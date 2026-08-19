const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../utils/embeds');

const Terminal = require('../utils/terminal');

const {
    terminalIncidents,
    terminalServices
} = require('../database');

const {
    CONTROL_PANEL_COLOR,
    CONTROL_PANEL_CUSTOM_ID,
    CONTROL_PANEL_REFRESH_ID,
    INCIDENT_CENTER_REFRESH_ID,
    SERVICES_CENTER_REFRESH_ID,
    formatBooleanStatus,
    formatHealthState,
    collectHealthSafely,
    buildControlPanelComponents,
    buildIncidentCenterComponents,
    buildServicesCenterComponents,
    buildControlPanelEmbed
} = require('../commands/information/controlpanel');

const INCIDENT_CENTER_LIMIT = 8;
const SERVICES_CENTER_LIMIT = 20;

const SERVICE_DISPLAY_ORDER = [
    'postgresql',
    'gateway',
    'memory',
    'guardian',
    'kingdom_feed',
    'rank_trials',
    'ticket_system',
    'verification',
    'setup_wizard',
    'levels',
    'achievements',
    'titles',
    'sin_ranks',
    'events',
    'giveaways',
    'soul_records'
];

const SERVICE_ICONS = {
    postgresql: '🗄️',
    gateway: '📡',
    memory: '🧠',
    guardian: '🛡️',
    kingdom_feed: '📈',
    rank_trials: '⚔️',
    ticket_system: '🎫',
    verification: '⛩️',
    setup_wizard: '📚',
    levels: '⭐',
    achievements: '🏆',
    titles: '🏷️',
    sin_ranks: '👑',
    events: '🎉',
    giveaways: '🎁',
    soul_records: '📖'
};

const STATUS_ICONS = {
    ONLINE: '🟢',
    DEGRADED: '🟡',
    OFFLINE: '🔴',
    STARTING: '🔵',
    STOPPED: '⚫'
};

const SEVERITY_ICONS = {
    critical: '🔴',
    warning: '🟡',
    success: '🟢',
    info: '🔵'
};

function formatSeverity(severity) {
    return `\`${String(severity || 'UNKNOWN').toUpperCase()}\``;
}

function formatServiceStatus(status) {
    const value = String(status || 'UNKNOWN').toUpperCase();
    return `${STATUS_ICONS[value] || '⚪'} \`${value}\``;
}

function formatTimestamp(value, detailed = false) {
    if (!value) return '`Unavailable`';

    const date = value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '`Unavailable`';
    }

    const unix = Math.floor(date.getTime() / 1000);

    return detailed
        ? `<t:${unix}:F>\n<t:${unix}:R>`
        : `<t:${unix}:R>`;
}

function truncateText(value, maxLength = 180) {
    const text = String(
        value || 'No information provided.'
    ).trim();

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 3)}...`;
}

function sortServices(services) {
    const getIndex = service => {
        const index = SERVICE_DISPLAY_ORDER.indexOf(
            service.serviceKey
        );

        return index === -1
            ? Number.MAX_SAFE_INTEGER
            : index;
    };

    return [...services].sort((a, b) => {
        const order = getIndex(a) - getIndex(b);

        if (order !== 0) {
            return order;
        }

        return String(
            a.displayName || a.serviceKey
        ).localeCompare(
            String(
                b.displayName || b.serviceKey
            )
        );
    });
}

function buildServiceField(service, index) {
    const key = service.serviceKey || 'unknown';
    const name =
        service.displayName ||
        service.serviceKey ||
        `Service ${index + 1}`;

    return {
        name: `${SERVICE_ICONS[key] || '⚙️'} ${name}`,
        value: [
            `**Status:** ${formatServiceStatus(service.status)}`,
            `**Severity:** ${formatSeverity(service.severity)}`,
            `**Incident:** \`${service.incidentType || 'NONE'}\``,
            `**Checked:** ${formatTimestamp(service.lastCheckedAt)}`
        ].join('\n'),
        inline: true
    };
}

function buildModuleEmbed({
    interaction,
    title,
    description,
    fields = [],
    color = CONTROL_PANEL_COLOR
}) {
    const botAvatar =
        interaction.client.user.displayAvatarURL({
            size: 256,
            forceStatic: false
        });

    const guildIcon =
        interaction.guild.iconURL({
            size: 128,
            forceStatic: false
        }) || botAvatar;

    return createEmbed({
        title,
        description,
        color,
        thumbnail: botAvatar,
        fields
    })
        .setAuthor({
            name: 'Evelynn • Control Panel',
            iconURL: botAvatar
        })
        .setFooter({
            text: 'LUNAR SEIREITEI • Administration',
            iconURL: guildIcon
        })
        .setTimestamp();
}

function buildSystemOverviewEmbed(
    interaction,
    snapshot
) {
    const uptime = Terminal.formatters.uptime(
        process.uptime() * 1000
    );

    const rss = Terminal.formatters.bytes(
        snapshot.memoryUsage.rss
    );

    const heap = Terminal.formatters.bytes(
        snapshot.memoryUsage.heapUsed
    );

    const databaseLatency =
        snapshot.databaseLatency !== null
            ? `${snapshot.databaseLatency} ms`
            : 'Unavailable';

    const description = [
        `**System:** \`${snapshot.overallHealth.label}\``,
        snapshot.overallHealth.message,
        `Checked <t:${snapshot.checkedAt}:R>`
    ];

    if (snapshot.fallback) {
        description.push(
            '⚠️ Some PostgreSQL statistics are unavailable.'
        );
    }

    return buildModuleEmbed({
        interaction,
        title: `${snapshot.overallHealth.emoji} System Overview`,
        description: description.join('\n\n'),
        color:
            snapshot.overallHealth.color ||
            CONTROL_PANEL_COLOR,
        fields: [
            {
                name: '📡 Gateway',
                value: [
                    formatBooleanStatus(
                        snapshot.gatewayConnected,
                        'CONNECTED',
                        'DISCONNECTED'
                    ),
                    `**Latency:** \`${snapshot.gatewayPing} ms\``,
                    `**State:** ${formatHealthState(
                        snapshot.gatewayLatencyState
                    )}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🗄️ PostgreSQL',
                value: [
                    formatBooleanStatus(
                        snapshot.databaseConnected,
                        'CONNECTED',
                        'UNAVAILABLE'
                    ),
                    `**Latency:** \`${databaseLatency}\``
                ].join('\n'),
                inline: true
            },
            {
                name: '🧠 Memory',
                value: [
                    `**RSS:** \`${rss}\``,
                    `**Heap:** \`${heap}\``,
                    `**State:** ${formatHealthState(
                        snapshot.memoryState
                    )}`
                ].join('\n'),
                inline: true
            },
            {
                name: '⏱️ Runtime',
                value: [
                    `**Uptime:** \`${uptime}\``,
                    `**PID:** \`${process.pid}\``
                ].join('\n'),
                inline: true
            },
            {
                name: '☾ LUNAR SEIREITEI',
                value: [
                    `**Members:** \`${interaction.guild.memberCount}\``,
                    `**Commands:** \`${snapshot.commandCount}\``
                ].join('\n'),
                inline: true
            },
            {
                name: '🖥️ Terminal',
                value: `<#${Terminal.TERMINAL_CHANNEL_ID}>`,
                inline: true
            }
        ]
    });
}async function loadServicesCenterData(interaction) {
    const services =
        await terminalServices.getTerminalServices(
            interaction.guild.id
        );

    return sortServices(services).slice(
        0,
        SERVICES_CENTER_LIMIT
    );
}

function getServiceSummary(services) {
    const summary = {
        total: services.length,
        online: 0,
        degraded: 0,
        offline: 0,
        starting: 0,
        stopped: 0,
        unknown: 0
    };

    for (const service of services) {
        switch (service.status) {
            case 'ONLINE':
                summary.online++;
                break;

            case 'DEGRADED':
                summary.degraded++;
                break;

            case 'OFFLINE':
                summary.offline++;
                break;

            case 'STARTING':
                summary.starting++;
                break;

            case 'STOPPED':
                summary.stopped++;
                break;

            default:
                summary.unknown++;
        }
    }

    return summary;
}

function getServicesCenterColor(summary) {
    if (summary.offline > 0) {
        return '#ED4245';
    }

    if (
        summary.degraded > 0 ||
        summary.starting > 0
    ) {
        return '#FEE75C';
    }

    return '#57F287';
}

function buildServicesCenterEmbed(
    interaction,
    services
) {
    const summary = getServiceSummary(services);

    const fields = [
        {
            name: '📊 Summary',
            value: [
                `🟢 Online: \`${summary.online}\``,
                `🟡 Degraded: \`${summary.degraded}\``,
                `🔴 Offline: \`${summary.offline}\``,
                `🔵 Starting: \`${summary.starting}\``,
                `⚫ Stopped: \`${summary.stopped}\``
            ].join('\n'),
            inline: true
        },
        {
            name: '🕒 Registry',
            value: [
                `**Registered:** \`${summary.total}\``,
                `**Displayed:** \`${services.length}/${SERVICES_CENTER_LIMIT}\``,
                `**Checked:** <t:${Math.floor(Date.now() / 1000)}:R>`
            ].join('\n'),
            inline: true
        }
    ];

    if (services.length > 0) {
        fields.push(
            ...services.map(buildServiceField)
        );
    } else {
        fields.push({
            name: '⚠️ No Services',
            value: 'No registered Terminal services were found.',
            inline: false
        });
    }

    return buildModuleEmbed({
        interaction,
        title:
            summary.offline > 0
                ? '🔴 Services Center'
                : summary.degraded > 0
                    ? '🟡 Services Center'
                    : '🟢 Services Center',
        description:
            'Live status of Evelynn system services.',
        color:
            getServicesCenterColor(summary),
        fields
    });
}

function buildRecentIncidentField(
    incident,
    index
) {
    return {
        name: `${
            SEVERITY_ICONS[incident.severity] || '⚪'
        } #${incident.id ?? index + 1} • ${
            truncateText(incident.title, 120)
        }`,
        value: [
            `**Type:** \`${incident.incidentType || 'UNKNOWN'}\``,
            `**Severity:** ${formatSeverity(
                incident.severity
            )}`,
            `**Time:** ${formatTimestamp(
                incident.createdAt,
                true
            )}`,
            '',
            truncateText(
                incident.message,
                220
            )
        ].join('\n'),
        inline: false
    };
}

async function loadIncidentCenterData(interaction) {
    const [incidents, statistics] =
        await Promise.all([
            terminalIncidents.getRecentTerminalIncidents(
                interaction.guild.id,
                INCIDENT_CENTER_LIMIT
            ),
            terminalIncidents.getTerminalIncidentStatistics(
                interaction.guild.id
            )
        ]);

    return {
        incidents,
        statistics
    };
}

function buildIncidentCenterEmbed(
    interaction,
    incidents,
    statistics
) {
    const fields = [
        {
            name: '📊 Archive',
            value: [
                `**Total:** \`${statistics.total}\``,
                `**Critical:** \`${statistics.critical}\``,
                `**Warnings:** \`${statistics.warning}\``,
                `**Info:** \`${statistics.info}\``
            ].join('\n'),
            inline: true
        },
        {
            name: '🕒 Latest',
            value: statistics.lastIncidentAt
                ? formatTimestamp(
                    statistics.lastIncidentAt,
                    true
                )
                : '`No incidents recorded`',
            inline: true
        }
    ];

    if (incidents.length > 0) {
        fields.push(
            ...incidents.map(
                buildRecentIncidentField
            )
        );
    } else {
        fields.push({
            name: '✅ No Incidents',
            value:
                'No system incidents have been recorded yet.',
            inline: false
        });
    }

    return buildModuleEmbed({
        interaction,
        title: '🚨 Incident Center',
        description:
            'Recent Evelynn system incidents stored in PostgreSQL.',
        color:
            statistics.critical > 0
                ? '#ED4245'
                : statistics.warning > 0
                    ? '#FEE75C'
                    : '#57F287',
        fields
    });
}function buildStaticModule(
    interaction,
    title,
    description,
    fields
) {
    return buildModuleEmbed({
        interaction,
        title,
        description,
        fields
    });
}

function buildRankTrialsEmbed(interaction) {
    return buildStaticModule(
        interaction,
        '⚔️ Captain Trials',
        'Manage the monthly Captain Trials system.',
        [
            {
                name: '📊 Status',
                value: '`/ranktrials status`',
                inline: true
            },
            {
                name: '🔍 Check',
                value: '`/ranktrials check`',
                inline: true
            },
            {
                name: '🔄 Sync',
                value: '`/ranktrials sync`',
                inline: true
            },
            {
                name: '👁️ Preview',
                value: '`/ranktrials preview`',
                inline: true
            },
            {
                name: '📢 Publish',
                value: '`/ranktrials publish`',
                inline: true
            },
            {
                name: '📜 History',
                value: '`/ranktrials history`',
                inline: true
            }
        ]
    );
}

function buildTicketsEmbed(interaction) {
    return buildStaticModule(
        interaction,
        '🎫 Ticket Management',
        'Manage the Evelynn support system.',
        [
            {
                name: '🧩 Panel',
                value: '`/ticketpanel`',
                inline: true
            },
            {
                name: '🎫 Members',
                value: 'Open and close tickets through buttons.',
                inline: true
            },
            {
                name: '🛡️ Staff',
                value: 'Close, reopen or delete ticket channels.',
                inline: true
            },
            {
                name: '🔐 Requirements',
                value:
                    'View Channel • Send Messages • Embed Links • Manage Channels',
                inline: false
            }
        ]
    );
}

function buildSinRanksEmbed(interaction) {
    return buildStaticModule(
        interaction,
        '👑 Captain Rank Control',
        'Manage LUNAR SEIREITEI rank hierarchy.',
        [
            {
                name: '⚔️ Assign',
                value: '`/setrank`',
                inline: true
            },
            {
                name: '🌘 Remove',
                value: '`/removerank`',
                inline: true
            },
            {
                name: '📜 History',
                value: '`/rankhistory`',
                inline: true
            },
            {
                name: '🛡️ Authority',
                value:
                    'Server Owner • Administrator • Configured Staff roles',
                inline: false
            }
        ]
    );
}

function buildSetupCenterEmbed(interaction) {
    return buildStaticModule(
        interaction,
        '📚 Seireitei Setup Center',
        'Publish and update LUNAR SEIREITEI guides.',
        [
            {
                name: '⚙️ Setup',
                value: '`/setup`',
                inline: true
            },
            {
                name: '📜 Sacred Laws',
                value: 'Publish server rules.',
                inline: true
            },
            {
                name: '⛩️ Verification',
                value: 'Publish the Bloxlink guide.',
                inline: true
            },
            {
                name: '📖 Guides',
                value:
                    'Server Guide • Role Information • FAQ • Ticket Guide',
                inline: false
            }
        ]
    );
}

function buildGuardianEmbed(
    interaction,
    snapshot
) {
    const operational =
        snapshot.gatewayConnected &&
        snapshot.databaseConnected;

    return buildModuleEmbed({
        interaction,
        title: '🛡️ Evelynn Guardian',
        description: operational
            ? 'Protection systems are operational.'
            : 'Protection systems are degraded.',
        color: operational
            ? '#57F287'
            : '#ED4245',
        fields: [
            {
                name: '🛡️ Guardian',
                value: formatBooleanStatus(
                    operational,
                    'ACTIVE',
                    'DEGRADED'
                ),
                inline: true
            },
            {
                name: '📡 Gateway',
                value: [
                    formatBooleanStatus(
                        snapshot.gatewayConnected,
                        'CONNECTED',
                        'DISCONNECTED'
                    ),
                    `**Latency:** \`${snapshot.gatewayPing} ms\``
                ].join('\n'),
                inline: true
            },
            {
                name: '🗄️ Database',
                value: formatBooleanStatus(
                    snapshot.databaseConnected,
                    'CONNECTED',
                    'UNAVAILABLE'
                ),
                inline: true
            },
            {
                name: '🔍 Protection',
                value:
                    'Spam • Invites • Profanity • Scam Detection',
                inline: true
            },
            {
                name: '📋 Records',
                value:
                    'AutoMod • Guardian • Incidents • Moderation',
                inline: true
            },
            {
                name: '🧠 System',
                value: [
                    `**Memory:** ${formatHealthState(
                        snapshot.memoryState
                    )}`,
                    `**Overall:** \`${snapshot.overallHealth.label}\``
                ].join('\n'),
                inline: true
            }
        ]
    });
}async function sendControlPanelError(
    interaction,
    title,
    description
) {
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: []
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

function isControlPanelInteraction(interaction) {
    if (interaction.isStringSelectMenu()) {
        return (
            interaction.customId ===
            CONTROL_PANEL_CUSTOM_ID
        );
    }

    if (!interaction.isButton()) {
        return false;
    }

    return [
        CONTROL_PANEL_REFRESH_ID,
        INCIDENT_CENTER_REFRESH_ID,
        SERVICES_CENTER_REFRESH_ID
    ].includes(
        interaction.customId
    );
}

function hasTerminalAuthority(interaction) {
    return (
        interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        ) === true
    );
}

async function handleModuleSelection(interaction) {
    await interaction.deferUpdate();

    const moduleId =
        interaction.values[0];

    let embed;
    let components =
        buildControlPanelComponents();

    switch (moduleId) {
        case 'system-overview': {
            const snapshot =
                await collectHealthSafely(
                    interaction.client
                );

            embed =
                buildSystemOverviewEmbed(
                    interaction,
                    snapshot
                );

            break;
        }

        case 'services-center': {
            const services =
                await loadServicesCenterData(
                    interaction
                );

            embed =
                buildServicesCenterEmbed(
                    interaction,
                    services
                );

            components =
                buildServicesCenterComponents();

            break;
        }

        case 'incident-center': {
            const {
                incidents,
                statistics
            } =
                await loadIncidentCenterData(
                    interaction
                );

            embed =
                buildIncidentCenterEmbed(
                    interaction,
                    incidents,
                    statistics
                );

            components =
                buildIncidentCenterComponents();

            break;
        }

        case 'rank-trials':
            embed =
                buildRankTrialsEmbed(
                    interaction
                );
            break;

        case 'tickets':
            embed =
                buildTicketsEmbed(
                    interaction
                );
            break;

        case 'sin-ranks':
            embed =
                buildSinRanksEmbed(
                    interaction
                );
            break;

        case 'setup-center':
            embed =
                buildSetupCenterEmbed(
                    interaction
                );
            break;

        case 'guardian-status': {
            const snapshot =
                await collectHealthSafely(
                    interaction.client
                );

            embed =
                buildGuardianEmbed(
                    interaction,
                    snapshot
                );

            break;
        }

        default:
            embed =
                createErrorEmbed(
                    '❌ Unknown Module',
                    'Evelynn could not load the selected module.'
                );
    }

    await interaction.editReply({
        embeds: [embed],
        components
    });
}

async function refreshHealth(interaction) {
    await interaction.update({
        components:
            buildControlPanelComponents(
                true
            )
    });

    const snapshot =
        await collectHealthSafely(
            interaction.client
        );

    await interaction.editReply({
        embeds: [
            buildControlPanelEmbed(
                interaction,
                snapshot
            )
        ],
        components:
            buildControlPanelComponents()
    });
}

async function refreshIncidents(interaction) {
    await interaction.update({
        components:
            buildIncidentCenterComponents(
                true
            )
    });

    const {
        incidents,
        statistics
    } =
        await loadIncidentCenterData(
            interaction
        );

    await interaction.editReply({
        embeds: [
            buildIncidentCenterEmbed(
                interaction,
                incidents,
                statistics
            )
        ],
        components:
            buildIncidentCenterComponents()
    });
}

async function refreshServices(interaction) {
    await interaction.update({
        components:
            buildServicesCenterComponents(
                true
            )
    });

    const services =
        await loadServicesCenterData(
            interaction
        );

    await interaction.editReply({
        embeds: [
            buildServicesCenterEmbed(
                interaction,
                services
            )
        ],
        components:
            buildServicesCenterComponents()
    });
}

const BUTTON_HANDLERS = {
    [CONTROL_PANEL_REFRESH_ID]:
        refreshHealth,

    [INCIDENT_CENTER_REFRESH_ID]:
        refreshIncidents,

    [SERVICES_CENTER_REFRESH_ID]:
        refreshServices
};

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (
            !isControlPanelInteraction(
                interaction
            )
        ) {
            return;
        }

        try {
            if (!interaction.inGuild()) {
                await sendControlPanelError(
                    interaction,
                    '❌ Server Only Action',
                    'The Evelynn Control Panel can only be used inside LUNAR SEIREITEI.'
                );

                return;
            }

            if (
                !hasTerminalAuthority(
                    interaction
                )
            ) {
                await sendControlPanelError(
                    interaction,
                    '❌ Authority Denied',
                    'Only Administrators can use the Evelynn Control Panel.'
                );

                return;
            }

            if (
                interaction.isStringSelectMenu()
            ) {
                await handleModuleSelection(
                    interaction
                );

                return;
            }

            const handler =
                BUTTON_HANDLERS[
                    interaction.customId
                ];

            if (handler) {
                await handler(
                    interaction
                );
            }
        } catch (error) {
            console.error(
                '❌ Evelynn Control Panel failed:',
                error
            );

            await sendControlPanelError(
                interaction,
                '❌ Control Panel Failed',
                'Evelynn could not complete the selected action.'
            ).catch(
                responseError => {
                    console.error(
                        '❌ Control Panel error response failed:',
                        responseError
                    );
                }
            );
        }
    }
};

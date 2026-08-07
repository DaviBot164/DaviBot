const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../utils/embeds');

const Terminal =
    require('../utils/terminal');

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

/**
 * Maximum number of recent Incidents
 * displayed inside Incident Center.
 */
const INCIDENT_CENTER_LIMIT =
    8;

/**
 * Maximum number of Services displayed
 * inside one Services Center page.
 */
const SERVICES_CENTER_LIMIT =
    20;

/**
 * Official Service display order.
 */
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
    'arrancar',
    'events',
    'giveaways',
    'soul_records'
];

/**
 * Convert one Incident severity into
 * a readable emoji.
 *
 * @param {string} severity
 * @returns {string}
 */
function getIncidentSeverityEmoji(
    severity
) {
    switch (
        severity
    ) {
        case 'critical':
            return '🔴';

        case 'warning':
            return '🟡';

        case 'success':
            return '🟢';

        case 'info':
            return '🔵';

        default:
            return '⚪';
    }
}

/**
 * Convert one Incident severity into
 * an uppercase label.
 *
 * @param {string} severity
 * @returns {string}
 */
function formatIncidentSeverity(
    severity
) {
    const normalizedSeverity =
        typeof severity ===
            'string'
            ? severity.toUpperCase()
            : 'UNKNOWN';

    return `\`${normalizedSeverity}\``;
}

/**
 * Convert one Service status into
 * a readable emoji.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
function getServiceStatusEmoji(
    status
) {
    switch (
        status
    ) {
        case 'ONLINE':
            return '🟢';

        case 'DEGRADED':
            return '🟡';

        case 'OFFLINE':
            return '🔴';

        case 'STARTING':
            return '🔵';

        case 'STOPPED':
            return '⚫';

        default:
            return '⚪';
    }
}

/**
 * Convert one Service status into
 * a compact Terminal label.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
function formatServiceStatus(
    status
) {
    const normalizedStatus =
        typeof status ===
            'string'
            ? status.toUpperCase()
            : 'UNKNOWN';

    return (
        `${getServiceStatusEmoji(
            normalizedStatus
        )} \`${normalizedStatus}\``
    );
}

/**
 * Convert one JavaScript date into
 * Discord timestamp syntax.
 *
 * @param {Date|string|null} value
 * @returns {string}
 */
function formatIncidentTimestamp(
    value
) {
    if (!value) {
        return '`Unavailable`';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '`Unavailable`';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1_000
        );

    return (
        `<t:${unixTimestamp}:F>\n` +
        `<t:${unixTimestamp}:R>`
    );
}

/**
 * Compact timestamp used by
 * Services Center entries.
 *
 * @param {Date|string|null} value
 * @returns {string}
 */
function formatServiceTimestamp(
    value
) {
    if (!value) {
        return '`Unavailable`';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '`Unavailable`';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1_000
        );

    return `<t:${unixTimestamp}:R>`;
}

/**
 * Limit Incident text before displaying
 * it inside the Control Panel.
 *
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string}
 */
function limitIncidentDisplayText(
    value,
    maxLength =
        180
) {
    const text =
        typeof value ===
            'string'
            ? value.trim()
            : String(
                value ??
                'No information provided.'
            ).trim();

    if (
        text.length <=
        maxLength
    ) {
        return (
            text ||
            'No information provided.'
        );
    }

    return (
        text.slice(
            0,
            maxLength -
                16
        ) +
        '... truncated'
    );
}

/**
 * Return the visual icon used for
 * one official Umbra Service.
 *
 * @param {string} serviceKey
 * @returns {string}
 */
function getServiceIcon(
    serviceKey
) {
    const icons = {
        postgresql:
            '🗄️',

        gateway:
            '📡',

        memory:
            '🧠',

        guardian:
            '🛡️',

        kingdom_feed:
            '📈',

        rank_trials:
            '⚔️',

        ticket_system:
            '🎫',

        verification:
            '⛩️',

        setup_wizard:
            '📚',

        levels:
            '⭐',

        achievements:
            '🏆',

        titles:
            '🏷️',

        arrancar:
            '👑',

        events:
            '🎉',

        giveaways:
            '🎁',

        soul_records:
            '📖'
    };

    return (
        icons[
            serviceKey
        ] ||
        '⚙️'
    );
}

/**
 * Sort Services in the official
 * Umbra display order.
 *
 * Unknown future Services remain
 * visible after the official list.
 *
 * @param {Object[]} services
 * @returns {Object[]}
 */
function sortServices(
    services
) {
    return [
        ...services
    ].sort(
        (
            first,
            second
        ) => {
            const firstIndex =
                SERVICE_DISPLAY_ORDER
                    .indexOf(
                        first.serviceKey
                    );

            const secondIndex =
                SERVICE_DISPLAY_ORDER
                    .indexOf(
                        second.serviceKey
                    );

            const safeFirstIndex =
                firstIndex ===
                    -1
                    ? Number.MAX_SAFE_INTEGER
                    : firstIndex;

            const safeSecondIndex =
                secondIndex ===
                    -1
                    ? Number.MAX_SAFE_INTEGER
                    : secondIndex;

            if (
                safeFirstIndex !==
                safeSecondIndex
            ) {
                return (
                    safeFirstIndex -
                    safeSecondIndex
                );
            }

            return String(
                first.displayName ??
                first.serviceKey
            ).localeCompare(
                String(
                    second.displayName ??
                    second.serviceKey
                )
            );
        }
    );
}

/**
 * Build one compact Services Center field.
 *
 * @param {Object} service
 * @param {number} index
 * @returns {{
 *     name: string,
 *     value: string,
 *     inline: boolean
 * }}
 */
function buildServiceField(
    service,
    index
) {
    const displayName =
        service.displayName ||
        service.serviceKey ||
        `Service ${index + 1}`;

    const serviceKey =
        service.serviceKey ||
        'unknown';

    const status =
        formatServiceStatus(
            service.status
        );

    const severity =
        formatIncidentSeverity(
            service.severity
        );

    const lastChecked =
        formatServiceTimestamp(
            service.lastCheckedAt
        );

    const lastChanged =
        formatServiceTimestamp(
            service.lastChangedAt
        );

    const incident =
        service.incidentType
            ? `\`${service.incidentType}\``
            : '`NONE`';

    return {
        name:
            `${getServiceIcon(
                serviceKey
            )} ${displayName}`,

        value:
            [
                `**Status:** ${status}`,
                `**Severity:** ${severity}`,
                `**Key:** \`${serviceKey}\``,
                `**Incident:** ${incident}`,
                `**Last Checked:** ${lastChecked}`,
                `**Last Changed:** ${lastChanged}`
            ].join(
                '\n'
            ),

        inline:
            true
    };
}

/**
 * Build a common Umbra Terminal
 * module Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').Interaction} options.interaction
 * @param {string} options.title
 * @param {string} options.description
 * @param {Object[]} [options.fields]
 * @param {string} [options.color]
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildModuleEmbed({
    interaction,
    title,
    description,
    fields =
        [],
    color =
        CONTROL_PANEL_COLOR
}) {
    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const embed =
        createEmbed({
            title,

            description,

            color,

            thumbnail:
                botAvatar,

            fields
        });

    embed.setAuthor({
        name:
            'Umbra • Core Operations',

        iconURL:
            botAvatar
    });

    embed.setFooter({
        text:
            'Las Noches • Administrative Terminal',

        iconURL:
            guildIcon
    });

    embed.setTimestamp();

    return embed;
}/**
 * Build the live Terminal Overview page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {Object} snapshot
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSystemOverviewEmbed(
    interaction,
    snapshot
) {
    const processUptime =
        Terminal.formatters.uptime(
            process.uptime() *
            1_000
        );

    const rssMemory =
        Terminal.formatters.bytes(
            snapshot.memoryUsage.rss
        );

    const heapMemory =
        Terminal.formatters.bytes(
            snapshot.memoryUsage.heapUsed
        );

    const databaseLatency =
        snapshot.databaseLatency !==
        null
            ? `${snapshot.databaseLatency} ms`
            : 'Unavailable';

    const descriptionLines = [
        `**System State:** \`${snapshot.overallHealth.label}\``,
        '',
        snapshot.overallHealth.message,
        '',
        `Last diagnostic check: <t:${snapshot.checkedAt}:R>`
    ];

    if (
        snapshot.fallback
    ) {
        descriptionLines.push(
            '',
            '⚠️ Some PostgreSQL statistics are temporarily unavailable.'
        );
    }

    return buildModuleEmbed({
        interaction,

        title:
            `${snapshot.overallHealth.emoji} Umbra Terminal Overview`,

        description:
            descriptionLines.join(
                '\n'
            ),

        color:
            snapshot.overallHealth.color ??
            CONTROL_PANEL_COLOR,

        fields: [
            {
                name:
                    '📡 Discord Gateway',

                value:
                    [
                        formatBooleanStatus(
                            snapshot.gatewayConnected,
                            'CONNECTED',
                            'DISCONNECTED'
                        ),
                        `**Latency:** \`${snapshot.gatewayPing} ms\``,
                        `**State:** ${formatHealthState(
                            snapshot.gatewayLatencyState
                        )}`
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🗄️ PostgreSQL',

                value:
                    [
                        formatBooleanStatus(
                            snapshot.databaseConnected,
                            'CONNECTED',
                            'UNAVAILABLE'
                        ),
                        `**Latency:** \`${databaseLatency}\``
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🧠 Process Memory',

                value:
                    [
                        `**RSS:** \`${rssMemory}\``,
                        `**Heap:** \`${heapMemory}\``,
                        `**State:** ${formatHealthState(
                            snapshot.memoryState
                        )}`
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '⏱️ Runtime',

                value:
                    [
                        `**Uptime:** \`${processUptime}\``,
                        `**Process ID:** \`${process.pid}\``
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🌙 Las Noches',

                value:
                    [
                        `**Members:** \`${interaction.guild.memberCount}\``,
                        `**Commands:** \`${snapshot.commandCount}\``
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🖥️ Terminal Channel',

                value:
                    `<#${Terminal.TERMINAL_CHANNEL_ID}>`,

                inline:
                    true
            }
        ]
    });
}

/**
 * Load every Black Box service stored
 * for the current Discord server.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<Object[]>}
 */
async function loadServicesCenterData(
    interaction
) {
    const services =
        await terminalServices
            .getTerminalServices(
                interaction.guild.id
            );

    return sortServices(
        services
    ).slice(
        0,
        SERVICES_CENTER_LIMIT
    );
}

/**
 * Build a summary of service states.
 *
 * @param {Object[]} services
 * @returns {{
 *     total: number,
 *     online: number,
 *     degraded: number,
 *     offline: number,
 *     starting: number,
 *     stopped: number,
 *     unknown: number
 * }}
 */
function getServiceSummary(
    services
) {
    const summary = {
        total:
            services.length,

        online:
            0,

        degraded:
            0,

        offline:
            0,

        starting:
            0,

        stopped:
            0,

        unknown:
            0
    };

    for (
        const service
        of services
    ) {
        switch (
            service.status
        ) {
            case 'ONLINE':
                summary.online +=
                    1;

                break;

            case 'DEGRADED':
                summary.degraded +=
                    1;

                break;

            case 'OFFLINE':
                summary.offline +=
                    1;

                break;

            case 'STARTING':
                summary.starting +=
                    1;

                break;

            case 'STOPPED':
                summary.stopped +=
                    1;

                break;

            default:
                summary.unknown +=
                    1;
        }
    }

    return summary;
}

/**
 * Determine Services Center visual color.
 *
 * @param {ReturnType<typeof getServiceSummary>} summary
 * @returns {string}
 */
function getServicesCenterColor(
    summary
) {
    if (
        summary.offline >
            0
    ) {
        return '#ED4245';
    }

    if (
        summary.degraded >
            0 ||
        summary.starting >
            0
    ) {
        return '#FEE75C';
    }

    return '#57F287';
}

/**
 * Build the Umbra Black Box
 * Services Center.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {Object[]} services
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildServicesCenterEmbed(
    interaction,
    services
) {
    const summary =
        getServiceSummary(
            services
        );

    const serviceFields =
        services.map(
            buildServiceField
        );

    const fields = [
        {
            name:
                '📊 Service Summary',

            value:
                [
                    `**Registered:** \`${summary.total}\``,
                    `🟢 **Online:** \`${summary.online}\``,
                    `🟡 **Degraded:** \`${summary.degraded}\``,
                    `🔴 **Offline:** \`${summary.offline}\``,
                    `🔵 **Starting:** \`${summary.starting}\``,
                    `⚫ **Stopped:** \`${summary.stopped}\``
                ].join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '🚨 Active Problems',

            value:
                summary.offline +
                    summary.degraded >
                0
                    ? [
                        `**Offline:** \`${summary.offline}\``,
                        `**Degraded:** \`${summary.degraded}\``,
                        '',
                        'Review the affected service entries below.'
                    ].join(
                        '\n'
                    )
                    : [
                        '🟢 `NO ACTIVE SERVICE INCIDENTS`',
                        '',
                        'All registered services are operating normally.'
                    ].join(
                        '\n'
                    ),

            inline:
                true
        },
        {
            name:
                '🕒 Registry State',

            value:
                [
                    `**Displayed:** \`${services.length}/${SERVICES_CENTER_LIMIT}\``,
                    `**Checked:** <t:${Math.floor(
                        Date.now() /
                        1_000
                    )}:R>`
                ].join(
                    '\n'
                ),

            inline:
                true
        }
    ];

    if (
        serviceFields.length >
        0
    ) {
        fields.push(
            {
                name:
                    '━━━━━━━━ BLACK BOX SERVICES ━━━━━━━━',

                value:
                    'Live operational state of every Umbra service registered for Las Noches.',

                inline:
                    false
            },

            ...serviceFields
        );
    } else {
        fields.push({
            name:
                '⚠️ No Registered Services',

            value:
                [
                    'No Black Box services were found for this server.',
                    '',
                    'Check the Terminal Services registry and PostgreSQL initialization.'
                ].join(
                    '\n'
                ),

            inline:
                false
        });
    }

    return buildModuleEmbed({
        interaction,

        title:
            summary.offline >
            0
                ? '🔴 Umbra Services Center'
                : summary.degraded >
                    0
                    ? '🟡 Umbra Services Center'
                    : '🟢 Umbra Services Center',

        description:
            [
                'Inspect the live state of every subsystem registered inside Umbra Black Box.',
                '',
                'Service states are read directly from PostgreSQL and reflect the latest Black Box heartbeat.'
            ].join(
                '\n'
            ),

        color:
            getServicesCenterColor(
                summary
            ),

        fields
    });
}

/**
 * Build one recent Incident field.
 *
 * @param {Object} incident
 * @param {number} index
 * @returns {{
 *     name: string,
 *     value: string,
 *     inline: boolean
 * }}
 */
function buildRecentIncidentField(
    incident,
    index
) {
    const severityEmoji =
        getIncidentSeverityEmoji(
            incident.severity
        );

    const incidentTitle =
        limitIncidentDisplayText(
            incident.title,
            120
        );

    const incidentMessage =
        limitIncidentDisplayText(
            incident.message,
            220
        );

    return {
        name:
            `${severityEmoji} #${incident.id ?? index + 1} • ${incidentTitle}`,

        value:
            [
                `**Type:** \`${incident.incidentType ?? 'UNKNOWN'}\``,
                `**Severity:** ${formatIncidentSeverity(
                    incident.severity
                )}`,
                `**Time:** ${formatIncidentTimestamp(
                    incident.createdAt
                )}`,
                '',
                incidentMessage
            ].join(
                '\n'
            ),

        inline:
            false
    };
}/**
 * Build the PostgreSQL Incident Center.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {Object[]} incidents
 * @param {Object} statistics
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildIncidentCenterEmbed(
    interaction,
    incidents,
    statistics
) {
    const recentIncidentFields =
        incidents.map(
            buildRecentIncidentField
        );

    const lastIncident =
        statistics.lastIncidentAt
            ? formatIncidentTimestamp(
                statistics.lastIncidentAt
            )
            : '`No incidents recorded`';

    const fields = [
        {
            name:
                '📊 Archive Summary',

            value:
                [
                    `**Total:** \`${statistics.total}\``,
                    `**Critical:** \`${statistics.critical}\``,
                    `**Warnings:** \`${statistics.warning}\``,
                    `**Info:** \`${statistics.info}\``
                ].join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '🕒 Latest Incident',

            value:
                lastIncident,

            inline:
                true
        },
        {
            name:
                '🗄️ Archive State',

            value:
                [
                    '🟢 `CONNECTED`',
                    `**Displayed:** \`${incidents.length}/${INCIDENT_CENTER_LIMIT}\``
                ].join(
                    '\n'
                ),

            inline:
                true
        }
    ];

    if (
        recentIncidentFields.length >
        0
    ) {
        fields.push(
            {
                name:
                    '━━━━━━━━ RECENT INCIDENTS ━━━━━━━━',

                value:
                    'The newest Umbra system records are displayed below.',

                inline:
                    false
            },

            ...recentIncidentFields
        );
    } else {
        fields.push({
            name:
                '✅ No Archived Incidents',

            value:
                [
                    'Umbra has not recorded any system incidents yet.',
                    '',
                    'New warnings, failures and recoveries will appear here automatically.'
                ].join(
                    '\n'
                ),

            inline:
                false
        });
    }

    return buildModuleEmbed({
        interaction,

        title:
            '🚨 Umbra Incident Center',

        description:
            [
                'Review permanent system Incident records stored inside PostgreSQL.',
                '',
                'Incidents are archived before being published in the Umbra Terminal channel.'
            ].join(
                '\n'
            ),

        color:
            statistics.critical >
            0
                ? '#ED4245'
                : statistics.warning >
                    0
                    ? '#FEE75C'
                    : '#57F287',

        fields
    });
}

/**
 * Load all data required by the
 * Incident Center.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<{
 *     incidents: Object[],
 *     statistics: Object
 * }>}
 */
async function loadIncidentCenterData(
    interaction
) {
    const [
        incidents,
        statistics
    ] = await Promise.all([
        terminalIncidents
            .getRecentTerminalIncidents(
                interaction.guild.id,
                INCIDENT_CENTER_LIMIT
            ),

        terminalIncidents
            .getTerminalIncidentStatistics(
                interaction.guild.id
            )
    ]);

    return {
        incidents,
        statistics
    };
}

/**
 * Build the Rank Trials page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRankTrialsEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '⚔️ Rank Trials Control',

        description:
            [
                'Manage the Automatic Monthly Rank Trials system.',
                '',
                'Umbra protects announcements and Discord Scheduled Events from duplicate creation.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '📊 Status',

                value:
                    '`/ranktrials status`\nView the active monthly schedule.',

                inline:
                    true
            },
            {
                name:
                    '🔍 Immediate Check',

                value:
                    '`/ranktrials check`\nRun the scheduler immediately.',

                inline:
                    true
            },
            {
                name:
                    '🔄 Event Sync',

                value:
                    '`/ranktrials sync`\nCreate or synchronize the Discord Event.',

                inline:
                    true
            },
            {
                name:
                    '👁️ Preview',

                value:
                    '`/ranktrials preview`\nPreview an announcement privately.',

                inline:
                    true
            },
            {
                name:
                    '📢 Manual Publication',

                value:
                    '`/ranktrials publish`\nPublish one scheduled announcement.',

                inline:
                    true
            },
            {
                name:
                    '📜 History',

                value:
                    '`/ranktrials history`\nView PostgreSQL publication records.',

                inline:
                    true
            }
        ]
    });
}

/**
 * Build the Ticket Management page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildTicketsEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '🎫 Ticket Management',

        description:
            [
                'Review and manage the Umbra support system.',
                '',
                'Ticket actions remain protected by staff roles and Discord channel permissions.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '🧩 Create Panel',

                value:
                    '`/ticketpanel`\nCreate the public support panel.',

                inline:
                    true
            },
            {
                name:
                    '🎫 Ticket Controls',

                value:
                    '`/ticket`\nUse the available ticket actions.',

                inline:
                    true
            },
            {
                name:
                    '📚 Ticket Records',

                value:
                    '`/tickets`\nReview stored ticket information.',

                inline:
                    true
            },
            {
                name:
                    '🛡️ Required Permissions',

                value:
                    [
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links',
                        '• Manage Channels'
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            }
        ]
    });
}

/**
 * Build the Arrancar Ranks page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildArrancarRanksEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '👑 Arrancar Rank Control',

        description:
            [
                'Manage the official Las Noches hierarchy.',
                '',
                'Every Rank change is preserved in PostgreSQL and published through Umbra progression feeds.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '⚔️ Assign Rank',

                value:
                    '`/setrank`\nAssign or change an Arrancar Rank.',

                inline:
                    true
            },
            {
                name:
                    '🌘 Remove Rank',

                value:
                    '`/removerank`\nRevoke the current Arrancar Rank.',

                inline:
                    true
            },
            {
                name:
                    '📜 Rank History',

                value:
                    '`/rankhistory`\nView a Soul’s Rank records.',

                inline:
                    true
            },
            {
                name:
                    '🛡️ Authority',

                value:
                    [
                        '• Server Owner',
                        '• Administrator',
                        '• Configured High Command roles'
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            }
        ]
    });
}

/**
 * Build the Setup Center page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSetupCenterEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '📚 Las Noches Setup Center',

        description:
            [
                'Publish and update the official Las Noches guides.',
                '',
                'Use the Setup Wizard for safe Administrator-only publication.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '🌙 Setup Wizard',

                value:
                    '`/setup`\nOpen the interactive publication menu.',

                inline:
                    true
            },
            {
                name:
                    '📜 Sacred Laws',

                value:
                    'Publish official rules inside the dedicated Sacred Laws channel.',

                inline:
                    true
            },
            {
                name:
                    '⛩️ Verification Guide',

                value:
                    'Publish compact Bloxlink verification instructions.',

                inline:
                    true
            },
            {
                name:
                    '📖 Kingdom Archives',

                value:
                    [
                        '• Server Guide',
                        '• Role Information',
                        '• FAQ',
                        '• Ticket Guide'
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            }
        ]
    });
}

/**
 * Build the live Guardian page.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {Object} snapshot
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildGuardianEmbed(
    interaction,
    snapshot
) {
    const guardianOperational =
        snapshot.gatewayConnected &&
        snapshot.databaseConnected;

    return buildModuleEmbed({
        interaction,

        title:
            '🛡️ Umbra Guardian',

        description:
            [
                'Guardian protects messages before other Umbra systems process them.',
                '',
                guardianOperational
                    ? 'The protection pipeline is currently operational.'
                    : 'Guardian may be affected by the current system-health condition.'
            ].join(
                '\n'
            ),

        color:
            guardianOperational
                ? '#57F287'
                : '#ED4245',

        fields: [
            {
                name:
                    '🛡️ Guardian State',

                value:
                    formatBooleanStatus(
                        guardianOperational,
                        'ACTIVE',
                        'DEGRADED'
                    ),

                inline:
                    true
            },
            {
                name:
                    '📡 Gateway',

                value:
                    [
                        formatBooleanStatus(
                            snapshot.gatewayConnected,
                            'CONNECTED',
                            'DISCONNECTED'
                        ),
                        `**Latency:** \`${snapshot.gatewayPing} ms\``
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🗄️ Database',

                value:
                    formatBooleanStatus(
                        snapshot.databaseConnected,
                        'CONNECTED',
                        'UNAVAILABLE'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🔍 Protection Modules',

                value:
                    [
                        '• Spam Protection',
                        '• Invite Protection',
                        '• Profanity Filter',
                        '• Scam Detection'
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '📋 Records',

                value:
                    [
                        '• AutoMod Cases',
                        '• Guardian Warnings',
                        '• Incident Logs',
                        '• Moderation Logs'
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            },
            {
                name:
                    '🧠 Process State',

                value:
                    [
                        `**Memory:** ${formatHealthState(
                            snapshot.memoryState
                        )}`,
                        `**Overall:** \`${snapshot.overallHealth.label}\``
                    ].join(
                        '\n'
                    ),

                inline:
                    true
            }
        ]
    });
}

/**
 * Safely send an Umbra Terminal error.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {string} title
 * @param {string} description
 * @returns {Promise<void>}
 */
async function sendControlPanelError(
    interaction,
    title,
    description
) {
    const errorEmbed =
        createErrorEmbed(
            title,
            description
        );

    if (
        interaction.deferred
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed
            ],

            components:
                []
        });

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction.followUp({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                errorEmbed
            ]
        });

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            errorEmbed
        ]
    });
}

/**
 * Check whether one interaction belongs
 * to the Umbra Terminal.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {boolean}
 */
function isControlPanelInteraction(
    interaction
) {
    if (
        interaction.isStringSelectMenu()
    ) {
        return (
            interaction.customId ===
            CONTROL_PANEL_CUSTOM_ID
        );
    }

    if (
        interaction.isButton()
    ) {
        return (
            interaction.customId ===
                CONTROL_PANEL_REFRESH_ID ||
            interaction.customId ===
                INCIDENT_CENTER_REFRESH_ID ||
            interaction.customId ===
                SERVICES_CENTER_REFRESH_ID
        );
    }

    return false;
}

/**
 * Check whether the member may use
 * the Umbra Terminal.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {boolean}
 */
function hasTerminalAuthority(
    interaction
) {
    return Boolean(
        interaction.memberPermissions
            ?.has(
                PermissionFlagsBits.Administrator
            )
    );
}

/**
 * Handle the Terminal module menu.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleModuleSelection(
    interaction
) {
    await interaction.deferUpdate();

    const selectedModule =
        interaction.values[0];

    let embed;
    let components;

    switch (
        selectedModule
    ) {
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

            components =
                buildControlPanelComponents();

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

            components =
                buildControlPanelComponents();

            break;

        case 'tickets':
            embed =
                buildTicketsEmbed(
                    interaction
                );

            components =
                buildControlPanelComponents();

            break;

        case 'arrancar-ranks':
            embed =
                buildArrancarRanksEmbed(
                    interaction
                );

            components =
                buildControlPanelComponents();

            break;

        case 'setup-center':
            embed =
                buildSetupCenterEmbed(
                    interaction
                );

            components =
                buildControlPanelComponents();

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

            components =
                buildControlPanelComponents();

            break;
        }

        default:
            embed =
                createErrorEmbed(
                    '❌ Unknown Terminal Module',
                    'Umbra could not load the selected Terminal module.'
                );

            components =
                buildControlPanelComponents();
    }

    await interaction.editReply({
        embeds: [
            embed
        ],

        components
    });
}/**
 * Refresh the live Umbra
 * Health Snapshot.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleHealthRefresh(
    interaction
) {
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

    const terminalEmbed =
        buildControlPanelEmbed(
            interaction,
            snapshot
        );

    await interaction.editReply({
        embeds: [
            terminalEmbed
        ],

        components:
            buildControlPanelComponents()
    });

    console.log(
        '======================================'
    );

    console.log(
        '🔄 Umbra Terminal Health Refreshed'
    );

    console.log(
        `🛡️ Refreshed By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        `📡 Gateway: ${
            snapshot.gatewayConnected
                ? 'CONNECTED'
                : 'DISCONNECTED'
        }`
    );

    console.log(
        `🗄️ Database: ${
            snapshot.databaseConnected
                ? 'CONNECTED'
                : 'UNAVAILABLE'
        }`
    );

    console.log(
        `🌙 Overall Health: ${snapshot.overallHealth.label}`
    );

    console.log(
        '======================================'
    );
}

/**
 * Refresh the PostgreSQL
 * Incident Center records.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleIncidentRefresh(
    interaction
) {
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

    const incidentCenterEmbed =
        buildIncidentCenterEmbed(
            interaction,
            incidents,
            statistics
        );

    await interaction.editReply({
        embeds: [
            incidentCenterEmbed
        ],

        components:
            buildIncidentCenterComponents()
    });

    console.log(
        '======================================'
    );

    console.log(
        '🚨 Umbra Incident Center Refreshed'
    );

    console.log(
        `🛡️ Refreshed By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        `📚 Incidents Displayed: ${incidents.length}`
    );

    console.log(
        `🔴 Critical Records: ${statistics.critical}`
    );

    console.log(
        `🟡 Warning Records: ${statistics.warning}`
    );

    console.log(
        `📊 Total Records: ${statistics.total}`
    );

    console.log(
        '======================================'
    );
}

/**
 * Refresh the Black Box
 * Services Center.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleServicesRefresh(
    interaction
) {
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

    const servicesCenterEmbed =
        buildServicesCenterEmbed(
            interaction,
            services
        );

    const summary =
        getServiceSummary(
            services
        );

    await interaction.editReply({
        embeds: [
            servicesCenterEmbed
        ],

        components:
            buildServicesCenterComponents()
    });

    console.log(
        '======================================'
    );

    console.log(
        '⚙️ Umbra Services Center Refreshed'
    );

    console.log(
        `🛡️ Refreshed By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        `🖥️ Services Displayed: ${services.length}`
    );

    console.log(
        `🟢 Online: ${summary.online}`
    );

    console.log(
        `🟡 Degraded: ${summary.degraded}`
    );

    console.log(
        `🔴 Offline: ${summary.offline}`
    );

    console.log(
        `🔵 Starting: ${summary.starting}`
    );

    console.log(
        `⚫ Stopped: ${summary.stopped}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra Terminal menus
     * and action buttons.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        if (
            !isControlPanelInteraction(
                interaction
            )
        ) {
            return;
        }

        try {
            if (
                !interaction.inGuild()
            ) {
                await sendControlPanelError(
                    interaction,
                    '❌ Server Only Action',
                    'The Umbra Terminal can only be used inside Las Noches.'
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
                    'Only a Las Noches Administrator may use the Umbra Terminal.'
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

            if (
                interaction.isButton() &&
                interaction.customId ===
                    CONTROL_PANEL_REFRESH_ID
            ) {
                await handleHealthRefresh(
                    interaction
                );

                return;
            }

            if (
                interaction.isButton() &&
                interaction.customId ===
                    INCIDENT_CENTER_REFRESH_ID
            ) {
                await handleIncidentRefresh(
                    interaction
                );

                return;
            }

            if (
                interaction.isButton() &&
                interaction.customId ===
                    SERVICES_CENTER_REFRESH_ID
            ) {
                await handleServicesRefresh(
                    interaction
                );
            }
        } catch (error) {
            console.error(
                '❌ Umbra Terminal interaction failed:'
            );

            console.error(
                error
            );

            await sendControlPanelError(
                interaction,
                '❌ Terminal Action Failed',
                [
                    'Umbra could not complete the selected Terminal action.',
                    '',
                    'Check the Discord Gateway, PostgreSQL connection and Black Box modules.'
                ].join(
                    '\n'
                )
            ).catch(
                responseError => {
                    console.error(
                        '❌ Failed to send the Terminal interaction error:'
                    );

                    console.error(
                        responseError
                    );
                }
            );
        }
    }
};
const {
    Events,
    MessageFlags,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../utils/embeds');

const Terminal =
    require('../utils/terminal');

const {
    CONTROL_PANEL_COLOR,
    CONTROL_PANEL_CUSTOM_ID,
    formatBooleanStatus,
    formatHealthState
} = require('../commands/information/controlpanel');

/**
 * Build the shared Umbra Terminal menu.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildControlPanelMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            CONTROL_PANEL_CUSTOM_ID
        )

        .setPlaceholder(
            'Select an Umbra Terminal module...'
        )

        .setMinValues(
            1
        )

        .setMaxValues(
            1
        )

        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Terminal Overview'
                )
                .setDescription(
                    'View live Umbra health and system information'
                )
                .setEmoji(
                    '🖥️'
                )
                .setValue(
                    'system-overview'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Rank Trials'
                )
                .setDescription(
                    'View Monthly Rank Trials controls'
                )
                .setEmoji(
                    '⚔️'
                )
                .setValue(
                    'rank-trials'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Ticket Management'
                )
                .setDescription(
                    'View ticket panel and support controls'
                )
                .setEmoji(
                    '🎫'
                )
                .setValue(
                    'tickets'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Arrancar Ranks'
                )
                .setDescription(
                    'View hierarchy management controls'
                )
                .setEmoji(
                    '👑'
                )
                .setValue(
                    'arrancar-ranks'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Setup Center'
                )
                .setDescription(
                    'View Las Noches setup controls'
                )
                .setEmoji(
                    '📚'
                )
                .setValue(
                    'setup-center'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Guardian Status'
                )
                .setDescription(
                    'View Guardian and AutoMod information'
                )
                .setEmoji(
                    '🛡️'
                )
                .setValue(
                    'guardian-status'
                )
        );
}

/**
 * Build the shared Action Row.
 *
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function buildControlPanelRow() {
    return new ActionRowBuilder()
        .addComponents(
            buildControlPanelMenu()
        );
}

/**
 * Build a common Umbra Terminal module Embed.
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
    fields = [],
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
}

/**
 * Build the live Terminal Overview page.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {Awaited<ReturnType<
 *     typeof Terminal.dashboard.collectHealth
 * >>} snapshot
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

    return buildModuleEmbed({
        interaction,

        title:
            `${snapshot.overallHealth.emoji} Umbra Terminal Overview`,

        description:
            [
                `**System State:** \`${snapshot.overallHealth.label}\``,
                '',
                snapshot.overallHealth.message,
                '',
                `Last diagnostic check: <t:${snapshot.checkedAt}:R>`
            ].join(
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
                            'DISCONNECTED'
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
                    '🧠 Memory',

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
                        `**PID:** \`${process.pid}\``
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
}/**
 * Build the Rank Trials page.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
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
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
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
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
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
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
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
                    'Publish official rules and standards.',

                inline:
                    true
            },
            {
                name:
                    '⛩️ Verification Guide',

                value:
                    'Publish compact Bloxlink instructions.',

                inline:
                    true
            },
            {
                name:
                    '📖 Information Modules',

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
}/**
 * Build the live Guardian page.
 *
 * The Guardian state is inferred from the
 * currently running Umbra process and the
 * live health snapshot.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {Awaited<ReturnType<
 *     typeof Terminal.dashboard.collectHealth
 * >>} snapshot
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
                        'DISCONNECTED'
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
 * Safely send a Control Panel error.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
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

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra Terminal menu interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        if (
            !interaction.isStringSelectMenu()
        ) {
            return;
        }

        if (
            interaction.customId !==
            CONTROL_PANEL_CUSTOM_ID
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
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await sendControlPanelError(
                    interaction,
                    '❌ Authority Denied',
                    'Only a Las Noches Administrator may use the Umbra Terminal.'
                );

                return;
            }

            await interaction.deferUpdate();

            const selectedModule =
                interaction.values[0];

            let embed;

            switch (
                selectedModule
            ) {
                case 'system-overview': {
                    const snapshot =
                        await Terminal.dashboard
                            .collectHealth(
                                interaction.client
                            );

                    embed =
                        buildSystemOverviewEmbed(
                            interaction,
                            snapshot
                        );

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

                case 'arrancar-ranks':
                    embed =
                        buildArrancarRanksEmbed(
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
                        await Terminal.dashboard
                            .collectHealth(
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
                            '❌ Unknown Terminal Module',
                            'Umbra could not load the selected Terminal module.'
                        );
            }

            await interaction.editReply({
                embeds: [
                    embed
                ],

                components: [
                    buildControlPanelRow()
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra Terminal interaction failed:'
            );

            console.error(
                error
            );

            await sendControlPanelError(
                interaction,
                '❌ Terminal Module Failed',
                [
                    'Umbra could not load the selected Terminal module.',
                    '',
                    'Check the Discord Gateway, PostgreSQL connection and Terminal health modules.'
                ].join(
                    '\n'
                )
            ).catch(
                responseError => {
                    console.error(
                        '❌ Failed to send Terminal interaction error:'
                    );

                    console.error(
                        responseError
                    );
                }
            );
        }
    }
};
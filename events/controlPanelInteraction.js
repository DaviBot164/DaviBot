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

const {
    CONTROL_PANEL_COLOR,
    CONTROL_PANEL_CUSTOM_ID
} = require('../commands/information/controlpanel');

/**
 * Build the shared Control Panel menu.
 *
 * The menu remains available after
 * switching between module pages.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildControlPanelMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            CONTROL_PANEL_CUSTOM_ID
        )

        .setPlaceholder(
            'Select an Umbra control module...'
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
                    'System Overview'
                )
                .setDescription(
                    'View Umbra systems and management commands'
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
 * Build a common Control Panel Embed.
 *
 * @param {Object} options
 * @param {import('discord.js').Interaction} options.interaction
 * @param {string} options.title
 * @param {string} options.description
 * @param {Object[]} [options.fields]
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildModuleEmbed({
    interaction,
    title,
    description,
    fields = []
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

            color:
                CONTROL_PANEL_COLOR,

            thumbnail:
                botAvatar,

            fields
        });

    embed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            botAvatar
    });

    embed.setFooter({
        text:
            'Las Noches • Administrative Control Center',

        iconURL:
            guildIcon
    });

    embed.setTimestamp();

    return embed;
}

/**
 * Build the System Overview page.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSystemOverviewEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '🖥️ Umbra System Overview',

        description:
            [
                'The primary Umbra systems are listed below.',
                '',
                'Use the related slash commands to manage each module safely.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '⚔️ Rank Trials',

                value:
                    [
                        '`/ranktrials status`',
                        '`/ranktrials check`',
                        '`/ranktrials sync`'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '🎫 Ticket System',

                value:
                    [
                        '`/ticketpanel`',
                        '`/ticket`',
                        '`/tickets`'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '👑 Arrancar Ranks',

                value:
                    [
                        '`/setrank`',
                        '`/removerank`',
                        '`/rankhistory`'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '📚 Setup Center',

                value:
                    [
                        '`/setup`',
                        '`/setuprules`'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '🛡️ Guardian',

                value:
                    [
                        'Message protection',
                        'Spam protection',
                        'Invite protection',
                        'Profanity filtering'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '🖥️ Umbra Terminal',

                value:
                    [
                        'Live health dashboard',
                        'Alerts and incidents',
                        'Database and gateway status'
                    ].join('\n'),

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
                'Umbra protects scheduled announcements and Discord Events from duplicate creation.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '📊 Status',

                value:
                    '`/ranktrials status`\nView the current monthly schedule.',

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
                'Ticket actions remain protected by channel permissions and staff-role checks.'
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
                    '`/ticket`\nUse available ticket management actions.',

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
                'All Rank changes are recorded inside PostgreSQL and published through Umbra feeds.'
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
                        'Server Owner',
                        'Administrator',
                        'Configured High Command roles'
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
                'Publish and update official Las Noches guides.',
                '',
                'Use the Setup Wizard for safe, Administrator-only publication.'
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
                        'Server Guide',
                        'Role Information',
                        'FAQ',
                        'Ticket Guide'
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            }
        ]
    });
}/**
 * Build the Guardian page.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildGuardianEmbed(
    interaction
) {
    return buildModuleEmbed({
        interaction,

        title:
            '🛡️ Umbra Guardian',

        description:
            [
                'Guardian continuously protects Las Noches.',
                '',
                'Every incoming message passes through the protection pipeline before reaching other systems.'
            ].join(
                '\n'
            ),

        fields: [
            {
                name:
                    '🛡️ Protection',

                value:
                    [
                        'Spam Protection',
                        'Invite Protection',
                        'Profanity Filter',
                        'Scam Detection'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '📋 Logging',

                value:
                    [
                        'Guardian Cases',
                        'AutoMod Records',
                        'Kingdom Feed'
                    ].join('\n'),

                inline:
                    true
            },
            {
                name:
                    '⚙️ Status',

                value:
                    [
                        'Monitoring Messages',
                        'Database Connected',
                        'Ready'
                    ].join('\n'),

                inline:
                    true
            }
        ]
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

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
                return;
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.reply({
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        createErrorEmbed(
                            '❌ Authority Denied',
                            'Only a Las Noches Administrator may use the Umbra Control Panel.'
                        )
                    ]
                });

                return;
            }

            await interaction.deferUpdate();

            let embed;

            switch (
                interaction.values[0]
            ) {
                case 'system-overview':
                    embed =
                        buildSystemOverviewEmbed(
                            interaction
                        );
                    break;

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

                case 'guardian-status':
                    embed =
                        buildGuardianEmbed(
                            interaction
                        );
                    break;

                default:
                    embed =
                        createErrorEmbed(
                            '❌ Unknown Module',
                            'Umbra could not load the selected Control Panel module.'
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
                '❌ Umbra Control Panel interaction failed:'
            );

            console.error(
                error
            );
        }
    }
};
const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const GUIDE_MENU_ID =
    'umbra_guide_category_menu';

const GUIDE_PAGES = {
    overview: 'guide_overview',
    moderation: 'guide_moderation',
    ranks: 'guide_ranks',
    titles: 'guide_titles',
    progression: 'guide_progression',
    server: 'guide_server',
    support: 'guide_support',
    events: 'guide_events',
    administration: 'guide_administration',
    information: 'guide_information'
};

const GUIDE_PAGE_ORDER = [
    GUIDE_PAGES.overview,
    GUIDE_PAGES.moderation,
    GUIDE_PAGES.ranks,
    GUIDE_PAGES.titles,
    GUIDE_PAGES.progression,
    GUIDE_PAGES.server,
    GUIDE_PAGES.support,
    GUIDE_PAGES.events,
    GUIDE_PAGES.administration,
    GUIDE_PAGES.information
];

const GUIDE_PAGE_DETAILS = {
    [GUIDE_PAGES.overview]: {
        emoji: 'Ⅹ',
        label: 'Overview',
        description:
            'Main command and system overview'
    },

    [GUIDE_PAGES.moderation]: {
        emoji: '🛡️',
        label: 'Moderation',
        description:
            'Warnings, punishments and channel control'
    },

    [GUIDE_PAGES.ranks]: {
        emoji: '⚔️',
        label: 'Sin Ranks',
        description:
            'Sin ranking and competitive records'
    },

    [GUIDE_PAGES.titles]: {
        emoji: '♜',
        label: 'Titles',
        description:
            'Title collection and management'
    },

    [GUIDE_PAGES.progression]: {
        emoji: '◆',
        label: 'Progression',
        description:
            'Member progression and profiles'
    },

    [GUIDE_PAGES.server]: {
        emoji: 'Ⅹ',
        label: 'THE Ⅹ SINS',
        description:
            'Server information and central records'
    },

    [GUIDE_PAGES.support]: {
        emoji: '🎫',
        label: 'Support',
        description:
            'Tickets and member assistance'
    },

    [GUIDE_PAGES.events]: {
        emoji: '🎉',
        label: 'Events',
        description:
            'Events, giveaways and community activity'
    },

    [GUIDE_PAGES.administration]: {
        emoji: '♛',
        label: 'Administration',
        description:
            'Setup and server management'
    },

    [GUIDE_PAGES.information]: {
        emoji: '📖',
        label: 'Information',
        description:
            'General commands and utilities'
    }
};

const ACCESS = {
    everyone: 'Everyone',
    self: 'Personal Use',
    moderator: '⚔️ Lieutenant or Higher',
    administrator: '🛡️ Captain or Higher',
    highCommand: '♛ High Command',
    owner: '♛ Sovereign Only'
};

const GUIDE_COMMANDS = {
    ban: [
        'moderation',
        '/ban user [reason] [delete_messages]',
        'Ban a member from the server.',
        'administrator'
    ],

    kick: [
        'moderation',
        '/kick user [reason]',
        'Remove a member without permanently banning them.',
        'moderator'
    ],

    timeout: [
        'moderation',
        '/timeout user duration [reason]',
        'Temporarily restrict a member from interacting.',
        'moderator'
    ],

    untimeout: [
        'moderation',
        '/untimeout user [reason]',
        'Remove an active timeout from a member.',
        'moderator'
    ],

    warn: [
        'moderation',
        '/warn user reason',
        'Record an official warning.',
        'moderator'
    ],

    warnings: [
        'moderation',
        '/warnings user',
        'View warnings recorded against a member.',
        'moderator'
    ],

    unwarn: [
        'moderation',
        '/unwarn warning_id [reason]',
        'Remove one warning record.',
        'moderator'
    ],

    clearwarnings: [
        'moderation',
        '/clearwarnings user [reason]',
        'Remove all warnings from a member.',
        'administrator'
    ],

    cases: [
        'moderation',
        '/cases [user] [limit]',
        'View moderation and AutoMod cases.',
        'moderator'
    ],

    history: [
        'moderation',
        '/history user [limit]',
        'View a member’s moderation history.',
        'moderator'
    ],

    clear: [
        'moderation',
        '/clear amount [user]',
        'Delete multiple messages from a channel.',
        'moderator'
    ],

    lock: [
        'moderation',
        '/lock [channel] [reason]',
        'Prevent regular members from sending messages.',
        'moderator'
    ],

    unlock: [
        'moderation',
        '/unlock [channel] [reason]',
        'Restore message access in a locked channel.',
        'moderator'
    ],

    slowmode: [
        'moderation',
        '/slowmode seconds [channel] [reason]',
        'Set or remove a channel slowmode delay.',
        'moderator'
    ],

    setrank: [
        'ranks',
        '/setrank user rank reason',
        'Assign or replace a managed Sin Rank.',
        'highCommand'
    ],

    removerank: [
        'ranks',
        '/removerank user reason',
        'Remove a member’s current managed Sin Rank.',
        'highCommand'
    ],

    rankhistory: [
        'ranks',
        '/rankhistory [user] [limit]',
        'View rank assignment and removal history.',
        'everyone'
    ],

    espada: [
        'ranks',
        '/espada',
        'View the current Ten Sins hierarchy.',
        'everyone'
    ],

    titles: [
        'titles',
        '/titles [user]',
        'View unlocked, active and locked Titles.',
        'everyone'
    ],

    settitle: [
        'titles',
        '/settitle category',
        'Activate one of your unlocked Titles.',
        'self'
    ],

    removetitle: [
        'titles',
        '/removetitle',
        'Remove your active Title.',
        'self'
    ],

    granttitle: [
        'titles',
        '/granttitle user title reason [activate]',
        'Grant a Manual or Event Title to a member.',
        'highCommand'
    ],

    revoketitle: [
        'titles',
        '/revoketitle user title reason',
        'Revoke a manually granted Title.',
        'highCommand'
    ],

    soul: [
        'progression',
        '/soul [user]',
        'Open the complete progression record for a member.',
        'everyone'
    ],

    profile: [
        'progression',
        '/profile [user]',
        'View a compact member profile.',
        'everyone'
    ],

    level: [
        'progression',
        '/level [user]',
        'View current level and progression.',
        'everyone'
    ],

    rank: [
        'progression',
        '/rank [user]',
        'View current rank information.',
        'everyone'
    ],

    leaderboard: [
        'progression',
        '/leaderboard',
        'View progression leaderboards.',
        'everyone'
    ],

    dashboard: [
        'server',
        '/dashboard',
        'Open the interactive THE Ⅹ SINS server overview.',
        'everyone'
    ],

    ticketpanel: [
        'support',
        '/ticketpanel',
        'Publish the interactive support panel.',
        'administrator'
    ],

    ticket: [
        'support',
        '/ticket',
        'Create or manage a personal support ticket.',
        'everyone'
    ],

    tickets: [
        'support',
        '/tickets',
        'View support ticket management options.',
        'moderator'
    ],

    event: [
        'events',
        '/event',
        'Create or manage an official server event.',
        'administrator'
    ],

    giveaway: [
        'events',
        '/giveaway',
        'Create or manage a community giveaway.',
        'administrator'
    ],

    setup: [
        'administration',
        '/setup',
        'Open Evelynn’s interactive server setup.',
        'administrator'
    ],

    setuprules: [
        'administration',
        '/setuprules',
        'Publish or refresh the Code of Sins.',
        'administrator'
    ],

    testwelcome: [
        'administration',
        '/testwelcome',
        'Preview the current Welcome design.',
        'administrator'
    ],

    announce: [
        'administration',
        '/announce',
        'Publish an official server announcement.',
        'administrator'
    ],

    help: [
        'information',
        '/help',
        'Open Evelynn’s quick command menu.',
        'everyone'
    ],

    guide: [
        'information',
        '/guide',
        'Open this detailed interactive command guide.',
        'everyone'
    ],

    ping: [
        'information',
        '/ping',
        'Check Evelynn’s latency and connection status.',
        'everyone'
    ],

    avatar: [
        'information',
        '/avatar [user]',
        'View a user’s Discord avatar.',
        'everyone'
    ],

    userinfo: [
        'information',
        '/userinfo [user]',
        'View detailed Discord member information.',
        'everyone'
    ],

    serverinfo: [
        'information',
        '/serverinfo',
        'View detailed information about THE Ⅹ SINS.',
        'everyone'
    ]
};

const PAGE_WORKFLOWS = {
    ranks: [
        '`/setrank` — assign a Sin Rank',
        '`/rankhistory` — review rank history',
        '`/espada` — view the Ten Sins hierarchy'
    ],

    titles: [
        '`/titles` — view unlocked Titles',
        '`/settitle` — activate a Title',
        '`/soul` — confirm your progression record'
    ],

    progression: [
        '`/soul` — open the full progression record',
        '`/level` — check current level',
        '`/rankhistory` — review rank history'
    ],

    support: [
        '`/ticketpanel` — publish the support panel',
        '`/ticket` — open a support request',
        '`/tickets` — manage active tickets'
    ]
};function getCategoryCommands(
    client,
    category
) {
    return Object.entries(
        GUIDE_COMMANDS
    )
        .filter(
            ([name, details]) =>
                details[0] === category &&
                client.commands.has(name)
        )
        .map(
            ([name, details]) => ({
                name,
                syntax: details[1],
                summary: details[2],
                access: details[3]
            })
        );
}

function getCategoryName(
    pageId
) {
    const details =
        GUIDE_PAGE_DETAILS[pageId];

    return details?.label ??
        'Guide';
}

function getCategoryFromPage(
    pageId
) {
    return Object.keys(
        GUIDE_PAGE_DETAILS
    ).find(
        key =>
            GUIDE_PAGE_DETAILS[key] &&
            pageId === key
    );
}

function getPageCategory(
    pageId
) {
    return (
        {
            [GUIDE_PAGES.overview]:
                'overview',

            [GUIDE_PAGES.moderation]:
                'moderation',

            [GUIDE_PAGES.ranks]:
                'ranks',

            [GUIDE_PAGES.titles]:
                'titles',

            [GUIDE_PAGES.progression]:
                'progression',

            [GUIDE_PAGES.server]:
                'server',

            [GUIDE_PAGES.support]:
                'support',

            [GUIDE_PAGES.events]:
                'events',

            [GUIDE_PAGES.administration]:
                'administration',

            [GUIDE_PAGES.information]:
                'information'
        }[pageId]
    );
}

function buildGuideMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                GUIDE_MENU_ID
            )
            .setPlaceholder(
                'Choose a guide category...'
            )
            .setMinValues(1)
            .setMaxValues(1)
            .setDisabled(disabled)
            .addOptions(
                GUIDE_PAGE_ORDER.map(
                    pageId => {
                        const page =
                            GUIDE_PAGE_DETAILS[
                                pageId
                            ];

                        return new StringSelectMenuOptionBuilder()
                            .setLabel(
                                page.label
                            )
                            .setDescription(
                                page.description
                            )
                            .setEmoji(
                                page.emoji
                            )
                            .setValue(
                                pageId
                            )
                            .setDefault(
                                pageId ===
                                selectedPage
                            );
                    }
                )
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

function buildGuideEmbed(
    interaction,
    title,
    description,
    fields = []
) {
    const avatar =
        interaction.client.user
            .displayAvatarURL({
                size: 256,
                forceStatic: false
            });

    const icon =
        interaction.guild.iconURL({
            size: 256,
            forceStatic: false
        }) ?? avatar;

    return createEmbed({
        title,

        description,

        color:
            '#5B3A78',

        thumbnail:
            icon,

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                avatar
        },

        fields,

        footer: {
            text:
                'TTS • Command Guide'
        }
    });
}

function formatCommand(
    command
) {
    return [
        `### ${command.syntax}`,

        command.summary,

        `-# Access: ${
            ACCESS[
                command.access
            ] ??
            ACCESS.everyone
        }`
    ].join('\n');
}

function buildCommandFields(
    commands
) {
    if (!commands.length) {
        return [
            {
                name:
                    'No Commands Available',

                value:
                    'No registered commands are available in this category.',

                inline: false
            }
        ];
    }

    const fields = [];
    let current = [];

    for (const command of commands) {
        const block =
            formatCommand(
                command
            );

        const length =
            current.join('\n\n')
                .length +
            block.length;

        if (
            length > 1000 &&
            current.length
        ) {
            fields.push({
                name:
                    fields.length
                        ? 'Commands'
                        : 'Commands',

                value:
                    current.join(
                        '\n\n'
                    ),

                inline: false
            });

            current = [];
        }

        current.push(block);
    }

    if (current.length) {
        fields.push({
            name:
                fields.length
                    ? 'Commands'
                    : 'Commands',

            value:
                current.join(
                    '\n\n'
                ),

            inline: false
        });
    }

    return fields;
}

function buildOverviewPage(
    interaction
) {
    const commands =
        Object.values(
            GUIDE_COMMANDS
        )
            .filter(
                details =>
                    interaction.client
                        .commands
                        .has(
                            Object.keys(
                                GUIDE_COMMANDS
                            ).find(
                                name =>
                                    GUIDE_COMMANDS[
                                        name
                                    ] === details
                            )
                        )
            );

    const loaded =
        interaction.client.commands.size;

    const documented =
        Object.keys(
            GUIDE_COMMANDS
        ).filter(
            name =>
                interaction.client.commands
                    .has(name)
        ).length;

    return buildGuideEmbed(
        interaction,

        'Ⅹ・Command Guide',

        [
            'Welcome to the THE Ⅹ SINS Command Guide.',
            '',
            'Use the menu below to explore commands by category.',
            '',
            `**Loaded Commands:** \`${loaded}\``,
            `**Documented Commands:** \`${documented}\``,
            '',
            'Only commands currently loaded by Evelynn are displayed.'
        ].join('\n'),

        [
            {
                name:
                    '🧭 Quick Access',

                value: [
                    '`/help` — quick command menu',
                    '`/dashboard` — server overview',
                    '`/profile` — member profile',
                    '`/soul` — progression archive'
                ].join('\n'),

                inline: false
            }
        ]
    );
}

function buildCategoryPage(
    interaction,
    pageId
) {
    const category =
        getPageCategory(
            pageId
        );

    const commands =
        getCategoryCommands(
            interaction.client,
            category
        );

    const page =
        GUIDE_PAGE_DETAILS[
            pageId
        ];

    const fields =
        buildCommandFields(
            commands
        );

    const workflow =
        PAGE_WORKFLOWS[
            category
        ];

    if (workflow) {
        fields.push({
            name:
                '🧭 Recommended Flow',

            value:
                workflow.join('\n'),

            inline: false
        });
    }

    return buildGuideEmbed(
        interaction,

        `${page.emoji}・${page.label}`,

        [
            page.description,
            '',
            `**Available Commands:** \`${commands.length}\``
        ].join('\n'),

        fields
    );
}

function buildPage(
    interaction,
    pageId
) {
    if (
        pageId ===
        GUIDE_PAGES.overview
    ) {
        return buildOverviewPage(
            interaction
        );
    }

    return buildCategoryPage(
        interaction,
        pageId
    );
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'guide'
            )
            .setDescription(
                'Open the interactive command guide.'
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Command Guide can only be opened inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            let selectedPage =
                GUIDE_PAGES.overview;

            const message =
                await interaction.editReply({
                    embeds: [
                        buildPage(
                            interaction,
                            selectedPage
                        )
                    ],

                    components: [
                        buildGuideMenu(
                            selectedPage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                message.createMessageComponentCollector({
                    componentType:
                        ComponentType.StringSelect,

                    time:
                        10 * 60 * 1000
                });

            collector.on(
                'collect',
                async menuInteraction => {
                    if (
                        menuInteraction.user.id !==
                        interaction.user.id
                    ) {
                        return menuInteraction.reply({
                            embeds: [
                                createErrorEmbed(
                                    '❌ Private Guide',
                                    'Only the member who opened this Guide can control it.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    if (
                        menuInteraction.customId !==
                        GUIDE_MENU_ID
                    ) {
                        return;
                    }

                    const page =
                        menuInteraction.values[0];

                    if (
                        !GUIDE_PAGE_ORDER.includes(
                            page
                        )
                    ) {
                        return menuInteraction.reply({
                            embeds: [
                                createErrorEmbed(
                                    '❌ Unknown Guide Page',
                                    'Evelynn could not recognize the selected category.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    try {
                        selectedPage =
                            page;

                        await menuInteraction.update({
                            embeds: [
                                buildPage(
                                    interaction,
                                    selectedPage
                                )
                            ],

                            components: [
                                buildGuideMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (error) {
                        console.error(
                            '❌ Evelynn Guide navigation error:',
                            error
                        );

                        await menuInteraction
                            .reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Guide Navigation Failed',
                                        'Evelynn could not open the selected Guide page.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            })
                            .catch(
                                () => null
                            );
                    }
                }
            );

            collector.on(
                'end',
                async () => {
                    await interaction
                        .editReply({
                            components: [
                                buildGuideMenu(
                                    selectedPage,
                                    true
                                )
                            ]
                        })
                        .catch(
                            () => null
                        );
                }
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /guide error:',
                error
            );

            const embed =
                createErrorEmbed(
                    '❌ Guide Unavailable',
                    'Evelynn could not open the Command Guide.'
                );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [embed],
                        components: []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [embed],
                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};
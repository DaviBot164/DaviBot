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

const GUIDE_COLOR =
    '#5B3A78';

const GUIDE_PAGES = {
    overview:
        'guide_overview',

    moderation:
        'guide_moderation',

    ranks:
        'guide_ranks',

    titles:
        'guide_titles',

    progression:
        'guide_progression',

    server:
        'guide_server',

    support:
        'guide_support',

    events:
        'guide_events',

    administration:
        'guide_administration',

    information:
        'guide_information'
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
        label:
            'Overview',

        emoji:
            'Ⅹ',

        description:
            'Main command and system overview.'
    },

    [GUIDE_PAGES.moderation]: {
        label:
            'Moderation',

        emoji:
            '🛡️',

        description:
            'Warnings, punishments and channel control.'
    },

    [GUIDE_PAGES.ranks]: {
        label:
            'Sin Ranks',

        emoji:
            '⚔️',

        description:
            'Sin ranking and competitive records.'
    },

    [GUIDE_PAGES.titles]: {
        label:
            'Titles',

        emoji:
            '♜',

        description:
            'Title collection and management.'
    },

    [GUIDE_PAGES.progression]: {
        label:
            'Progression',

        emoji:
            '◆',

        description:
            'Levels, profiles and member progression.'
    },

    [GUIDE_PAGES.server]: {
        label:
            'THE Ⅹ SINS',

        emoji:
            'Ⅹ',

        description:
            'Server information and central records.'
    },

    [GUIDE_PAGES.support]: {
        label:
            'Support',

        emoji:
            '🎫',

        description:
            'Tickets and member assistance.'
    },

    [GUIDE_PAGES.events]: {
        label:
            'Events',

        emoji:
            '🎉',

        description:
            'Events, giveaways and community activity.'
    },

    [GUIDE_PAGES.administration]: {
        label:
            'Administration',

        emoji:
            '♛',

        description:
            'Setup and server management.'
    },

    [GUIDE_PAGES.information]: {
        label:
            'Information',

        emoji:
            '📖',

        description:
            'General commands and utilities.'
    }
};

const ACCESS = {
    everyone:
        'Everyone',

    self:
        'Personal Use',

    moderator:
        'Lieutenant or Higher',

    administrator:
        'Captain or Higher',

    highCommand:
        'High Command',

    owner:
        'Sovereign Only'
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
        'Temporarily restrict a member.',
        'moderator'
    ],

    untimeout: [
        'moderation',
        '/untimeout user [reason]',
        'Remove an active timeout.',
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
        'View moderation history.',
        'moderator'
    ],

    clear: [
        'moderation',
        '/clear amount [user]',
        'Delete multiple messages.',
        'moderator'
    ],

    lock: [
        'moderation',
        '/lock [channel] [reason]',
        'Lock a channel.',
        'moderator'
    ],

    unlock: [
        'moderation',
        '/unlock [channel] [reason]',
        'Unlock a channel.',
        'moderator'
    ],

    slowmode: [
        'moderation',
        '/slowmode seconds [channel] [reason]',
        'Set or remove channel slowmode.',
        'moderator'
    ],

    setrank: [
        'ranks',
        '/setrank user rank reason',
        'Assign or replace a Sin Rank.',
        'highCommand'
    ],

    removerank: [
        'ranks',
        '/removerank user reason',
        'Remove a member’s Sin Rank.',
        'highCommand'
    ],

    rankhistory: [
        'ranks',
        '/rankhistory [user] [limit]',
        'View rank history.',
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
        'View unlocked and active Titles.',
        'everyone'
    ],

    settitle: [
        'titles',
        '/settitle category',
        'Activate an unlocked Title.',
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
        'Grant a Title to a member.',
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
        'Open a member progression record.',
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
        'Open the THE Ⅹ SINS server dashboard.',
        'everyone'
    ],

    ticketpanel: [
        'support',
        '/ticketpanel',
        'Publish the support panel.',
        'administrator'
    ],

    ticket: [
        'support',
        '/ticket',
        'Create a support ticket.',
        'everyone'
    ],

    tickets: [
        'support',
        '/tickets',
        'Manage active tickets.',
        'moderator'
    ],

    announce: [
        'events',
        '/announce',
        'Publish an official announcement.',
        'administrator'
    ],

    event: [
        'events',
        '/event',
        'Create or manage an event.',
        'administrator'
    ],

    giveaway: [
        'events',
        '/giveaway',
        'Create or manage a giveaway.',
        'administrator'
    ],

    setup: [
        'administration',
        '/setup',
        'Open the server setup menu.',
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
        'Preview the Welcome design.',
        'administrator'
    ],

    help: [
        'information',
        '/help',
        'Open the quick command menu.',
        'everyone'
    ],

    guide: [
        'information',
        '/guide',
        'Open this detailed command guide.',
        'everyone'
    ],

    ping: [
        'information',
        '/ping',
        'Check Evelynn latency and status.',
        'everyone'
    ],

    avatar: [
        'information',
        '/avatar [user]',
        'View a user avatar.',
        'everyone'
    ],

    userinfo: [
        'information',
        '/userinfo [user]',
        'View detailed member information.',
        'everyone'
    ],

    serverinfo: [
        'information',
        '/serverinfo',
        'View server information.',
        'everyone'
    ]
};function getBotAvatar(
    interaction
) {
    return interaction.client.user
        .displayAvatarURL({
            size:
                256,

            forceStatic:
                false
        });
}

function getGuildIcon(
    interaction
) {
    return (
        interaction.guild.iconURL({
            size:
                512,

            forceStatic:
                false
        }) ??
        getBotAvatar(
            interaction
        )
    );
}

function getPageCategory(
    pageId
) {
    return {
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
    }[
        pageId
    ];
}

function getPageCommands(
    client,
    pageId
) {
    const category =
        getPageCategory(
            pageId
        );

    if (!category) {
        return [];
    }

    return Object.entries(
        GUIDE_COMMANDS
    )
        .filter(
            ([, details]) =>
                details[0] ===
                category
        )
        .filter(
            ([name]) =>
                client.commands?.has(
                    name
                )
        )
        .map(
            ([name, details]) => ({
                name,
                syntax:
                    details[1],
                description:
                    details[2],
                access:
                    details[3]
            })
        );
}

function getLoadedCommandCount(
    client
) {
    return (
        client.commands?.size ??
        0
    );
}

function formatCommand(
    command
) {
    return [
        `\`${command.syntax}\``,

        command.description,

        `-# Access: ${
            ACCESS[
                command.access
            ] ??
            ACCESS.everyone
        }`
    ].join('\n');
}

function splitCommandEntries(
    entries
) {
    const chunks = [];
    let current = [];

    for (
        const entry of entries
    ) {
        const next =
            current.length
                ? `${current.join('\n\n')}\n\n${entry}`
                : entry;

        if (
            next.length > 900 &&
            current.length
        ) {
            chunks.push(
                current.join(
                    '\n\n'
                )
            );

            current = [
                entry
            ];

            continue;
        }

        current.push(
            entry
        );
    }

    if (
        current.length
    ) {
        chunks.push(
            current.join(
                '\n\n'
            )
        );
    }

    return chunks;
}

function createGuideEmbed(
    interaction,
    title,
    description
) {
    const botAvatar =
        getBotAvatar(
            interaction
        );

    return createEmbed({
        title,

        description,

        color:
            GUIDE_COLOR,

        thumbnail:
            getGuildIcon(
                interaction
            ),

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                'TTS • Command Guide',

            iconURL:
                botAvatar
        }
    });
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
            .setMinValues(
                1
            )
            .setMaxValues(
                1
            )
            .setDisabled(
                disabled
            )
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
        .addComponents(
            menu
        );
}

function addWorkflow(
    embed,
    pageId
) {
    const workflows = {
        [GUIDE_PAGES.ranks]: [
            '`/setrank` — assign a Sin Rank',
            '`/rankhistory` — review rank history',
            '`/espada` — view the Ten Sins hierarchy'
        ],

        [GUIDE_PAGES.titles]: [
            '`/titles` — view unlocked Titles',
            '`/settitle` — activate a Title',
            '`/removetitle` — remove your active Title'
        ],

        [GUIDE_PAGES.progression]: [
            '`/soul` — open the progression record',
            '`/level` — check current level',
            '`/rank` — check current rank'
        ],

        [GUIDE_PAGES.support]: [
            '`/ticketpanel` — publish the support panel',
            '`/ticket` — open a support request',
            '`/tickets` — manage active tickets'
        ]
    };

    const workflow =
        workflows[
            pageId
        ];

    if (
        !workflow
    ) {
        return;
    }

    embed.addFields({
        name:
            'Ⅹ・RECOMMENDED FLOW',

        value:
            workflow.join('\n'),

        inline:
            false
    });
}function buildOverviewPage(
    interaction
) {
    const embed =
        createGuideEmbed(
            interaction,

            'Ⅹ・COMMAND GUIDE',

            [
                `Welcome, ${interaction.user}.`,
                '',
                'Explore THE Ⅹ SINS commands using the menu below.',
                '',
                `**Loaded Commands:** \`${getLoadedCommandCount(
                    interaction.client
                )}\``,
                '',
                'Only commands currently loaded by Evelynn are shown.'
            ].join('\n')
        );

    const categoryFields =
        GUIDE_PAGE_ORDER
            .filter(
                pageId =>
                    pageId !==
                    GUIDE_PAGES.overview
            )
            .map(
                pageId => {
                    const page =
                        GUIDE_PAGE_DETAILS[
                            pageId
                        ];

                    const count =
                        getPageCommands(
                            interaction.client,
                            pageId
                        ).length;

                    return {
                        name:
                            `${page.emoji}・${page.label.toUpperCase()}`,

                        value:
                            `\`${count}\` commands`,

                        inline:
                            true
                    };
                }
            );

    embed.addFields(
        ...categoryFields
    );

    embed.addFields({
        name:
            'Ⅹ・QUICK ACCESS',

        value: [
            '`/help` — quick command menu',
            '`/guide` — detailed documentation',
            '`/dashboard` — server overview',
            '`/soul` — progression record'
        ].join('\n'),

        inline:
            false
    });

    return embed;
}

function buildCategoryPage(
    interaction,
    pageId
) {
    const page =
        GUIDE_PAGE_DETAILS[
            pageId
        ];

    if (!page) {
        return buildOverviewPage(
            interaction
        );
    }

    const commands =
        getPageCommands(
            interaction.client,
            pageId
        );

    const embed =
        createGuideEmbed(
            interaction,

            `${page.emoji}・${page.label.toUpperCase()}`,

            [
                page.description,
                '',
                `**Available Commands:** \`${commands.length}\``
            ].join('\n')
        );

    addWorkflow(
        embed,
        pageId
    );

    if (
        !commands.length
    ) {
        embed.addFields({
            name:
                '◇・NO COMMANDS',

            value:
                'No commands from this category are currently loaded.',

            inline:
                false
        });

        return embed;
    }

    const entries =
        commands.map(
            formatCommand
        );

    const chunks =
        splitCommandEntries(
            entries
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? 'Ⅹ・COMMANDS'
                        : 'Ⅹ・COMMANDS — CONTINUED',

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    return embed;
}

function buildGuidePage(
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

    if (
        GUIDE_PAGE_ORDER.includes(
            pageId
        )
    ) {
        return buildCategoryPage(
            interaction,
            pageId
        );
    }

    return buildOverviewPage(
        interaction
    );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'guide'
            )
            .setDescription(
                'Open Evelynn’s interactive command guide.'
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
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Command Guide can only be opened inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
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
                        buildGuidePage(
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
                    try {
                        if (
                            menuInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Guide',
                                        'Only the member who opened this Guide can control it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            GUIDE_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !GUIDE_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Guide Page',
                                        'Evelynn could not recognize the selected category.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        await menuInteraction.update({
                            embeds: [
                                buildGuidePage(
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
                            '❌ Evelynn /guide navigation error:',
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
                '❌ Evelynn /guide command error:',
                error
            );

            const errorEmbed =
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
                        embeds: [
                            errorEmbed
                        ],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};
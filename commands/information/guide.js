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

const rankConfig =
    require('../../config/ranks');

const GUIDE_MENU_ID =
    'umbra_guide_category_menu';

const MENU_TIMEOUT =
    10 * 60 * 1000;

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

const PAGE_DETAILS = {
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
            'Sin hierarchy and Rank management'
    },

    [GUIDE_PAGES.titles]: {
        emoji: '🏷️',
        label: 'Titles',
        description:
            'Title collection and selection'
    },

    [GUIDE_PAGES.progression]: {
        emoji: '⭐',
        label: 'Progression',
        description:
            'Levels, profiles and leaderboards'
    },

    [GUIDE_PAGES.server]: {
        emoji: 'Ⅹ',
        label: 'Server',
        description:
            'THE Ⅹ SINS server records'
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
            'Events, giveaways and announcements'
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
            'General information and utilities'
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
        'High Command'
};

const COMMAND_GUIDE = [
    // Moderation
    [
        'ban',
        GUIDE_PAGES.moderation,
        '/ban user [reason] [delete_messages]',
        'Ban a member from the server.',
        ACCESS.administrator
    ],
    [
        'kick',
        GUIDE_PAGES.moderation,
        '/kick user [reason]',
        'Remove a member from the server.',
        ACCESS.moderator
    ],
    [
        'timeout',
        GUIDE_PAGES.moderation,
        '/timeout user duration [reason]',
        'Temporarily restrict a member.',
        ACCESS.moderator
    ],
    [
        'untimeout',
        GUIDE_PAGES.moderation,
        '/untimeout user [reason]',
        'Remove an active timeout.',
        ACCESS.moderator
    ],
    [
        'warn',
        GUIDE_PAGES.moderation,
        '/warn user reason',
        'Record an official warning.',
        ACCESS.moderator
    ],
    [
        'warnings',
        GUIDE_PAGES.moderation,
        '/warnings user',
        'View a member’s warnings.',
        ACCESS.moderator
    ],
    [
        'unwarn',
        GUIDE_PAGES.moderation,
        '/unwarn warning_id [reason]',
        'Remove one warning record.',
        ACCESS.moderator
    ],
    [
        'clearwarnings',
        GUIDE_PAGES.moderation,
        '/clearwarnings user [reason]',
        'Remove all warnings from a member.',
        ACCESS.administrator
    ],
    [
        'cases',
        GUIDE_PAGES.moderation,
        '/cases [user] [limit]',
        'View moderation and AutoMod cases.',
        ACCESS.moderator
    ],
    [
        'history',
        GUIDE_PAGES.moderation,
        '/history user [limit]',
        'View a member’s moderation history.',
        ACCESS.moderator
    ],
    [
        'clear',
        GUIDE_PAGES.moderation,
        '/clear amount [user]',
        'Delete multiple channel messages.',
        ACCESS.moderator
    ],
    [
        'lock',
        GUIDE_PAGES.moderation,
        '/lock [channel] [reason]',
        'Lock a channel.',
        ACCESS.moderator
    ],
    [
        'unlock',
        GUIDE_PAGES.moderation,
        '/unlock [channel] [reason]',
        'Unlock a channel.',
        ACCESS.moderator
    ],
    [
        'slowmode',
        GUIDE_PAGES.moderation,
        '/slowmode seconds [channel] [reason]',
        'Set or remove channel slowmode.',
        ACCESS.moderator
    ],

    // Sin Ranks
    [
        'setrank',
        GUIDE_PAGES.ranks,
        '/setrank user rank reason',
        'Assign or replace a Sin Rank.',
        ACCESS.highCommand
    ],
    [
        'removerank',
        GUIDE_PAGES.ranks,
        '/removerank user reason',
        'Remove a member’s Sin Rank.',
        ACCESS.highCommand
    ],
    [
        'rankhistory',
        GUIDE_PAGES.ranks,
        '/rankhistory [user] [limit]',
        'View recorded Sin Rank history.',
        ACCESS.everyone
    ],

    // Titles
    [
        'titles',
        GUIDE_PAGES.titles,
        '/titles [user]',
        'View unlocked and active Titles.',
        ACCESS.everyone
    ],
    [
        'settitle',
        GUIDE_PAGES.titles,
        '/settitle category',
        'Activate an unlocked Title.',
        ACCESS.self
    ],
    [
        'removetitle',
        GUIDE_PAGES.titles,
        '/removetitle',
        'Remove your active Title.',
        ACCESS.self
    ]
];COMMAND_GUIDE.push(
    // Progression
    [
        'soul',
        GUIDE_PAGES.progression,
        '/soul',
        'Open your detailed Soul Record.',
        ACCESS.everyone
    ],
    [
        'profile',
        GUIDE_PAGES.progression,
        '/profile [user]',
        'View a compact member profile.',
        ACCESS.everyone
    ],
    [
        'level',
        GUIDE_PAGES.progression,
        '/level [user]',
        'View Level and XP progression.',
        ACCESS.everyone
    ],
    [
        'rank',
        GUIDE_PAGES.progression,
        '/rank [user]',
        'View current progression rank.',
        ACCESS.everyone
    ],
    [
        'leaderboard',
        GUIDE_PAGES.progression,
        '/leaderboard',
        'Open THE Ⅹ SINS leaderboards.',
        ACCESS.everyone
    ],

    // Server
    [
        'dashboard',
        GUIDE_PAGES.server,
        '/dashboard',
        'Open the central server dashboard.',
        ACCESS.everyone
    ],

    // Support
    [
        'ticketpanel',
        GUIDE_PAGES.support,
        '/ticketpanel',
        'Publish the support panel.',
        ACCESS.administrator
    ],
    [
        'ticket',
        GUIDE_PAGES.support,
        '/ticket',
        'Create a private support request.',
        ACCESS.everyone
    ],
    [
        'tickets',
        GUIDE_PAGES.support,
        '/tickets',
        'Manage active support tickets.',
        ACCESS.moderator
    ],

    // Events
    [
        'announce',
        GUIDE_PAGES.events,
        '/announce',
        'Publish an official announcement.',
        ACCESS.administrator
    ],
    [
        'event',
        GUIDE_PAGES.events,
        '/event',
        'Create and manage server events.',
        ACCESS.administrator
    ],
    [
        'giveaway',
        GUIDE_PAGES.events,
        '/giveaway',
        'Create and manage giveaways.',
        ACCESS.administrator
    ],

    // Administration
    [
        'setup',
        GUIDE_PAGES.administration,
        '/setup',
        'Open the server setup menu.',
        ACCESS.administrator
    ],
    [
        'setuprules',
        GUIDE_PAGES.administration,
        '/setuprules',
        'Publish the Code of Sins.',
        ACCESS.administrator
    ],
    [
        'testwelcome',
        GUIDE_PAGES.administration,
        '/testwelcome',
        'Preview the Welcome message.',
        ACCESS.administrator
    ],
    [
        'controlpanel',
        GUIDE_PAGES.administration,
        '/controlpanel',
        'Open Evelynn’s administrative terminal.',
        ACCESS.administrator
    ],

    // Information
    [
        'help',
        GUIDE_PAGES.information,
        '/help',
        'Open the quick command menu.',
        ACCESS.everyone
    ],
    [
        'guide',
        GUIDE_PAGES.information,
        '/guide',
        'Open this detailed command guide.',
        ACCESS.everyone
    ],
    [
        'ping',
        GUIDE_PAGES.information,
        '/ping',
        'Check Evelynn’s latency.',
        ACCESS.everyone
    ],
    [
        'avatar',
        GUIDE_PAGES.information,
        '/avatar [user]',
        'View a member’s avatar.',
        ACCESS.everyone
    ],
    [
        'userinfo',
        GUIDE_PAGES.information,
        '/userinfo [user]',
        'View detailed member information.',
        ACCESS.everyone
    ],
    [
        'serverinfo',
        GUIDE_PAGES.information,
        '/serverinfo',
        'View THE Ⅹ SINS server information.',
        ACCESS.everyone
    ]
);

function getBotAvatar(interaction) {
    return interaction.client.user
        .displayAvatarURL({
            size: 256,
            forceStatic: false
        });
}

function getGuildIcon(interaction) {
    return (
        interaction.guild.iconURL({
            size: 512,
            forceStatic: false
        }) ??
        getBotAvatar(interaction)
    );
}

function getPageCommands(
    client,
    pageId
) {
    return COMMAND_GUIDE
        .filter(
            ([
                name,
                page
            ]) =>
                page === pageId &&
                client.commands?.has(name)
        )
        .map(
            ([
                name,
                page,
                syntax,
                summary,
                access
            ]) => ({
                name,
                page,
                syntax,
                summary,
                access
            })
        );
}

function formatCommand(command) {
    return [
        `\`${command.syntax}\``,
        command.summary,
        `-# Access: ${command.access}`
    ].join('\n');
}

function splitEntries(
    entries,
    maxLength = 900
) {
    const chunks = [];
    let current = '';

    for (const entry of entries) {
        const next =
            current
                ? `${current}\n\n${entry}`
                : entry;

        if (
            next.length >
            maxLength
        ) {
            if (current) {
                chunks.push(current);
            }

            current =
                entry.slice(
                    0,
                    maxLength
                );
        } else {
            current = next;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function buildSinHierarchyText() {
    const ranks =
        Object.entries(
            rankConfig.hierarchy
        );

    return ranks
        .map(
            (
                [
                    key,
                    rank
                ],
                index
            ) => {
                if (
                    key ===
                    'unranked'
                ) {
                    return (
                        `◇ **${rank.name}** — ` +
                        'No assigned Sin Rank'
                    );
                }

                if (
                    key ===
                    'dominion'
                ) {
                    return [
                        `**${rank.name}**`,
                        '-# Special authority above the standard Sin hierarchy'
                    ].join('\n');
                }

                return (
                    `${index}. **${rank.name}**`
                );
            }
        )
        .join('\n');
}

function createGuideEmbed(
    interaction,
    title,
    description
) {
    const botAvatar =
        getBotAvatar(interaction);

    return createEmbed({
        title,
        description,
        color: '#5B3A78',

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
                'THE Ⅹ SINS • Command Guide',

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
                'Choose a guide category'
            )
            .setDisabled(disabled)
            .addOptions(
                GUIDE_PAGE_ORDER.map(
                    pageId => {
                        const page =
                            PAGE_DETAILS[
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
        .addComponents(menu);
}function addCommandFields(
    embed,
    commands
) {
    if (commands.length === 0) {
        embed.addFields({
            name:
                '◇・NO COMMANDS',

            value:
                'No commands from this category are currently loaded.'
        });

        return embed;
    }

    const chunks =
        splitEntries(
            commands.map(
                formatCommand
            )
        );

    for (
        let index = 0;
        index < chunks.length;
        index += 1
    ) {
        embed.addFields({
            name:
                index === 0
                    ? 'Ⅹ・COMMANDS'
                    : 'Ⅹ・COMMANDS — CONTINUED',

            value:
                chunks[index]
        });
    }

    return embed;
}

function buildOverviewPage(interaction) {
    const embed =
        createGuideEmbed(
            interaction,
            'Ⅹ・COMMAND GUIDE',
            [
                `Welcome, ${interaction.user}.`,
                '',
                'Explore THE Ⅹ SINS commands using the menu below.',
                '',
                `**Loaded Commands:** \`${
                    interaction.client.commands
                        ?.size ?? 0
                }\``,
                '',
                'Only commands currently loaded by Evelynn are displayed.'
            ].join('\n')
        );

    const fields =
        GUIDE_PAGE_ORDER
            .filter(
                pageId =>
                    pageId !==
                    GUIDE_PAGES.overview
            )
            .map(pageId => {
                const page =
                    PAGE_DETAILS[pageId];

                const commandCount =
                    getPageCommands(
                        interaction.client,
                        pageId
                    ).length;

                return {
                    name:
                        `${page.emoji}・${page.label.toUpperCase()}`,

                    value:
                        `\`${commandCount}\` loaded commands`,

                    inline:
                        true
                };
            });

    embed.addFields(...fields);

    embed.addFields({
        name:
            'Ⅹ・QUICK ACCESS',

        value: [
            '`/help` — quick command menu',
            '`/guide` — detailed command guide',
            '`/dashboard` — server dashboard',
            '`/soul` — personal Soul Record'
        ].join('\n')
    });

    return embed;
}

function buildRankPage(interaction) {
    const embed =
        createGuideEmbed(
            interaction,
            '⚔️・SIN RANKS',
            [
                'The official Sin Rank hierarchy of THE Ⅹ SINS.',
                '',
                buildSinHierarchyText()
            ].join('\n')
        );

    const commands =
        getPageCommands(
            interaction.client,
            GUIDE_PAGES.ranks
        );

    return addCommandFields(
        embed,
        commands
    );
}

function buildCategoryPage(
    interaction,
    pageId
) {
    const page =
        PAGE_DETAILS[pageId];

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

    return addCommandFields(
        embed,
        commands
    );
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
        pageId ===
        GUIDE_PAGES.ranks
    ) {
        return buildRankPage(
            interaction
        );
    }

    return buildCategoryPage(
        interaction,
        pageId
    );
}

async function sendGuideError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ],

        components: []
    };

    if (interaction.deferred) {
        return interaction
            .editReply(payload)
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                ...payload,

                flags:
                    MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(() => null);
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName('guide')
            .setDescription(
                'Open Evelynn’s interactive command guide.'
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendGuideError(
                    interaction,
                    '❌ Server Only Command',
                    'The Command Guide can only be opened inside THE Ⅹ SINS.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            let selectedPage =
                GUIDE_PAGES.overview;

            const createPagePayload =
                (
                    pageId,
                    disabled = false
                ) => ({
                    embeds: [
                        buildGuidePage(
                            interaction,
                            pageId
                        )
                    ],

                    components: [
                        buildGuideMenu(
                            pageId,
                            disabled
                        )
                    ]
                });

            const message =
                await interaction.editReply({
                    ...createPagePayload(
                        selectedPage
                    ),

                    fetchReply:
                        true
                });

            const collector =
                message
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        filter:
                            component =>
                                component.customId ===
                                GUIDE_MENU_ID,

                        time:
                            MENU_TIMEOUT
                    });

            collector.on(
                'collect',
                async component => {
                    try {
                        if (
                            component.user.id !==
                            interaction.user.id
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Guide',
                                        'Only the member who opened this Guide may control it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        const requestedPage =
                            component.values[0];

                        if (
                            !GUIDE_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Guide Page',
                                        'Evelynn could not recognize that Guide category.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        await component.update(
                            createPagePayload(
                                selectedPage
                            )
                        );
                    } catch (error) {
                        console.error(
                            '❌ Evelynn /guide navigation error:',
                            error
                        );

                        const payload = {
                            embeds: [
                                createErrorEmbed(
                                    '❌ Guide Navigation Failed',
                                    'Evelynn could not open that Guide page.'
                                )
                            ],

                            flags:
                                MessageFlags.Ephemeral
                        };

                        if (
                            component.replied ||
                            component.deferred
                        ) {
                            await component
                                .followUp(payload)
                                .catch(() => null);
                        } else {
                            await component
                                .reply(payload)
                                .catch(() => null);
                        }
                    }
                }
            );

            collector.on(
                'end',
                async () => {
                    await interaction
                        .editReply(
                            createPagePayload(
                                selectedPage,
                                true
                            )
                        )
                        .catch(() => null);
                }
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /guide command error:',
                error
            );

            await sendGuideError(
                interaction,
                '❌ Guide Unavailable',
                'Evelynn could not open the Command Guide.'
            );
        }
    }
};
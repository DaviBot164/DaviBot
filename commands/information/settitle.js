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
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    TITLE_CATEGORIES,
    TITLE_DEFINITIONS
} = require('../../config/titles');

const {
    titles:
        titleDatabase
} = require('../../database');

const TITLE_SELECT_MENU_ID =
    'settitle_select_title';

const MENU_TIMEOUT =
    3 * 60 * 1000;

const TITLE_COLOR =
    '#E8E8E8';

const ACTIVE_TITLE_COLOR =
    '#D4AF37';

const CATEGORY_CHOICES = [
    {
        name:
            '🏆 Achievement',

        value:
            TITLE_CATEGORIES.ACHIEVEMENT
    },

    {
        name:
            '⚔️ Sin Ranks',

        value:
            TITLE_CATEGORIES.SIN_RANK
    },

    {
        name:
            '🛡️ High Command',

        value:
            TITLE_CATEGORIES.STAFF
    }
];

const RARITY_DETAILS = {
    Common: {
        emoji: '⚪',
        label: 'Common'
    },

    Uncommon: {
        emoji: '🟢',
        label: 'Uncommon'
    },

    Rare: {
        emoji: '🔵',
        label: 'Rare'
    },

    Epic: {
        emoji: '🟣',
        label: 'Epic'
    },

    Legendary: {
        emoji: '🟡',
        label: 'Legendary'
    },

    Mythic: {
        emoji: '🔴',
        label: 'Mythic'
    }
};

const TITLE_DEFINITION_MAP =
    new Map(
        TITLE_DEFINITIONS.map(
            title => [
                title.id,
                title
            ]
        )
    );

function getRarityDetails(rarity) {
    return RARITY_DETAILS[rarity] ?? {
        emoji:
            '⚪',

        label:
            rarity || 'Unknown'
    };
}

function formatDiscordDate(value) {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        !value ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Not recorded';
    }

    const timestamp =
        Math.floor(
            date.getTime() / 1000
        );

    return (
        `<t:${timestamp}:F>\n` +
        `-# <t:${timestamp}:R>`
    );
}

function normalizeUnlockedTitles(
    unlockedTitles
) {
    if (
        !Array.isArray(
            unlockedTitles
        )
    ) {
        return [];
    }

    return unlockedTitles
        .filter(
            title =>
                TITLE_DEFINITION_MAP.has(
                    title.titleId
                )
        )
        .map(
            title => ({
                ...title,
                ...TITLE_DEFINITION_MAP.get(
                    title.titleId
                ),

                titleId:
                    title.titleId
            })
        );
}

function createTitleSelectMenu(
    unlockedTitles,
    activeTitleId,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                TITLE_SELECT_MENU_ID
            )
            .setPlaceholder(
                'Select an active Title'
            )
            .setDisabled(
                disabled
            );

    for (
        const title
        of unlockedTitles.slice(
            0,
            25
        )
    ) {
        const rarity =
            getRarityDetails(
                title.rarity
            );

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    String(
                        title.displayName
                    ).slice(
                        0,
                        100
                    )
                )
                .setDescription(
                    `${rarity.label} • ${title.description}`.slice(
                        0,
                        100
                    )
                )
                .setEmoji(
                    rarity.emoji
                )
                .setValue(
                    title.titleId
                )
                .setDefault(
                    title.titleId ===
                    activeTitleId
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

function createSelectionEmbed({
    interaction,
    member,
    category,
    unlockedTitles,
    activeTitle
}) {
    const avatarURL =
        member.user.displayAvatarURL({
            size:
                1024,

            forceStatic:
                false
        });

    const titleList =
        unlockedTitles
            .map(
                title => {
                    const rarity =
                        getRarityDetails(
                            title.rarity
                        );

                    const status =
                        title.titleId ===
                        activeTitle?.titleId
                            ? '👑 Active'
                            : '✅ Unlocked';

                    return [
                        `${status} • **${title.displayName}**`,
                        `-# ${rarity.emoji} ${rarity.label}`
                    ].join('\n');
                }
            )
            .join('\n\n');

    return createEmbed({
        title:
            '🏷️ Select Title',

        description: [
            `${member}, select one unlocked Title from the menu below.`,
            '',
            `**Category:** ${category}`
        ].join('\n'),

        color:
            activeTitle
                ? ACTIVE_TITLE_COLOR
                : TITLE_COLOR,

        thumbnail:
            avatarURL,

        fields: [
            {
                name:
                    '👑 Current Active Title',

                value:
                    activeTitle
                        ? `**${activeTitle.displayName}**`
                        : 'No active Title selected.',

                inline:
                    false
            },

            {
                name:
                    `📚 Unlocked ${category} Titles`,

                value:
                    titleList.slice(
                        0,
                        1024
                    ),

                inline:
                    false
            }
        ],

        footer: {
            text:
                `THE Ⅹ SINS • Titles • Requested by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            128,

                        forceStatic:
                            false
                    })
        }
    });
}function createActivatedEmbed({
    interaction,
    member,
    activatedTitle
}) {
    const rarity =
        getRarityDetails(
            activatedTitle.rarity
        );

    const embed =
        createSuccessEmbed(
            '👑 Title Activated',
            `${member} selected a new active Title.`
        );

    embed
        .setColor(
            ACTIVE_TITLE_COLOR
        )
        .setThumbnail(
            member.user.displayAvatarURL({
                size:
                    1024,

                forceStatic:
                    false
            })
        )
        .addFields(
            {
                name:
                    '🏷️ Active Title',

                value:
                    `**${activatedTitle.displayName}**`,

                inline:
                    false
            },

            {
                name:
                    '📚 Classification',

                value: [
                    `**Category:** ${activatedTitle.category}`,
                    `**Rarity:** ${rarity.emoji} ${rarity.label}`
                ].join('\n'),

                inline:
                    true
            },

            {
                name:
                    '🕒 Activated At',

                value:
                    formatDiscordDate(
                        activatedTitle.activatedAt
                    ),

                inline:
                    true
            },

            {
                name:
                    '📖 Description',

                value:
                    activatedTitle.description,

                inline:
                    false
            }
        )
        .setFooter({
            text:
                `THE Ⅹ SINS • Titles • Activated by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            128,

                        forceStatic:
                            false
                    })
        });

    return embed;
}

async function sendCommandError(
    interaction,
    embed
) {
    const payload = {
        embeds: [
            embed
        ],

        components:
            []
    };

    if (
        interaction.deferred ||
        interaction.replied
    ) {
        await interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );

        return;
    }

    await interaction
        .reply({
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'settitle'
            )
            .setDescription(
                'Select one of your unlocked Titles.'
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'category'
                        )
                        .setDescription(
                            'Select a Title category.'
                        )
                        .setRequired(
                            true
                        )
                        .addChoices(
                            ...CATEGORY_CHOICES
                        )
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
                            '❌ THE Ⅹ SINS Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
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

            const member =
                interaction.member;

            const selectedCategory =
                interaction.options.getString(
                    'category',
                    true
                );

            const unlockedTitles =
                normalizeUnlockedTitles(
                    await titleDatabase
                        .getSoulTitles(
                            interaction.guild.id,
                            member.id
                        )
                );

            const categoryTitles =
                unlockedTitles.filter(
                    title =>
                        title.category ===
                        selectedCategory
                );

            const activeTitle =
                unlockedTitles.find(
                    title =>
                        title.isActive
                ) ??
                null;

            if (
                categoryTitles.length ===
                0
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Titles Unlocked',
                            [
                                `You have not unlocked any **${selectedCategory}** Titles.`,
                                '',
                                'Use `/titles` to view their requirements.'
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        createSelectionEmbed({
                            interaction,
                            member,

                            category:
                                selectedCategory,

                            unlockedTitles:
                                categoryTitles,

                            activeTitle
                        })
                    ],

                    components: [
                        createTitleSelectMenu(
                            categoryTitles,
                            activeTitle?.titleId ??
                                null
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                replyMessage
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        time:
                            MENU_TIMEOUT
                    });

            collector.on(
                'collect',
                async menuInteraction => {                    try {
                        if (
                            menuInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Title Selection',
                                        'Only the member who opened this menu may use it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            TITLE_SELECT_MENU_ID
                        ) {
                            return;
                        }

                        const selectedTitleId =
                            menuInteraction.values[0];

                        const selectedTitle =
                            categoryTitles.find(
                                title =>
                                    title.titleId ===
                                    selectedTitleId
                            );

                        if (!selectedTitle) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Title Not Found',
                                        'The selected Title could not be found.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            selectedTitle.titleId ===
                            activeTitle?.titleId
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Title Already Active',
                                        `**${selectedTitle.displayName}** is already active.`
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        await menuInteraction
                            .deferUpdate();

                        const activatedTitle =
                            await titleDatabase
                                .setActiveTitle(
                                    interaction.guild.id,
                                    member.id,
                                    selectedTitleId
                                );

                        if (!activatedTitle) {
                            await menuInteraction
                                .followUp({
                                    embeds: [
                                        createErrorEmbed(
                                            '❌ Title Activation Failed',
                                            'The selected Title could not be activated.'
                                        )
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        collector.stop(
                            'title_selected'
                        );

                        await interaction.editReply({
                            embeds: [
                                createActivatedEmbed({
                                    interaction,
                                    member,

                                    activatedTitle: {
                                        ...activatedTitle,
                                        ...TITLE_DEFINITION_MAP.get(
                                            selectedTitleId
                                        )
                                    }
                                })
                            ],

                            components:
                                []
                        });
                    } catch (error) {
                        console.error(
                            '❌ THE Ⅹ SINS /settitle selection error:',
                            error
                        );

                        const errorEmbed =
                            createErrorEmbed(
                                '❌ Title Activation Failed',
                                'The selected Title could not be activated.'
                            );

                        if (
                            menuInteraction.deferred ||
                            menuInteraction.replied
                        ) {
                            await menuInteraction
                                .followUp({
                                    embeds: [
                                        errorEmbed
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        await menuInteraction
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
            );

            collector.on(
                'end',
                async (
                    collected,
                    reason
                ) => {
                    if (
                        reason ===
                        'title_selected'
                    ) {
                        return;
                    }

                    await interaction
                        .editReply({
                            components: [
                                createTitleSelectMenu(
                                    categoryTitles,
                                    activeTitle?.titleId ??
                                        null,
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
                '❌ THE Ⅹ SINS /settitle command error:',
                error
            );

            await sendCommandError(
                interaction,
                createErrorEmbed(
                    '❌ Title Error',
                    'The Title selection menu could not be opened.'
                )
            );
        }
    }
};
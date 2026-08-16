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
    TITLE_CATEGORIES
} = require('../../config/titles');

const {
    titles:
        titleDatabase
} = require('../../database');

/**
 * THE Ⅹ SINS silver embed color.
 */
const SINS_TITLE_COLOR =
    '#E8E8E8';

/**
 * Active Title gold color.
 */
const ACTIVE_TITLE_COLOR =
    '#D4AF37';

/**
 * Title selection menu identifier.
 */
const TITLE_SELECT_MENU_ID =
    'settitle_select_title';

/**
 * Available Title categories.
 */
const CATEGORY_CHOICES = [
    {
        name:
            '🌑 General',

        value:
            TITLE_CATEGORIES.GENERAL
    },
    {
        name:
            '⭐ Progression',

        value:
            TITLE_CATEGORIES.LEVEL
    },
    {
        name:
            '🏆 Achievement',

        value:
            TITLE_CATEGORIES.ACHIEVEMENT
    },
    {
        name:
            '👁️ Hollow Evolution',

        value:
            TITLE_CATEGORIES.EVOLUTION
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
    },
    {
        name:
            '🎮 Event',

        value:
            TITLE_CATEGORIES.EVENT
    },
    {
        name:
            '🌙 Legendary',

        value:
            TITLE_CATEGORIES.LEGENDARY
    }
];

/**
 * Title rarity visual information.
 */
const RARITY_DETAILS = {
    Common: {
        emoji:
            '⚪',

        label:
            'Common'
    },

    Uncommon: {
        emoji:
            '🟢',

        label:
            'Uncommon'
    },

    Rare: {
        emoji:
            '🔵',

        label:
            'Rare'
    },

    Epic: {
        emoji:
            '🟣',

        label:
            'Epic'
    },

    Legendary: {
        emoji:
            '🟡',

        label:
            'Legendary'
    },

    Mythic: {
        emoji:
            '🔴',

        label:
            'Mythic'
    }
};

/**
 * Get readable rarity information.
 *
 * @param {string|null|undefined} rarity
 * @returns {{emoji: string, label: string}}
 */
function getRarityDetails(
    rarity
) {
    return (
        RARITY_DETAILS[
            rarity
        ] || {
            emoji:
                '⚪',

            label:
                rarity ||
                'Unknown'
        }
    );
}

/**
 * Format a Discord timestamp.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Not recorded';
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
        return 'Not recorded';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return (
        `<t:${unixTimestamp}:F>\n` +
        `-# <t:${unixTimestamp}:R>`
    );
}

/**
 * Create a safe Select Menu label.
 *
 * @param {string} value
 * @returns {string}
 */
function createSafeLabel(
    value
) {
    return String(
        value ||
        'Unknown Title'
    ).slice(
        0,
        100
    );
}

/**
 * Create a safe Select Menu description.
 *
 * @param {string} value
 * @returns {string}
 */
function createSafeDescription(
    value
) {
    return String(
        value ||
        'Unlocked Title'
    ).slice(
        0,
        100
    );
}/**
 * Create the unlocked Title selection menu.
 *
 * @param {Object[]} unlockedTitles
 * @param {string|null} activeTitleId
 * @param {boolean} disabled
 * @returns {ActionRowBuilder}
 */
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
                'Select an active Chronicle Title'
            )
            .setMinValues(
                1
            )
            .setMaxValues(
                1
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
                    createSafeLabel(
                        title.name
                    )
                )
                .setDescription(
                    createSafeDescription(
                        `${rarity.label} • ${title.description}`
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

/**
 * Create the Chronicle Title selection embed.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
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

    const availableTitleDisplay =
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
            '🏷️ Select Chronicle Title',

        description:
            [
                `${member}, select one unlocked Title from the menu below.`,

                '',

                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',

                '',

                `**Archive Category:** ${category}`,

                '',

                '*The selected designation will appear inside your official Soul Record.*'
            ].join('\n'),

        color:
            activeTitle
                ? ACTIVE_TITLE_COLOR
                : SINS_TITLE_COLOR,

        thumbnail:
            avatarURL,

        fields: [
            {
                name:
                    '👑 Current Active Title',

                value:
                    activeTitle
                        ? [
                            `**${activeTitle.displayName}**`,
                            `-# ${activeTitle.rarity} • ${activeTitle.category}`
                        ].join('\n')
                        : '🌑 No active Title is currently selected.',

                inline:
                    false
            },

            {
                name:
                    `📚 Unlocked ${category} Titles`,

                value:
                    availableTitleDisplay,

                inline:
                    false
            }
        ],

        footer: {
            text:
                `THE Ⅹ SINS • Chronicle Titles • Requested by ${interaction.user.username}`,

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
}

/**
 * Create the successful Title activation embed.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function createTitleActivatedEmbed({
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
            '👑 Chronicle Title Activated',
            [
                `${member} has selected a new active designation within the Soul Archives.`,

                '',

                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            ].join('\n')
        );

    embed.setColor(
        ACTIVE_TITLE_COLOR
    );

    embed.setThumbnail(
        member.user.displayAvatarURL({
            size:
                1024,

            forceStatic:
                false
        })
    );

    embed.addFields(
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

            value:
                [
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
                '📖 Chronicle Description',

            value:
                activatedTitle.description,

            inline:
                false
        }
    );

    embed.setFooter({
        text:
            `THE Ⅹ SINS • Chronicle Titles • Activated by ${interaction.user.username}`,

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
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'settitle'
            )
            .setDescription(
                'Select one of your unlocked Chronicle Titles.'
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

    /**
     * Execute /settitle.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
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

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'The server could not access your Soul Record.'
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            const selectedCategory =
                interaction.options.getString(
                    'category',
                    true
                );

            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const unlockedTitles =
                await titleDatabase
                    .getSoulTitles(
                        interaction.guild.id,
                        member.id
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
                ) ||
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
                                `You have not unlocked any Titles from the **${selectedCategory}** category.`,

                                '',

                                'Use `/titles` to view available Chronicle Titles and their requirements.'
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            const selectionEmbed =
                createSelectionEmbed({
                    interaction,
                    member,
                    category:
                        selectedCategory,
                    unlockedTitles:
                        categoryTitles,
                    activeTitle
                });

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        selectionEmbed
                    ],

                    components: [
                        createTitleSelectMenu(
                            categoryTitles,
                            activeTitle?.titleId ||
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
                            3 * 60 * 1000
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
                                        '❌ Private Title Selection',
                                        'Only the Soul who opened this menu may use it.'
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
                            ) ||
                            null;

                        if (!selectedTitle) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Title Not Found',
                                        'The selected Chronicle Title could not be located.'
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
                                        `**${selectedTitle.displayName}** is already your active Chronicle Title.`
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        await menuInteraction.deferUpdate();

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
                                            'The selected Chronicle Title could not be activated.'
                                        )
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }                        collector.stop(
                            'title_selected'
                        );

                        await interaction.editReply({
                            embeds: [
                                createTitleActivatedEmbed({
                                    interaction,
                                    member,
                                    activatedTitle
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
                                'The Chronicle Title could not be activated.'
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
                                    activeTitle?.titleId ||
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

            const errorEmbed =
                createErrorEmbed(
                    '❌ Chronicle Title Error',
                    'The Chronicle Title selection menu could not be opened.'
                );

            if (
                interaction.deferred ||
                interaction.replied
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
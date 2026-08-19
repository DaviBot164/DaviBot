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
    titles: titleDatabase
} = require('../../database');

const TITLE_SELECT_MENU_ID = 'settitle_select_title';
const MENU_TIMEOUT = 3 * 60 * 1000;
const TITLE_COLOR = '#E8E8E8';
const ACTIVE_TITLE_COLOR = '#D4AF37';

const CATEGORY_CHOICES = [
    {
        name: '🏆 Achievement',
        value: TITLE_CATEGORIES.ACHIEVEMENT
    },
    {
        name: '⚔️ Captain Ranks',
        value: TITLE_CATEGORIES.SIN_RANK
    },
    {
        name: '🛡️ High Command',
        value: TITLE_CATEGORIES.STAFF
    }
];

const RARITY_DETAILS = {
    Common: ['⚪', 'Common'],
    Uncommon: ['🟢', 'Uncommon'],
    Rare: ['🔵', 'Rare'],
    Epic: ['🟣', 'Epic'],
    Legendary: ['🟡', 'Legendary'],
    Mythic: ['🔴', 'Mythic']
};

const TITLE_DEFINITION_MAP = new Map(
    TITLE_DEFINITIONS.map(title => [
        title.id,
        title
    ])
);

function getRarityDetails(rarity) {
    const [emoji, label] =
        RARITY_DETAILS[rarity] ?? [
            '⚪',
            rarity || 'Unknown'
        ];

    return {
        emoji,
        label
    };
}

function normalizeUnlockedTitles(titles) {
    if (!Array.isArray(titles)) {
        return [];
    }

    return titles
        .filter(title =>
            TITLE_DEFINITION_MAP.has(
                title.titleId
            )
        )
        .map(title => ({
            ...title,
            ...TITLE_DEFINITION_MAP.get(
                title.titleId
            ),
            titleId: title.titleId
        }));
}

function createTitleMenu(
    titles,
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
            .setDisabled(disabled)
            .addOptions(
                titles
                    .slice(0, 25)
                    .map(title => {
                        const rarity =
                            getRarityDetails(
                                title.rarity
                            );

                        return new StringSelectMenuOptionBuilder()
                            .setLabel(
                                String(
                                    title.displayName
                                ).slice(0, 100)
                            )
                            .setDescription(
                                `${rarity.label} • ${title.description}`
                                    .slice(0, 100)
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
                            );
                    })
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

function createSelectionEmbed(
    interaction,
    member,
    category,
    titles,
    activeTitle
) {
    const titleList = titles
        .map(title => {
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
        })
        .join('\n\n');

    return createEmbed({
        title: '🏷️ Select Title',

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
            member.user.displayAvatarURL({
                size: 1024,
                forceStatic: false
            }),

        fields: [
            {
                name: '👑 Current Active Title',

                value:
                    activeTitle
                        ? `**${activeTitle.displayName}**`
                        : 'No active Title selected.'
            },
            {
                name:
                    `📚 Unlocked ${category} Titles`,

                value:
                    titleList.slice(0, 1024)
            }
        ],

        footer: {
            text:
                `LUNAR SEIREITEI • Titles • Requested by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        }
    });
}

function formatDiscordDate(value) {
    const date = new Date(value);

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

function createActivatedEmbed(
    interaction,
    member,
    title
) {
    const rarity =
        getRarityDetails(
            title.rarity
        );

    const embed =
        createSuccessEmbed(
            '👑 Title Activated',
            `${member} selected a new active Title.`
        );

    return embed
        .setColor(
            ACTIVE_TITLE_COLOR
        )
        .setThumbnail(
            member.user.displayAvatarURL({
                size: 1024,
                forceStatic: false
            })
        )
        .addFields(
            {
                name: '🏷️ Active Title',
                value:
                    `**${title.displayName}**`
            },
            {
                name: '📚 Classification',
                value: [
                    `**Category:** ${title.category}`,
                    `**Rarity:** ${rarity.emoji} ${rarity.label}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🕒 Activated At',
                value:
                    formatDiscordDate(
                        title.activatedAt
                    ),
                inline: true
            },
            {
                name: '📖 Description',
                value: title.description
            }
        )
        .setFooter({
            text:
                `LUNAR SEIREITEI • Titles • Activated by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        });
}async function sendError(
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

    if (
        interaction.deferred ||
        interaction.replied
    ) {
        return interaction
            .editReply(payload)
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
    category: 'information',

    data:
        new SlashCommandBuilder()
            .setName('settitle')
            .setDescription(
                'Select one of your unlocked Titles.'
            )
            .addStringOption(option =>
                option
                    .setName('category')
                    .setDescription(
                        'Select a Title category.'
                    )
                    .setRequired(true)
                    .addChoices(
                        ...CATEGORY_CHOICES
                    )
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendError(
                    interaction,
                    '❌ LUNAR SEIREITEI Only Command',
                    'This command can only be used inside LUNAR SEIREITEI.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const member =
                interaction.member;

            const category =
                interaction.options
                    .getString(
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
                        category
                );

            const activeTitle =
                unlockedTitles.find(
                    title =>
                        title.isActive
                ) ?? null;

            if (
                categoryTitles.length === 0
            ) {
                await sendError(
                    interaction,
                    '❌ No Titles Unlocked',
                    [
                        `You have not unlocked any **${category}** Titles.`,
                        '',
                        'Use `/titles` to view their requirements.'
                    ].join('\n')
                );

                return;
            }

            const message =
                await interaction.editReply({
                    embeds: [
                        createSelectionEmbed(
                            interaction,
                            member,
                            category,
                            categoryTitles,
                            activeTitle
                        )
                    ],

                    components: [
                        createTitleMenu(
                            categoryTitles,
                            activeTitle?.titleId ??
                                null
                        )
                    ],

                    fetchReply: true
                });

            const menuInteraction =
                await message
                    .awaitMessageComponent({
                        componentType:
                            ComponentType.StringSelect,

                        filter:
                            component =>
                                component.customId ===
                                    TITLE_SELECT_MENU_ID &&
                                component.user.id ===
                                    interaction.user.id,

                        time:
                            MENU_TIMEOUT
                    })
                    .catch(() => null);

            if (!menuInteraction) {
                await interaction
                    .editReply({
                        components: [
                            createTitleMenu(
                                categoryTitles,
                                activeTitle?.titleId ??
                                    null,
                                true
                            )
                        ]
                    })
                    .catch(() => null);

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
                selectedTitleId ===
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
                await sendError(
                    interaction,
                    '❌ Title Activation Failed',
                    'The selected Title could not be activated.'
                );

                return;
            }

            await interaction.editReply({
                embeds: [
                    createActivatedEmbed(
                        interaction,
                        member,
                        {
                            ...activatedTitle,
                            ...TITLE_DEFINITION_MAP.get(
                                selectedTitleId
                            )
                        }
                    )
                ],

                components: []
            });
        } catch (error) {
            console.error(
                '❌ LUNAR SEIREITEI /settitle command error:',
                error
            );

            await sendError(
                interaction,
                '❌ Title Error',
                'The Title selection menu could not be opened.'
            );
        }
    }
};
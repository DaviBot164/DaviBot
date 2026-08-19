const {
    SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

const rankConfig =
    require('../../config/ranks');

const {
    souls: soulDatabase,
    ranks: rankDatabase,
    titles: titleDatabase
} = require('../../database');

const SOUL_MENU_ID =
    'soul_record_page_menu';

const MENU_TIMEOUT =
    5 * 60 * 1000;

const SOUL_PAGES = {
    overview:
        'soul_overview',

    progression:
        'soul_progression',

    ranks:
        'soul_ranks',

    collection:
        'soul_collection',

    activity:
        'soul_activity'
};

const SOUL_PAGE_ORDER = [
    SOUL_PAGES.overview,
    SOUL_PAGES.progression,
    SOUL_PAGES.ranks,
    SOUL_PAGES.collection,
    SOUL_PAGES.activity
];

const SOUL_PAGE_DETAILS = {
    [SOUL_PAGES.overview]: {
        emoji: '📖',
        label: 'Overview',
        description:
            'Identity, standing and progression'
    },

    [SOUL_PAGES.progression]: {
        emoji: '⭐',
        label: 'Progression',
        description:
            'Level and Spiritual Power'
    },

    [SOUL_PAGES.ranks]: {
        emoji: '⚔️',
        label: 'Captain Rank',
        description:
            'Current Captain Rank and rank history'
    },

    [SOUL_PAGES.collection]: {
        emoji: '🏆',
        label: 'Achievements & Titles',
        description:
            'Achievements and unlocked Titles'
    },

    [SOUL_PAGES.activity]: {
        emoji: '📊',
        label: 'Activity',
        description:
            'Activity and account statistics'
    }
};

const SIN_RANKS =
    Object.values(
        rankConfig.hierarchy
    );

function formatNumber(value) {
    const number =
        Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString('en-US')
        : '0';
}

function formatDiscordDate(
    value,
    style = 'F'
) {
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
        return 'Unknown';
    }

    const timestamp =
        Math.floor(
            date.getTime() / 1000
        );

    return `<t:${timestamp}:${style}>`;
}

function calculateDaysSince(value) {
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
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) /
            86_400_000
        )
    );
}

function createProgressBar(
    percentage,
    length = 14
) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) || 0
            )
        );

    const filled =
        Math.round(
            (
                safePercentage /
                100
            ) *
            length
        );

    return (
        '▰'.repeat(filled) +
        '▱'.repeat(
            length - filled
        )
    );
}

function getSinRank(member) {
    const rank =
        SIN_RANKS.find(
            entry =>
                entry?.id &&
                member.roles.cache.has(
                    entry.id
                )
        );

    return (
        rank?.name ??
        rankConfig.hierarchy
            .unranked.name
    );
}

function getServerStanding(
    member,
    guild
) {
    if (
        member.id ===
        guild.ownerId
    ) {
        return '👑・SOVEREIGN';
    }

    const highCommandRoles = [
        {
            id:
                rankConfig.highCommand
                    ?.ruler,

            name:
                '👑・SOVEREIGN'
        },
        {
            id:
                rankConfig.highCommand
                    ?.headCaptain,

            name:
                '⚜️・HEAD CAPTAIN'
        },
        {
            id:
                rankConfig.highCommand
                    ?.captain,

            name:
                '🛡️・CAPTAIN'
        },
        {
            id:
                rankConfig.highCommand
                    ?.lieutenant,

            name:
                '⚔️・LIEUTENANT'
        }
    ];

    const commandRole =
        highCommandRoles.find(
            role =>
                role.id &&
                member.roles.cache.has(
                    role.id
                )
        );

    if (commandRole) {
        return commandRole.name;
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        )
    ) {
        return '🛡️・CAPTAIN';
    }

    if (
        member.permissions.has(
            PermissionFlagsBits.ModerateMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.KickMembers
        ) ||
        member.permissions.has(
            PermissionFlagsBits.BanMembers
        )
    ) {
        return '⚔️・LIEUTENANT';
    }

    if (member.user.bot) {
        return '🌑 Moon Spirit of Seireitei';
    }

    return '◇・MEMBER';
}

function getHighestRole(member) {
    return (
        member.roles.highest.id ===
        member.guild.id
    )
        ? 'None'
        : member.roles.highest
            .toString();
}

function getActiveTitle(soulRecord) {
    return (
        soulRecord?.title
            ?.displayName ||
        soulRecord?.title
            ?.name ||
        'No active Title'
    );
}

function createSoulMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                SOUL_MENU_ID
            )
            .setPlaceholder(
                'Select a Soul Record page'
            )
            .setDisabled(disabled);

    for (
        const pageId
        of SOUL_PAGE_ORDER
    ) {
        const page =
            SOUL_PAGE_DETAILS[pageId];

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
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
                    selectedPage ===
                    pageId
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(menu);
}async function loadSafely(
    loader,
    fallback
) {
    try {
        const result =
            await loader();

        return result ?? fallback;
    } catch {
        return fallback;
    }
}

async function getSafeRankHistory(
    guildId,
    userId
) {
    const history =
        await loadSafely(
            () =>
                rankDatabase.getRankHistory(
                    guildId,
                    userId,
                    5
                ),
            []
        );

    return Array.isArray(history)
        ? history
        : [];
}

async function getSafeSoulTitles(
    guildId,
    userId
) {
    const titles =
        await loadSafely(
            () =>
                titleDatabase.getSoulTitles(
                    guildId,
                    userId
                ),
            []
        );

    return Array.isArray(titles)
        ? titles
        : [];
}

function formatAchievement(
    achievement
) {
    const icon =
        achievement?.icon ??
        '🏆';

    const name =
        achievement?.name ??
        'Unknown Achievement';

    const description =
        achievement?.description ??
        'No Achievement description is available.';

    const unlockedAt =
        achievement?.unlockedAt ??
        achievement?.unlocked_at ??
        null;

    return [
        `${icon} **${name}**`,
        `-# ${description}`,
        `-# Unlocked ${
            formatDiscordDate(
                unlockedAt,
                'R'
            )
        }`
    ].join('\n');
}

function formatSoulTitle(title) {
    const marker =
        title?.isActive
            ? '👑'
            : '🏷️';

    const displayName =
        title?.displayName ??
        title?.name ??
        'Unknown Title';

    const rarity =
        title?.rarity ??
        'Unknown';

    const category =
        title?.category ??
        'Unknown';

    return [
        `${marker} **${displayName}**`,
        `-# ${rarity} • ${category}`,
        `-# Unlocked ${
            formatDiscordDate(
                title?.unlockedAt,
                'R'
            )
        }`
    ].join('\n');
}

function formatRankHistoryRecord(
    record
) {
    const action =
        record?.action ??
        record?.change_type ??
        record?.history_type ??
        'UPDATED';

    const previousRank =
        record?.old_rank ??
        record?.previous_rank ??
        record?.oldRank ??
        null;

    const newRank =
        record?.new_rank ??
        record?.rank_name ??
        record?.newRank ??
        null;

    const reason =
        record?.reason ??
        'No reason was recorded.';

    const createdAt =
        record?.created_at ??
        record?.createdAt ??
        null;

    let rankChange =
        'Rank record unavailable';

    if (
        previousRank &&
        newRank
    ) {
        rankChange =
            `${previousRank} → ${newRank}`;
    } else if (newRank) {
        rankChange =
            newRank;
    } else if (previousRank) {
        rankChange =
            `${previousRank} → Unranked`;
    }

    return [
        `⚔️ **${action}** • ${rankChange}`,
        `-# ${reason}`,
        `-# Recorded ${
            formatDiscordDate(
                createdAt,
                'R'
            )
        }`
    ].join('\n');
}

function calculateSoulCompletion({
    soulRecord,
    titles,
    rankHistory
}) {
    const progression =
        soulRecord?.progression ?? {};

    const achievements =
        soulRecord?.achievements ?? {};

    const activity =
        soulRecord?.activity ?? {};

    const checks = [
        Boolean(
            progression.recordCreatedAt ||
            progression.level >= 0
        ),

        Boolean(
            soulRecord?.title?.id
        ),

        Number(
            progression.xp || 0
        ) > 0,

        Number(
            achievements.unlocked || 0
        ) > 0,

        Array.isArray(titles) &&
        titles.length > 0,

        Array.isArray(rankHistory) &&
        rankHistory.length > 0,

        Number(
            activity.messages || 0
        ) > 0 ||
        Number(
            activity.voiceMinutes || 0
        ) > 0
    ];

    const completed =
        checks.filter(Boolean).length;

    const total =
        checks.length;

    return {
        completed,
        total,

        percentage:
            total > 0
                ? Math.round(
                    (
                        completed /
                        total
                    ) *
                    100
                )
                : 0
    };
}

function formatCompletionSummary(
    completion
) {
    return [
        `\`${createProgressBar(
            completion.percentage
        )}\``,
        `**${completion.percentage}% complete**`,
        `${completion.completed}/${completion.total} records`
    ].join('\n');
}

function createSoulEmbed({
    interaction,
    member,
    title,
    description,
    color
}) {
    const avatarURL =
        member.user
            .displayAvatarURL({
                size: 256,
                forceStatic: false
            });

    return createEmbed({
        title,
        description,

        color:
            color ??
            embedConfig.colors.primary,

        thumbnail:
            avatarURL,

        author: {
            name:
                `${member.displayName} • Soul Record`,

            iconURL:
                avatarURL
        },

        footer: {
            text:
                `Evelynn • LUNAR SEIREITEI • Requested by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        },

        timestamp:
            true
    });
}

function buildOverviewPage({
    interaction,
    member,
    soulRecord,
    titles,
    rankHistory
}) {
    const progression =
        soulRecord?.progression ?? {};

    const completion =
        calculateSoulCompletion({
            soulRecord,
            titles,
            rankHistory
        });

    const embed =
        createSoulEmbed({
            interaction,
            member,

            title:
                `📖 ${member.displayName}'s Soul Record`,

            description:
                'A compact member record within **LUNAR SEIREITEI**.',

            color:
                embedConfig.colors.accent
        });

    return embed.addFields(
        {
            name:
                '🜏 Identity',

            value: [
                `**User:** ${member.user}`,
                `**Standing:** ${
                    getServerStanding(
                        member,
                        interaction.guild
                    )
                }`,
                `**Joined:** ${
                    formatDiscordDate(
                        member.joinedAt
                    )
                }`
            ].join('\n')
        },

        {
            name:
                '⚔️ Position',

            value: [
                `**Captain Rank:** ${
                    getSinRank(member)
                }`,
                `**Highest Role:** ${
                    getHighestRole(member)
                }`
            ].join('\n')
        },

        {
            name:
                '⭐ Progression',

            value: [
                `**Level:** \`${
                    formatNumber(
                        progression.level
                    )
                }\``,
                `**Spiritual Power:** \`${
                    formatNumber(
                        progression.xp
                    )
                } XP\``,
                `**Active Title:** ${
                    getActiveTitle(
                        soulRecord
                    )
                }`
            ].join('\n')
        },

        {
            name:
                '📊 Record Completion',

            value:
                formatCompletionSummary(
                    completion
                )
        }
    );
}function buildProgressionPage({
    interaction,
    member,
    soulRecord
}) {
    const progression =
        soulRecord?.progression ?? {};

    const level =
        Number(
            progression.level || 0
        );

    const xp =
        Number(
            progression.xp || 0
        );

    const nextLevelXp =
        Number(
            progression.nextLevelXp ??
            progression.requiredXp ??
            0
        );

    const percentage =
        nextLevelXp > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        xp /
                        nextLevelXp
                    ) *
                    100
                )
            )
            : 0;

    const embed =
        createSoulEmbed({
            interaction,
            member,

            title:
                '⭐ Soul Progression',

            description:
                'Current Level and Spiritual Power.',

            color:
                embedConfig.colors.primary
        });

    embed.addFields(
        {
            name:
                '⭐ Level',

            value:
                `\`${formatNumber(level)}\``,

            inline:
                true
        },

        {
            name:
                '✨ Spiritual Power',

            value:
                `\`${formatNumber(xp)} XP\``,

            inline:
                true
        },

        {
            name:
                '🏷️ Active Title',

            value:
                getActiveTitle(
                    soulRecord
                ),

            inline:
                true
        }
    );

    if (nextLevelXp > 0) {
        embed.addFields({
            name:
                '📈 Next Level',

            value: [
                `\`${createProgressBar(
                    percentage
                )}\``,
                `**${percentage}%** • ${
                    formatNumber(
                        nextLevelXp
                    )
                } XP required`
            ].join('\n')
        });
    }

    return embed;
}

function buildRankPage({
    interaction,
    member,
    rankHistory
}) {
    const history =
        Array.isArray(rankHistory)
            ? rankHistory.slice(0, 5)
            : [];

    const historyText =
        history.length > 0
            ? history
                .map(
                    formatRankHistoryRecord
                )
                .join('\n\n')
            : (
                'No Captain Rank history ' +
                'has been recorded yet.'
            );

    const embed =
        createSoulEmbed({
            interaction,
            member,

            title:
                '⚔️ Captain Rank Record',

            description:
                'Current Captain Rank and recent changes.',

            color:
                embedConfig.colors.accent
        });

    return embed.addFields(
        {
            name:
                '⚔️ Current Captain Rank',

            value:
                getSinRank(member)
        },

        {
            name:
                '📜 Recent Rank History',

            value:
                historyText.slice(
                    0,
                    1024
                )
        }
    );
}

function buildCollectionPage({
    interaction,
    member,
    soulRecord,
    titles
}) {
    const achievements =
        Array.isArray(
            soulRecord?.achievements
                ?.recent
        )
            ? soulRecord
                .achievements
                .recent
                .slice(0, 5)
            : [];

    const unlockedTitles =
        Array.isArray(titles)
            ? titles.slice(0, 5)
            : [];

    const achievementText =
        achievements.length > 0
            ? achievements
                .map(
                    formatAchievement
                )
                .join('\n\n')
            : (
                'No Achievements have ' +
                'been recorded yet.'
            );

    const titleText =
        unlockedTitles.length > 0
            ? unlockedTitles
                .map(
                    formatSoulTitle
                )
                .join('\n\n')
            : (
                'No Titles have been ' +
                'unlocked yet.'
            );

    const embed =
        createSoulEmbed({
            interaction,
            member,

            title:
                '🏆 Achievements & Titles',

            description:
                'Recent Achievements and unlocked Titles.',

            color:
                embedConfig.colors.primary
        });

    return embed.addFields(
        {
            name:
                '🏆 Recent Achievements',

            value:
                achievementText.slice(
                    0,
                    1024
                )
        },

        {
            name:
                '🏷️ Unlocked Titles',

            value:
                titleText.slice(
                    0,
                    1024
                )
        }
    );
}

function buildActivityPage({
    interaction,
    member,
    soulRecord
}) {
    const activity =
        soulRecord?.activity ?? {};

    const progression =
        soulRecord?.progression ?? {};

    const embed =
        createSoulEmbed({
            interaction,
            member,

            title:
                '📊 Activity & Statistics',

            description:
                'Community activity and account information.',

            color:
                embedConfig.colors.accent
        });

    return embed.addFields(
        {
            name:
                '💬 Messages',

            value:
                `\`${formatNumber(
                    activity.messages
                )}\``,

            inline:
                true
        },

        {
            name:
                '🎙️ Voice',

            value:
                `\`${formatNumber(
                    activity.voiceMinutes
                )} min\``,

            inline:
                true
        },

        {
            name:
                '🎉 Events',

            value:
                `\`${formatNumber(
                    activity.events
                )}\``,

            inline:
                true
        },

        {
            name:
                '🎫 Tickets',

            value:
                `\`${formatNumber(
                    activity.tickets
                )}\``,

            inline:
                true
        },

        {
            name:
                '👤 Account',

            value: [
                `**Created:** ${
                    formatDiscordDate(
                        member.user.createdAt
                    )
                }`,
                `**User ID:** \`${member.id}\``
            ].join('\n')
        },

        {
            name:
                '🌙 Server Record',

            value: [
                `**Joined:** ${
                    formatDiscordDate(
                        member.joinedAt
                    )
                }`,
                `**Days in server:** \`${
                    formatNumber(
                        calculateDaysSince(
                            member.joinedAt
                        )
                    )
                }\``,
                `**Record created:** ${
                    progression.recordCreatedAt
                        ? formatDiscordDate(
                            progression
                                .recordCreatedAt
                        )
                        : 'Unknown'
                }`,
                `**Highest Role:** ${
                    getHighestRole(member)
                }`
            ].join('\n')
        }
    );
}async function loadSoulContext(member) {
    const guildId =
        member.guild.id;

    const userId =
        member.id;

    const soulRecord =
        await soulDatabase
            .ensureSoulRecord(
                guildId,
                userId
            );

    const [
        rankHistory,
        titles
    ] =
        await Promise.all([
            getSafeRankHistory(
                guildId,
                userId
            ),

            getSafeSoulTitles(
                guildId,
                userId
            )
        ]);

    return {
        soulRecord,
        rankHistory,
        titles
    };
}

function buildSoulPage(
    pageId,
    context
) {
    switch (pageId) {
        case SOUL_PAGES.progression:
            return buildProgressionPage(
                context
            );

        case SOUL_PAGES.ranks:
            return buildRankPage(
                context
            );

        case SOUL_PAGES.collection:
            return buildCollectionPage(
                context
            );

        case SOUL_PAGES.activity:
            return buildActivityPage(
                context
            );

        case SOUL_PAGES.overview:
        default:
            return buildOverviewPage(
                context
            );
    }
}

async function sendSoulError(
    interaction,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                '❌ Soul Record Unavailable',
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
            .setName('soul')
            .setDescription(
                'View your Soul Record.'
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendSoulError(
                    interaction,
                    'This command can only be used inside LUNAR SEIREITEI.'
                );

                return;
            }

            await interaction.deferReply();

            const member =
                interaction.member;

            if (!member) {
                await sendSoulError(
                    interaction,
                    'Evelynn could not access your member record.'
                );

                return;
            }

            const context =
                await loadSoulContext(
                    member
                );

            let selectedPage =
                SOUL_PAGES.overview;

            const createPagePayload =
                (
                    pageId,
                    disabled = false
                ) => ({
                    embeds: [
                        buildSoulPage(
                            pageId,
                            {
                                ...context,
                                interaction,
                                member
                            }
                        )
                    ],

                    components: [
                        createSoulMenu(
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

                        time:
                            MENU_TIMEOUT
                    });

            collector.on(
                'collect',
                async component => {
                    try {
                        if (
                            component.customId !==
                            SOUL_MENU_ID
                        ) {
                            return;
                        }

                        if (
                            component.user.id !==
                            interaction.user.id
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Soul Record',
                                        'Only the member who opened this Soul Record may control it.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        const pageId =
                            component.values[0];

                        if (
                            !SOUL_PAGE_ORDER.includes(
                                pageId
                            )
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Invalid Soul Record Page',
                                        'Evelynn could not recognize that page.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            pageId;

                        await component
                            .deferUpdate();

                        await interaction.editReply(
                            createPagePayload(
                                selectedPage
                            )
                        );
                    } catch (error) {
                        console.error(
                            '❌ Evelynn /soul navigation error:',
                            error
                        );

                        if (
                            !component.replied &&
                            !component.deferred
                        ) {
                            await component
                                .reply({
                                    content:
                                        '❌ The Soul Record page could not be opened.',

                                    flags:
                                        MessageFlags.Ephemeral
                                })
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
                '❌ Evelynn /soul command error:',
                error
            );

            await sendSoulError(
                interaction,
                'Evelynn could not open this Soul Record.'
            );
        }
    }
};
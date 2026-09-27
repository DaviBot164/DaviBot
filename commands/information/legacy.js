const {
    SlashCommandBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const roles =
    require('../../config/roles');

const {
    getAchievementStats,
    getTitleStats,
    getLegacyTotals
} = require('../../database/legacy');

const {
    LEGACY_IDS,
    buildLegacyComponents
} = require('../../utils/legacyComponents');

const ITEMS_PER_PAGE = 10;
const COLLECTOR_TIME = 5 * 60 * 1000;

const LEGACY_RANKS = Object.freeze([
    {
        id: 'moonbound',
        name: 'Moonbound',
        emoji: '🌙'
    },
    {
        id: 'crimsonBloom',
        name: 'Crimson Bloom',
        emoji: '🌸'
    },
    {
        id: 'bloodbound',
        name: 'Bloodbound',
        emoji: '🩸'
    },
    {
        id: 'nightAscendant',
        name: 'Night Ascendant',
        emoji: '🌑'
    },
    {
        id: 'eternalMoon',
        name: 'Eternal Moon',
        emoji: '🌕'
    }
]);

function formatId(value) {
    return value
        .replace(/[_-]+/g, ' ')
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );
}

function getLegacyRankCounts(
    guild
) {
    return LEGACY_RANKS.map(
        rank => {
            const roleId =
                roles[rank.id];

            const role =
                roleId
                    ? guild.roles.cache.get(
                        roleId
                    )
                    : null;

            return {
                ...rank,
                roleId,
                members:
                    role?.members.size ??
                    0
            };
        }
    );
}

function createOverviewEmbed(
    totals,
    rankCounts
) {
    const rankLines =
        rankCounts.map(
            rank =>
                `${rank.emoji} **${rank.name}** — ${rank.members}`
        );

    return createEmbed(
        '🌙 BLOOD MOON • LEGACY',
        [
            'The achievements and titles recorded across Blood Moon.',
            '',
            '**🏆 ACHIEVEMENTS**',
            `Total Unlocks — **${totals.achievementUnlocks}**`,
            `Members — **${totals.achievementMembers}**`,
            '',
            '**📜 TITLES**',
            `Total Unlocks — **${totals.titleUnlocks}**`,
            `Members — **${totals.titleMembers}**`,
            '',
            '**🌕 LEGACY RANKS**',
            ...rankLines,
            '',
            `**Recorded Members:** ${totals.recordedMembers}`
        ].join('\n')
    );
}

function createRecordEmbed({
    title,
    description,
    records,
    page,
    formatter
}) {
    const totalPages =
        Math.max(
            1,
            Math.ceil(
                records.length /
                ITEMS_PER_PAGE
            )
        );

    const safePage =
        Math.min(
            Math.max(
                page,
                0
            ),
            totalPages - 1
        );

    const start =
        safePage *
        ITEMS_PER_PAGE;

    const pageRecords =
        records.slice(
            start,
            start +
                ITEMS_PER_PAGE
        );

    const lines =
        pageRecords.map(
            (record, index) =>
                formatter(
                    record,
                    start +
                        index +
                        1
                )
        );

    if (!lines.length) {
        lines.push(
            '*No records have been unlocked yet.*'
        );
    }

    return {
        embed:
            createEmbed(
                title,
                [
                    description,
                    '',
                    ...lines,
                    '',
                    `Records: **${records.length}** • Page **${safePage + 1}/${totalPages}**`
                ].join('\n')
            ),

        page:
            safePage,

        totalPages
    };
}

function createRankEmbed(
    rankCounts
) {
    const total =
        rankCounts.reduce(
            (sum, rank) =>
                sum +
                rank.members,
            0
        );

    const lines =
        rankCounts.map(
            rank => [
                `${rank.emoji} **${rank.name}**`,
                `Members — **${rank.members}**`
            ].join('\n')
        );

    return createEmbed(
        '🌕 BLOOD MOON • LEGACY RANKS',
        [
            'Achievement rank distribution across Blood Moon.',
            '',
            ...lines,
            '',
            `**Total Rank Assignments:** ${total}`
        ].join('\n')
    );
}

async function loadSection(
    interaction,
    section,
    page = 0
) {
    if (section === 'overview') {
        const [
            totals,
            rankCounts
        ] = await Promise.all([
            getLegacyTotals(
                interaction.guild.id
            ),

            Promise.resolve(
                getLegacyRankCounts(
                    interaction.guild
                )
            )
        ]);

        return {
            embed:
                createOverviewEmbed(
                    totals,
                    rankCounts
                ),

            page: 0,
            totalPages: 1
        };
    }

    if (section === 'achievements') {
        const records =
            await getAchievementStats(
                interaction.guild.id
            );

        return createRecordEmbed({
            title:
                '🏆 BLOOD MOON • ACHIEVEMENTS',

            description:
                'Server-wide achievement unlock records.',

            records,
            page,

            formatter:
                (record, position) =>
                    [
                        `**${position}. ${formatId(record.achievementId)}**`,
                        `Unlocks — **${record.unlocks}**`
                    ].join('\n')
        });
    }

    if (section === 'titles') {
        const records =
            await getTitleStats(
                interaction.guild.id
            );

        return createRecordEmbed({
            title:
                '📜 BLOOD MOON • TITLES',

            description:
                'Titles earned across Blood Moon.',

            records,
            page,

            formatter:
                (record, position) =>
                    [
                        `**${position}. ${formatId(record.titleId)}**`,
                        `Unlocked — **${record.unlocks}** • Equipped — **${record.equipped}**`
                    ].join('\n')
        });
    }

    if (section === 'ranks') {
        return {
            embed:
                createRankEmbed(
                    getLegacyRankCounts(
                        interaction.guild
                    )
                ),

            page: 0,
            totalPages: 1
        };
    }

    return loadSection(
        interaction,
        'overview',
        0
    );
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('legacy')
            .setDescription(
                'View Blood Moon achievements, titles and legacy ranks.'
            ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            let section =
                'overview';

            let page =
                0;

            let view =
                await loadSection(
                    interaction,
                    section,
                    page
                );

            const reply =
                await interaction.editReply({
                    embeds: [
                        view.embed
                    ],

                    components:
                        buildLegacyComponents({
                            section,
                            page:
                                view.page,
                            totalPages:
                                view.totalPages
                        })
                });

            const collector =
                reply.createMessageComponentCollector({
                    componentType:
                        ComponentType.MessageComponent,

                    time:
                        COLLECTOR_TIME
                });

            collector.on(
                'collect',
                async component => {
                    if (
                        component.user.id !==
                        interaction.user.id
                    ) {
                        await component.reply({
                            content:
                                'Run `/legacy` to open your own legacy view.',
                            ephemeral:
                                true
                        });

                        return;
                    }

                    try {
                        if (
                            component.isStringSelectMenu() &&
                            component.customId ===
                                LEGACY_IDS.section
                        ) {
                            section =
                                component.values[0];

                            page = 0;
                        } else if (
                            component.isButton()
                        ) {
                            if (
                                component.customId ===
                                LEGACY_IDS.previous
                            ) {
                                page -= 1;
                            }

                            if (
                                component.customId ===
                                LEGACY_IDS.next
                            ) {
                                page += 1;
                            }
                        } else {
                            return;
                        }

                        view =
                            await loadSection(
                                interaction,
                                section,
                                page
                            );

                        page =
                            view.page;

                        await component.update({
                            embeds: [
                                view.embed
                            ],

                            components:
                                buildLegacyComponents({
                                    section,
                                    page,
                                    totalPages:
                                        view.totalPages
                                })
                        });
                    } catch (error) {
                        console.error(
                            'Legacy navigation failed:',
                            error
                        );

                        if (
                            !component.replied &&
                            !component.deferred
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        'Legacy Failed',
                                        'Akane could not update the legacy records.'
                                    )
                                ],

                                ephemeral:
                                    true
                            });
                        }
                    }
                }
            );

            collector.on(
                'end',
                async () => {
                    try {
                        await interaction.editReply({
                            components: []
                        });
                    } catch {
                        // Message may no longer exist.
                    }
                }
            );
        } catch (error) {
            console.error(
                'Legacy command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        'Legacy Failed',
                        'Akane could not load the Blood Moon legacy.'
                    )
                ],

                components: []
            });
        }
    }
};
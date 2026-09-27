const {
    SlashCommandBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    getCorpsMembers,
    getFactionMembers,
    getRankMembers,
    getCorpsCounts
} = require('../../database/directory');

const {
    CORPS_IDS,
    buildCorpsComponents
} = require('../../utils/corpsComponents');

const MEMBERS_PER_PAGE = 10;
const COLLECTOR_TIME = 5 * 60 * 1000;

const RANKS = Object.freeze({
    hashira: {
        faction: 'slayer',
        rank: 'hashira',
        name: 'Hashira',
        emoji: '🔥'
    },

    kinoe: {
        faction: 'slayer',
        rank: 'kinoe',
        name: 'Kinoe',
        emoji: '🍃'
    },

    mizunoe: {
        faction: 'slayer',
        rank: 'mizunoe',
        name: 'Mizunoe',
        emoji: '🌊'
    },

    slayer_rank: {
        faction: 'slayer',
        rank: 'slayer',
        name: 'Slayer',
        emoji: '🗡️'
    },

    upper_moon: {
        faction: 'demon',
        rank: 'upper_moon',
        name: 'Upper Moon',
        emoji: '🌙'
    },

    lower_moon: {
        faction: 'demon',
        rank: 'lower_moon',
        name: 'Lower Moon',
        emoji: '🌑'
    },

    demon_rank: {
        faction: 'demon',
        rank: 'demon',
        name: 'Demon',
        emoji: '🩸'
    }
});

const OVERVIEW_RANKS = Object.freeze([
    {
        faction: 'slayer',
        rank: 'hashira',
        label: '🔥 Hashira'
    },
    {
        faction: 'slayer',
        rank: 'kinoe',
        label: '🍃 Kinoe'
    },
    {
        faction: 'slayer',
        rank: 'mizunoe',
        label: '🌊 Mizunoe'
    },
    {
        faction: 'slayer',
        rank: 'slayer',
        label: '🗡️ Slayer'
    },
    {
        faction: 'demon',
        rank: 'upper_moon',
        label: '🌙 Upper Moon'
    },
    {
        faction: 'demon',
        rank: 'lower_moon',
        label: '🌑 Lower Moon'
    },
    {
        faction: 'demon',
        rank: 'demon',
        label: '🩸 Demon'
    }
]);

function getCount(
    counts,
    faction,
    rank
) {
    return (
        counts.find(
            entry =>
                entry.faction === faction &&
                entry.rank === rank
        )?.members ?? 0
    );
}

function formatTitle(titleId) {
    if (!titleId) {
        return 'None';
    }

    return titleId
        .split(/[_-]/g)
        .filter(Boolean)
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(' ');
}

function createOverviewEmbed(
    counts,
    totalMembers
) {
    const slayerLines =
        OVERVIEW_RANKS
            .filter(
                entry =>
                    entry.faction ===
                    'slayer'
            )
            .map(
                entry =>
                    `${entry.label} — **${getCount(
                        counts,
                        entry.faction,
                        entry.rank
                    )}**`
            );

    const demonLines =
        OVERVIEW_RANKS
            .filter(
                entry =>
                    entry.faction ===
                    'demon'
            )
            .map(
                entry =>
                    `${entry.label} — **${getCount(
                        counts,
                        entry.faction,
                        entry.rank
                    )}**`
            );

    return createEmbed(
        '🌙 BLOOD MOON • CORPS',
        [
            'Official Blood Moon progression roster.',
            '',
            '**⚔️ SLAYER CORPS**',
            ...slayerLines,
            '',
            '**🩸 DEMON ORDER**',
            ...demonLines,
            '',
            `**Recorded Members:** ${totalMembers}`
        ].join('\n')
    );
}

function createMemberEmbed({
    title,
    description,
    members,
    page
}) {
    const totalPages =
        Math.max(
            1,
            Math.ceil(
                members.length /
                MEMBERS_PER_PAGE
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
        MEMBERS_PER_PAGE;

    const pageMembers =
        members.slice(
            start,
            start +
                MEMBERS_PER_PAGE
        );

    const lines =
        pageMembers.map(
            (member, index) => {
                const position =
                    start +
                    index +
                    1;

                return [
                    `**${position}.** <@${member.userId}>`,
                    `Level **${member.level}** • Title: **${formatTitle(member.titleId)}**`
                ].join('\n');
            }
        );

    if (!lines.length) {
        lines.push(
            '*No members are recorded here yet.*'
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
                    `Members: **${members.length}** • Page **${safePage + 1}/${totalPages}**`
                ].join('\n')
            ),

        page:
            safePage,

        totalPages
    };
}

async function loadSection(
    guildId,
    section,
    page = 0
) {
    if (section === 'overview') {
        const [
            counts,
            members
        ] = await Promise.all([
            getCorpsCounts(
                guildId
            ),

            getCorpsMembers(
                guildId
            )
        ]);

        return {
            embed:
                createOverviewEmbed(
                    counts,
                    members.length
                ),

            page: 0,
            totalPages: 1
        };
    }

    if (
        section === 'slayer' ||
        section === 'demon'
    ) {
        const members =
            await getFactionMembers(
                guildId,
                section
            );

        return createMemberEmbed({
            title:
                section === 'slayer'
                    ? '⚔️ BLOOD MOON • SLAYER CORPS'
                    : '🩸 BLOOD MOON • DEMON ORDER',

            description:
                section === 'slayer'
                    ? 'Members following the Slayer path.'
                    : 'Members following the Demon path.',

            members,
            page
        });
    }

    const rank =
        RANKS[section];

    if (!rank) {
        return loadSection(
            guildId,
            'overview',
            0
        );
    }

    const members =
        await getRankMembers(
            guildId,
            rank.faction,
            rank.rank
        );

    return createMemberEmbed({
        title:
            `${rank.emoji} BLOOD MOON • ${rank.name.toUpperCase()}`,

        description:
            `${rank.name} roster.`,

        members,
        page
    });
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('corps')
            .setDescription(
                'View the Blood Moon progression roster.'
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
                    interaction.guild.id,
                    section,
                    page
                );

            const reply =
                await interaction.editReply({
                    embeds: [
                        view.embed
                    ],

                    components:
                        buildCorpsComponents({
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
                                'Run `/corps` to open your own roster view.',

                            ephemeral:
                                true
                        });

                        return;
                    }

                    try {
                        if (
                            component.isStringSelectMenu() &&
                            component.customId ===
                                CORPS_IDS.section
                        ) {
                            section =
                                component.values[0];

                            page = 0;
                        } else if (
                            component.isButton()
                        ) {
                            if (
                                component.customId ===
                                CORPS_IDS.previous
                            ) {
                                page -= 1;
                            }

                            if (
                                component.customId ===
                                CORPS_IDS.next
                            ) {
                                page += 1;
                            }
                        } else {
                            return;
                        }

                        view =
                            await loadSection(
                                interaction.guild.id,
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
                                buildCorpsComponents({
                                    section,
                                    page,
                                    totalPages:
                                        view.totalPages
                                })
                        });
                    } catch (error) {
                        console.error(
                            'Corps navigation failed:',
                            error
                        );

                        if (
                            !component.replied &&
                            !component.deferred
                        ) {
                            await component.reply({
                                embeds: [
                                    createErrorEmbed(
                                        'Corps Failed',
                                        'Akane could not update the roster.'
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
                'Corps command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        'Corps Failed',
                        'Akane could not load the Blood Moon roster.'
                    )
                ],

                components: []
            });
        }
    }
};
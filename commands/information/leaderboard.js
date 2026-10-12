const { SlashCommandBuilder } = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

const {
    paginate,
    openRecordBrowser
} = require('../../utils/recordBrowser');

const {
    getLeaderboard
} = require('../../database/communityViews');

const {
    getRanks,
    XP
} = require('../../config/progression');

const SECTIONS = [
    { label: 'All Members', value: 'all', emoji: '🏆' },
    { label: 'Slayer Corps', value: 'slayer', emoji: '⚔️' },
    { label: 'Demon Order', value: 'demon', emoji: '🩸' }
];

function rankName(member) {
    return getRanks(member.faction)
        .find(rank => rank.id === member.rank)?.name ??
        member.rank?.replace(/_/g, ' ') ??
        'Unranked';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View level rankings and your position.')
        .setDMPermission(false),

    async execute(interaction) {
        await openRecordBrowser(interaction, {
            sections: SECTIONS,
            initialSection: 'all',

            load: () => getLeaderboard(interaction.guildId),

            render(records, state) {
                const filtered = state.section === 'all'
                    ? records
                    : records.filter(member =>
                        member.faction === state.section
                    );

                const page = paginate(filtered, state.page);

                const lines = page.records.map((member, index) => {
                    const position = page.start + index + 1;
                    const medal = ['🥇', '🥈', '🥉'][position - 1] ??
                        `**${position}.**`;

                    return [
                        `${medal} <@${member.userId}>`,
                        `Level **${member.level}** • XP **${member.xp}/${XP.requiredForLevel(member.level)}**`,
                        `Rank: **${rankName(member)}**`
                    ].join('\n');
                });

                const ownIndex = filtered.findIndex(member =>
                    member.userId === interaction.user.id
                );

                const overall = records.find(member =>
                    member.userId === interaction.user.id
                );

                const ownLine = ownIndex >= 0
                    ? `Your position: **#${ownIndex + 1} / ${filtered.length}**`
                    : 'You have no record in this section yet.';

                const label = SECTIONS.find(section =>
                    section.value === state.section
                )?.label ?? 'All Members';

                return {
                    ...page,
                    embed: createEmbed(
                        `🏆 BLOOD MOON • ${label.toUpperCase()}`,
                        [
                            'Recorded members ranked by level, then current-level XP. Ties are ordered by user ID.',
                            '',
                            lines.join('\n\n') || '*No progression records yet.*',
                            '',
                            ownLine,
                            state.section !== 'all' && overall
                                ? `Your overall position: **#${overall.position} / ${records.length}**`
                                : '',
                            '',
                            `Page **${page.page + 1}/${page.totalPages}**`,
                            'Records may include former server members.'
                        ].filter(line => line !== null).join('\n')
                    )
                };
            }
        });
    }
};
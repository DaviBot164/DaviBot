const {serverText}=require("../../utils/guildContext");
const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const { paginate, openRecordBrowser } = require('../../utils/recordBrowser');
const { getCorpsMembers } = require('../../database/directory');
const { getRanks } = require('../../config/progression');
const { getTitle } = require('../../config/titles');
const RANK_FILTERS = {
    hashira: { faction: 'slayer', rank: 'hashira' },
    kinoe: { faction: 'slayer', rank: 'kinoe' },
    mizunoe: { faction: 'slayer', rank: 'mizunoe' },
    slayer_rank: { faction: 'slayer', rank: 'slayer' },
    upper_moon: { faction: 'demon', rank: 'upper_moon' },
    lower_moon: { faction: 'demon', rank: 'lower_moon' },
    demon_rank: { faction: 'demon', rank: 'demon' }
};
const SECTIONS = [
    { label: 'Overview', value: 'overview', emoji: '🌙' },
    { label: 'All Members', value: 'all', emoji: '👥' },
    { label: serverText('Slayer Corps'), value: 'slayer', emoji: '⚔️' },
    { label: serverText('Hashira'), value: 'hashira', emoji: '🔥' },
    { label: serverText('Kinoe'), value: 'kinoe', emoji: '🍃' },
    { label: serverText('Mizunoe'), value: 'mizunoe', emoji: '🌊' },
    { label: serverText('Slayer'), value: 'slayer_rank', emoji: '🗡️' },
    { label: serverText('Demon Order'), value: 'demon', emoji: '🩸' },
    { label: serverText('Upper Moon'), value: 'upper_moon', emoji: '🌙' },
    { label: serverText('Lower Moon'), value: 'lower_moon', emoji: '🌑' },
    { label: serverText('Demon'), value: 'demon_rank', emoji: '🩸' }
];
function rankName(member) {
    return getRanks(member.faction)
        .find(rank => rank.id === member.rank)?.name ??
        member.rank?.replace(/_/g, ' ') ??
        'Unranked';
}
function render(members, state) {
    if (state.section === 'overview') {
        const lines = [
            'Recorded progression roster. Database records may include former members.',
            ''
        ];
        for (const faction of ['slayer', 'demon']) {
            const factionMembers = members.filter(member => member.faction === faction);
            lines.push(serverText(`**${faction === 'slayer' ? serverText('⚔️ SLAYER CORPS') : serverText('🩸 DEMON ORDER')} — ${factionMembers.length}**`));
            for (const rank of [...getRanks(faction)].reverse()) {
                lines.push(`${rank.name} — **${factionMembers.filter(member => member.rank === rank.id).length}**`);
            }
            const unknown = factionMembers.filter(member => !getRanks(faction).some(rank => rank.id === member.rank)).length;
            if (unknown) {
                lines.push(`Unranked / Other — **${unknown}**`);
            }
            lines.push('');
        }
        lines.push(`Recorded Members: **${members.length}**`);
        return {
            embed: createEmbed(serverText('🌙 BLOOD MOON • CORPS'), lines.join('\n')),
            page: 0,
            totalPages: 1
        };
    }
    const filter = RANK_FILTERS[state.section];
    const filtered = members.filter(member => {
        if (filter) {
            return member.faction === filter.faction &&
                member.rank === filter.rank;
        }
        if (['slayer', 'demon'].includes(state.section)) {
            return member.faction === state.section;
        }
        return true;
    });
    const page = paginate(filtered, state.page);
    const lines = page.records.map((member, index) => [
        `**${page.start + index + 1}.** <@${member.userId}>`,
        serverText(`${member.faction === 'slayer' ? serverText('⚔️ Slayer') : serverText('🩸 Demon')} • **${rankName(member)}**`),
        `Level **${member.level}** • XP **${member.xp}** • Messages **${member.messages}**`,
        `Title: **${getTitle(member.titleId)?.name ?? member.titleId ?? 'None'}**`
    ].join('\n'));
    const label = SECTIONS.find(section => section.value === state.section)?.label ?? 'Members';
    return {
        ...page,
        embed: createEmbed(serverText(`🌙 BLOOD MOON • ${label.toUpperCase()}`), [
            'Sorted by level, then XP.',
            '',
            lines.join('\n\n') || '*No members recorded here yet.*',
            '',
            `Members: **${page.total}** • Page **${page.page + 1}/${page.totalPages}**`
        ].join('\n'))
    };
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('corps')
        .setDescription('View faction members, ranks, levels, and titles.')
        .setDMPermission(false),
    async execute(interaction) {
        await openRecordBrowser(interaction, {
            sections: SECTIONS,
            render,
            async load() {
                const records = await getCorpsMembers(interaction.guildId);
                return [
                    ...new Map(records.map(member => [member.userId, member])).values()
                ];
            }
        });
    }
};

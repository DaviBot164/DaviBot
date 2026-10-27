const {serverText}=require("../../utils/guildContext");
const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const { paginate, openRecordBrowser } = require('../../utils/recordBrowser');
const { getLegacyRecords } = require('../../database/communityViews');
const { getUser } = require('../../database/users');
const { getLegacyTotals } = require('../../database/legacy');
const { getAchievements, ACHIEVEMENT_RANKS } = require('../../config/achievements');
const { getTitles } = require('../../config/titles');
const SECTIONS = [
    { label: 'Overview', value: 'overview', emoji: '🌙' },
    { label: 'Achievements', value: 'achievements', emoji: '🏆' },
    { label: 'Titles', value: 'titles', emoji: '📜' },
    { label: 'Legacy Ranks', value: 'ranks', emoji: '🌕' }
];
function prettyId(id) {
    return id.replace(/[_-]/g, ' ');
}
function progressText(achievement, user) {
    const requirement = achievement.requirement;
    if (requirement.type === 'level') {
        return `Level ${Number(user?.level ?? 0)}/${requirement.value}`;
    }
    if (requirement.type === 'messages') {
        return `Messages ${Number(user?.messages ?? 0)}/${requirement.value}`;
    }
    if (requirement.type === 'faction') {
        return user?.faction ? 'Path chosen' : 'Choose a path';
    }
    if (requirement.type === 'prestige_rank') {
        return serverText('Requires Hashira or Upper Moon');
    }
    return achievement.description;
}
function pageView(title, intro, records, state, formatter) {
    const page = paginate(records, state.page);
    const lines = page.records.map((record, index) => formatter(record, page.start + index + 1));
    return {
        ...page,
        embed: createEmbed(title, [
            intro,
            '',
            lines.join('\n\n') || '*No records found.*',
            '',
            `Records: **${page.total}** • Page **${page.page + 1}/${page.totalPages}**`
        ].join('\n'))
    };
}
function catalogView(data, state, isAchievement) {
    const catalog = isAchievement ? getAchievements() : getTitles();
    const records = isAchievement ? data.achievements : data.titles;
    const key = isAchievement ? 'achievementId' : 'titleId';
    const title = isAchievement ? '🏆 ACHIEVEMENTS' : '📜 TITLES';
    const items = [...catalog];
    const knownIds = new Set(items.map(item => item.id));
    for (const id of new Set(records.map(record => record[key]))) {
        if (!knownIds.has(id)) {
            items.push({
                id,
                name: prettyId(id),
                description: 'Previously recorded unlock.'
            });
            knownIds.add(id);
        }
    }
    if (state.item) {
        const item = items.find(entry => entry.id === state.item);
        const holders = records.filter(record => record[key] === state.item);
        return {
            ...pageView(`${title} • ${item?.name ?? prettyId(state.item)}`, item?.description ?? '', holders, state, (record, position) => `**${position}.** <@${record.userId}>${!isAchievement && record.equipped
                ? ' • **Equipped**'
                : ''}`),
            choices: [
                { label: 'Back to all records', value: 'all' }
            ],
            placeholder: 'Return to the catalog'
        };
    }
    const view = pageView(serverText(`🌙 BLOOD MOON • ${title}`), data.target
        ? `Records for <@${data.target.id}>.`
        : 'Choose a record below to view its holders. Database records may include former members.', items, state, item => {
        const holders = records.filter(record => record[key] === item.id);
        if (data.target) {
            const unlocked = holders.length > 0;
            return [
                `${unlocked ? '✅' : '🔒'} **${item.name}**`,
                item.description,
                unlocked
                    ? !isAchievement && holders.some(record => record.equipped)
                        ? '**Unlocked • Equipped**'
                        : '**Unlocked**'
                    : isAchievement && item.requirement
                        ? progressText(item, data.user)
                        : '**Locked**'
            ].join('\n');
        }
        const preview = holders.slice(0, 3)
            .map(record => `<@${record.userId}>`)
            .join(', ');
        return [
            `**${item.name}**`,
            item.description,
            `Holders: **${holders.length}**${!isAchievement
                ? ` • Equipped: **${holders.filter(record => record.equipped).length}**`
                : ''}`,
            preview
                ? `${preview}${holders.length > 3 ? ' …' : ''}`
                : '*No holders yet.*'
        ].join('\n');
    });
    const choices = view.records.map(item => ({
        label: item.name.slice(0, 100),
        value: item.id
    }));
    return {
        ...view,
        choices,
        placeholder: 'Choose an achievement or title'
    };
}
function rankView(data, state) {
    if (state.item) {
        const rank = data.ranks.find(entry => entry.id === state.item);
        return {
            ...pageView(`🌕 LEGACY • ${rank?.name ?? 'Rank'}`, `Discord role holders${data.target ? ` for <@${data.target.id}>` : ''}.`, rank?.members ?? [], state, (userId, position) => `**${position}.** <@${userId}>`),
            choices: [
                { label: 'Back to all ranks', value: 'all' }
            ]
        };
    }
    return {
        embed: createEmbed(serverText('🌕 BLOOD MOON • LEGACY RANKS'), [
            'Current Discord role assignments. One member may hold multiple roles.',
            '',
            ...data.ranks.map(rank => `**${rank.name}** — ${rank.points} achievement points\nHolders: **${rank.members.length}**`)
        ].join('\n\n')),
        page: 0,
        totalPages: 1,
        choices: data.ranks.map(rank => ({
            label: rank.name,
            value: rank.id
        })),
        placeholder: 'Choose a legacy rank'
    };
}
function render(data, state) {
    if (state.item === 'all') {
        state.item = null;
        state.page = 0;
    }
    if (state.section === 'achievements') {
        return catalogView(data, state, true);
    }
    if (state.section === 'titles') {
        return catalogView(data, state, false);
    }
    if (state.section === 'ranks') {
        return rankView(data, state);
    }
    const achievementIds = new Set(data.achievements.map(record => record.achievementId));
    const points = getAchievements()
        .filter(item => achievementIds.has(item.id))
        .reduce((sum, item) => sum + item.points, 0);
    const lines = data.target
        ? [
            `Member: <@${data.target.id}>`,
            '',
            `Achievements: **${achievementIds.size}/${getAchievements().length}**`,
            `Achievement Points: **${points}**`,
            `Titles: **${data.titles.length}/${getTitles().length}**`,
            `Equipped Title: **${getTitles().find(item => item.id === data.titles.find(record => record.equipped)?.titleId)?.name ?? 'None'}**`
        ]
        : [
            'Achievements, titles, and legacy role holders.',
            '',
            `Achievement Unlocks: **${data.totals.achievementUnlocks}**`,
            `Achievement Holders: **${data.totals.achievementMembers}**`,
            `Title Unlocks: **${data.totals.titleUnlocks}**`,
            `Title Holders: **${data.totals.titleMembers}**`,
            `Recorded Members: **${data.totals.recordedMembers}**`
        ];
    return {
        embed: createEmbed(serverText('🌙 BLOOD MOON • LEGACY'), [
            ...lines,
            '',
            '**LEGACY ROLES**',
            ...data.ranks.map(rank => `${rank.name} — **${rank.members.length}**`)
        ].join('\n')),
        page: 0,
        totalPages: 1
    };
}
module.exports = {
    data: new SlashCommandBuilder()
        .setName('legacy')
        .setDescription('View achievements, titles, and their holders.')
        .setDMPermission(false)
        .addUserOption(option => option
        .setName('member')
        .setDescription('View one member’s legacy.')),
    async execute(interaction) {
        const target = interaction.options.getUser('member');
        await openRecordBrowser(interaction, {
            sections: SECTIONS,
            render,
            async load() {
                const [records, totals, user] = await Promise.all([
                    getLegacyRecords(interaction.guildId, target?.id),
                    getLegacyTotals(interaction.guildId),
                    target
                        ? getUser(interaction.guildId, target.id)
                        : Promise.resolve(null),
                    interaction.guild.members.fetch()
                ]);
                const ranks = ACHIEVEMENT_RANKS.map(rank => ({
                    ...rank,
                    members: [
                        ...(interaction.guild.roles.cache
                            .get(rank.roleId)?.members.values() ?? [])
                    ]
                        .filter(member => !member.user.bot &&
                        (!target || member.id === target.id))
                        .map(member => member.id)
                        .sort()
                }));
                return {
                    ...records,
                    target,
                    totals,
                    user,
                    ranks
                };
            }
        });
    }
};

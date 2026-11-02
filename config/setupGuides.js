const { current, factionName } = require('../utils/guildContext');
const { getRanks } = require('./progression');
function rankLines(faction) {
    return getRanks(faction).map(r => `**${r.name}** · Level ${r.level}${r.automatic ? '' : ' + staff promotion'}`).join('\n');
}
function guide(kind) {
    const s = current();
    const channel = (key, fallback) => s.channels[key] ? `<#${s.channels[key]}>` : fallback;
    const specs = {
        sacred_laws: { title: '📜 Sacred Laws', intro: 'Respect others and keep this community welcoming.', fields: [
            { name: 'Respect', value: 'No harassment, threats, discrimination or personal attacks. Follow staff instructions.' },
            { name: 'Chat responsibly', value: 'No spam, disruptive mentions, scams, harmful links or inappropriate content. Use the right channels.' },
            { name: 'Get help', value: `Report issues privately through ${channel('openTicket', 'a support ticket')}. Never share passwords or tokens.` }
        ] },
        moon_guide: { title: `📖 ${s.brand.server} Guide`, intro: 'Your first steps in the community.', fields: [
            { name: 'Start here', value: `Read the rules and follow Bloxlink in ${channel('verification', 'the verification channel')}. Then choose a faction in ${channel('slayers2', 'the path channel')}. Faction selection does not verify your account.` },
            { name: 'Progress', value: 'Chat naturally to earn XP. Use /profile, /leaderboard and /corps to follow levels and ranks. XP has a cooldown; spam does not help.' },
            { name: 'Need help?', value: `Use /help or open a ticket in ${channel('openTicket', 'the ticket channel')}.` }
        ] },
        verification_guide: { title: '✅ Verification', intro: 'Use the Bloxlink verification option provided in this channel.', fields: [
            { name: 'Link your account', value: 'Follow Bloxlink’s instructions with the Roblox account you intend to use. Faction selection is a separate step.' },
            { name: 'Problems?', value: 'Contact a moderator directly if verification blocks access to support. Never share passwords or verification codes.' }
        ] },
        role_guide: { title: '🎭 Roles and Ranks', intro: 'Faction progression and staff responsibilities are separate.', fields: [
            { name: factionName('slayer'), value: rankLines('slayer'), inline: true },
            { name: factionName('demon'), value: rankLines('demon'), inline: true },
            { name: 'Staff', value: 'Staff roles are assigned by server leadership. XP never grants moderation permissions. Final faction ranks require staff promotion.' }
        ] },
        game_guide: { title: '🗺️ Game Guide', intro: 'Share builds, legitimate strategies and questions in the game channels.', fields: [
            { name: 'Server progression', value: 'Discord levels and faction ranks are separate from your in-game character. No exploits or suspicious downloads.' }
        ] },
        support_guide: { title: '🎫 Support Guide', intro: `Open a ticket in ${channel('openTicket', 'the ticket channel')}.`, fields: [
            { name: 'Choose a category', value: 'Support, report, appeal or other. Explain what happened and include relevant evidence.' },
            { name: 'While waiting', value: 'Keep related details in one ticket. Avoid duplicate tickets, repeated pings and sharing credentials.' }
        ] }
    };
    return specs[kind] ? { ...specs[kind], key: kind } : null;
}
function pathGuide(faction) {
    return { key: 'progression_' + faction, title: factionName(faction) + ' Progression', intro: 'Levels and ranks belong to this Discord server.', fields: [
        { name: 'Rank path', value: rankLines(faction) },
        { name: 'Earn XP', value: 'Chat naturally. Eligible messages award XP with a cooldown. Use /profile to see progress.' },
        { name: 'Final ranks', value: 'Reach the required level and ask staff about promotion. Level alone does not automatically award the final rank.' }
    ] };
}
module.exports = { guide, pathGuide, rankLines };

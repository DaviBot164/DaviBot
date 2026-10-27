const {serverText}=require("../utils/guildContext");
const channels = require('./channels');
const { getRanks } = require('./progression');
const { STREAK_BONUSES, BOARD_BONUS } = require('./missions');
const channel = (key, fallback) => channels[key] ? `<#${channels[key]}>` : fallback;
const field = (name, value, inline = false) => ({ name, value: Array.isArray(value) ? value.join('\n') : value, inline });
function guide(kind) {
    const current=require('../utils/guildContext').current();
    const custom=current.pages[kind];
    if(custom)return {key:kind,title:custom.title,intro:custom.description,fields:[]};
    if(current.theme!=='blood-moon')return require('./serverGuides').guide(kind,current);
    const training = channel('training', 'the training channel');
    const path = channel('slayers2', serverText('the Slayers 2 channel'));
    const support = channel('supportGuide', 'the support guide');
    const tickets = channel('openTicket', 'the ticket channel');
    const specs = {
        sacred_laws: { title: '📜 Sacred Laws', intro: serverText('**Good rivalry. Clear boundaries. One community.**\nSlayer or Demon, these rules apply to everyone.'), quote: 'Keep the sharp edges in the jokes. Respect the person behind the screen.', fields: [
                field('01 · Respect the person', 'Friendly rivalry is welcome. Harassment, slurs, discrimination, threats and personal attacks are not. Stop when someone asks.'),
                field('02 · Give the chat room to breathe', 'No message floods, repeated posts, mention spam or disruption in voice channels. Use the right channel and read its topic.'),
                field('03 · Keep it community-friendly', 'No sexual or NSFW content, graphic gore or shock material. Dark fantasy is a theme, not permission to ignore boundaries.'),
                field('04 · Keep accounts safe', 'No scams, phishing, harmful links or malicious downloads. Do not request or expose passwords, account tokens, verification codes or other private information.'),
                field('05 · Handle disagreements properly', 'Follow staff instructions. Do not evade restrictions. If a moderation decision needs review, explain it calmly through a ticket.'),
                field('Need help?', `Read ${support} or open a ticket in ${tickets}. Include relevant message links or screenshots.`)
            ] },
        moon_guide: { title: serverText('📖 Blood Moon Guide'), intro: serverText('**Your first night under the Blood Moon.**\nA Slayers 2 community, a server progression journey, and matches for any game. Start here.'), quote: 'You do not need to memorize the server. Just take the next step.', fields: [
                field('01 · Arrive & choose', serverText(`Complete Bloxlink verification in ${channel('verification', 'the verification channel')}, then choose **Slayer** or **Demon** in ${path}. Verification and faction selection are separate steps.`)),
                field('02 · Collect your Daily Drop', [
                    `Use **/daily** or the Daily Drop button in ${training}.`,
                    `Streak bonus drops: ${Object.entries(STREAK_BONUSES).map(([day, xp]) => `**${day} days: +${xp} XP**`).join(' · ')}.`,
                    'The bonus track repeats every 30 claims. Claim 24–48 hours after your last drop to keep the streak.'
                ]),
                field('03 · Clear the Mission Board', [
                    `Open **Missions** from ${training}. Send **15 / 30 XP-eligible messages** and collect your daily drop.`,
                    `Collect all three mission rewards for a **+${BOARD_BONUS} XP** clear bonus. Themes change between cycles; mission goals stay the same.`,
                    'XP has a cooldown. Spam will not speed up your progress.'
                ]),
                field('04 · Make your progress visible', '**/profile** — Level, faction and statistics\n**/achievements** — Milestones and Achievement Points\n**/titles** — Equip an unlocked title\n**/leaderboard** — Community rankings'),
                field('05 · Rise through your path', serverText(`Regular faction ranks follow your server level. **Hashira / Upper Moon** require Level **50+** and a Trial or staff promotion. Level 50 alone does not award them.\nGuides: ${channel('factionProgression', 'the faction progression channel')} · **/corps** · **/trial**`)),
                field('06 · Pick your team', 'Use **/match** for **1v1–5v5** in any game. Join **🔴 Vortex** or **🔵 Nova**. Both captains confirm the start; the opposing captain confirms or disputes the reported result. Confirmed results update profile wins and losses.'),
                field('07 · Meet Kitsune', `Try **\`kitsune help\`** for conversation examples, or **/help** for bot commands. Need a hand? ${support}.\n*Server XP and ranks are separate from your in-game progress.*`)
            ] },
        verification_guide: { title: serverText('⛩️ Blood Moon Verification'), intro: serverText('**One account linked. Your next chapter unlocked.**\nBlood Moon uses Bloxlink for Roblox account verification.'), quote: 'Make an entrance. Preferably with the right account.', fields: [
                field('01 · Start here', 'Use the Bloxlink verification option provided in this channel. Follow the instructions shown by Bloxlink.'),
                field('02 · Check the account', 'Make sure you are linking the Roblox account you intend to use. Complete Bloxlink’s steps, then return to Discord and check your access.'),
                field('03 · Choose your side', serverText(`Once verified, visit ${path} and choose **Slayer** or **Demon**. Linking your account does not select a faction.`)),
                field('Something did not work?', `Read ${support} or ask staff. Include the error and a screenshot if useful. **Never send passwords, account tokens or verification codes to another member.**`)
            ] },
        role_guide: { title: serverText('🎭 Blood Moon Roles'), intro: '**Your path. Your milestones. Your place in the community.**\nFaction ranks, Achievement Ranks and staff responsibilities are separate.', quote: 'An impressive title is lovely. Knowing what it means is even better.', fields: [
                field(serverText('⚔️ Slayer path'), rankLines('slayer'), true), field(serverText('🩸 Demon path'), rankLines('demon'), true),
                field('🌕 Achievement ladder', serverText('Moonbound → Crimson Bloom → Bloodbound → Night Ascendant → Eternal Moon\nEarn Achievement Points through milestones. Track them with **/achievements**.')),
                field(serverText('👑 The Shogunate'), serverText('**Shogun** — Owner\n**Daimyo** — Administrator\n**Hatamoto** — Moderator\n**Samurai** — Staff\nStaff responsibilities are assigned; XP does not award authority.')),
                field('✨ Wear your progress', 'Use **/titles** to equip an unlocked title. Titles do not change your faction rank or grant staff permissions.'),
                field('Find your next step', serverText(`**/profile** · **/corps**\nFaction guides: ${channel('factionProgression', 'the progression channel')}\n*All ranks here belong to Blood Moon, not your in-game character.*`))
            ] },
        game_guide: { title: serverText('🗺️ Slayers 2 Guide Directory'), intro: serverText('**Find a route. Share a build. Bring someone along.**\nThis is the community space for Slayers 2 questions, guides and discoveries.'), quote: 'A clear question gets further than a mysterious cry for help.', fields: [
                field('⚔️ Build your fighter', serverText('Share breathing styles, Demon Arts, weapons and equipment combinations. Mention whether your build is for PvE or PvP.')),
                field('👹 Learn the fight', 'Discuss boss patterns, combat timing and team tactics. Explain what worked, what did not, and when you tested it.'),
                field('📈 Share a useful route', 'Post legitimate leveling or resource routes. Keep guides current when the game changes. No exploits, malicious scripts or suspicious downloads.'),
                field('🤝 Find a party', 'Tell people your goal, faction, relevant in-game level and when you can play. Give your future teammates something to work with.'),
                field('📖 Make a guide people can use', 'Keep the steps short. Add screenshots when useful. Distinguish your own experience from confirmed mechanics.'),
                field('Looking for server progression?', serverText(`Blood Moon XP is separate from Slayers 2. See ${channel('factionProgression', 'the faction guides')} or use **/profile**.`))
            ] },
        support_guide: { title: '📜 Support Guide', intro: `**A clear question. The right ticket. A calmer conversation.**\nOpen a ticket in ${tickets} and choose the category that fits.`, quote: 'Bring the details. Leave the dramatic ping marathon outside.', fields: [
                field('🛟 Support', 'Verification, missing roles, server questions or Kitsune issues. Tell staff what you expected, what happened, and what you already tried.'),
                field('🚨 Report', 'Rule violations, harassment or suspicious activity. Include relevant message links, screenshots and a short explanation. Keep private details out of public chat.'),
                field('⚖️ Appeal', 'Ask staff to review a moderation action. Include its date or case ID when available and explain what needs reconsideration. A review does not guarantee a reversal.'),
                field('📜 Other', 'Not sure where it fits? State what you need in the first message so staff can direct you.'),
                field('A useful first message', '**What happened?** A short description.\n**Where?** Channel and message link.\n**Evidence?** Relevant screenshots.\n**Already tried?** Your troubleshooting steps.'),
                field('While you wait', 'Keep related information in one ticket. Avoid duplicate tickets or repeated staff mentions. Never include passwords, tokens or verification codes. Follow staff instructions when the issue is resolved.')
            ] }
    };
    return specs[kind]?{...specs[kind],key:kind}:null;
}
function rankLines(faction) { return getRanks(faction).map(rank => `**${rank.name}** · Level ${rank.level}${rank.automatic ? '' : ' + Trial / staff promotion'}`).join('\n'); }
function pathGuide(faction) {
    if(require('../utils/guildContext').current().theme!=='blood-moon')return require('./serverGuides').pathGuide(faction);
    const slayer = faction === 'slayer';
    const elite = slayer ? serverText('Hashira') : serverText('Upper Moon');
    return {
        title: slayer ? serverText('⚔️ Slayer Path') : serverText('🩸 Demon Path'),
        intro: slayer ? '**Steady hands. A sharper blade. Your place in the Corps.**' : '**A quiet entrance. A rising presence. Your place in the night.**',
        quote: slayer ? 'Discipline looks good on you. Put it to use.' : 'Make the progress more impressive than the entrance.',
        fields: [field('Your rank path', rankLines(faction)), field('Build the habit', `Talk naturally to earn XP, collect your **Daily Drop**, and open **Missions** in ${channel('training', 'the training channel')}. XP has a cooldown; spam does not help.`), field(`The final step · ${elite}`, `Reach server Level **50+**, then qualify through Trials or staff promotion. Level 50 alone does not grant **${elite}**. Use **/trial** for trial information.`), field('Track your path', serverText(`**/profile** · **/corps** · **/leaderboard**\nChoose your faction: ${channel('slayers2', serverText('the Slayers 2 channel'))}\n*These are Discord server levels and ranks, not in-game progression.*`))]
    };
}
module.exports = { guide, pathGuide };

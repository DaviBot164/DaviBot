
const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishMoonGuide(guild) {
    const channel = guild.channels.cache.get(channels.moonGuide);

    if (!channel?.isTextBased()) {
        throw new Error('Moon Guide channel could not be found.');
    }

    const title = '📖 Blood Moon Guide';

    const embed = createEmbed(
        title,
        [
            '**Your journey begins beneath the Blood Moon.**',
            'Blood Moon is a **Slayers 2** community with progression, training and a universal PvP system for any game.',
            '',
            '**01 • Verify & Choose Your Path**',
            'Complete Bloxlink verification, then choose **Slayer** or **Demon**.',
            `Visit <#${channels.slayers2}> to begin your journey.`,
            'Your faction determines your server rank progression.',
            '',
            '**02 • Build Your Progress**',
            'Earn XP through chat activity and level up over time. XP has a cooldown to prevent spam.',
            'Use `/daily` for your daily XP reward and `/profile` to check your progress.',
            'Use `/leaderboard` to view the community rankings.',
            '*Discord XP and levels are separate from your in-game progress.*',
            '',
            '**03 • Rise Through Your Faction**',
            'Regular faction ranks are awarded automatically as you reach the required server levels.',
            '**Hashira** and **Upper Moon** require Level **50+** and qualification through Trials or staff promotion.',
            'Use `/trial` for trial information and `/corps` to explore ranks and members.',
            '',
            '**04 • Earn Achievements & Titles**',
            'Complete community milestones to unlock achievements and progress through Achievement Ranks.',
            'Collect and equip titles through `/titles`.',
            'Use `/achievements` to view your rewards and `/legacy` to explore server accomplishments.',
            '',
            '**05 • Universal PvP & Matches**',
            'Challenge warriors in **any game** using `/match` in the PvP channel.',
            'Choose a format from **1v1 to 5v5** and recruit players for 🔴 Crimson or 🔵 Azure.',
            'When both teams are full, each captain must confirm before the battle begins.',
            'After the match, a captain reports the winner. The opposing captain must confirm or dispute the result.',
            'Confirmed results update your **Wins & Losses** on `/profile`.',
            'Staff can resolve disputed matches using `/matchmanage`.',
            'Play fairly, respect your opponents and report accurate results.',
            '',
            '**06 • Join the Community**',
            'Discuss builds, breathing styles and demon arts, find teammates, complete daily quests and train with other members.',
            'Use the appropriate channels and respect other players.',
            '',
            '**07 • Help & Information**',
            `Role hierarchy: <#${channels.roles}>`,
            `Faction progression: <#${channels.factionProgression}>`,
            `For support, read the support guide and open a ticket in <#${channels.openTicket}>.`,
            'Use `/help` to explore Akane commands.',
            '',
            '━━━━━━━━━━',
            '*Choose your path. Find your allies. Build your legacy.*'
        ].join('\n')
    );

    const icon = guild.iconURL({ size: 256 });

    if (icon) {
        embed.setThumbnail(icon);
    }

    return publishSetupMessage(
        channel,
        { embeds: [embed] },
        title
    );
}

module.exports = { publishMoonGuide };

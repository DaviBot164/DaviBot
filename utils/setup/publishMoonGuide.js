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
            'We are a **Slayers 2** community for progression, PvP, training and finding people to play with.',
            '',
            '**01 • Get Verified & Choose Your Path**',
            'Complete Bloxlink verification, then choose **Slayer** or **Demon**.',
            `Visit <#${channels.slayers2}> to choose your path.`,
            'Your faction determines which server rank path you follow.',
            '',
            '**02 • Build Your Progress**',
            'Earn server XP through chat activity and gain levels over time. XP has a cooldown, so sending messages rapidly does not speed up your progress.',
            'Use `/profile` to check your progress and `/leaderboard` to view the level and XP rankings.',
            '*Akane tracks your Discord progression, not your Slayers 2 character level.*',
            '',
            '**03 • Rise Through Your Faction**',
            'Regular faction ranks are awarded automatically when you reach their required server levels.',
            '**Hashira** and **Upper Moon** are elite ranks: Level **50+** is required, but reaching that level alone does not grant the rank. You must also qualify through Trials or staff promotion.',
            'Use `/trial` to view trial information and `/corps` to browse members and ranks.',
            '',
            '**04 • Earn Achievements & Titles**',
            'Reach community milestones to unlock achievements and progress through Achievement Ranks.',
            'Titles are separate collectible rewards that you can earn and equip through Akane.',
            'Use `/achievements` and `/titles` to view your rewards, or `/legacy` to explore the server’s achievements, titles and ranks.',
            '',
            '**05 • Join the Community**',
            'Share builds, discuss breathing styles and demon arts, find a party, and practice with other members.',
            'Keep posts in the appropriate channels. Friendly competition is welcome; respect still comes first.',
            '',
            '**06 • Find Help & More Information**',
            `Role hierarchy: <#${channels.roles}>`,
            `Slayer progression: <#${channels.slayerPath}>`,
            `Demon progression: <#${channels.demonPath}>`,
            `For assistance, read the support guide and open a ticket in <#${channels.openTicket}>.`,
            'Use `/help` whenever you need the command directory.',
            '',
            '──────────',
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
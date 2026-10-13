const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

const PATHS = {
    slayer: {
        channelId: channels.slayerPath,
        title: '⚔️ Slayer Path',
        introduction: 'Take up your blade. Build your place in the Corps.',
        faction: 'Slayer',
        elite: 'Hashira',
        ranks: [
            '🗡️ **Slayer** — Starting Rank • Level 1',
            '🌊 **Mizunoe** — Automatic Promotion • Level 10',
            '🍃 **Kinoe** — Automatic Promotion • Level 25',
            '🔥 **Hashira** — Level 50+ • Trial / Staff Promotion'
        ]
    },
    demon: {
        channelId: channels.demonPath,
        title: '🩸 Demon Path',
        introduction: 'Embrace the night. Rise beneath the Blood Moon.',
        faction: 'Demon',
        elite: 'Upper Moon',
        ranks: [
            '🩸 **Demon** — Starting Rank • Level 1',
            '🌑 **Lower Moon** — Automatic Promotion • Level 20',
            '🌙 **Upper Moon** — Level 50+ • Trial / Staff Promotion'
        ]
    }
};

async function publishPathGuide(guild, path) {
    const channel = guild.channels.cache.get(path.channelId);

    if (!channel?.isTextBased()) {
        throw new Error(`${path.faction} Path channel could not be found.`);
    }

    const embed = createEmbed(
        path.title,
        [
            `**${path.introduction}**`,
            `Choose the **${path.faction}** faction to follow this rank path.`,
            '*All levels below refer to your Blood Moon server level, not your Slayers 2 character level.*'
        ].join('\n')
    ).addFields(
        {
            name: '🏯 YOUR RANK PATH',
            value: path.ranks.join('\n')
        },
        {
            name: '🌙 EARN YOUR PROGRESS',
            value: [
                'Participate in server conversations to earn XP and gain levels.',
                'XP has a cooldown. Sending messages rapidly does not speed up progression, and spam is not allowed.',
                'Regular faction promotions are automatic when you meet their level requirements.'
            ].join('\n')
        },
        {
            name: `⚔️ REACH ${path.elite.toUpperCase()}`,
            value: [
                `**${path.elite}** requires server Level **50+** and promotion through Trials or staff approval.`,
                `Reaching Level 50 alone does **not** grant ${path.elite}.`,
                'Use `/trial` to view trial information.'
            ].join('\n')
        },
        {
            name: '📖 TRACK YOUR JOURNEY',
            value: [
                '`/profile` — Check your server progression.',
                '`/corps` — Browse members and faction ranks.',
                '`/leaderboard` — View the level and XP rankings.',
                `Role hierarchy: <#${channels.roles}>`,
                `Path selection: <#${channels.slayers2}>`
            ].join('\n')
        }
    );

    const icon = guild.iconURL({ size: 256 });

    if (icon) {
        embed.setThumbnail(icon);
    }

    return publishSetupMessage(
        channel,
        { embeds: [embed] },
        path.title
    );
}

async function publishSlayerGuide(guild) {
    return publishPathGuide(guild, PATHS.slayer);
}

async function publishDemonGuide(guild) {
    return publishPathGuide(guild, PATHS.demon);
}

async function publishProgressionGuides(guild) {
    const slayer = await publishSlayerGuide(guild);
    const demon = await publishDemonGuide(guild);

    return { slayer, demon };
}

module.exports = {
    publishSlayerGuide,
    publishDemonGuide,
    publishProgressionGuides
};
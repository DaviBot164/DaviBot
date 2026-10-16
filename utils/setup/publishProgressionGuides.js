
const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

const PATHS = Object.freeze({
    slayer: {
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
});

function buildPathEmbed(guild, path) {
    const embed = createEmbed(
        path.title,
        [
            `**${path.introduction}**`,
            `Choose the **${path.faction}** faction to follow this rank path.`,
            '*These levels refer to your Blood Moon server level, not your Slayers 2 character level.*'
        ].join('\n')
    ).addFields(
        {
            name: '⚔️ YOUR RANK PATH',
            value: path.ranks.join('\n')
        },
        {
            name: '🌙 EARN YOUR PROGRESS',
            value: [
                'Participate in server conversations to earn XP and gain levels.',
                'XP has a cooldown. Spam does not speed up progression.',
                'Regular faction promotions are automatic when level requirements are met.'
            ].join('\n')
        },
        {
            name: `🏯 REACH ${path.elite.toUpperCase()}`,
            value: [
                `**${path.elite}** requires Level **50+** and promotion through Trials or staff approval.`,
                `Reaching Level 50 alone does **not** grant ${path.elite}.`,
                'Use `/trial` to view trial information.'
            ].join('\n')
        },
        {
            name: '📖 TRACK YOUR JOURNEY',
            value: [
                '`/profile` — Check your server progression.',
                '`/corps` — Browse faction members and ranks.',
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

    return embed;
}

function getChannel(guild) {
    const channel = guild.channels.cache.get(channels.factionProgression);

    if (!channel?.isTextBased()) {
        throw new Error('Faction Progression channel could not be found.');
    }

    return channel;
}

async function publishSlayerGuide(guild) {
    const path = PATHS.slayer;

    return publishSetupMessage(
        getChannel(guild),
        { embeds: [buildPathEmbed(guild, path)] },
        path.title
    );
}

async function publishDemonGuide(guild) {
    const path = PATHS.demon;

    return publishSetupMessage(
        getChannel(guild),
        { embeds: [buildPathEmbed(guild, path)] },
        path.title
    );
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

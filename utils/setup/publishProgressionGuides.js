const channels =
    require('../../config/channels');

const brand =
    require('../../config/brand');

const {
    createEmbed
} = require('../embeds');

const {
    publishSetupMessage
} = require('./publishSetupMessage');

async function publishSlayerGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.slayerPath
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Slayer Path channel could not be found.'
        );
    }

    const title =
        '⚔️ Slayer Path';

    const embed =
        createEmbed(
            title,
            [
                'Walk the path of a Demon Slayer and rise through the Corps.',
                '',
                '🗡️ **SLAYER**',
                'Starting Rank • Level 1',
                '',
                '🌊 **MIZUNOE**',
                'Automatic Promotion • Level 10',
                '',
                '🍃 **KINOE**',
                'Automatic Promotion • Level 25',
                '',
                '🔥 **HASHIRA**',
                'Level 50+ • Trial / Staff Promotion',
                '',
                '**Progression**',
                'Stay active, earn XP and level up to advance through the Slayer ranks.',
                '',
                '*Reaching Level 50 does not automatically grant Hashira.*'
            ].join('\n')
        )
            .setFooter({
                text:
                    brand.footer
            });

    return publishSetupMessage(
        channel,
        {
            embeds: [
                embed
            ]
        },
        title
    );
}

async function publishDemonGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.demonPath
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Demon Path channel could not be found.'
        );
    }

    const title =
        '🩸 Demon Path';

    const embed =
        createEmbed(
            title,
            [
                'Embrace the night and rise through the Demon ranks.',
                '',
                '🩸 **DEMON**',
                'Starting Rank • Level 1',
                '',
                '🌑 **LOWER MOON**',
                'Automatic Promotion • Level 20',
                '',
                '🌙 **UPPER MOON**',
                'Level 50+ • Trial / Staff Promotion',
                '',
                '**Progression**',
                'Stay active, earn XP and level up to advance through the Demon ranks.',
                '',
                '*Reaching Level 50 does not automatically grant Upper Moon.*'
            ].join('\n')
        )
            .setFooter({
                text:
                    brand.footer
            });

    return publishSetupMessage(
        channel,
        {
            embeds: [
                embed
            ]
        },
        title
    );
}

async function publishProgressionGuides(
    guild
) {
    const slayer =
        await publishSlayerGuide(
            guild
        );

    const demon =
        await publishDemonGuide(
            guild
        );

    return {
        slayer,
        demon
    };
}

module.exports = {
    publishSlayerGuide,
    publishDemonGuide,
    publishProgressionGuides
};
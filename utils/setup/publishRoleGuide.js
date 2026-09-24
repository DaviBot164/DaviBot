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

async function publishRoleGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.roles
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Roles channel could not be found.'
        );
    }

    const title =
        '🎭 Blood Moon Roles';

    const embed =
        createEmbed(
            title,
            [
                'Roles in **Blood Moon** represent your path, progression, achievements and position within the community.',
                '',
                '⚔️ **SLAYER PATH**',
                '🗡️ Slayer — Starting Rank',
                '🌊 Mizunoe — Level 10',
                '🍃 Kinoe — Level 25',
                '🔥 Hashira — Level 50+ • Trial / Staff Promotion',
                '',
                '🩸 **DEMON PATH**',
                '🩸 Demon — Starting Rank',
                '🌑 Lower Moon — Level 20',
                '🌙 Upper Moon — Level 50+ • Trial / Staff Promotion',
                '',
                '🌕 **ACHIEVEMENT RANKS**',
                '🌙 Moonbound',
                '🌸 Crimson Bloom',
                '🩸 Bloodbound',
                '🌑 Night Ascendant',
                '🌕 Eternal Moon',
                '',
                'Achievement ranks reflect your overall accomplishments within Blood Moon.',
                '',
                '🏯 **SHOGUNATE**',
                '🥷 Samurai — Staff',
                '🛡️ Hatamoto — Moderator',
                '🏯 Daimyo — Administrator',
                '👑 Shogun — Server Owner',
                '',
                '✨ **TITLES**',
                'Titles are collectible honors earned through activity, progression and achievements.',
                'Unlocked titles can be viewed and equipped through Akane.',
                '',
                '*Your roles tell the story of your journey through Blood Moon.*'
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

module.exports = {
    publishRoleGuide
};
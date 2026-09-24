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

async function publishMoonGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.moonGuide
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Moon Guide channel could not be found.'
        );
    }

    const title =
        '📖 Moon Guide';

    const embed =
        createEmbed(
            title,
            [
                'Welcome to **Blood Moon** — a Slayers 2 community built around progression, PvP and playing together.',
                '',
                '⚔️ **Choose Your Path**',
                'Visit <#' + channels.slayers2 + '> and choose **Slayer** or **Demon**.',
                '',
                '🌙 **Progression**',
                'Chat, earn XP, level up and unlock achievements and titles.',
                '',
                '🏆 **Ranks**',
                'Your path determines your ranks. Higher ranks are earned through progression and trials.',
                '',
                '🏯 **Dojo**',
                'Use the Dojo for PvP, training and challenges.',
                '',
                '🎫 **Need Help?**',
                'Use <#' + channels.openTicket + '> to open a private support ticket.',
                '',
                '*Choose your path. Grow stronger. Rise beneath the Blood Moon.*'
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
    publishMoonGuide
};
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

async function publishSupportGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.supportGuide
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Support Guide channel could not be found.'
        );
    }

    const title =
        '📜 Support Guide';

    const embed =
        createEmbed(
            title,
            [
                'Need help in **Blood Moon**? Use the ticket system to contact the staff team privately.',
                '',
                '🛟 **Support**',
                'General questions or server-related help.',
                '',
                '🚨 **Report**',
                'Report a member, rule violation or other problem.',
                '',
                '⚖️ **Appeal**',
                'Appeal a moderation action.',
                '',
                '📜 **Other**',
                'Use this when your request does not fit another category.',
                '',
                'Open your ticket in <#' + channels.openTicket + '>.',
                '',
                '*Please explain your issue clearly and wait patiently for staff.*'
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
    publishSupportGuide
};
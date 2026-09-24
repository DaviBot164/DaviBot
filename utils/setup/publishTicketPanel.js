const channels =
    require('../../config/channels');

const brand =
    require('../../config/brand');

const {
    createEmbed
} = require('../embeds');

const {
    buildTicketPanelComponents
} = require('../ticketComponents');

const {
    publishSetupMessage
} = require('./publishSetupMessage');

async function publishTicketPanel(guild) {
    const channel =
        guild.channels.cache.get(
            channels.openTicket
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Ticket channel could not be found.'
        );
    }

    const title =
        '🎫 Blood Moon Support';

    const embed =
        createEmbed(
            title,
            [
                'Need help beneath the Blood Moon?',
                '',
                'Open a private ticket and choose the category that best matches your request.',
                '',
                '🛟 **Support** — General help',
                '🚨 **Report** — Report a member or problem',
                '⚖️ **Appeal** — Appeal a moderation action',
                '📜 **Other** — Anything else',
                '',
                '*Please open a ticket only when needed.*'
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
            ],
            components:
                buildTicketPanelComponents()
        },
        title
    );
}

module.exports = {
    publishTicketPanel
};
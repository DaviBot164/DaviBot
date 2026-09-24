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

async function publishVerificationGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.verification
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Verification channel could not be found.'
        );
    }

    const title =
        '⛩️ Blood Moon Verification';

    const embed =
        createEmbed(
            title,
            [
                'Verify your Roblox account through **Bloxlink** to enter Blood Moon.',
                '',
                '**How to Verify**',
                '1. Use the Bloxlink verification button or command below.',
                '2. Complete the Roblox verification process.',
                '3. Return to Blood Moon once verification is complete.',
                '',
                'After verification, visit <#' + channels.slayers2 + '> to choose your **Slayer** or **Demon** path.',
                '',
                '*Verification helps keep Blood Moon secure and organized.*'
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
    publishVerificationGuide
};
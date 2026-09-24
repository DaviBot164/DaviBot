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

async function publishSacredLaws(guild) {
    const channel =
        guild.channels.cache.get(
            channels.sacredLaws
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Sacred Laws channel could not be found.'
        );
    }

    const title =
        '📜 Sacred Laws';

    const embed =
        createEmbed(
            title,
            [
                '**1. Respect Everyone**',
                'Treat others with respect. Harassment, discrimination and unnecessary toxicity are not allowed.',
                '',
                '**2. No Spam**',
                'Avoid spam, excessive mentions and disruptive behavior.',
                '',
                '**3. Keep Content Appropriate**',
                'No NSFW, disturbing or intentionally offensive content.',
                '',
                '**4. Use Channels Properly**',
                'Keep conversations and posts in the appropriate channels.',
                '',
                '**5. No Scams or Malicious Links**',
                'Scams, phishing, suspicious downloads and harmful links are prohibited.',
                '',
                '**6. Follow Staff Instructions**',
                'Respect moderation decisions. Use support or appeals if you disagree.',
                '',
                '*Use common sense and help keep Blood Moon enjoyable for everyone.*'
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
    publishSacredLaws
};
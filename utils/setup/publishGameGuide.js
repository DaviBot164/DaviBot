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

async function publishGameGuide(guild) {
    const channel =
        guild.channels.cache.get(
            channels.guides
        );

    if (!channel?.isTextBased()) {
        throw new Error(
            'Guides channel could not be found.'
        );
    }

    const title =
        '🗺️ Slayers 2 Guide Directory';

    const embed =
        createEmbed(
            title,
            [
                'Your starting point for **Slayers 2** knowledge, builds and progression.',
                '',
                '⚔️ **SLAYER GUIDES**',
                'Slayer builds, equipment and progression advice.',
                '',
                '🩸 **DEMON GUIDES**',
                'Demon builds, progression and combat advice.',
                '',
                '🌊 **BREATHING STYLES**',
                'Information, comparisons and tips for Breathing Styles.',
                '',
                '🌙 **DEMON ARTS**',
                'Information and tips for Demon Arts.',
                '',
                '🗡️ **WEAPONS & BUILDS**',
                'Weapons, stats and build combinations.',
                '',
                '👹 **BOSSES & COMBAT**',
                'Boss encounters, combat tips and useful strategies.',
                '',
                '📈 **LEVELING & PROGRESSION**',
                'Leveling routes and ways to progress efficiently.',
                '',
                '💰 **FARMING**',
                'Useful farming methods, materials and resources.',
                '',
                '🔎 **NEED A TEAM?**',
                'Use the party-finder channel when you need other players.',
                '',
                '*This directory will grow as Blood Moon discovers more of Slayers 2.*'
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
    publishGameGuide
};
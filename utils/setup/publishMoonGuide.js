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
        '📖 Blood Moon Guide';

    const embed =
        createEmbed(
            title,
            [
                'Welcome to **Blood Moon**, a Slayers 2 community built around progression, PvP and the Slayer vs Demon world.',
                '',
                '⛩️ **BEGIN YOUR JOURNEY**',
                'Complete verification, then choose your path as a **Slayer** or **Demon**.',
                `Choose your path in <#${channels.slayers2}>.`,
                '',
                '🌙 **LEVEL & PROGRESS**',
                'Stay active in the server to earn XP, gain levels and progress through your faction ranks.',
                '',
                '⚔️ **RANKS**',
                'Slayers and Demons follow separate rank paths.',
                'Normal ranks are earned automatically at their required levels, while elite ranks require more.',
                '',
                '🔥 **ELITE RANKS**',
                '**Hashira** and **Upper Moon** are not automatic promotions.',
                'Reach Level 50+ and prove yourself through Trials or staff promotion.',
                '',
                '🏆 **ACHIEVEMENTS**',
                'Complete milestones across Blood Moon to unlock achievements and rise through Achievement Ranks.',
                '',
                '✨ **TITLES**',
                'Earn collectible titles through activity, progression and accomplishments.',
                'Unlocked titles can be equipped through Akane.',
                '',
                '🏯 **DOJO & COMMUNITY**',
                'Train, challenge other members, discuss Slayers 2 and find people to play with.',
                '',
                '🎫 **SUPPORT**',
                `Need help? Read the support guide and open a private ticket in <#${channels.openTicket}>.`,
                '',
                '🎭 **LEARN MORE**',
                `View the complete role hierarchy in <#${channels.roles}>.`,
                `Slayer progression: <#${channels.slayerPath}>`,
                `Demon progression: <#${channels.demonPath}>`,
                '',
                '*Choose your path. Build your legacy beneath the Blood Moon.*'
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
const {
    EmbedBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

const WELCOME_BANNER_NAME =
    'welcome-banner.png';

const WELCOME_EMBED_COLOR =
    '#B026FF';

/**
 * Create the THE Ⅹ SINS
 * Welcome Embed.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {EmbedBuilder}
 */
function createWelcomeEmbed(
    member
) {
    const botAvatar =
        member.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const memberAvatar =
        member.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const verifyChannel =
        member.guild.channels.cache.get(
            channels.verifyChannelId
        );

    const verificationText =
        verifyChannel?.isTextBased()
            ? `Verify in ${verifyChannel} to unlock the server.`
            : 'Complete verification to unlock the server.';

    return new EmbedBuilder()
        .setColor(
            WELCOME_EMBED_COLOR
        )

        .setAuthor({
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                botAvatar
        })

        .setDescription(
            [
                `Welcome, ${member}.`,
                '',
                verificationText
            ].join('\n')
        )

        .setThumbnail(
            memberAvatar
        )

        .setImage(
            `attachment://${WELCOME_BANNER_NAME}`
        )

        .setFooter({
            text:
                'THE Ⅹ SINS • Welcome'
        })

        .setTimestamp();
}

module.exports = {
    WELCOME_BANNER_NAME,
    WELCOME_EMBED_COLOR,
    createWelcomeEmbed
};
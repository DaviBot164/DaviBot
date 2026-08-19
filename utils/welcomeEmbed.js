const {
    EmbedBuilder
} = require('discord.js');

const brand =
    require('../config/brand');

const channels =
    require('../config/channels');

const WELCOME_BANNER_NAME =
    'welcome-banner.png';

const WELCOME_EMBED_COLOR =
    brand.themeColor;

/**
 * Create the Lunar Seireitei
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
            ? `Verify in ${verifyChannel} to enter Soul Society as a **Soul Reaper**.`
            : 'Complete verification to enter Soul Society as a **Soul Reaper**.';

    return new EmbedBuilder()
        .setColor(
            WELCOME_EMBED_COLOR
        )

        .setAuthor({
            name:
                `${brand.botName} • ${brand.serverName}`,

            iconURL:
                botAvatar
        })

        .setDescription(
            [
                `Welcome to **${brand.serverName}**, ${member}.`,
                '',
                'You have arrived as a **Wandering Soul**.',
                verificationText,
                '',
                `*${brand.motto}*`
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
                `${brand.serverName} • Welcome`
        })

        .setTimestamp();
}

module.exports = {
    WELCOME_BANNER_NAME,
    WELCOME_EMBED_COLOR,
    createWelcomeEmbed
};
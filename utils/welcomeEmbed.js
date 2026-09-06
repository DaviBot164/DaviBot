const {
    EmbedBuilder
} = require('discord.js');

const brand =
    require('../config/brand');

const {
    getGuildProfile
} = require('../config/guildProfiles');

const WELCOME_EMBED_COLOR =
    brand.themeColor;

function getWelcomeBannerName(
    guildId
) {
    return (
        getGuildProfile(guildId)
            .assets
            .welcomeBannerName ??
        null
    );
}

/**
 * Create a server-aware Welcome Embed.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {EmbedBuilder}
 */
function createWelcomeEmbed(
    member
) {
    const profile =
        getGuildProfile(
            member.guild.id
        );

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
            profile.channels
                .verifyChannelId
        );

    const verifiedName =
        profile.roles
            .verifiedName;

    const unverifiedName =
        profile.roles
            .unverifiedName;

    const verificationText =
        verifyChannel?.isTextBased()
            ? `Verify in ${verifyChannel} to enter **${profile.shortName}** as **${verifiedName}**.`
            : `Complete verification to enter **${profile.shortName}** as **${verifiedName}**.`;

    const embed =
        new EmbedBuilder()
            .setColor(
                profile.themeColor
            )

            .setAuthor({
                name:
                    `${profile.botName} • ${profile.serverName}`,

                iconURL:
                    botAvatar
            })

            .setDescription(
                [
                    `Welcome to **${profile.serverName}**, ${member}.`,
                    '',
                    `You have arrived as a **${unverifiedName}**.`,
                    verificationText,
                    '',
                    `*${profile.motto}*`
                ].join('\n')
            )

            .setThumbnail(
                memberAvatar
            )

            .setFooter({
                text:
                    `${profile.serverName} • Welcome`
            })

            .setTimestamp();

    const bannerName =
        getWelcomeBannerName(
            member.guild.id
        );

    if (
        bannerName
    ) {
        embed.setImage(
            `attachment://${bannerName}`
        );
    }

    return embed;
}

module.exports = {
    WELCOME_EMBED_COLOR,
    getWelcomeBannerName,
    createWelcomeEmbed
};
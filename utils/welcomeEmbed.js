const {
    EmbedBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

/**
 * Name used for the Welcome banner attachment.
 */
const WELCOME_BANNER_NAME =
    'welcome-banner.png';

/**
 * Create the Umbra Welcome embed.
 *
 * The banner image is attached inside:
 * - events/guildMemberAdd.js
 * - commands/information/testwelcome.js
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {EmbedBuilder}
 */
function createWelcomeEmbed(
    member
) {
    const guild =
        member.guild;

    const serverIcon =
        guild.iconURL({
            extension:
                'png',

            size:
                512,

            forceStatic:
                false
        }) ||
        undefined;

    const memberAvatar =
        member.user
            .displayAvatarURL({
                extension:
                    'png',

                size:
                    512,

                forceStatic:
                    false
            });

    const botAvatar =
        member.client.user
            .displayAvatarURL({
                extension:
                    'png',

                size:
                    256,

                forceStatic:
                    false
            });

    const joinedTimestamp =
        Math.floor(
            Date.now() /
            1_000
        );

    const verifyChannel =
        guild.channels.cache.get(
            channels.verifyChannelId
        );

    const verificationText =
        verifyChannel &&
        verifyChannel.isTextBased()
            ? `Complete verification in ${verifyChannel} to enter Las Noches.`
            : 'Complete verification to enter Las Noches.';

    const arrivalNumber =
        guild.memberCount;

    return new EmbedBuilder()
        .setColor(
            '#6F42C1'
        )

        .setAuthor({
            name:
                `${guild.name} • New Arrival`,

            iconURL:
                serverIcon
        })

        .setTitle(
            '🌙 A Soul Has Entered Las Noches'
        )

        .setDescription(
            [
                `Welcome, ${member}.`,
                '',
                `**${verificationText}**`
            ].join(
                '\n'
            )
        )

        .addFields({
            name:
                '📜 Arrival Record',

            value:
                [
                    `👤 **Soul:** ${member}`,
                    `🏅 **Number:** \`#${arrivalNumber}\``,
                    `🕒 **Joined:** <t:${joinedTimestamp}:R>`
                ].join(
                    '\n'
                ),

            inline:
                false
        })

        .setThumbnail(
            memberAvatar
        )

        .setImage(
            `attachment://${WELCOME_BANNER_NAME}`
        )

        .setFooter({
            text:
                'Umbra • Guardian of Las Noches',

            iconURL:
                botAvatar
        })

        .setTimestamp();
}

module.exports = {
    WELCOME_BANNER_NAME,
    createWelcomeEmbed
};
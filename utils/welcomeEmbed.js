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
 * Cold silver tone matching the
 * current Las Noches welcome banner.
 */
const WELCOME_EMBED_COLOR =
    '#C8CDD4';

/**
 * Create the Umbra Welcome Embed.
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

    const accountCreatedTimestamp =
        Math.floor(
            member.user.createdTimestamp /
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
            WELCOME_EMBED_COLOR
        )

        .setAuthor({
            name:
                'Umbra • Arrival Record',

            iconURL:
                botAvatar ||
                serverIcon
        })

        .setTitle(
            '🌙 A New Soul Has Arrived'
        )

        .setDescription(
            [
                `Welcome, ${member}.`,
                '',
                'Beyond these gates begins your journey.',
                '',
                `**${verificationText}**`,
                '',
                '*Every Soul leaves a mark.*'
            ].join(
                '\n'
            )
        )

        .addFields(
            {
                name:
                    '👤 Soul',

                value:
                    `${member}`,

                inline:
                    true
            },
            {
                name:
                    '📜 Arrival',

                value:
                    `\`#${arrivalNumber}\``,

                inline:
                    true
            },
            {
                name:
                    '🕒 Joined',

                value:
                    `<t:${joinedTimestamp}:R>`,

                inline:
                    true
            },
            {
                name:
                    '📅 Account Created',

                value:
                    [
                        `<t:${accountCreatedTimestamp}:D>`,
                        `<t:${accountCreatedTimestamp}:R>`
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            }
        )

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
    WELCOME_EMBED_COLOR,
    createWelcomeEmbed
};
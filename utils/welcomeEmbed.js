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
 * events/guildMemberAdd.js
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
            '#F2F2F2'
        )

        .setAuthor({
            name:
                `${guild.name} • New Arrival`,

            iconURL:
                serverIcon
        })

        .setTitle(
            `🏰 Arrival #${arrivalNumber} Has Entered Las Noches`
        )

        .setDescription(
            [
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `Welcome, ${member}.`,
                '',
                'A new presence has crossed the white sands of Hueco Mundo.',
                `The gates of **${guild.name}** now stand before you.`,
                '',
                `**${verificationText}**`,
                '',
                'Once verified, explore the fortress, meet its Arrancar, and begin your ascent.',
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Every arrival leaves a trace within the halls of Las Noches.*'
            ].join(
                '\n'
            )
        )

        .addFields(
            {
                name:
                    '📜 Arrival Record',

                value:
                    [
                        `👤 **Arrival:** ${member}`,
                        `🏅 **Record Number:** \`#${arrivalNumber}\``,
                        `🕒 **Entered:** <t:${joinedTimestamp}:R>`
                    ].join(
                        '\n'
                    ),

                inline:
                    false
            },
            {
                name:
                    '🌙 First Directive',

                value:
                    [
                        'Complete verification.',
                        'Read the laws of Las Noches.',
                        'Choose your path and begin your progression.'
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
    createWelcomeEmbed
};
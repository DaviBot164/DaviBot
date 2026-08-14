const {
    EmbedBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

/**
 * Welcome banner attachment name.
 */
const WELCOME_BANNER_NAME =
    'welcome-banner.png';

/**
 * THE Ⅹ SINS signature color.
 */
const WELCOME_EMBED_COLOR =
    '#5B3A78';

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
    const guild =
        member.guild;

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

    const verifyChannel =
        guild.channels.cache.get(
            channels.verifyChannelId
        );

    const verificationText =
        verifyChannel &&
        verifyChannel.isTextBased()
            ? `Begin your oath in ${verifyChannel}.`
            : 'Begin your oath through verification.';

    return new EmbedBuilder()
        .setColor(
            WELCOME_EMBED_COLOR
        )

        .setAuthor({
            name:
                'THE Ⅹ SINS',

            iconURL:
                botAvatar
        })

        .setTitle(
            'Ⅹ・NEW ARRIVAL'
        )

        .setDescription(
            [
                `Welcome, ${member}.`,
                '',
                verificationText
            ].join(
                '\n'
            )
        )

        .setThumbnail(
            memberAvatar
        )

        .setImage(
            `attachment://${WELCOME_BANNER_NAME}`
        )

        .setFooter({
            text:
                'The Ten are ranked. Dominion is not.',

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
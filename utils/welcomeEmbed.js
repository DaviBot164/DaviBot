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
            ? `Complete verification in ${verifyChannel} to enter the Order.`
            : 'Complete verification to enter the Order.';

    const soulNumber =
        guild.memberCount;

    return new EmbedBuilder()
        .setColor(
            '#8B0000'
        )

        .setAuthor({
            name:
                `${guild.name} • New Arrival`,

            iconURL:
                serverIcon
        })

        .setTitle(
            `🌑 Soul #${soulNumber} Has Arrived`
        )

        .setDescription(
            [
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `Welcome, ${member}.`,
                '',
                'A new Soul has stepped beneath the Crimson Moon.',
                `Your journey through **${guild.name}** begins now.`,
                '',
                `**${verificationText}**`,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                '*The Order grows stronger beneath the crimson moon.*'
            ].join(
                '\n'
            )
        )

        .addFields(
            {
                name:
                    '👤 Soul Record',

                value:
                    [
                        `🌑 **Soul:** ${member}`,
                        `🏅 **Number:** \`#${soulNumber}\``,
                        `📅 **Joined:** <t:${joinedTimestamp}:R>`
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
                'Umbra • Guardian of Crimson Eclipse',

            iconURL:
                botAvatar
        })

        .setTimestamp();
}

module.exports = {
    WELCOME_BANNER_NAME,
    createWelcomeEmbed
};
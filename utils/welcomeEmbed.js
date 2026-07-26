const {
    EmbedBuilder
} = require('discord.js');

/**
 * Create the Umbra welcome embed.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {EmbedBuilder}
 */
function createWelcomeEmbed(member) {
    const guild = member.guild;

    const serverIcon =
        guild.iconURL({
            extension: 'png',
            size: 512
        }) || undefined;

    const memberAvatar =
        member.user.displayAvatarURL({
            extension: 'png',
            size: 512
        });

    const botAvatar =
        member.client.user.displayAvatarURL({
            extension: 'png',
            size: 256
        });

    const joinedTimestamp =
        Math.floor(Date.now() / 1_000);

    /*
     * Find the verification channel.
     */
    const verifyChannel =
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                channel.name === '⛩️・verify'
        );

    const verificationText =
        verifyChannel
            ? `Complete verification in ${verifyChannel} to enter the Order.`
            : 'Complete verification to enter the Order.';

    return new EmbedBuilder()
        /*
         * Crimson Eclipse theme.
         */
        .setColor('#8B0000')

        .setAuthor({
            name: guild.name,
            iconURL: serverIcon
        })

        .setTitle('🌑 A New Soul Has Arrived')

        .setDescription(
            [
                `Umbra welcomes ${member} to **${guild.name}**.`,
                '',
                'May your strength guide your path beneath the crimson moon.',
                '',
                `**${verificationText}**`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━'
            ].join('\n')
        )

        .addFields(
            {
                name: '📜 Your First Steps',
                value: [
                    '• Complete verification',
                    '• Read the Sacred Laws',
                    '• Explore the community'
                ].join('\n'),
                inline: true
            },
            {
                name: '⚔️ The Order',
                value: [
                    '• Respect every Soul',
                    '• Support the community',
                    '• Forge your legacy'
                ].join('\n'),
                inline: true
            },
            {
                name: '👤 Soul Information',
                value: [
                    `**Soul:** ${member}`,
                    `**Soul Number:** #${guild.memberCount}`,
                    `**Joined:** <t:${joinedTimestamp}:R>`
                ].join('\n'),
                inline: false
            }
        )

        .setThumbnail(memberAvatar)

        .setFooter({
            text: 'Umbra • Guardian of Crimson Eclipse',
            iconURL: botAvatar
        })

        .setTimestamp();
}

module.exports = {
    createWelcomeEmbed
};
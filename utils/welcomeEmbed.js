const {
    EmbedBuilder
} = require('discord.js');

const embedConfig = require('../config/embed');

/**
 * Create the Seraphiel welcome embed.
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
        Math.floor(Date.now() / 1000);

    return new EmbedBuilder()
        /*
         * Seraphiel ice-blue theme.
         */
        .setColor('#6EC6FF')

        .setAuthor({
            name: guild.name,
            iconURL: serverIcon
        })

        .setTitle(
            '🐉 Seraphiel Welcomes a New Traveler'
        )

        .setDescription(
            [
                `Welcome to **${guild.name}**, ${member}!`,
                '',
                'The Guardian Dragon watches over this realm.',
                'Respect the rules, meet the community,',
                'and begin your journey.',
                '',
                '━━━━━━━━━━━━━━━━━━━━━━'
            ].join('\n')
        )

        .addFields(
            {
                name: '📜 Server Guide',
                value: [
                    '• Read the server rules',
                    '• Complete verification',
                    '• Choose your roles',
                    '• Explore the community'
                ].join('\n'),
                inline: true
            },
            {
                name: '⚔️ Your Journey',
                value: [
                    '• Join server events',
                    '• Meet other members',
                    '• Rise through the ranks',
                    '• Build your legacy'
                ].join('\n'),
                inline: true
            },
            {
                name: '👥 Member Information',
                value: [
                    `**Member:** ${member}`,
                    `**Member Number:** #${guild.memberCount}`,
                    `**Joined:** <t:${joinedTimestamp}:R>`
                ].join('\n'),
                inline: false
            }
        )

        .setThumbnail(memberAvatar)

        .setFooter({
            text:
                `${embedConfig.footer.text} • ` +
                'Seraphiel Welcome System',
            iconURL: botAvatar
        })

        .setTimestamp();
}

module.exports = {
    createWelcomeEmbed
};
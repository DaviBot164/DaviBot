const {
    ChannelType
} = require('discord.js');

const {
    createEmbed
} = require('../utils/embeds');

/**
 * Find the Guardian log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} channelName
 * @returns {import('discord.js').TextChannel|null}
 */
function findLogChannel(guild, channelName) {
    return guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildText &&
        channel.name === channelName
    ) || null;
}

/**
 * Send a Guardian action log.
 *
 * @param {Object} options
 * @param {import('discord.js').Message} options.message
 * @param {string} options.reason
 * @param {string} options.action
 * @param {number} options.violationCount
 * @param {string} options.logChannelName
 * @returns {Promise<void>}
 */
async function sendGuardianLog({
    message,
    reason,
    action,
    violationCount,
    logChannelName
}) {
    const logChannel = findLogChannel(
        message.guild,
        logChannelName
    );

    if (!logChannel) {
        return;
    }

    const embed = createEmbed({
        title: '🛡️ Guardian Report',
        color: '#ED4245',
        thumbnail: message.author.displayAvatarURL({
            size: 256
        }),
        fields: [
            {
                name: '👤 User',
                value:
                    `${message.author.tag}\n` +
                    `\`${message.author.id}\``,
                inline: true
            },
            {
                name: '📺 Channel',
                value:
                    `${message.channel}\n` +
                    `\`${message.channel.id}\``,
                inline: true
            },
            {
                name: '🚨 Reason',
                value: reason,
                inline: false
            },
            {
                name: '⚙️ Action',
                value: action,
                inline: true
            },
            {
                name: '📊 Violations',
                value: String(violationCount),
                inline: true
            },
            {
                name: '💬 Message',
                value:
                    message.content
                        ? `\`\`\`${message.content.slice(0, 900)}\`\`\``
                        : '*No text content*',
                inline: false
            }
        ]
    });

    try {
        await logChannel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Guardian log:'
        );
        console.error(error);
    }
}

module.exports = {
    sendGuardianLog
};
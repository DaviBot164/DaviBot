const {
    ChannelType
} = require('discord.js');

const {
    createEmbed
} = require('../utils/embeds');

/**
 * Find Umbra's moderation log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} channelName
 * @returns {import('discord.js').TextChannel|null}
 */
function findLogChannel(
    guild,
    channelName
) {
    return (
        guild.channels.cache.find(
            channel =>
                channel.type ===
                    ChannelType.GuildText &&
                channel.name ===
                    channelName
        ) || null
    );
}

/**
 * Send an Umbra Guardian action log.
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
    const logChannel =
        findLogChannel(
            message.guild,
            logChannelName
        );

    if (!logChannel) {
        console.warn(
            `⚠️ Umbra log channel "${logChannelName}" was not found in ${message.guild.name}.`
        );

        return;
    }

    const embed = createEmbed({
        title: '🌑 Umbra Guardian Report',

        color: '#D7263D',

        thumbnail:
            message.author.displayAvatarURL({
                extension: 'png',
                size: 256
            }),

        description:
            [
                'A disturbance was detected within the Order.',
                '',
                'Umbra has recorded the violation beneath the crimson moon.'
            ].join('\n'),

        fields: [
            {
                name: '🌑 Soul',
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
                name: '🚨 Violation',
                value:
                    reason ||
                    'No violation reason was provided.',
                inline: false
            },
            {
                name: '🛡️ Guardian Action',
                value:
                    action ||
                    'No action was recorded.',
                inline: true
            },
            {
                name: '📊 Violation Count',
                value:
                    `\`${violationCount}\``,
                inline: true
            },
            {
                name: '💬 Detected Message',
                value:
                    message.content
                        ? `\`\`\`${message.content.slice(
                            0,
                            900
                        )}\`\`\``
                        : '*No text content was detected.*',
                inline: false
            }
        ]
    });

    try {
        await logChannel.send({
            embeds: [embed]
        });

        console.log(
            `✅ Umbra Guardian log sent for ${message.author.tag}.`
        );
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra Guardian log:'
        );

        console.error(error);
    }
}

module.exports = {
    sendGuardianLog
};
const { EmbedBuilder } = require('discord.js');

const channels = require('../config/channels');
const embedConfig = require('../config/embed');

/**
 * Sends a moderation log message to the configured mod-logs channel.
 *
 * @param {Object} options
 * @param {import('discord.js').Guild} options.guild
 * @param {string} options.action
 * @param {import('discord.js').User} options.user
 * @param {import('discord.js').User} options.moderator
 * @param {string} [options.reason]
 * @param {Array} [options.fields]
 */
async function sendModLog({
    guild,
    action,
    user,
    moderator,
    reason = 'No reason provided.',
    fields = []
}) {
    try {
        if (!guild) {
            console.warn('⚠️ Moderation log skipped: Guild was not provided.');
            return false;
        }

        const logChannelId = channels.modLogs;

        if (!logChannelId) {
            console.warn('⚠️ Moderation log skipped: modLogs channel ID is missing.');
            return false;
        }

        const logChannel =
            guild.channels.cache.get(logChannelId) ||
            await guild.channels.fetch(logChannelId).catch(() => null);

        if (!logChannel) {
            console.warn(
                `⚠️ Moderation log channel was not found in ${guild.name}.`
            );

            return false;
        }

        if (!logChannel.isTextBased()) {
            console.warn('⚠️ Moderation log channel is not a text channel.');
            return false;
        }

        const logEmbed = new EmbedBuilder()
            .setColor(embedConfig.colors.moderation)
            .setTitle(action)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '👤 User',
                    value:
                        `${user.tag}\n` +
                        `\`${user.id}\``,
                    inline: true
                },
                {
                    name: '🛡️ Moderator',
                    value:
                        `${moderator.tag}\n` +
                        `\`${moderator.id}\``,
                    inline: true
                },
                {
                    name: '📝 Reason',
                    value: reason,
                    inline: false
                }
            )
            .setFooter({
                text: embedConfig.footer.text
            })
            .setTimestamp();

        if (Array.isArray(fields) && fields.length > 0) {
            logEmbed.addFields(fields);
        }

        await logChannel.send({
            embeds: [logEmbed]
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to send moderation log:', error);
        return false;
    }
}

module.exports = {
    sendModLog
};
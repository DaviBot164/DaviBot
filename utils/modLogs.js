const {
    EmbedBuilder
} = require('discord.js');

const channels =
    require('../config/channels');

const embedConfig =
    require('../config/embed');

/**
 * Send an Umbra moderation log to the
 * configured moderation-log channel.
 *
 * Supports both:
 * - Member moderation actions
 * - Channel moderation actions
 *
 * @param {Object} options
 * @param {import('discord.js').Guild} options.guild
 * @param {string} options.action
 * @param {import('discord.js').User} [options.user]
 * @param {import('discord.js').User} options.moderator
 * @param {import('discord.js').GuildBasedChannel} [options.channel]
 * @param {string} [options.reason]
 * @param {Array} [options.fields]
 * @returns {Promise<boolean>}
 */
async function sendModLog({
    guild,
    action,
    user = null,
    moderator,
    channel = null,
    reason = 'No reason was provided.',
    fields = []
}) {
    try {
        if (!guild) {
            console.warn(
                '⚠️ Umbra moderation log skipped: Guild was not provided.'
            );

            return false;
        }

        if (!action) {
            console.warn(
                '⚠️ Umbra moderation log skipped: Action was not provided.'
            );

            return false;
        }

        if (!moderator) {
            console.warn(
                '⚠️ Umbra moderation log skipped: Moderator was not provided.'
            );

            return false;
        }

        const logChannelId =
            channels.modLogs;

        if (!logChannelId) {
            console.warn(
                '⚠️ Umbra moderation log skipped: modLogs channel ID is missing.'
            );

            return false;
        }

        const logChannel =
            guild.channels.cache.get(
                logChannelId
            ) ||
            await guild.channels
                .fetch(logChannelId)
                .catch(() => null);

        if (!logChannel) {
            console.warn(
                `⚠️ Umbra moderation log channel was not found in ${guild.name}.`
            );

            return false;
        }

        if (!logChannel.isTextBased()) {
            console.warn(
                '⚠️ Umbra moderation log channel is not text-based.'
            );

            return false;
        }

        const logEmbed =
            new EmbedBuilder()
                .setColor(
                    embedConfig.colors.moderation
                )

                .setAuthor({
                    name:
                        'Umbra • Guardian of Crimson Eclipse',

                    iconURL:
                        guild.client.user
                            .displayAvatarURL({
                                size: 128,
                                forceStatic: false
                            })
                })

                .setTitle(
                    action
                )

                .setDescription(
                    'Umbra has recorded a moderation action within the Order.'
                )

                .setFooter({
                    text:
                        embedConfig.footer.text
                })

                .setTimestamp();

        if (user) {
            logEmbed.setThumbnail(
                user.displayAvatarURL({
                    size: 256,
                    forceStatic: false
                })
            );

            logEmbed.addFields({
                name:
                    '🌑 Soul',

                value:
                    `${user.tag}\n` +
                    `\`${user.id}\``,

                inline:
                    true
            });
        }

        if (channel) {
            logEmbed.addFields({
                name:
                    '📺 Channel',

                value:
                    `${channel}\n` +
                    `\`${channel.id}\``,

                inline:
                    true
            });
        }

        logEmbed.addFields(
            {
                name:
                    '🛡️ Shadow Warden',

                value:
                    `${moderator.tag}\n` +
                    `\`${moderator.id}\``,

                inline:
                    true
            },
            {
                name:
                    '🏰 Order',

                value:
                    `${guild.name}\n` +
                    `\`${guild.id}\``,

                inline:
                    false
            },
            {
                name:
                    '📜 Reason',

                value:
                    reason ||
                    'No reason was provided.',

                inline:
                    false
            }
        );

        if (
            Array.isArray(fields) &&
            fields.length > 0
        ) {
            logEmbed.addFields(
                fields
            );
        }

        await logChannel.send({
            embeds: [
                logEmbed
            ]
        });

        console.log(
            `✅ Umbra moderation log sent in ${guild.name}: ${action}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to send Umbra moderation log:'
        );

        console.error(error);

        return false;
    }
}

module.exports = {
    sendModLog
};
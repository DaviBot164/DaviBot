const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const channels =
    require('../config/channels');

const embedConfig =
    require('../config/embed');

/**
 * Send a moderation log.
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
    reason = 'No reason provided.',
    fields = []
}) {
    try {
        if (
            !guild ||
            typeof action !==
                'string' ||
            !action.trim() ||
            !moderator
        ) {
            return false;
        }

        const logChannelId =
            channels.modLogs;

        if (!logChannelId) {
            console.warn(
                '⚠️ Moderation log channel ID is missing.'
            );

            return false;
        }

        const logChannel =
            guild.channels.cache.get(
                logChannelId
            ) ||
            await guild.channels
                .fetch(
                    logChannelId
                )
                .catch(
                    () => null
                );

        if (
            !logChannel ||
            !logChannel.isTextBased() ||
            logChannel.isThread()
        ) {
            console.warn(
                `⚠️ Moderation log channel is unavailable in ${guild.name}.`
            );

            return false;
        }

        const botMember =
            guild.members.me;

        if (!botMember) {
            return false;
        }

        const permissions =
            logChannel.permissionsFor(
                botMember
            );

        if (
            !permissions?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ])
        ) {
            console.warn(
                `⚠️ Evelynn cannot send moderation logs in #${logChannel.name}.`
            );

            return false;
        }

        const botAvatar =
            guild.client.user
                .displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                });

        const logEmbed =
            new EmbedBuilder()
                .setColor(
                    embedConfig
                        .colors
                        .moderation
                )
                .setAuthor({
                    name:
                        'Evelynn • Moderation',

                    iconURL:
                        botAvatar
                })
                .setTitle(
                    action.trim()
                )
                .setTimestamp();

        if (user) {
            logEmbed.setThumbnail(
                user.displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
            );

            logEmbed.addFields({
                name:
                    '✦・MEMBER',

                value:
                    `${user}\n\`${user.id}\``,

                inline:
                    true
            });
        }

        if (channel) {
            logEmbed.addFields({
                name:
                    '📺・CHANNEL',

                value:
                    `${channel}\n\`${channel.id}\``,

                inline:
                    true
            });
        }

        logEmbed.addFields(
            {
                name:
                    '🛡️・MODERATOR',

                value:
                    `${moderator}\n\`${moderator.id}\``,

                inline:
                    true
            },

            {
                name:
                    '📜・REASON',

                value:
                    reason ||
                    'No reason provided.',

                inline:
                    false
            }
        );

        if (
            Array.isArray(
                fields
            ) &&
            fields.length >
                0
        ) {
            logEmbed.addFields(
                fields
            );
        }

        await logChannel.send({
            embeds: [
                logEmbed
            ],

            allowedMentions: {
                parse:
                    []
            }
        });

        console.log(
            `✅ Moderation log sent: ${action}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to send moderation log:',
            error
        );

        return false;
    }
}

module.exports = {
    sendModLog
};
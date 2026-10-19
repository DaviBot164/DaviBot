const {
    AuditLogEvent,
    EmbedBuilder
} = require('discord.js');

const channels = require('../config/channels');
const brand = require('../config/brand');

const MODERATION_ACTIONS = new Set([
    AuditLogEvent.MemberKick,
    AuditLogEvent.MemberPrune,
    AuditLogEvent.MemberBanAdd,
    AuditLogEvent.MemberBanRemove,
    AuditLogEvent.MemberDisconnect,
    AuditLogEvent.AutoModerationBlockMessage,
    AuditLogEvent.AutoModerationFlagToChannel,
    AuditLogEvent.AutoModerationUserCommunicationDisabled
]);

function shorten(value, limit = 1000) {
    const text = String(value ?? '').trim();

    return text.length > limit
        ? `${text.slice(0, limit - 3)}...`
        : text;
}

function isLogChannel(channelId) {
    return [
        channels.staffLogs,
        channels.moderation
    ].includes(channelId);
}

async function sendLog(guild, embed, channelId = channels.staffLogs) {
    try {
        const channel = await guild.channels.fetch(channelId);

        if (!channel?.isTextBased() || typeof channel.send !== 'function') {
            throw new Error(`Log channel unavailable: ${channelId}`);
        }

        embed
            .setFooter({ text: brand.footer })
            .setTimestamp();

        await channel.send({
            embeds: [embed],
            allowedMentions: { parse: [] }
        });
    } catch (error) {
        console.error('Server log failed:', error);
    }
}

function messageText(message) {
    const parts = [];

    if (message.content) parts.push(message.content);

    for (const embed of message.embeds ?? []) {
        if (embed.title) parts.push(embed.title);
        if (embed.description) parts.push(embed.description);
    }

    return shorten(parts.join('\n'))
        || 'Text unavailable or no text content.';
}

async function logMessageDelete(message) {
    if (!message.guild || isLogChannel(message.channelId)) return;

    const embed = new EmbedBuilder()
        .setColor('#9B1C31')
        .setTitle('🗑️ Message Deleted')
        .addFields(
            {
                name: 'Author',
                value: message.author
                    ? `<@${message.author.id}> • ${message.author.id}`
                    : 'Unavailable'
            },
            {
                name: 'Channel',
                value: `<#${message.channelId}>`
            },
            {
                name: 'Message ID',
                value: message.id
            },
            {
                name: 'Content',
                value: messageText(message)
            },
            {
                name: 'Executor',
                value: 'Not established for this message.'
            }
        );

    if (message.attachments?.size) {
        embed.addFields({
            name: 'Attachments',
            value: shorten(
                [...message.attachments.values()]
                    .map(file => file.name || file.id)
                    .join('\n')
            )
        });
    }

    await sendLog(message.guild, embed);
}

async function logBulkDelete(messages, channel) {
    if (!channel.guild || isLogChannel(channel.id)) return;

    const sample = [...messages.values()]
        .slice(0, 6)
        .map(message =>
            `${message.author?.tag ?? 'Unknown author'} • ${message.id}\n` +
            shorten(messageText(message), 120)
        )
        .join('\n\n');

    const embed = new EmbedBuilder()
        .setColor('#9B1C31')
        .setTitle('🧹 Messages Bulk Deleted')
        .addFields(
            {
                name: 'Channel',
                value: `<#${channel.id}>`
            },
            {
                name: 'Deleted Messages',
                value: String(messages.size)
            },
            {
                name: 'Content Sample',
                value: shorten(sample) || 'Unavailable'
            },
            {
                name: 'Executor',
                value: 'See the separate Audit Log entry.'
            }
        );

    await sendLog(channel.guild, embed);
}

async function logMessageUpdate(before, after) {
    if (
        !after.guild ||
        isLogChannel(after.channelId) ||
        after.author?.bot ||
        typeof after.content !== 'string' ||
        before.content === after.content
    ) {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#C8A45D')
        .setTitle('✏️ Message Edited')
        .addFields(
            {
                name: 'Author',
                value: after.author
                    ? `<@${after.author.id}> • ${after.author.id}`
                    : 'Unavailable'
            },
            {
                name: 'Channel',
                value: `<#${after.channelId}>`
            },
            {
                name: 'Before',
                value: typeof before.content === 'string'
                    ? shorten(before.content) || 'No text content.'
                    : 'Previous content was not cached.'
            },
            {
                name: 'After',
                value: shorten(after.content) || 'No text content.'
            },
            {
                name: 'Message',
                value: `[Open message](${after.url})`
            }
        );

    await sendLog(after.guild, embed);
}

function formatValue(value) {
    if (value === undefined) return 'Not supplied';
    if (value === null) return 'None';

    return shorten(
        typeof value === 'object' ? JSON.stringify(value) : value,
        180
    ) || 'Empty';
}

async function logAuditEntry(entry, guild) {
    const extra = entry.extra ?? {};
    const channelId = extra.channel?.id ?? extra.channelId;
    const changes = entry.changes ?? [];

    const messageAction = [
        AuditLogEvent.MessageDelete,
        AuditLogEvent.MessageBulkDelete
    ].includes(entry.action);

    if (messageAction && isLogChannel(channelId)) return;

    const timeoutChanged =
        entry.action === AuditLogEvent.MemberUpdate &&
        changes.some(change =>
            change.key === 'communication_disabled_until'
        );

    const moderation = MODERATION_ACTIONS.has(entry.action)
        || timeoutChanged
        || messageAction;

    const executorId = entry.executorId ?? entry.executor?.id;
    const targetId = entry.targetId ?? entry.target?.id;
    const action = AuditLogEvent[entry.action] ?? `Action ${entry.action}`;

    const embed = new EmbedBuilder()
        .setColor(moderation ? '#9B1C31' : '#C8A45D')
        .setTitle(
            moderation
                ? '🛡️ Moderation Audit'
                : '🏯 Server Audit Action'
        )
        .addFields(
            { name: 'Action', value: action },
            {
                name: 'Executor',
                value: executorId
                    ? `<@${executorId}> • ${executorId}`
                    : 'Discord did not supply an executor.'
            },
            {
                name: 'Target',
                value: targetId ? `ID: ${targetId}` : 'Not supplied'
            },
            {
                name: 'Reason',
                value: shorten(entry.reason) || 'No reason supplied.'
            },
            {
                name: 'Audit Entry',
                value: `${entry.id}\n<t:${Math.floor(
                    entry.createdTimestamp / 1000
                )}:F>`
            }
        );

    if (channelId) {
        embed.addFields({
            name: 'Channel',
            value: `<#${channelId}>`
        });
    }

    if (extra.count != null) {
        embed.addFields({
            name: 'Count Reported by Discord',
            value: String(extra.count)
        });
    }

    const changeText = changes
        .filter(change => !/token|secret|password/i.test(change.key))
        .slice(0, 8)
        .map(change =>
            `${change.key}: ${formatValue(change.old)} → ` +
            formatValue(change.new)
        )
        .join('\n');

    if (changeText) {
        embed.addFields({
            name: 'Changes',
            value: shorten(changeText)
        });
    }

    await sendLog(
        guild,
        embed,
        moderation ? channels.moderation : channels.staffLogs
    );
}

async function logAvatarChange(guild, user, oldURL, newURL, server = false) {
    const embed = new EmbedBuilder()
        .setColor('#C8A45D')
        .setTitle(
            server ? '🖼️ Server Avatar Changed' : '🖼️ Account Avatar Changed'
        )
        .setDescription(
            `<@${user.id}> • ${user.id}\n` +
            (server
                ? 'Their avatar for this server was updated.'
                : 'Their account avatar was updated.')
        )
        .addFields(
            {
                name: 'Before',
                value: oldURL
                    ? `[Open previous avatar](${oldURL})`
                    : 'Previous avatar unavailable.'
            },
            {
                name: 'After',
                value: `[Open current avatar](${newURL})`
            }
        )
        .setImage(newURL);

    if (oldURL) embed.setThumbnail(oldURL);

    await sendLog(guild, embed);
}

module.exports = {
    logMessageDelete,
    logBulkDelete,
    logMessageUpdate,
    logAuditEntry,
    logAvatarChange
};
const { recordAction } = require('../utils/logTracking');
const { PermissionFlagsBits } = require('discord.js');
const channels = require('../config/channels');
const { createEmbed } = require('../utils/embeds');
const { createCase } = require('../database/moderationCases');

const ACTION_NAMES = Object.freeze({
    warn: 'Warning',
    unwarn: 'Warning Removed',
    timeout: 'Timeout',
    untimeout: 'Timeout Removed',
    kick: 'Kick',
    ban: 'Ban',
    unban: 'Ban Removed',
    lock: 'Channel Locked',
    unlock: 'Channel Unlocked',
    slowmode: 'Slowmode',
    clear: 'Messages Cleared',
    guardian: 'Guardian',
    emergency: 'Emergency Control'
});

function canModerate(moderator, target) {
    if (!moderator || !target) {
        return {
            allowed: false,
            reason: 'Member information is unavailable.'
        };
    }

    if (moderator.id === target.id) {
        return {
            allowed: false,
            reason: 'You cannot moderate yourself.'
        };
    }

    if (target.id === target.guild.ownerId) {
        return {
            allowed: false,
            reason: 'The server owner cannot be moderated.'
        };
    }

    if (target.id === target.guild.members.me?.id) {
        return {
            allowed: false,
            reason: 'Akane cannot moderate herself.'
        };
    }

    if (
        moderator.id !== moderator.guild.ownerId &&
        moderator.roles.highest.comparePositionTo(
            target.roles.highest
        ) <= 0
    ) {
        return {
            allowed: false,
            reason: 'Your highest role must be above the target member.'
        };
    }

    const botMember = target.guild.members.me;

    if (
        !botMember ||
        botMember.roles.highest.comparePositionTo(
            target.roles.highest
        ) <= 0
    ) {
        return {
            allowed: false,
            reason: 'Akane role must be above the target member.'
        };
    }

    return { allowed: true, reason: null };
}

function hasModerationPermission(member) {
    return Boolean(
        member?.permissions.any([
            PermissionFlagsBits.ModerateMembers,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ManageMessages
        ])
    );
}

function formatDuration(milliseconds) {
    if (milliseconds == null) return null;

    const seconds = Math.floor(milliseconds / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h`;

    return `${Math.floor(hours / 24)}d`;
}

async function sendModerationLog({
    guild,
    moderationCase,
    target = null
}) {
    const channel = await guild.channels.fetch(channels.moderation);

    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
        throw new Error('Moderation log channel is unavailable.');
    }

    const actionName = ACTION_NAMES[moderationCase.action]
        ?? moderationCase.action;

    const details = [
        `Case: **#${moderationCase.id}**`,
        `Action: **${actionName}**`
    ];

    if (moderationCase.userId) {
        const targetText = target
            ? `${target} (\`${moderationCase.userId}\`)`
            : `<@${moderationCase.userId}> (\`${moderationCase.userId}\`)`;

        details.push(`Target: ${targetText}`);
    }

    if (moderationCase.moderatorId) {
        details.push(`Moderator: <@${moderationCase.moderatorId}>`);
    }

    if (moderationCase.channelId) {
        details.push(`Channel: <#${moderationCase.channelId}>`);
    }

    if (moderationCase.durationMs != null) {
        details.push(
            `Duration: **${formatDuration(moderationCase.durationMs)}**`
        );
    }

    if (moderationCase.action === 'clear') {
        details.push(`Deleted: **${moderationCase.metadata?.deleted ?? 'Unknown'}** messages`);
    }

    const reason = String(
        moderationCase.reason || 'No reason provided.'
    ).slice(0, 1500);

    details.push(`Reason: ${reason}`);

    await channel.send({
        embeds: [
            createEmbed('🛡️ Moderation Action', details.join('\n'))
        ],
        allowedMentions: { parse: [] }
    });
}

async function recordModerationAction({
    guild,
    userId = null,
    moderatorId = null,
    action,
    reason = null,
    durationMs = null,
    channelId = null,
    messageId = null,
    metadata = {},
    active = true,
    expiresAt = null,
    target = null,
    log = true
}) {
    const moderationCase = await createCase({
        guildId: guild.id,
        userId,
        moderatorId,
        action,
        reason,
        durationMs,
        channelId,
        messageId,
        metadata,
        active,
        expiresAt
    });

    try {
        if (log) await sendModerationLog({ guild, moderationCase, target });
        recordAction({ guild, userId, action, metadata });
    } catch (error) {
        console.error('Moderation log failed:', error);
    }

    return moderationCase;
}

module.exports = {
    canModerate,
    hasModerationPermission,
    formatDuration,
    sendModerationLog,
    recordModerationAction
};
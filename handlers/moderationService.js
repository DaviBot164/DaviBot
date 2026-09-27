const {
    PermissionFlagsBits
} = require('discord.js');

const channels =
    require('../config/channels');

const {
    createEmbed
} = require('../utils/embeds');

const {
    createCase
} = require('../database/moderationCases');

const ACTION_NAMES =
    Object.freeze({
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

function canModerate(
    moderator,
    target
) {
    if (!moderator || !target) {
        return {
            allowed: false,
            reason:
                'Member information is unavailable.'
        };
    }

    if (moderator.id === target.id) {
        return {
            allowed: false,
            reason:
                'You cannot moderate yourself.'
        };
    }

    if (
        target.id ===
        target.guild.ownerId
    ) {
        return {
            allowed: false,
            reason:
                'The server owner cannot be moderated.'
        };
    }

    if (
        target.user.bot &&
        target.id ===
        target.guild.members.me?.id
    ) {
        return {
            allowed: false,
            reason:
                'Akane cannot moderate herself.'
        };
    }

    if (
        moderator.id !==
            moderator.guild.ownerId &&
        moderator.roles.highest
            .comparePositionTo(
                target.roles.highest
            ) <= 0
    ) {
        return {
            allowed: false,
            reason:
                'Your highest role must be above the target member.'
        };
    }

    const botMember =
        target.guild.members.me;

    if (
        !botMember ||
        botMember.roles.highest
            .comparePositionTo(
                target.roles.highest
            ) <= 0
    ) {
        return {
            allowed: false,
            reason:
                'Akane role must be above the target member.'
        };
    }

    return {
        allowed: true,
        reason: null
    };
}

function hasModerationPermission(
    member
) {
    return Boolean(
        member?.permissions.has(
            PermissionFlagsBits.ModerateMembers
        ) ||
        member?.permissions.has(
            PermissionFlagsBits.KickMembers
        ) ||
        member?.permissions.has(
            PermissionFlagsBits.BanMembers
        ) ||
        member?.permissions.has(
            PermissionFlagsBits.ManageMessages
        )
    );
}

function formatDuration(
    milliseconds
) {
    if (
        milliseconds === null ||
        milliseconds === undefined
    ) {
        return null;
    }

    const seconds =
        Math.floor(
            milliseconds / 1000
        );

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours}h`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    return `${days}d`;
}

async function sendModerationLog({
    guild,
    moderationCase,
    target = null
}) {
    const channel =
        guild.channels.cache.get(
            channels.staffLogs
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const actionName =
        ACTION_NAMES[
            moderationCase.action
        ] ??
        moderationCase.action;

    const details = [
        `Case: **#${moderationCase.id}**`,
        `Action: **${actionName}**`
    ];

    if (moderationCase.userId) {
        const targetText =
            target
                ? `${target} (\`${moderationCase.userId}\`)`
                : `<@${moderationCase.userId}> (\`${moderationCase.userId}\`)`;

        details.push(
            `Target: ${targetText}`
        );
    }

    if (
        moderationCase.moderatorId
    ) {
        details.push(
            `Moderator: <@${moderationCase.moderatorId}>`
        );
    }

    if (
        moderationCase.channelId
    ) {
        details.push(
            `Channel: <#${moderationCase.channelId}>`
        );
    }

    if (
        moderationCase.durationMs !==
        null
    ) {
        details.push(
            `Duration: **${formatDuration(
                moderationCase.durationMs
            )}**`
        );
    }

    details.push(
        `Reason: ${
            moderationCase.reason ||
            'No reason provided.'
        }`
    );

    const embed =
        createEmbed(
            '🛡️ Moderation Action',
            details.join('\n')
        );

    await channel.send({
        embeds: [
            embed
        ]
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
    target = null
}) {
    const moderationCase =
        await createCase({
            guildId:
                guild.id,

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
        await sendModerationLog({
            guild,
            moderationCase,
            target
        });
    } catch (error) {
        console.error(
            'Moderation log failed:',
            error
        );
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
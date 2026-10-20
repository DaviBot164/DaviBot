const channels = require('../config/channels');
const guardian = require('../config/guardian');
const { createEmbed } = require('./embeds');
const { formatDuration } = require('../handlers/moderationService');

const TYPE_NAMES = Object.freeze({
    spam: 'Spam',
    scam: 'Scam',
    invite: 'Discord Invite',
    severe_word: 'Severe Language'
});

function trimContent(content) {
    const text = String(content ?? '')
        .trim()
        .replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere');

    if (!text) return '*No text content*';

    return text.length > 700
        ? `${text.slice(0, 697)}...`
        : text;
}

function deletionStatus(result) {
    if (result.messageDeleted === true) return 'Deleted';
    if (result.messageDeleted === false) return 'Deletion failed';

    return 'Not recorded';
}

function timeoutStatus(result) {
    if (result.timeoutStatus === 'applied') {
        return `Applied • ${formatDuration(guardian.spam.timeoutMs)}`;
    }

    if (result.timeoutStatus === 'failed') {
        return 'Failed • Check runtime logs';
    }

    if (result.timeoutStatus === 'unavailable') {
        return 'Unavailable • Member cannot be timed out by Akane';
    }

    return 'Not applied';
}

async function sendGuardianLog(message, result) {
    if (!message.guild || !result?.blocked) return;

    const channel = await message.guild.channels.fetch(
        channels.moderation
    );

    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
        throw new Error('Guardian log channel is unavailable.');
    }

    const details = [
        `Member: <@${message.author.id}> (\`${message.author.id}\`)`,
        `Channel: <#${message.channelId}>`,
        `Detection: **${TYPE_NAMES[result.type] ?? 'Guardian'}**`,
        `Message: **${deletionStatus(result)}**`
    ];

    if (result.caseId != null) {
        details.push(`Case: **#${result.caseId}**`);
    }

    if (result.strikes != null) {
        details.push(`Spam Strikes: **${result.strikes}**`);
    }

    if (result.type === 'spam') {
        details.push(`Timeout: **${timeoutStatus(result)}**`);

        if (result.action === 'warning') {
            details.push(
                'Response: **Spam strike recorded • No timeout applied**'
            );
        }
    }

    details.push(
        '',
        '**Detected Content**',
        trimContent(message.content)
    );

    await channel.send({
        embeds: [
            createEmbed('🛡️ Guardian Protection', details.join('\n'))
        ],
        allowedMentions: { parse: [] }
    });
}

module.exports = { sendGuardianLog };
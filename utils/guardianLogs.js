const channels = require('../config/channels');
const { createEmbed } = require('./embeds');

const TYPE_NAMES = Object.freeze({
    spam: 'Spam',
    scam: 'Scam',
    invite: 'Discord Invite',
    severe_word: 'Severe Insult'
});

const ACTION_NAMES = Object.freeze({
    delete: 'Message Deleted',
    warning: 'Message Deleted • Warning',
    timeout: 'Message Deleted • 5 Minute Timeout'
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

async function sendGuardianLog(message, result) {
    if (!message.guild || !result?.blocked) return;

    const channel = await message.guild.channels.fetch(
        channels.moderation
    );

    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
        throw new Error('Guardian log channel is unavailable.');
    }

    const type = TYPE_NAMES[result.type] ?? 'Guardian';
    const action = ACTION_NAMES[result.action]
        ?? result.action
        ?? 'Unknown';

    const details = [
        `Member: <@${message.author.id}> (\`${message.author.id}\`)`,
        `Channel: <#${message.channelId}>`,
        `Detection: **${type}**`,
        `Action: **${action}**`
    ];

    if (result.strikes) {
        details.push(`Spam Strikes: **${result.strikes}**`);
    }

    details.push('', '**Message**', trimContent(message.content));

    await channel.send({
        embeds: [
            createEmbed('🛡️ Guardian Protection', details.join('\n'))
        ],
        allowedMentions: { parse: [] }
    });
}

module.exports = { sendGuardianLog };
const channels =
    require('../config/channels');

const brand =
    require('../config/brand');

const {
    createEmbed
} = require('./embeds');

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

function sanitizeContent(content) {
    return content
        .replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere');
}

function trimContent(content) {
    const text =
        sanitizeContent(
            content?.trim() ||
            ''
        );

    if (!text) {
        return '*No text content*';
    }

    if (text.length <= 700) {
        return text;
    }

    return `${text.slice(0, 697)}...`;
}

async function sendGuardianLog(
    message,
    result
) {
    if (!result?.blocked) {
        return;
    }

    const channel =
        message.guild.channels.cache.get(
            channels.staffLogs
        );

    if (!channel?.isTextBased()) {
        return;
    }

    const type =
        TYPE_NAMES[result.type] ??
        'Guardian';

    const action =
        ACTION_NAMES[result.action] ??
        result.action ??
        'Unknown';

    const details = [
        `Member: ${message.author}`,
        `Channel: ${message.channel}`,
        `Detection: **${type}**`,
        `Action: **${action}**`
    ];

    if (result.strikes) {
        details.push(
            `Spam Strikes: **${result.strikes}**`
        );
    }

    details.push(
        '',
        '**Message**',
        trimContent(
            message.content
        )
    );

    const embed =
        createEmbed(
            '🛡️ Guardian Protection',
            details.join('\n')
        )
            .setFooter({
                text:
                    brand.footer
            })
            .setTimestamp();

    await channel.send({
        embeds: [
            embed
        ]
    });
}

module.exports = {
    sendGuardianLog
};
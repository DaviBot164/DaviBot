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
    bad_word: 'Blocked Word'
});

const ACTION_NAMES = Object.freeze({
    delete: 'Message Deleted',
    warning: 'Message Deleted • Warning',
    timeout: 'Message Deleted • 5 Minute Timeout'
});

function trimContent(content) {
    const text =
        content?.trim();

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
        result.action;

    const embed =
        createEmbed(
            '🛡️ Guardian Protection',
            [
                `Member: ${message.author}`,
                `Channel: ${message.channel}`,
                `Detection: **${type}**`,
                `Action: **${action}**`,
                result.strikes
                    ? `Spam Strikes: **${result.strikes}**`
                    : null,
                '',
                '**Message**',
                trimContent(
                    message.content
                )
            ]
                .filter(Boolean)
                .join('\n')
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
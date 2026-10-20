const { PermissionFlagsBits } = require('discord.js');
const replies = require('../config/akaneReplies');

const USER_COOLDOWN = 10_000;
const CHANNEL_COOLDOWN = 5_000;

const users = new Map();
const channels = new Map();

const TRIGGER =
    /^(?:akane|აკანე)(?:[\s!?.,…♡♥❤🩸👋🔪🌙❤️])*$/iu;

async function handleAkaneReply(message) {
    if (
        !message.inGuild() ||
        message.author.bot ||
        message.webhookId ||
        !TRIGGER.test(message.content.trim()) ||
        !replies.length
    ) {
        return false;
    }

    const bot = message.guild.members.me;
    const permissions = bot
        ? message.channel.permissionsFor(bot)
        : null;

    const sendPermission = message.channel.isThread()
        ? PermissionFlagsBits.SendMessagesInThreads
        : PermissionFlagsBits.SendMessages;

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            sendPermission
        ])
    ) {
        return false;
    }

    const now = Date.now();
    const userKey = `${message.guildId}:${message.author.id}`;
    const channelKey = message.channelId;
    const previous = channels.get(channelKey);

    if (
        now < (users.get(userKey) ?? 0) ||
        now < (previous?.until ?? 0) ||
        previous?.busy
    ) {
        return false;
    }

    const options = replies
        .map((text, index) => ({ text, index }))
        .filter(reply =>
            replies.length === 1 || reply.index !== previous?.index
        );

    const selected = options[Math.floor(Math.random() * options.length)];
    const userExpiry = now + USER_COOLDOWN;

    users.set(userKey, userExpiry);
    channels.set(channelKey, {
        until: now + CHANNEL_COOLDOWN,
        index: previous?.index,
        busy: true
    });

    setTimeout(() => {
        if (users.get(userKey) === userExpiry) {
            users.delete(userKey);
        }
    }, USER_COOLDOWN).unref();

    try {
        await message.reply({
            content: selected.text,
            allowedMentions: {
                parse: [],
                repliedUser: false
            }
        });

        channels.set(channelKey, {
            until: Date.now() + CHANNEL_COOLDOWN,
            index: selected.index,
            busy: false
        });

        return true;
    } catch (error) {
        channels.set(channelKey, {
            until: Date.now() + CHANNEL_COOLDOWN,
            index: previous?.index,
            busy: false
        });

        console.error('Akane reply failed:', error);
        return false;
    }
}

module.exports = { handleAkaneReply };
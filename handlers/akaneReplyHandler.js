const { PermissionFlagsBits } = require('discord.js');

const {
    USER_COOLDOWN,
    CHANNEL_COOLDOWN,
    SESSION_TTL
} = require('./akane/settings');

const {
    users,
    channels,
    sessions,
    sessionKey,
    cleanExpired
} = require('./akane/state');

const { parseRequest } = require('./akane/parser');
const { buildResponse } = require('./akane/responses');
const { plainHelp } = require('./akane/help');
const { memoryAfter } = require('./akane/context');

async function handleAkaneReply(message) {
    if (
        !message.inGuild() ||
        message.author.bot ||
        message.webhookId
    ) {
        return false;
    }

    const now = Date.now();
    cleanExpired(now);

    try {
        const request = parseRequest(message, now);

        if (!request) return false;

        const key = sessionKey(message);

        // Stop always clears context, even during cooldown.
        if (request.category === 'stop') {
            sessions.delete(key);
        }

        const bot = message.guild.members.me;
        const permissions = bot
            ? message.channel.permissionsFor(bot)
            : null;

        const sendPermission = message.channel.isThread()
            ? PermissionFlagsBits.SendMessagesInThreads
            : PermissionFlagsBits.SendMessages;

        if (!permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            sendPermission
        ])) {
            return false;
        }

        let state = channels.get(message.channelId);

        if (!state) {
            state = {
                busy: false,
                until: 0,
                lastUsed: now,
                bags: new Map()
            };

            channels.set(message.channelId, state);
        }

        const userKey = `${message.guildId}:${message.author.id}`;

        if (
            state.busy ||
            now < state.until ||
            now < (users.get(userKey) ?? 0)
        ) {
            return false;
        }

        state.busy = true;
        state.lastUsed = now;

        const expiry = now + USER_COOLDOWN;
        users.set(userKey, expiry);

        try {
            const response = buildResponse(message, request, state);

            if (
                response.payload.embeds &&
                !permissions.has(PermissionFlagsBits.EmbedLinks)
            ) {
                response.payload = { content: plainHelp() };
            }

            const sent = await message.reply({
                ...response.payload,
                allowedMentions: {
                    parse: [],
                    repliedUser: false
                }
            });

            sessions.delete(key);

            if (response.session) {
                sessions.set(key, {
                    ...memoryAfter(request.conversation, request, response),
                    messageId: sent.id,
                    category: response.category,
                    question: response.question ?? false,
                    implicitUntil: Date.now() + SESSION_TTL,
                    expiresAt: Date.now() + SESSION_TTL
                });
            }

            return true;
        } catch (error) {
            // A failed send does not consume the user's cooldown.
            if (users.get(userKey) === expiry) {
                users.delete(userKey);
            }

            throw error;
        } finally {
            state.busy = false;
            state.lastUsed = Date.now();
            state.until = state.lastUsed + CHANNEL_COOLDOWN;
        }
    } catch (error) {
        console.error('Akane reply failed:', error);
        return false;
    }
}
module.exports = { handleAkaneReply };

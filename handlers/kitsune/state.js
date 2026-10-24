const { randomInt } = require('node:crypto');
const { replies, STATE_TTL } = require('./settings');

const users = new Map();
const channels = new Map();
const sessions = new Map();
const listeners = new Map();
const TEST_SCOPE=Symbol('kitsune-test-scope');
function createTestScope(random){return {sessions:new Map(),listeners:new Map(),randomInt:random??randomInt};}
function randomFor(message){return message[TEST_SCOPE]?.randomInt??randomInt;}

function sessionKey(message) {
    return `${message.guildId}:${message.channelId}:${message.author.id}`;
}

function cleanExpired(now) {
    for (const [key, expiry] of users) {
        if (expiry <= now) users.delete(key);
    }
    for (const [key, session] of sessions) {
        if (session.expiresAt <= now) sessions.delete(key);
    }
    for (const [key, state] of channels) {
        if (!state.busy && now - state.lastUsed >= STATE_TTL) channels.delete(key);
    }
    for (const [key, state] of listeners) {
        if (now - state.lastUsed >= STATE_TTL) listeners.delete(key);
    }
}

function getReplyState(message) {
    const key = `${message.guildId}:${message.author.id}`;
    const scope=message[TEST_SCOPE];
    const store=scope?.listeners??listeners;
    let state = store.get(key);
    if (!state) {
        state = { bags: new Map(), lastUsed: Date.now(), ...(scope?{randomInt:scope.randomInt}:{}) };
        store.set(key, state);
    }
    state.lastUsed = Date.now();
    return state;
}

function drawReply(state, category) {
    const pool = replies[category];
    if (!Array.isArray(pool) || !pool.length) {
        throw new Error(`Missing Kitsune reply pool: ${category}`);
    }
    const unique = [...new Set(pool)];
    let bag = state.bags.get(category);
    if (!bag?.remaining.length) {
        const remaining = [...unique];
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = (state.randomInt??randomInt)(i + 1);
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        if (remaining.length > 1 && remaining.at(-1) === bag?.last) {
            const end = remaining.length - 1;
            [remaining[0], remaining[end]] = [remaining[end], remaining[0]];
        }
        bag = { remaining, last: bag?.last };
        state.bags.set(category, bag);
    }
    const text = bag.remaining.pop();
    bag.last = text;
    return text;
}

function getSession(message, now) {
    const session = (message[TEST_SCOPE]?.sessions??sessions).get(sessionKey(message));
    return session?.expiresAt > now ? session : null;
}

module.exports = {
    users, channels, sessions, sessionKey, cleanExpired,
    drawReply, getSession, getReplyState, TEST_SCOPE, createTestScope, randomFor
};

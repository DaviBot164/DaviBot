const { XP } = require('../config/progression');

const cooldowns = new Map();

let nextCleanup = 0;

function cleanExpired(now) {
    if (now < nextCleanup) return;

    nextCleanup = now + 60_000;

    for (const [key, expiresAt] of cooldowns) {
        if (expiresAt <= now) {
            cooldowns.delete(key);
        }
    }
}

function canEarnXP(guildId, userId) {
    const duration = Number(XP.cooldown);

    if (!Number.isSafeInteger(duration) || duration < 0) {
        throw new Error('XP cooldown must be a non-negative integer.');
    }

    const now = Date.now();
    const key = `${guildId}:${userId}`;

    cleanExpired(now);

    if (now < (cooldowns.get(key) ?? 0)) {
        return false;
    }

    cooldowns.set(key, now + duration);
    return true;
}

function clearCooldown(guildId, userId) {
    cooldowns.delete(`${guildId}:${userId}`);
}

module.exports = {
    canEarnXP,
    clearCooldown
};
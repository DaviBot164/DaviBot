const { XP } = require('../config/progression');

const cooldowns = new Map();

function canEarnXP(guildId, userId) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    const lastEarned = cooldowns.get(key);

    if (
        lastEarned &&
        now - lastEarned < XP.cooldown
    ) {
        return false;
    }

    cooldowns.set(key, now);
    return true;
}

function clearCooldown(guildId, userId) {
    cooldowns.delete(`${guildId}:${userId}`);
}

module.exports = {
    canEarnXP,
    clearCooldown
};
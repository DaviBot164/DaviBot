const { XP } = require('../config/progression');

function xpForLevel(level) {
    return XP.requiredForLevel(level);
}

function randomXP() {
    return Math.floor(
        Math.random() *
        (XP.maxPerMessage - XP.minPerMessage + 1)
    ) + XP.minPerMessage;
}

function calculateLevel(level, xp) {
    let currentLevel = level;
    let currentXP = xp;
    let levelsGained = 0;

    while (currentXP >= xpForLevel(currentLevel)) {
        currentXP -= xpForLevel(currentLevel);
        currentLevel++;
        levelsGained++;
    }

    return {
        level: currentLevel,
        xp: currentXP,
        levelsGained
    };
}

function getProgress(level, xp) {
    const required = xpForLevel(level);

    return {
        current: xp,
        required,
        percentage: Math.min(
            100,
            Math.floor((xp / required) * 100)
        )
    };
}

module.exports = {
    randomXP,
    calculateLevel,
    getProgress,
    xpForLevel
};
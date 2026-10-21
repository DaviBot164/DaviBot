const { XP } = require('../config/progression');

function integer(value, name, minimum = 0) {
    const parsed = typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim()
            ? Number(value)
            : NaN;

    if (!Number.isSafeInteger(parsed) || parsed < minimum) {
        throw new Error(`${name} must be a safe integer >= ${minimum}.`);
    }

    return parsed;
}

function xpForLevel(level) {
    const currentLevel = integer(level, 'Level', 1);

    return integer(
        XP.requiredForLevel(currentLevel),
        'Required XP',
        1
    );
}

function randomXP() {
    const minimum = integer(XP.minPerMessage, 'Minimum XP', 1);
    const maximum = integer(XP.maxPerMessage, 'Maximum XP', minimum);

    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;
}

function calculateLevel(level, xp) {
    let currentLevel = integer(level, 'Level', 1);
    let currentXP = integer(xp, 'XP');
    let levelsGained = 0;
    let required = xpForLevel(currentLevel);

    while (currentXP >= required) {
        if (currentLevel === Number.MAX_SAFE_INTEGER) {
            throw new Error('Level exceeds the supported range.');
        }

        currentXP -= required;
        currentLevel += 1;
        levelsGained += 1;
        required = xpForLevel(currentLevel);
    }

    return {
        level: currentLevel,
        xp: currentXP,
        levelsGained
    };
}

function getProgress(level, xp) {
    const required = xpForLevel(level);
    const current = integer(xp, 'XP');

    return {
        current,
        required,
        percentage: Math.min(
            100,
            Math.floor(current / required * 100)
        )
    };
}

module.exports = {
    randomXP,
    calculateLevel,
    getProgress,
    xpForLevel
};
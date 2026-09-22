const FACTIONS = Object.freeze({
    SLAYER: 'slayer',
    DEMON: 'demon'
});

const SLAYER_RANKS = Object.freeze([
    {
        id: 'slayer',
        name: 'Slayer',
        level: 1,
        automatic: true
    },
    {
        id: 'mizunoe',
        name: 'Mizunoe',
        level: 10,
        automatic: true
    },
    {
        id: 'kinoe',
        name: 'Kinoe',
        level: 25,
        automatic: true
    },
    {
        id: 'hashira',
        name: 'Hashira',
        level: 50,
        automatic: false
    }
]);

const DEMON_RANKS = Object.freeze([
    {
        id: 'demon',
        name: 'Demon',
        level: 1,
        automatic: true
    },
    {
        id: 'lower_moon',
        name: 'Lower Moon',
        level: 20,
        automatic: true
    },
    {
        id: 'upper_moon',
        name: 'Upper Moon',
        level: 50,
        automatic: false
    }
]);

const XP = Object.freeze({
    minPerMessage: 15,
    maxPerMessage: 25,
    cooldown: 60_000,

    requiredForLevel(level) {
        return 100 + level * 50;
    }
});

function getRanks(faction) {
    if (faction === FACTIONS.SLAYER) {
        return SLAYER_RANKS;
    }

    if (faction === FACTIONS.DEMON) {
        return DEMON_RANKS;
    }

    return [];
}

function getRankForLevel(
    faction,
    level
) {
    return getRanks(faction)
        .filter(
            rank =>
                rank.automatic &&
                level >= rank.level
        )
        .at(-1) ?? null;
}

module.exports = {
    FACTIONS,
    SLAYER_RANKS,
    DEMON_RANKS,
    XP,
    getRanks,
    getRankForLevel
};
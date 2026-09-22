const {
    FACTIONS,
    getRanks
} = require('../config/progression');

const roles = require('../config/roles');

const FACTION_ROLES = Object.freeze({
    [FACTIONS.SLAYER]: [
        roles.slayer,
        roles.mizunoe,
        roles.kinoe,
        roles.hashira
    ],

    [FACTIONS.DEMON]: [
        roles.demon,
        roles.lowerMoon,
        roles.upperMoon
    ]
});

function getStartingRank(faction) {
    return getRanks(faction)[0] ?? null;
}

function getRank(faction, rankId) {
    return getRanks(faction).find(
        rank => rank.id === rankId
    ) ?? null;
}

function isFaction(faction) {
    return Object.values(FACTIONS).includes(faction);
}

function isRank(faction, rankId) {
    return Boolean(
        getRank(faction, rankId)
    );
}

function getFactionRoles(faction) {
    return FACTION_ROLES[faction] ?? [];
}

function getAllProgressionRoles() {
    return [
        ...new Set(
            Object.values(FACTION_ROLES).flat()
        )
    ];
}

module.exports = {
    getStartingRank,
    getRank,
    isFaction,
    isRank,
    getFactionRoles,
    getAllProgressionRoles
};
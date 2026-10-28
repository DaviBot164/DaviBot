const {
    FACTIONS,
    getRanks,getAllRanks,RANK_ROLE_KEYS
} = require('../config/progression');

const roles = require('../config/roles');

function factionRoles(){return Object.fromEntries(Object.values(FACTIONS).map(faction=>[faction,getAllRanks(faction).map(rank=>roles[RANK_ROLE_KEYS[rank.id]]).filter(Boolean)]));}

function getStartingRank(faction) {
    return getRanks(faction)[0] ?? null;
}

function getRank(faction, rankId) {
    return getAllRanks(faction).find(
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
    return factionRoles()[faction] ?? [];
}

function getAllProgressionRoles() {
    return [
        ...new Set(
            Object.values(factionRoles()).flat()
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

const {serverText}=require("../utils/guildContext");
const { current } = require('../utils/guildContext');
const FACTIONS = Object.freeze({
    SLAYER: 'slayer',
    DEMON: 'demon'
});
const SLAYER_RANKS = Object.freeze([
    {
        id: 'slayer',
        name: serverText('Slayer'),
        level: 1,
        automatic: true
    },
    {
        id: 'mizunoe',
        name: serverText('Mizunoe'),
        level: 10,
        automatic: true
    },
    {
        id: 'kinoe',
        name: serverText('Kinoe'),
        level: 25,
        automatic: true
    },
    {
        id: 'hashira',
        name: serverText('Hashira'),
        level: 50,
        automatic: false
    }
]);
const DEMON_RANKS = Object.freeze([
    {
        id: 'demon',
        name: serverText('Demon'),
        level: 1,
        automatic: true
    },
    {
        id: 'lower_moon',
        name: serverText('Lower Moon'),
        level: 20,
        automatic: true
    },
    {
        id: 'upper_moon',
        name: serverText('Upper Moon'),
        level: 50,
        automatic: false
    }
]);
const XP = Object.freeze({
    minPerMessage: 15,
    maxPerMessage: 25,
    cooldown: 60000,
    requiredForLevel(level) {
        return 100 + level * 50;
    }
});
function getBaseRanks(faction) {
    if (faction === FACTIONS.SLAYER) {
        return SLAYER_RANKS.map(r => ({ ...r, name: current().ranks[r.id] }));
    }
    if (faction === FACTIONS.DEMON) {
        return DEMON_RANKS.map(r => ({ ...r, name: current().ranks[r.id] }));
    }
    return [];
}
const RANK_ROLE_KEYS=Object.freeze({slayer:'slayer',mizunoe:'mizunoe',kanoto:'kanoto',tsuchinoe:'tsuchinoe',kinoe:'kinoe',hashira:'hashira',demon:'demon',rogue:'rogue',tsuyoi:'tsuyoi',lower_moon:'lowerMoon',upper_moon:'upperMoon'});
function getAllRanks(faction){const base=getBaseRanks(faction),extra=faction===FACTIONS.SLAYER?[{id:'kanoto',level:15,automatic:true},{id:'tsuchinoe',level:20,automatic:true}]:faction===FACTIONS.DEMON?[{id:'rogue',level:5,automatic:true},{id:'tsuyoi',level:10,automatic:true}]:[];return [...base,...extra.map(r=>({...r,name:current().ranks[r.id]}))].sort((a,b)=>a.level-b.level);}
function getRanks(faction){return current().progression?.extended?getAllRanks(faction):getBaseRanks(faction);}
function getRankForLevel(faction, level) {
    return getRanks(faction)
        .filter(rank => rank.automatic &&
        level >= rank.level)
        .at(-1) ?? null;
}
module.exports = {
    FACTIONS,
    SLAYER_RANKS,
    DEMON_RANKS,
    XP,
    getRanks, getAllRanks, RANK_ROLE_KEYS,
    getRankForLevel
};

const {
    ensureUser,
    setFaction
} = require('../database/users');

const {
    getStartingRank,
    isFaction
} = require('./factionHandler');

const {
    syncProgressionRole,
    clearProgressionRoles
} = require('./progressionRoles');

async function assignFaction(member, faction) {
    if (!isFaction(faction)) {
        throw new Error(
            `Invalid faction: ${faction}`
        );
    }

    const startingRank =
        getStartingRank(faction);

    if (!startingRank) {
        throw new Error(
            `No starting rank for faction: ${faction}`
        );
    }

    await ensureUser(
        member.guild.id,
        member.id,
        member.joinedAt
    );

    const user = await setFaction(
        member.guild.id,
        member.id,
        faction,
        startingRank.id
    );

    try {
        await syncProgressionRole(
            member,
            faction,
            startingRank.id
        );
    } catch (error) {
        await setFaction(
            member.guild.id,
            member.id,
            null,
            null
        );

        throw error;
    }

    return {
        user,
        rank: startingRank
    };
}

async function removeFaction(member) {
    await ensureUser(
        member.guild.id,
        member.id,
        member.joinedAt
    );

    await clearProgressionRoles(member);

    return setFaction(
        member.guild.id,
        member.id,
        null,
        null
    );
}

module.exports = {
    assignFaction,
    removeFaction
};
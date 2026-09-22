const roles = require('../config/roles');

const {
    getRank,
    getAllProgressionRoles
} = require('./factionHandler');

const RANK_ROLES = Object.freeze({
    slayer: roles.slayer,
    mizunoe: roles.mizunoe,
    kinoe: roles.kinoe,
    hashira: roles.hashira,

    demon: roles.demon,
    lower_moon: roles.lowerMoon,
    upper_moon: roles.upperMoon
});

async function syncProgressionRole(
    member,
    faction,
    rankId
) {
    const rank = getRank(
        faction,
        rankId
    );

    if (!rank) {
        return false;
    }

    const targetRole = RANK_ROLES[rank.id];

    if (!targetRole) {
        return false;
    }

    const progressionRoles =
        getAllProgressionRoles();

    const rolesToRemove =
        progressionRoles.filter(
            roleId =>
                roleId !== targetRole &&
                member.roles.cache.has(roleId)
        );

    if (rolesToRemove.length) {
        await member.roles.remove(
            rolesToRemove,
            'Akane progression sync'
        );
    }

    if (!member.roles.cache.has(targetRole)) {
        await member.roles.add(
            targetRole,
            'Akane progression sync'
        );
    }

    return true;
}

async function clearProgressionRoles(member) {
    const rolesToRemove =
        getAllProgressionRoles().filter(
            roleId =>
                member.roles.cache.has(roleId)
        );

    if (!rolesToRemove.length) {
        return;
    }

    await member.roles.remove(
        rolesToRemove,
        'Akane progression reset'
    );
}

module.exports = {
    syncProgressionRole,
    clearProgressionRoles
};
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

async function syncProgressionRole(member, faction, rankId) {
    const rank = getRank(faction, rankId);

    if (!rank) {
        throw new Error('Invalid progression rank.');
    }

    const targetRoleId = RANK_ROLES[rank.id];

    if (!targetRoleId) {
        throw new Error(`Role is not configured for rank: ${rank.id}`);
    }

    const current = await member.guild.members.fetch({
        user: member.id,
        force: true
    });

    const targetRole = await member.guild.roles.fetch(targetRoleId);

    if (!targetRole) {
        throw new Error(`Progression role does not exist: ${targetRoleId}`);
    }

    const obsolete = getAllProgressionRoles().filter(
        roleId =>
            roleId &&
            roleId !== targetRoleId &&
            current.roles.cache.has(roleId)
    );

    const added = !current.roles.cache.has(targetRoleId);

    // Keep the previous rank role until the new one is available.
    if (added) {
        await current.roles.add(
            targetRoleId,
            'Akane progression sync'
        );
    }

    try {
        if (obsolete.length) {
            await current.roles.remove(
                obsolete,
                'Akane progression sync'
            );
        }
    } catch (error) {
        if (added) {
            await current.roles.remove(
                targetRoleId,
                'Akane progression sync rollback'
            ).catch(rollbackError => {
                console.error(
                    'Progression role rollback failed:',
                    rollbackError
                );
            });
        }

        throw error;
    }

    return true;
}

async function clearProgressionRoles(member) {
    const current = await member.guild.members.fetch({
        user: member.id,
        force: true
    });

    const toRemove = getAllProgressionRoles().filter(
        roleId => roleId && current.roles.cache.has(roleId)
    );

    if (toRemove.length) {
        await current.roles.remove(
            toRemove,
            'Akane progression reset'
        );
    }
}

module.exports = {
    syncProgressionRole,
    clearProgressionRoles
};
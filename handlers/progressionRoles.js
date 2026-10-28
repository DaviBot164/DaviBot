const roles = require('../config/roles');

const {
    getRank,
    getAllProgressionRoles
} = require('./factionHandler');

function rankRoles(){return Object.fromEntries(Object.entries(require('../config/progression').RANK_ROLE_KEYS).map(([id,key])=>[id,roles[key]]));}

async function syncProgressionRole(member, faction, rankId) {
    const rank = getRank(faction, rankId);

    if (!rank) {
        throw new Error('Invalid progression rank.');
    }

    const targetRoleId = rankRoles()[rank.id];

    if (!targetRoleId) {
        return false; // Rank/XP can work without optional Discord role assignments.
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
            'Kitsune progression sync'
        );
    }

    try {
        if (obsolete.length) {
            await current.roles.remove(
                obsolete,
                'Kitsune progression sync'
            );
        }
    } catch (error) {
        if (added) {
            await current.roles.remove(
                targetRoleId,
                'Kitsune progression sync rollback'
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
            'Kitsune progression reset'
        );
    }
}

module.exports = {
    syncProgressionRole,
    clearProgressionRoles
};

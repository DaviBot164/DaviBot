const {
    getAchievements: getUnlockedAchievements,
    unlockAchievement
} = require('../database/achievements');

const {
    getAchievements,
    getAchievement,
    getAchievementRank,
    meetsRequirement
} = require('../config/achievements');

const roles = require('../config/roles');

const ACHIEVEMENT_ROLE_IDS = Object.freeze([
    roles.moonbound,
    roles.crimsonBloom,
    roles.bloodbound,
    roles.nightAscendant,
    roles.eternalMoon
]);

function calculateAchievementPoints(
    unlockedAchievements
) {
    return unlockedAchievements.reduce(
        (total, unlocked) => {
            const achievement =
                getAchievement(
                    unlocked.achievementId
                );

            return total +
                (achievement?.points ?? 0);
        },
        0
    );
}

async function syncAchievementRole(
    member,
    points
) {
    if (!member) {
        return null;
    }

    const rank =
        getAchievementRank(points);

    const targetRoleId =
        rank?.roleId ?? null;

    const rolesToRemove =
        ACHIEVEMENT_ROLE_IDS.filter(
            roleId =>
                roleId !== targetRoleId &&
                member.roles.cache.has(roleId)
        );

    if (rolesToRemove.length > 0) {
        await member.roles.remove(
            rolesToRemove
        );
    }

    if (
        targetRoleId &&
        !member.roles.cache.has(targetRoleId)
    ) {
        await member.roles.add(
            targetRoleId
        );
    }

    return rank;
}

async function checkMemberAchievements(
    member,
    user
) {
    if (!member || !user) {
        return {
            unlocked: [],
            points: 0,
            rank: null
        };
    }

    const guildId =
        member.guild.id;

    const userId =
        member.id;

    const existing =
        await getUnlockedAchievements(
            guildId,
            userId
        );

    const unlockedIds =
        new Set(
            existing.map(
                achievement =>
                    achievement.achievementId
            )
        );

    const newlyUnlocked = [];

    for (const achievement of getAchievements()) {
        if (
            unlockedIds.has(achievement.id) ||
            !meetsRequirement(
                achievement,
                user
            )
        ) {
            continue;
        }

        const unlocked =
            await unlockAchievement(
                guildId,
                userId,
                achievement.id
            );

        if (!unlocked) {
            continue;
        }

        newlyUnlocked.push(
            achievement
        );

        unlockedIds.add(
            achievement.id
        );
    }

    const allUnlocked =
        await getUnlockedAchievements(
            guildId,
            userId
        );

    const points =
        calculateAchievementPoints(
            allUnlocked
        );

    const rank =
        await syncAchievementRole(
            member,
            points
        );

    return {
        unlocked: newlyUnlocked,
        points,
        rank
    };
}

async function getMemberAchievementProgress(
    guildId,
    userId
) {
    const unlocked =
        await getUnlockedAchievements(
            guildId,
            userId
        );

    const points =
        calculateAchievementPoints(
            unlocked
        );

    return {
        unlocked,
        points,
        rank:
            getAchievementRank(points)
    };
}

module.exports = {
    calculateAchievementPoints,
    syncAchievementRole,
    checkMemberAchievements,
    getMemberAchievementProgress
};
const {
    query
} = require('./connection');

/**
 * Umbra's built-in Achievement definitions.
 *
 * These are not Discord roles.
 * They exist only inside Umbra's Soul system.
 */
const ACHIEVEMENT_DEFINITIONS = [
    {
        id:
            'first_words',

        name:
            'First Words',

        description:
            'Send the first recorded message inside the Realm.',

        icon:
            '🌑',

        category:
            'Activity'
    },
    {
        id:
            'awakened_soul',

        name:
            'Awakened Soul',

        description:
            'Reach Level 5.',

        icon:
            '🌒',

        category:
            'Progression'
    },
    {
        id:
            'rising_soul',

        name:
            'Rising Soul',

        description:
            'Reach Level 10.',

        icon:
            '⭐',

        category:
            'Progression'
    },
    {
        id:
            'crimson_soul',

        name:
            'Crimson Soul',

        description:
            'Reach Level 25.',

        icon:
            '🌔',

        category:
            'Progression'
    },
    {
        id:
            'eternal_soul',

        name:
            'Eternal Soul',

        description:
            'Reach Level 50.',

        icon:
            '🌕',

        category:
            'Progression'
    }
];

/**
 * Convert a PostgreSQL Achievement row
 * into Umbra's Achievement structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapAchievementRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        id:
            row.achievement_id,

        name:
            row.name,

        description:
            row.description,

        icon:
            row.icon,

        category:
            row.category,

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                )
                : null
    };
}

/**
 * Convert an unlocked Achievement row
 * into a Soul Achievement structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapSoulAchievementRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        guildId:
            row.guild_id,

        userId:
            row.user_id,

        achievementId:
            row.achievement_id,

        name:
            row.name,

        description:
            row.description,

        icon:
            row.icon,

        category:
            row.category,

        unlockedAt:
            row.unlocked_at
                ? new Date(
                    row.unlocked_at
                )
                : null
    };
}

/**
 * Create or update every built-in
 * Achievement definition.
 *
 * This function is safe to run whenever
 * Umbra starts.
 *
 * @returns {Promise<number>}
 */
async function initializeAchievements() {
    for (
        const achievement
        of ACHIEVEMENT_DEFINITIONS
    ) {
        await query(
            `
                INSERT INTO achievements (
                    achievement_id,
                    name,
                    description,
                    icon,
                    category
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                ON CONFLICT (
                    achievement_id
                )
                DO UPDATE SET
                    name =
                        EXCLUDED.name,

                    description =
                        EXCLUDED.description,

                    icon =
                        EXCLUDED.icon,

                    category =
                        EXCLUDED.category;
            `,
            [
                achievement.id,
                achievement.name,
                achievement.description,
                achievement.icon,
                achievement.category
            ]
        );
    }

    return ACHIEVEMENT_DEFINITIONS.length;
}

/**
 * Get one Achievement definition.
 *
 * @param {string} achievementId
 * @returns {Promise<Object|null>}
 */
async function getAchievement(
    achievementId
) {
    const result =
        await query(
            `
                SELECT *
                FROM achievements
                WHERE achievement_id = $1
                LIMIT 1;
            `,
            [
                achievementId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    return mapAchievementRow(
        result.rows[0]
    );
}

/**
 * Get every available Achievement.
 *
 * @returns {Promise<Object[]>}
 */
async function getAllAchievements() {
    const result =
        await query(
            `
                SELECT *
                FROM achievements
                ORDER BY
                    category ASC,
                    created_at ASC,
                    achievement_id ASC;
            `
        );

    return result.rows.map(
        mapAchievementRow
    );
}

/**
 * Count every available Achievement.
 *
 * @returns {Promise<number>}
 */
async function countAllAchievements() {
    const result =
        await query(
            `
                SELECT COUNT(*)::INTEGER
                    AS achievement_count
                FROM achievements;
            `
        );

    return Number(
        result.rows[0]
            ?.achievement_count || 0
    );
}

/**
 * Check whether a Soul has already
 * unlocked an Achievement.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} achievementId
 * @returns {Promise<boolean>}
 */
async function hasAchievement(
    guildId,
    userId,
    achievementId
) {
    const result =
        await query(
            `
                SELECT 1
                FROM soul_achievements
                WHERE guild_id = $1
                  AND user_id = $2
                  AND achievement_id = $3
                LIMIT 1;
            `,
            [
                guildId,
                userId,
                achievementId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Unlock an Achievement for one Soul.
 *
 * The same Achievement can never be
 * unlocked twice by the same Soul
 * inside the same server.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} achievementId
 * @returns {Promise<{
 *     unlocked: boolean,
 *     achievement: Object|null
 * }>}
 */
async function unlockAchievement(
    guildId,
    userId,
    achievementId
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to unlock an Achievement.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to unlock an Achievement.'
        );
    }

    if (!achievementId) {
        throw new TypeError(
            'An Achievement ID is required.'
        );
    }

    const achievement =
        await getAchievement(
            achievementId
        );

    if (!achievement) {
        return {
            unlocked:
                false,

            achievement:
                null
        };
    }

    const result =
        await query(
            `
                INSERT INTO soul_achievements (
                    guild_id,
                    user_id,
                    achievement_id
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    guild_id,
                    user_id,
                    achievement_id
                )
                DO NOTHING
                RETURNING unlocked_at;
            `,
            [
                guildId,
                userId,
                achievementId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return {
            unlocked:
                false,

            achievement:
                {
                    ...achievement,

                    unlockedAt:
                        null
                }
        };
    }

    return {
        unlocked:
            true,

        achievement:
            {
                ...achievement,

                unlockedAt:
                    new Date(
                        result.rows[0]
                            .unlocked_at
                    )
            }
    };
}

/**
 * Get every Achievement unlocked
 * by one Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getSoulAchievements(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    soul_achievements.guild_id,
                    soul_achievements.user_id,
                    soul_achievements.achievement_id,
                    soul_achievements.unlocked_at,

                    achievements.name,
                    achievements.description,
                    achievements.icon,
                    achievements.category

                FROM soul_achievements

                INNER JOIN achievements
                    ON achievements.achievement_id =
                        soul_achievements.achievement_id

                WHERE soul_achievements.guild_id = $1
                  AND soul_achievements.user_id = $2

                ORDER BY
                    soul_achievements.unlocked_at DESC;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows.map(
        mapSoulAchievementRow
    );
}

/**
 * Get a Soul's most recently
 * unlocked Achievements.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentSoulAchievements(
    guildId,
    userId,
    limit = 3
) {
    const safeLimit =
        Math.min(
            20,
            Math.max(
                1,
                Math.floor(
                    Number(limit) || 3
                )
            )
        );

    const result =
        await query(
            `
                SELECT
                    soul_achievements.guild_id,
                    soul_achievements.user_id,
                    soul_achievements.achievement_id,
                    soul_achievements.unlocked_at,

                    achievements.name,
                    achievements.description,
                    achievements.icon,
                    achievements.category

                FROM soul_achievements

                INNER JOIN achievements
                    ON achievements.achievement_id =
                        soul_achievements.achievement_id

                WHERE soul_achievements.guild_id = $1
                  AND soul_achievements.user_id = $2

                ORDER BY
                    soul_achievements.unlocked_at DESC

                LIMIT $3;
            `,
            [
                guildId,
                userId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapSoulAchievementRow
    );
}

/**
 * Count the Achievements unlocked
 * by one Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countSoulAchievements(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT COUNT(*)::INTEGER
                    AS achievement_count
                FROM soul_achievements
                WHERE guild_id = $1
                  AND user_id = $2;
            `,
            [
                guildId,
                userId
            ]
        );

    return Number(
        result.rows[0]
            ?.achievement_count || 0
    );
}

/**
 * Remove one Achievement from a Soul.
 *
 * Intended for future Administrator
 * management commands.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} achievementId
 * @returns {Promise<boolean>}
 */
async function removeSoulAchievement(
    guildId,
    userId,
    achievementId
) {
    const result =
        await query(
            `
                DELETE FROM soul_achievements
                WHERE guild_id = $1
                  AND user_id = $2
                  AND achievement_id = $3
                RETURNING achievement_id;
            `,
            [
                guildId,
                userId,
                achievementId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Remove every unlocked Achievement
 * from one Soul.
 *
 * Achievement definitions remain intact.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function resetSoulAchievements(
    guildId,
    userId
) {
    const result =
        await query(
            `
                DELETE FROM soul_achievements
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING achievement_id;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows.length;
}

module.exports = {
    ACHIEVEMENT_DEFINITIONS,

    initializeAchievements,

    getAchievement,
    getAllAchievements,
    countAllAchievements,

    hasAchievement,
    unlockAchievement,

    getSoulAchievements,
    getRecentSoulAchievements,
    countSoulAchievements,

    removeSoulAchievement,
    resetSoulAchievements
};
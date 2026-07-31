const levels =
    require('./levels');

const warnings =
    require('./warnings');

const achievements =
    require('./achievements');

/**
 * Default values reserved for systems
 * that will be added to Umbra later.
 */
const DEFAULT_SOUL_DATA = {
    title: {
        id:
            null,

        name:
            'Nameless Soul',

        displayName:
            '🌑 Nameless Soul'
    },

    reputation: {
        total:
            0,

        received:
            0,

        given:
            0
    },

    chronicles: {
        total:
            0,

        recent:
            []
    },

    tickets: {
        created:
            0,

        closed:
            0
    },

    events: {
        joined:
            0,

        completed:
            0
    },

    voice: {
        totalMinutes:
            0
    }
};

/**
 * Create a safe default Level record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Object}
 */
function createDefaultLevelRecord(
    guildId,
    userId
) {
    return {
        guildId,
        userId,

        xp:
            0,

        level:
            0,

        messageCount:
            0,

        lastXpAt:
            null,

        createdAt:
            null,

        updatedAt:
            null,

        progress:
            levels.calculateLevelProgress(
                0
            )
    };
}

/**
 * Safely load a Soul's Level data.
 *
 * If the database is unavailable or no
 * record exists, a Level 0 record is returned.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getSoulLevel(
    guildId,
    userId
) {
    try {
        const levelRecord =
            await levels.getUserLevel(
                guildId,
                userId
            );

        if (levelRecord) {
            return levelRecord;
        }

        return createDefaultLevelRecord(
            guildId,
            userId
        );
    } catch (error) {
        console.warn(
            `⚠️ Soul Level unavailable for ${userId}: ${error.message}`
        );

        return createDefaultLevelRecord(
            guildId,
            userId
        );
    }
}

/**
 * Safely load a Soul's server Rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|null>}
 */
async function getSoulRank(
    guildId,
    userId
) {
    try {
        return await levels.getUserRank(
            guildId,
            userId
        );
    } catch (error) {
        console.warn(
            `⚠️ Soul Rank unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely load a Soul's warning count.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number|null>}
 */
async function getSoulWarningCount(
    guildId,
    userId
) {
    try {
        const warningCount =
            await warnings.countWarnings(
                guildId,
                userId
            );

        return Number(
            warningCount || 0
        );
    } catch (error) {
        console.warn(
            `⚠️ Soul warnings unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely load a Soul's unlocked
 * Achievement count.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getSoulAchievementCount(
    guildId,
    userId
) {
    try {
        return await achievements
            .countSoulAchievements(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Soul Achievement count unavailable for ${userId}: ${error.message}`
        );

        return 0;
    }
}

/**
 * Safely load the total number of
 * Achievement definitions.
 *
 * @returns {Promise<number>}
 */
async function getTotalAchievementCount() {
    try {
        return await achievements
            .countAllAchievements();
    } catch (error) {
        console.warn(
            `⚠️ Total Achievement count unavailable: ${error.message}`
        );

        return 0;
    }
}

/**
 * Safely load a Soul's most recently
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
    try {
        return await achievements
            .getRecentSoulAchievements(
                guildId,
                userId,
                limit
            );
    } catch (error) {
        console.warn(
            `⚠️ Recent Soul Achievements unavailable for ${userId}: ${error.message}`
        );

        return [];
    }
}

/**
 * Create a safe copy of Umbra's default
 * future-system data.
 *
 * This prevents one Soul object from sharing
 * mutable arrays or nested objects with another.
 *
 * @returns {Object}
 */
function createDefaultSoulData() {
    return {
        title: {
            ...DEFAULT_SOUL_DATA.title
        },

        reputation: {
            ...DEFAULT_SOUL_DATA.reputation
        },

        chronicles: {
            ...DEFAULT_SOUL_DATA.chronicles,

            recent: [
                ...DEFAULT_SOUL_DATA
                    .chronicles
                    .recent
            ]
        },

        tickets: {
            ...DEFAULT_SOUL_DATA.tickets
        },

        events: {
            ...DEFAULT_SOUL_DATA.events
        },

        voice: {
            ...DEFAULT_SOUL_DATA.voice
        }
    };
}

/**
 * Open one complete Soul Record.
 *
 * This is Umbra Core's central reader.
 * Every future Soul system will connect here.
 *
 * Current live systems:
 * - Levels
 * - XP progress
 * - Server Rank
 * - Message count
 * - Warnings
 * - Achievements
 *
 * Reserved future systems:
 * - Titles
 * - Reputation
 * - Chronicles
 * - Tickets
 * - Events
 * - Voice activity
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getSoulRecord(
    guildId,
    userId
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to open a Soul Record.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to open a Soul Record.'
        );
    }

    const [
        level,
        serverRank,
        warningCount,
        unlockedAchievementCount,
        totalAchievementCount,
        recentAchievements
    ] =
        await Promise.all([
            getSoulLevel(
                guildId,
                userId
            ),

            getSoulRank(
                guildId,
                userId
            ),

            getSoulWarningCount(
                guildId,
                userId
            ),

            getSoulAchievementCount(
                guildId,
                userId
            ),

            getTotalAchievementCount(),

            getRecentSoulAchievements(
                guildId,
                userId,
                3
            )
        ]);

    const futureSystems =
        createDefaultSoulData();

    return {
        guildId,
        userId,

        openedAt:
            new Date(),

        progression: {
            level:
                level.level,

            xp:
                level.xp,

            messageCount:
                level.messageCount,

            serverRank,

            progress:
                level.progress,

            lastXpAt:
                level.lastXpAt,

            recordCreatedAt:
                level.createdAt,

            recordUpdatedAt:
                level.updatedAt
        },

        guardian: {
            warningCount,

            status:
                warningCount === null
                    ? 'Unavailable'
                    : warningCount === 0
                        ? 'Clear'
                        : 'Marked'
        },

        achievements: {
            unlocked:
                unlockedAchievementCount,

            total:
                totalAchievementCount,

            recent:
                recentAchievements
        },

        ...futureSystems
    };
}

/**
 * Check whether a Soul currently has
 * a stored Level record.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function soulRecordExists(
    guildId,
    userId
) {
    try {
        const levelRecord =
            await levels.getUserLevel(
                guildId,
                userId
            );

        return Boolean(
            levelRecord
        );
    } catch (error) {
        console.warn(
            `⚠️ Soul existence check failed for ${userId}: ${error.message}`
        );

        return false;
    }
}

/**
 * Ensure that a Soul has at least the
 * base progression record required by Umbra.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function ensureSoulRecord(
    guildId,
    userId
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to ensure a Soul Record.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to ensure a Soul Record.'
        );
    }

    await levels.ensureUserLevel(
        guildId,
        userId
    );

    return getSoulRecord(
        guildId,
        userId
    );
}

module.exports = {
    DEFAULT_SOUL_DATA,

    getSoulLevel,
    getSoulRank,
    getSoulWarningCount,

    getSoulAchievementCount,
    getTotalAchievementCount,
    getRecentSoulAchievements,

    getSoulRecord,
    soulRecordExists,
    ensureSoulRecord
};
const {
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../config/titles');

const levelDatabase =
    require('../database/levels');

const achievementDatabase =
    require('../database/achievements');

const rankDatabase =
    require('../database/ranks');

const titleDatabase =
    require('../database/titles');

/**
 * Convert a GuildMember's Discord roles
 * into a Set containing exact role names.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @returns {Set<string>}
 */
function getMemberRoleNames(
    member
) {
    if (!member) {
        return new Set();
    }

    return new Set(
        member.roles.cache.map(
            role =>
                role.name
        )
    );
}

/**
 * Find a manually managed Sin Rank
 * directly from a member's Discord roles.
 *
 * This acts as a safe fallback whenever
 * the database Rank record is unavailable.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @returns {string|null}
 */
function getDiscordSinRank(
    member
) {
    if (!member) {
        return null;
    }

    const sinRanks =
        Array.isArray(
            rankDatabase.SIN_RANKS
        )
            ? rankDatabase.SIN_RANKS
            : [];

    for (
        const rankName
        of sinRanks
    ) {
        const hasRank =
            member.roles.cache.some(
                role =>
                    role.name ===
                    rankName
            );

        if (hasRank) {
            return rankName;
        }
    }

    return null;
}

/**
 * Safely load one Soul's Level record.
 *
 * A Level database failure must not crash
 * the entire Title evaluation system.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getSafeLevelRecord(
    guildId,
    userId
) {
    try {
        return await levelDatabase
            .getUserLevel(
                guildId,
                userId
            );
    } catch (error) {
        console.warn(
            `⚠️ Title Level check unavailable for ${userId}: ${error.message}`
        );

        return null;
    }
}

/**
 * Safely load every Achievement ID
 * unlocked by one Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Set<string>>}
 */
async function getSafeAchievementIds(
    guildId,
    userId
) {
    try {
        const achievements =
            await achievementDatabase
                .getSoulAchievements(
                    guildId,
                    userId
                );

        if (
            !Array.isArray(
                achievements
            )
        ) {
            return new Set();
        }

        return new Set(
            achievements
                .map(
                    achievement =>
                        achievement
                            ?.achievementId
                )
                .filter(
                    Boolean
                )
        );
    } catch (error) {
        console.warn(
            `⚠️ Title Achievement check unavailable for ${userId}: ${error.message}`
        );

        return new Set();
    }
}

/**
 * Safely load one Soul's current
 * manually managed Sin Rank.
 *
 * Database state is preferred.
 * Discord roles are used as fallback.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {import('discord.js').GuildMember|null} member
 * @returns {Promise<string|null>}
 */
async function getSafeSinRank(
    guildId,
    userId,
    member
) {
    try {
        const rankRecord =
            await rankDatabase
                .getCurrentRank(
                    guildId,
                    userId
                );

        const databaseRank =
            rankRecord?.rank_name ||
            rankRecord?.rankName ||
            null;

        if (databaseRank) {
            return databaseRank;
        }
    } catch (error) {
        console.warn(
            `⚠️ Title Rank check unavailable for ${userId}: ${error.message}`
        );
    }

    return getDiscordSinRank(
        member
    );
}/**
 * Build all information required
 * to evaluate Title requirements.
 *
 * Level, Achievement and Rank records
 * are loaded in parallel.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {import('discord.js').GuildMember} options.member
 * @returns {Promise<Object>}
 */
async function createTitleContext({
    guildId,
    userId,
    member
}) {
    const [
        levelRecord,
        achievementIds,
        sinRank
    ] =
        await Promise.all([
            getSafeLevelRecord(
                guildId,
                userId
            ),

            getSafeAchievementIds(
                guildId,
                userId
            ),

            getSafeSinRank(
                guildId,
                userId,
                member
            )
        ]);

    const safeLevel =
        Number(
            levelRecord?.level
        );

    const safeXp =
        Number(
            levelRecord?.xp
        );

    return {
        guildId,
        userId,
        member,

        level:
            Number.isFinite(
                safeLevel
            )
                ? safeLevel
                : 0,

        xp:
            Number.isFinite(
                safeXp
            )
                ? safeXp
                : 0,

        achievementIds,

        sinRank,

        roleNames:
            getMemberRoleNames(
                member
            ),

        isGuildOwner:
            Boolean(
                member &&
                member.id ===
                    member.guild.ownerId
            )
    };
}

/**
 * Check whether one Title definition
 * has been earned by a Soul.
 *
 * MANUAL and EVENT Titles are never
 * unlocked by this automatic handler.
 *
 * @param {Object} title
 * @param {Object} context
 * @returns {boolean}
 */
function isTitleEligible(
    title,
    context
) {
    if (
        !title ||
        !context
    ) {
        return false;
    }

    const unlock =
        title.unlock || {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.DEFAULT:
            return true;

        case TITLE_UNLOCK_TYPES.LEVEL: {
            const requiredLevel =
                Number(
                    unlock.level
                );

            if (
                !Number.isFinite(
                    requiredLevel
                )
            ) {
                return false;
            }

            return (
                context.level >=
                requiredLevel
            );
        }

        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            if (
                !unlock.achievementId
            ) {
                return false;
            }

            return context
                .achievementIds
                .has(
                    unlock.achievementId
                );

        case TITLE_UNLOCK_TYPES.EVOLUTION:
            if (
                !unlock.roleName
            ) {
                return false;
            }

            return context
                .roleNames
                .has(
                    unlock.roleName
                );

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            if (
                !unlock.rankName
            ) {
                return false;
            }

            return (
                context.sinRank ===
                unlock.rankName
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            if (
                unlock.ownerFallback &&
                context.isGuildOwner
            ) {
                return true;
            }

            if (
                !unlock.roleName
            ) {
                return false;
            }

            return context
                .roleNames
                .has(
                    unlock.roleName
                );

        case TITLE_UNLOCK_TYPES.MANUAL:
        case TITLE_UNLOCK_TYPES.EVENT:
        default:
            return false;
    }
}

/**
 * Explain the automatic source that
 * caused a Title to unlock.
 *
 * This value is stored inside the
 * Soul Title database record.
 *
 * @param {Object} title
 * @returns {string}
 */
function getUnlockSource(
    title
) {
    const unlock =
        title?.unlock || {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.DEFAULT:
            return 'DEFAULT';

        case TITLE_UNLOCK_TYPES.LEVEL:
            return (
                `LEVEL_${Number(
                    unlock.level || 0
                )}`
            );

        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return (
                `ACHIEVEMENT_${
                    unlock.achievementId ||
                    'UNKNOWN'
                }`
            );

        case TITLE_UNLOCK_TYPES.EVOLUTION:
            return (
                `EVOLUTION_${
                    unlock.roleName ||
                    'UNKNOWN'
                }`
            );

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            return (
                `SIN_RANK_${
                    unlock.rankName ||
                    'UNKNOWN'
                }`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return (
                `STAFF_ROLE_${
                    unlock.roleName ||
                    'UNKNOWN'
                }`
            );

        default:
            return 'AUTOMATIC';
    }
}/**
 * Check every automatic Title requirement
 * for one Soul and unlock all eligible Titles.
 *
 * Titles are permanent once earned.
 *
 * Losing a Level requirement, Achievement,
 * Evolution role, Staff role or Sin Rank
 * does not automatically revoke an unlocked
 * Chronicle Title.
 *
 * MANUAL and EVENT Titles remain controlled
 * by their dedicated systems.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {import('discord.js').GuildMember} options.member
 * @returns {Promise<{
 *     context: Object,
 *     newlyUnlocked: Object[],
 *     activeTitle: Object|null,
 *     unlockedCount: number
 * }>}
 */
async function checkSoulTitles({
    guildId,
    userId,
    member
}) {
    if (
        typeof guildId !==
            'string' ||
        guildId.trim().length ===
            0
    ) {
        throw new TypeError(
            'A guild ID is required to check Soul Titles.'
        );
    }

    if (
        typeof userId !==
            'string' ||
        userId.trim().length ===
            0
    ) {
        throw new TypeError(
            'A user ID is required to check Soul Titles.'
        );
    }

    if (!member) {
        throw new TypeError(
            'A GuildMember is required to check Soul Titles.'
        );
    }

    /*
     * Every Soul must permanently own
     * the default Nameless Soul Title.
     */
    await titleDatabase
        .ensureDefaultSoulTitle(
            guildId,
            userId
        );

    const context =
        await createTitleContext({
            guildId,
            userId,
            member
        });

    const newlyUnlocked = [];

    /*
     * Evaluate every configured Chronicle
     * Title against the current Soul state.
     */
    for (
        const title
        of TITLE_DEFINITIONS
    ) {
        if (
            !title ||
            !title.id ||
            !title.unlock
        ) {
            continue;
        }

        /*
         * The default Title was already
         * guaranteed above.
         */
        if (
            title.unlock.type ===
            TITLE_UNLOCK_TYPES.DEFAULT
        ) {
            continue;
        }

        /*
         * Manual and Event Titles must
         * never be awarded automatically.
         */
        if (
            title.unlock.type ===
                TITLE_UNLOCK_TYPES.MANUAL ||
            title.unlock.type ===
                TITLE_UNLOCK_TYPES.EVENT
        ) {
            continue;
        }

        if (
            !isTitleEligible(
                title,
                context
            )
        ) {
            continue;
        }

        try {
            const result =
                await titleDatabase
                    .unlockSoulTitle({
                        guildId,
                        userId,

                        titleId:
                            title.id,

                        unlockedBy:
                            null,

                        unlockSource:
                            getUnlockSource(
                                title
                            ),

                        activate:
                            false
                    });

            if (
                result?.unlocked &&
                result?.title
            ) {
                newlyUnlocked.push(
                    result.title
                );
            }
        } catch (error) {
            console.error(
                `❌ Evelynn could not unlock Title ${title.id} for ${userId}:`
            );

            console.error(
                error
            );
        }
    }

    /*
     * Read the final Title state only after
     * all automatic unlock checks finish.
     */
    const [
        activeTitle,
        unlockedCount
    ] =
        await Promise.all([
            titleDatabase
                .getActiveTitle(
                    guildId,
                    userId
                ),

            titleDatabase
                .countSoulTitles(
                    guildId,
                    userId
                )
        ]);

    return {
        context,
        newlyUnlocked,
        activeTitle,

        unlockedCount:
            Number(
                unlockedCount
            ) || 0
    };
}/**
 * Check automatic Titles for one
 * Discord GuildMember.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Object|null>}
 */
async function checkMemberTitles(
    member
) {
    if (
        !member ||
        !member.guild ||
        member.user?.bot
    ) {
        return null;
    }

    try {
        return await checkSoulTitles({
            guildId:
                member.guild.id,

            userId:
                member.id,

            member
        });
    } catch (error) {
        console.error(
            `❌ Evelynn Title check failed for ${member.id}:`
        );

        console.error(
            error
        );

        return null;
    }
}

/**
 * Check automatic Titles after one
 * valid server message.
 *
 * This wrapper is connected to
 * events/messageCreate.js and runs after
 * the Achievement check completes.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<Object|null>}
 */
async function checkMessageTitles(
    message
) {
    if (
        !message?.inGuild?.() ||
        message.author?.bot ||
        !message.member
    ) {
        return null;
    }

    return checkMemberTitles(
        message.member
    );
}

module.exports = {
    getMemberRoleNames,
    getDiscordSinRank,

    getSafeLevelRecord,
    getSafeAchievementIds,
    getSafeSinRank,

    createTitleContext,
    isTitleEligible,
    getUnlockSource,

    checkSoulTitles,
    checkMemberTitles,
    checkMessageTitles
};
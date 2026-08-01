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
 * into a Set of exact role names.
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
 * Find a manually managed Arrancar Rank
 * directly from the member's Discord roles.
 *
 * This is used as a safe fallback when a
 * database Rank record is unavailable.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @returns {string|null}
 */
function getDiscordArrancarRank(
    member
) {
    if (!member) {
        return null;
    }

    for (
        const rankName
        of rankDatabase.ARRANCAR_RANKS
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

        return new Set(
            achievements.map(
                achievement =>
                    achievement.achievementId
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
 * Safely load a Soul's current manually
 * managed Arrancar Rank.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {import('discord.js').GuildMember|null} member
 * @returns {Promise<string|null>}
 */
async function getSafeArrancarRank(
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

        if (
            rankRecord?.rank_name
        ) {
            return rankRecord.rank_name;
        }
    } catch (error) {
        console.warn(
            `⚠️ Title Rank check unavailable for ${userId}: ${error.message}`
        );
    }

    return getDiscordArrancarRank(
        member
    );
}

/**
 * Build all information required to
 * evaluate Title unlock requirements.
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
        arrancarRank
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

            getSafeArrancarRank(
                guildId,
                userId,
                member
            )
        ]);

    return {
        guildId,
        userId,
        member,

        level:
            Number(
                levelRecord?.level || 0
            ),

        xp:
            Number(
                levelRecord?.xp || 0
            ),

        achievementIds,

        arrancarRank,

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
 * MANUAL and EVENT Titles are not
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
    const unlock =
        title?.unlock || {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.DEFAULT:
            return true;

        case TITLE_UNLOCK_TYPES.LEVEL:
            return (
                context.level >=
                Number(
                    unlock.level || 0
                )
            );

        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return context
                .achievementIds
                .has(
                    unlock.achievementId
                );

        case TITLE_UNLOCK_TYPES.EVOLUTION:
            return context
                .roleNames
                .has(
                    unlock.roleName
                );

        case TITLE_UNLOCK_TYPES.ARRANCAR_RANK:
            return (
                context.arrancarRank ===
                unlock.rankName
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            if (
                unlock.ownerFallback &&
                context.isGuildOwner
            ) {
                return true;
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
                `ACHIEVEMENT_${unlock.achievementId}`
            );

        case TITLE_UNLOCK_TYPES.EVOLUTION:
            return (
                `EVOLUTION_${unlock.roleName}`
            );

        case TITLE_UNLOCK_TYPES.ARRANCAR_RANK:
            return (
                `ARRANCAR_RANK_${unlock.rankName}`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return (
                `STAFF_ROLE_${unlock.roleName}`
            );

        default:
            return 'AUTOMATIC';
    }
}

/**
 * Check every automatic Title requirement
 * for one Soul and unlock all eligible Titles.
 *
 * This function does not remove Titles when
 * a requirement is later lost. Once earned,
 * a Title remains permanently unlocked unless
 * an Administrator explicitly revokes it.
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
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to check Soul Titles.'
        );
    }

    if (!userId) {
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
     * Ensure the Soul always owns the
     * default Nameless Soul Title.
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

    for (
        const title
        of TITLE_DEFINITIONS
    ) {
        /*
         * The default Title was already
         * handled above.
         */
        if (
            title.unlock.type ===
            TITLE_UNLOCK_TYPES.DEFAULT
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
                result.unlocked &&
                result.title
            ) {
                newlyUnlocked.push(
                    result.title
                );
            }
        } catch (error) {
            console.error(
                `❌ Umbra could not unlock Title ${title.id} for ${userId}:`
            );

            console.error(
                error
            );
        }
    }

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
        unlockedCount
    };
}

/**
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
            `❌ Umbra Title check failed for ${member.id}:`
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
 * This wrapper will later be connected
 * to events/messageCreate.js after the
 * Achievement check succeeds.
 *
 * @param {import('discord.js').Message} message
 * @returns {Promise<Object|null>}
 */
async function checkMessageTitles(
    message
) {
    if (
        !message?.inGuild() ||
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
    createTitleContext,
    isTitleEligible,
    getUnlockSource,

    checkSoulTitles,
    checkMemberTitles,
    checkMessageTitles
};
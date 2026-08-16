const {
    TITLE_DEFINITIONS,
    TITLE_UNLOCK_TYPES
} = require('../config/titles');

const achievementDatabase =
    require('../database/achievements');

const rankDatabase =
    require('../database/ranks');

const titleDatabase =
    require('../database/titles');

const TITLE_ID_SET =
    new Set(
        TITLE_DEFINITIONS.map(
            title => title.id
        )
    );

function getMemberRoleNames(member) {
    if (!member) {
        return new Set();
    }

    return new Set(
        member.roles.cache.map(
            role => role.name
        )
    );
}

function getMemberRoleIds(member) {
    if (!member) {
        return new Set();
    }

    return new Set(
        member.roles.cache.keys()
    );
}

function getDiscordSinRank(member) {
    if (!member) {
        return null;
    }

    const ranks =
        Array.isArray(
            rankDatabase.SIN_RANKS
        )
            ? rankDatabase.SIN_RANKS
            : [];

    return (
        ranks.find(
            rankName =>
                member.roles.cache.some(
                    role =>
                        role.name ===
                        rankName
                )
        ) ??
        null
    );
}

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

        const rankName =
            rankRecord?.rank_name ??
            rankRecord?.rankName ??
            null;

        if (rankName) {
            return rankName;
        }
    } catch (error) {
        console.warn(
            `⚠️ Title Rank check unavailable for ${userId}: ${error.message}`
        );
    }

    return getDiscordSinRank(
        member
    );
}

async function createTitleContext({
    guildId,
    userId,
    member
}) {
    const [
        achievementIds,
        sinRank
    ] =
        await Promise.all([
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

    return {
        guildId,
        userId,
        member,
        achievementIds,
        sinRank,

        roleNames:
            getMemberRoleNames(
                member
            ),

        roleIds:
            getMemberRoleIds(
                member
            )
    };
}

function isTitleEligible(
    title,
    context
) {
    if (
        !title?.unlock ||
        !context
    ) {
        return false;
    }

    const unlock =
        title.unlock;

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return Boolean(
                unlock.achievementId &&
                context.achievementIds.has(
                    unlock.achievementId
                )
            );

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            return Boolean(
                unlock.rankName &&
                context.sinRank ===
                    unlock.rankName
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return Boolean(
                (
                    unlock.roleId &&
                    context.roleIds.has(
                        unlock.roleId
                    )
                ) ||
                (
                    unlock.roleName &&
                    context.roleNames.has(
                        unlock.roleName
                    )
                )
            );

        default:
            return false;
    }
}

function getUnlockSource(title) {
    const unlock =
        title?.unlock ??
        {};

    switch (unlock.type) {
        case TITLE_UNLOCK_TYPES.ACHIEVEMENT:
            return (
                `ACHIEVEMENT_${unlock.achievementId ?? 'UNKNOWN'}`
            );

        case TITLE_UNLOCK_TYPES.SIN_RANK:
            return (
                `SIN_RANK_${unlock.rankName ?? 'UNKNOWN'}`
            );

        case TITLE_UNLOCK_TYPES.STAFF_ROLE:
            return (
                `STAFF_ROLE_${unlock.roleId ?? unlock.roleName ?? 'UNKNOWN'}`
            );

        default:
            return 'AUTOMATIC';
    }
}function normalizeUnlockedTitles(
    unlockedTitles
) {
    if (
        !Array.isArray(
            unlockedTitles
        )
    ) {
        return [];
    }

    return unlockedTitles.filter(
        title =>
            TITLE_ID_SET.has(
                title.titleId
            )
    );
}

async function checkSoulTitles({
    guildId,
    userId,
    member
}) {
    if (
        typeof guildId !==
            'string' ||
        !guildId.trim()
    ) {
        throw new TypeError(
            'A guild ID is required to check Titles.'
        );
    }

    if (
        typeof userId !==
            'string' ||
        !userId.trim()
    ) {
        throw new TypeError(
            'A user ID is required to check Titles.'
        );
    }

    if (!member) {
        throw new TypeError(
            'A GuildMember is required to check Titles.'
        );
    }

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
                newlyUnlocked.push({
                    ...result.title,
                    ...title,

                    titleId:
                        title.id
                });
            }
        } catch (error) {
            console.error(
                `❌ Evelynn could not unlock Title ${title.id} for ${userId}:`,
                error
            );
        }
    }

    const unlockedTitles =
        normalizeUnlockedTitles(
            await titleDatabase
                .getSoulTitles(
                    guildId,
                    userId
                )
        );

    const activeTitle =
        unlockedTitles.find(
            title =>
                title.isActive
        ) ??
        null;

    return {
        context,
        newlyUnlocked,
        activeTitle,

        unlockedCount:
            unlockedTitles.length
    };
}

async function checkMemberTitles(member) {
    if (
        !member?.guild ||
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
            `❌ Evelynn Title check failed for ${member.id}:`,
            error
        );

        return null;
    }
}

async function checkMessageTitles(message) {
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
    getSafeAchievementIds,
    getSafeSinRank,
    createTitleContext,
    isTitleEligible,
    getUnlockSource,
    checkSoulTitles,
    checkMemberTitles,
    checkMessageTitles
};
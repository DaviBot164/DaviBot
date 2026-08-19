const rankConfig =
    require('./ranks');

/**
 * Public Title categories.
 *
 * SIN_RANK remains as an internal key
 * for compatibility.
 */
const TITLE_CATEGORIES = Object.freeze({
    ACHIEVEMENT:
        'Achievement',

    SIN_RANK:
        'Captain Rank',

    STAFF:
        'High Command'
});

/**
 * Title rarity levels.
 */
const TITLE_RARITIES = Object.freeze({
    COMMON:
        'Common',

    UNCOMMON:
        'Uncommon',

    RARE:
        'Rare',

    EPIC:
        'Epic',

    LEGENDARY:
        'Legendary',

    MYTHIC:
        'Mythic'
});

/**
 * Supported Title unlock methods.
 *
 * SIN_RANK remains unchanged because
 * existing systems may store this value.
 */
const TITLE_UNLOCK_TYPES = Object.freeze({
    ACHIEVEMENT:
        'ACHIEVEMENT',

    SIN_RANK:
        'SIN_RANK',

    STAFF_ROLE:
        'STAFF_ROLE'
});

/**
 * Achievement Title IDs remain unchanged
 * for database compatibility.
 */
const ACHIEVEMENT_TITLES = Object.freeze([
    {
        id:
            'first_voice',

        name:
            'SOUL AWAKENED',

        achievementId:
            'first_words',

        rarity:
            TITLE_RARITIES.COMMON
    },

    {
        id:
            'chronicle_awakened',

        name:
            'SOULBOUND',

        achievementId:
            'awakened_soul',

        rarity:
            TITLE_RARITIES.UNCOMMON
    },

    {
        id:
            'chronicle_riser',

        name:
            'SOUL ASCENDANT',

        achievementId:
            'rising_soul',

        rarity:
            TITLE_RARITIES.RARE
    },

    {
        id:
            'keeper_of_crimson_chronicles',

        name:
            'SOUL SOVEREIGN',

        achievementId:
            'crimson_soul',

        rarity:
            TITLE_RARITIES.EPIC
    },

    {
        id:
            'eternal_chronicle_keeper',

        name:
            'ETERNAL SOUL',

        achievementId:
            'eternal_soul',

        rarity:
            TITLE_RARITIES.LEGENDARY
    }
]);

/**
 * Legacy hierarchy keys remain unchanged
 * because Rank History may store them.
 */
const CAPTAIN_RANK_KEYS = Object.freeze([
    'dominion',
    'pride',
    'wrath',
    'envy',
    'greed',
    'lust',
    'gluttony',
    'sloth',
    'ruin',
    'heresy',
    'vengeance'
]);

const HIGH_COMMAND_TITLES = Object.freeze([
    {
        id:
            'lunar_sovereign',

        name:
            '♔・LUNAR SOVEREIGN',

        roleName:
            '♔・LUNAR SOVEREIGN',

        rarity:
            TITLE_RARITIES.MYTHIC
    },

    {
        id:
            'captain_commander',

        name:
            '⚔・CAPTAIN-COMMANDER',

        roleName:
            '⚔・CAPTAIN-COMMANDER',

        rarity:
            TITLE_RARITIES.LEGENDARY
    },

    {
        id:
            'captain',

        name:
            '🛡・CAPTAIN',

        roleName:
            '🛡・CAPTAIN',

        rarity:
            TITLE_RARITIES.EPIC
    },

    {
        id:
            'lieutenant',

        name:
            '◇・LIEUTENANT',

        roleName:
            '◇・LIEUTENANT',

        rarity:
            TITLE_RARITIES.RARE
    }
]);

function createAchievementTitles() {
    return ACHIEVEMENT_TITLES.map(
        title => ({
            id:
                title.id,

            name:
                title.name,

            displayName:
                title.name,

            description:
                `Unlocked by earning the ${title.name} achievement.`,

            category:
                TITLE_CATEGORIES.ACHIEVEMENT,

            rarity:
                title.rarity,

            unlock: {
                type:
                    TITLE_UNLOCK_TYPES.ACHIEVEMENT,

                achievementId:
                    title.achievementId
            }
        })
    );
}

function createCaptainRankTitles() {
    return CAPTAIN_RANK_KEYS.map(
        (
            rankKey,
            index
        ) => {
            const rank =
                rankConfig.hierarchy[
                    rankKey
                ];

            return {
                /**
                 * Stable legacy ID retained for
                 * existing database records.
                 */
                id:
                    `sin_of_${rankKey}`,

                name:
                    rank.name,

                displayName:
                    rank.name,

                description:
                    `Unlocked by receiving the ${rank.name} rank.`,

                category:
                    TITLE_CATEGORIES.SIN_RANK,

                rarity:
                    index === 0
                        ? TITLE_RARITIES.MYTHIC
                        : TITLE_RARITIES.LEGENDARY,

                unlock: {
                    type:
                        TITLE_UNLOCK_TYPES.SIN_RANK,

                    rankName:
                        rank.name,

                    roleId:
                        rank.id
                }
            };
        }
    );
}

function createHighCommandTitles() {
    const stableIds = {
        lunar_sovereign:
            'sin_heir',

        captain_commander:
            'head_of_sins',

        captain:
            'captain_of_sins',

        lieutenant:
            'sin_lieutenant'
    };

    const roleIds = {
        lunar_sovereign:
            rankConfig.highCommand.ruler,

        captain_commander:
            rankConfig.highCommand
                .headCaptain,

        captain:
            rankConfig.highCommand.captain
    };

    return HIGH_COMMAND_TITLES.map(
        title => ({
            id:
                stableIds[title.id],

            name:
                title.name,

            displayName:
                title.name,

            description:
                `Unlocked by holding the ${title.roleName} role.`,

            category:
                TITLE_CATEGORIES.STAFF,

            rarity:
                title.rarity,

            unlock: {
                type:
                    TITLE_UNLOCK_TYPES.STAFF_ROLE,

                roleName:
                    title.roleName,

                roleId:
                    roleIds[title.id] ??
                    null
            }
        })
    );
}

/**
 * Every active Title available inside
 * Lunar Seireitei.
 */
const TITLE_DEFINITIONS = Object.freeze([
    ...createAchievementTitles(),
    ...createCaptainRankTitles(),
    ...createHighCommandTitles()
]);

function getTitleDefinition(
    titleId
) {
    if (!titleId) {
        return null;
    }

    return (
        TITLE_DEFINITIONS.find(
            title =>
                title.id ===
                titleId
        ) ??
        null
    );
}

function getTitlesByCategory(
    category
) {
    if (!category) {
        return [];
    }

    return TITLE_DEFINITIONS.filter(
        title =>
            title.category ===
            category
    );
}

function getTitlesByUnlockType(
    unlockType
) {
    if (!unlockType) {
        return [];
    }

    return TITLE_DEFINITIONS.filter(
        title =>
            title.unlock?.type ===
            unlockType
    );
}

function getAllTitleDefinitions() {
    return TITLE_DEFINITIONS.map(
        title => ({
            ...title,

            unlock: {
                ...title.unlock
            }
        })
    );
}

function isValidTitleId(
    titleId
) {
    return Boolean(
        getTitleDefinition(
            titleId
        )
    );
}

module.exports = {
    TITLE_CATEGORIES,
    TITLE_RARITIES,
    TITLE_UNLOCK_TYPES,
    TITLE_DEFINITIONS,

    getTitleDefinition,
    getTitlesByCategory,
    getTitlesByUnlockType,
    getAllTitleDefinitions,
    isValidTitleId
};
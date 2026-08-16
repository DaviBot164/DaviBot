/**
 * THE Ⅹ SINS Title System.
 *
 * Titles are internal Soul Record rewards.
 * They are not Discord roles.
 *
 * Unlock types:
 * - DEFAULT
 * - LEVEL
 * - ACHIEVEMENT
 * - EVOLUTION
 * - SIN_RANK
 * - STAFF_ROLE
 * - MANUAL
 * - EVENT
 */

const TITLE_CATEGORIES = {
    GENERAL:
        'General',

    LEVEL:
        'Progression',

    ACHIEVEMENT:
        'Achievement',

    EVOLUTION:
        'Hollow Evolution',

    SIN_RANK:
        'Sin Rank',

    STAFF:
        'High Command',

    EVENT:
        'Event',

    LEGENDARY:
        'Legendary'
};

const TITLE_RARITIES = {
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
};

const TITLE_UNLOCK_TYPES = {
    DEFAULT:
        'DEFAULT',

    LEVEL:
        'LEVEL',

    ACHIEVEMENT:
        'ACHIEVEMENT',

    EVOLUTION:
        'EVOLUTION',

    SIN_RANK:
        'SIN_RANK',

    STAFF_ROLE:
        'STAFF_ROLE',

    MANUAL:
        'MANUAL',

    EVENT:
        'EVENT'
};

/**
 * Every Title available inside
 * THE Ⅹ SINS.
 */
const TITLE_DEFINITIONS = [
    /*
     * ======================================================
     * General Titles
     * ======================================================
     */
    {
        id:
            'nameless_soul',

        name:
            'Nameless Soul',

        displayName:
            '🌑 Nameless Soul',

        description:
            'The default designation of every newly recorded Soul.',

        category:
            TITLE_CATEGORIES.GENERAL,

        rarity:
            TITLE_RARITIES.COMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.DEFAULT
        }
    },

    {
        id:
            'resident_of_las_noches',

        name:
            'Resident of THE Ⅹ SINS',

        displayName:
            '✦ Resident of THE Ⅹ SINS',

        description:
            'A recognized Soul who has begun their journey within THE Ⅹ SINS.',

        category:
            TITLE_CATEGORIES.GENERAL,

        rarity:
            TITLE_RARITIES.COMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                1
        }
    },

    {
        id:
            'soul_of_the_white_sands',

        name:
            'Soul of the White Sands',

        displayName:
            '🏜️ Soul of the White Sands',

        description:
            'A Soul whose presence has become known across the endless sands.',

        category:
            TITLE_CATEGORIES.GENERAL,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                3
        }
    },

    {
        id:
            'moonlit_wanderer',

        name:
            'Moonlit Wanderer',

        displayName:
            '🌘 Moonlit Wanderer',

        description:
            'A wandering Soul guided by the quiet light of the night.',

        category:
            TITLE_CATEGORIES.GENERAL,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                7
        }
    },

    /*
     * ======================================================
     * Level and Progression Titles
     * ======================================================
     */
    {
        id:
            'awakened_soul',

        name:
            'The Awakened',

        displayName:
            '🌒 The Awakened',

        description:
            'Awarded to a Soul who reaches Level 5.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                5
        }
    },

    {
        id:
            'rising_soul',

        name:
            'Rising Soul',

        displayName:
            '⭐ Rising Soul',

        description:
            'Awarded to a Soul who reaches Level 10.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                10
        }
    },

    {
        id:
            'spiritual_ascendant',

        name:
            'Spiritual Ascendant',

        displayName:
            '✨ Spiritual Ascendant',

        description:
            'Awarded to a Soul who reaches Level 15.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                15
        }
    },

    {
        id:
            'crimson_soul',

        name:
            'Crimson Soul',

        displayName:
            '🌔 Crimson Soul',

        description:
            'Awarded to a Soul who reaches Level 25.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                25
        }
    },

    {
        id:
            'moon_forged',

        name:
            'Moon-Forged',

        displayName:
            '🌙 Moon-Forged',

        description:
            'Awarded to a Soul who reaches Level 35.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                35
        }
    },

    {
        id:
            'eternal_soul',

        name:
            'The Eternal Soul',

        displayName:
            '🌕 The Eternal Soul',

        description:
            'Awarded to a Soul who reaches Level 50.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                50
        }
    },

    {
        id:
            'transcendent_soul',

        name:
            'The Transcendent',

        displayName:
            '🌌 The Transcendent',

        description:
            'Awarded to a Soul who reaches Level 75.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                75
        }
    },

    {
        id:
            'limitless_reiatsu',

        name:
            'Limitless Reiatsu',

        displayName:
            '💠 Limitless Reiatsu',

        description:
            'Awarded to a Soul who reaches Level 100.',

        category:
            TITLE_CATEGORIES.LEVEL,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.LEVEL,

            level:
                100
        }
    },

    /*
     * ======================================================
     * Achievement Titles
     * ======================================================
     */    {
        id:
            'first_voice',

        name:
            'The First Voice',

        displayName:
            '🗣️ The First Voice',

        description:
            'Unlocked after recording the First Words Achievement.',

        category:
            TITLE_CATEGORIES.ACHIEVEMENT,

        rarity:
            TITLE_RARITIES.COMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ACHIEVEMENT,

            achievementId:
                'first_words'
        }
    },

    {
        id:
            'chronicle_awakened',

        name:
            'Chronicle Awakened',

        displayName:
            '📖 Chronicle Awakened',

        description:
            'Unlocked after recording the Awakened Soul Achievement.',

        category:
            TITLE_CATEGORIES.ACHIEVEMENT,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ACHIEVEMENT,

            achievementId:
                'awakened_soul'
        }
    },

    {
        id:
            'chronicle_riser',

        name:
            'Keeper of Rising Chronicles',

        displayName:
            '⭐ Keeper of Rising Chronicles',

        description:
            'Unlocked after recording the Rising Soul Achievement.',

        category:
            TITLE_CATEGORIES.ACHIEVEMENT,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ACHIEVEMENT,

            achievementId:
                'rising_soul'
        }
    },

    {
        id:
            'keeper_of_crimson_chronicles',

        name:
            'Keeper of Crimson Chronicles',

        displayName:
            '🌔 Keeper of Crimson Chronicles',

        description:
            'Unlocked after recording the Crimson Soul Achievement.',

        category:
            TITLE_CATEGORIES.ACHIEVEMENT,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ACHIEVEMENT,

            achievementId:
                'crimson_soul'
        }
    },

    {
        id:
            'eternal_chronicle_keeper',

        name:
            'Eternal Chronicle Keeper',

        displayName:
            '🌕 Eternal Chronicle Keeper',

        description:
            'Unlocked after recording the Eternal Soul Achievement.',

        category:
            TITLE_CATEGORIES.ACHIEVEMENT,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ACHIEVEMENT,

            achievementId:
                'eternal_soul'
        }
    },

    /*
     * ======================================================
     * Hollow Evolution Titles
     * ======================================================
     */
    {
        id:
            'hollow_born',

        name:
            'Hollow Born',

        displayName:
            '👁️ Hollow Born',

        description:
            'Unlocked by reaching the Hollow Evolution stage.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.COMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '👁️ Hollow'
        }
    },

    {
        id:
            'menos_colossus',

        name:
            'Menos Colossus',

        displayName:
            '🦴 Menos Colossus',

        description:
            'Unlocked by evolving into a Menos Grande.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '🦴 Menos Grande'
        }
    },

    {
        id:
            'gillian_of_the_void',

        name:
            'Gillian of the Void',

        displayName:
            '⚪ Gillian of the Void',

        description:
            'Unlocked by evolving into a Gillian.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '⚪ Gillian'
        }
    },

    {
        id:
            'adjuchas_predator',

        name:
            'Adjuchas Predator',

        displayName:
            '🐺 Adjuchas Predator',

        description:
            'Unlocked by evolving into an Adjuchas.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '🐺 Adjuchas'
        }
    },

    {
        id:
            'vasto_lorde',

        name:
            'Vasto Lorde',

        displayName:
            '👑 Vasto Lorde',

        description:
            'Unlocked by reaching the Vasto Lorde evolution stage.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '👑 Vasto Lorde'
        }
    },

    {
        id:
            'evolution_apex',

        name:
            'Apex of Evolution',

        displayName:
            '🌑 Apex of Evolution',

        description:
            'A Soul who has reached the highest known Hollow Evolution stage.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '👑 Vasto Lorde'
        }
    },

    /*
     * ======================================================
     * Sin Rank Titles
     * ======================================================
     */    {
        id:
            'sin_of_pride',

        name:
            'Sin of Pride',

        displayName:
            '👑 Sin of Pride',

        description:
            'The throne of Pride. A rank reserved for the Soul who stands above the others.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '👑 Sin of Pride'
        }
    },

    {
        id:
            'sin_of_wrath',

        name:
            'Sin of Wrath',

        displayName:
            '💧 Sin of Wrath',

        description:
            'The throne of Wrath. Power forged through relentless fury.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '💧 Sin of Wrath'
        }
    },

    {
        id:
            'sin_of_envy',

        name:
            'Sin of Envy',

        displayName:
            '🐍 Sin of Envy',

        description:
            'The throne of Envy. Always watching, always wanting more.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '🐍 Sin of Envy'
        }
    },

    {
        id:
            'sin_of_greed',

        name:
            'Sin of Greed',

        displayName:
            '💰 Sin of Greed',

        description:
            'The throne of Greed. Nothing is ever enough.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '💰 Sin of Greed'
        }
    },

    {
        id:
            'sin_of_lust',

        name:
            'Sin of Lust',

        displayName:
            '🖤 Sin of Lust',

        description:
            'The throne of Lust. Desire turned into power.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '🖤 Sin of Lust'
        }
    },

    {
        id:
            'sin_of_gluttony',

        name:
            'Sin of Gluttony',

        displayName:
            '🍷 Sin of Gluttony',

        description:
            'The throne of Gluttony. An endless hunger that refuses to fade.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '🍷 Sin of Gluttony'
        }
    },

    {
        id:
            'sin_of_sloth',

        name:
            'Sin of Sloth',

        displayName:
            '💤 Sin of Sloth',

        description:
            'The throne of Sloth. Quiet power that never needs to prove itself.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '💤 Sin of Sloth'
        }
    },

    {
        id:
            'sin_of_ruin',

        name:
            'Sin of Ruin',

        displayName:
            '☠️ Sin of Ruin',

        description:
            'The throne of Ruin. What stands today may not stand tomorrow.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '☠️ Sin of Ruin'
        }
    },

    {
        id:
            'sin_of_heresy',

        name:
            'Sin of Heresy',

        displayName:
            '⚜️ Sin of Heresy',

        description:
            'The throne of Heresy. A Soul who refuses to bow to convention.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '⚜️ Sin of Heresy'
        }
    },

    {
        id:
            'sin_of_vengeance',

        name:
            'Sin of Vengeance',

        displayName:
            '⚔️ Sin of Vengeance',

        description:
            'The throne of Vengeance. Every debt eventually comes due.',

        category:
            TITLE_CATEGORIES.SIN_RANK,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.SIN_RANK,

            rankName:
                '⚔️ Sin of Vengeance'
        }
    },

    /*
     * ======================================================
     * High Command Titles
     * ======================================================
     */    {
        id:
            'sin_heir',

        name:
            'Sin Heir',

        displayName:
            '👑 Sin Heir',

        description:
            'A chosen heir entrusted with authority within THE Ⅹ SINS.',

        category:
            TITLE_CATEGORIES.STAFF,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.STAFF_ROLE,

            roleName:
                '👑 Ruler of THE Ⅹ SINS'
        }
    },

    {
        id:
            'head_of_sins',

        name:
            'Head of Sins',

        displayName:
            '⚜️ Head of Sins',

        description:
            'A high-ranking authority trusted to assist in governing THE Ⅹ SINS.',

        category:
            TITLE_CATEGORIES.STAFF,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.STAFF_ROLE,

            roleName:
                '⚜️ Head Captain'
        }
    },

    {
        id:
            'captain_of_sins',

        name:
            'Captain of Sins',

        displayName:
            '🛡️ Captain of Sins',

        description:
            'A captain entrusted with maintaining order and protecting the Sins.',

        category:
            TITLE_CATEGORIES.STAFF,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.STAFF_ROLE,

            roleName:
                '🛡️ Captain'
        }
    },

    {
        id:
            'sin_lieutenant',

        name:
            'Sin Lieutenant',

        displayName:
            '⚔️ Sin Lieutenant',

        description:
            'A trusted officer responsible for assisting the High Command.',

        category:
            TITLE_CATEGORIES.STAFF,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.STAFF_ROLE,

            roleName:
                '⚔️ Lieutenant'
        }
    },

    /*
     * ======================================================
     * Event Titles
     * ======================================================
     */    {
        id:
            'event_participant',

        name:
            'Realm Challenger',

        displayName:
            '🎮 Realm Challenger',

        description:
            'Awarded for participation in an official THE Ⅹ SINS event.',

        category:
            TITLE_CATEGORIES.EVENT,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVENT,

            eventRequirement:
                'PARTICIPATION'
        }
    },

    {
        id:
            'event_champion',

        name:
            'Champion of the Sins',

        displayName:
            '🏆 Champion of the Sins',

        description:
            'Awarded to the winner of an official THE Ⅹ SINS event.',

        category:
            TITLE_CATEGORIES.EVENT,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVENT,

            eventRequirement:
                'WINNER'
        }
    },

    /*
     * ======================================================
     * Manual and Legendary Titles
     * ======================================================
     */
    {
        id:
            'moon_chosen',

        name:
            'The Chosen',

        displayName:
            '✦ The Chosen',

        description:
            'A rare Title personally granted by the High Command.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    },

    {
        id:
            'silent_blade',

        name:
            'The Silent Blade',

        displayName:
            '🗡️ The Silent Blade',

        description:
            'A special Title granted to a disciplined and deadly Soul.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    },

    {
        id:
            'unbroken_soul',

        name:
            'The Unbroken',

        displayName:
            '⛓️ The Unbroken',

        description:
            'A legendary Title for a Soul who refuses to fall.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    },

    {
        id:
            'witness_of_evolution',

        name:
            'Witness of Evolution',

        displayName:
            '👁️ Witness of Evolution',

        description:
            'A special Title for a Soul who has witnessed extraordinary spiritual growth.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    },

    {
        id:
            'guardian_of_the_sins',

        name:
            'Guardian of the Sins',

        displayName:
            '🛡️ Guardian of the Sins',

        description:
            'A unique designation reserved for the guardian of THE Ⅹ SINS.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    }
];/**
 * Get one Title definition by ID.
 *
 * @param {string} titleId
 * @returns {Object|null}
 */
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
        ) ||
        null
    );
}

/**
 * Get every Title belonging to
 * one category.
 *
 * @param {string} category
 * @returns {Object[]}
 */
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

/**
 * Get every Title that can be
 * unlocked through one unlock type.
 *
 * @param {string} unlockType
 * @returns {Object[]}
 */
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

/**
 * Check whether a Title ID exists.
 *
 * @param {string} titleId
 * @returns {boolean}
 */
function isValidTitleId(
    titleId
) {
    return Boolean(
        getTitleDefinition(
            titleId
        )
    );
}

/**
 * Return a safe copy of every
 * configured Title definition.
 *
 * @returns {Object[]}
 */
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
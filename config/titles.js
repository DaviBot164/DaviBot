/**
 * Umbra Title System configuration.
 *
 * Titles are internal Soul Record rewards.
 * They are not Discord roles.
 *
 * Unlock types:
 *
 * DEFAULT
 * LEVEL
 * ACHIEVEMENT
 * EVOLUTION
 * ARRANCAR_RANK
 * STAFF_ROLE
 * MANUAL
 * EVENT
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

    ARRANCAR:
        'Arrancar Hierarchy',

    ESPADA:
        'Espada',

    STAFF:
        'High Command',

    EVENT:
        'Event',

    LEGENDARY:
        'Legendary'
};

/**
 * Title rarity levels.
 */
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

/**
 * Title unlock requirement types.
 */
const TITLE_UNLOCK_TYPES = {
    DEFAULT:
        'DEFAULT',

    LEVEL:
        'LEVEL',

    ACHIEVEMENT:
        'ACHIEVEMENT',

    EVOLUTION:
        'EVOLUTION',

    ARRANCAR_RANK:
        'ARRANCAR_RANK',

    STAFF_ROLE:
        'STAFF_ROLE',

    MANUAL:
        'MANUAL',

    EVENT:
        'EVENT'
};

/**
 * Every Title available inside Umbra.
 *
 * Each Title contains:
 *
 * id:
 * Unique internal identifier.
 *
 * name:
 * Plain Title name.
 *
 * displayName:
 * Title displayed inside /soul.
 *
 * description:
 * Explanation shown inside /titles.
 *
 * category:
 * Title category.
 *
 * rarity:
 * Cosmetic rarity.
 *
 * unlock:
 * Requirement used by the Title Handler.
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
            'Resident of Las Noches',

        displayName:
            '🌙 Resident of Las Noches',

        description:
            'A recognized Soul living beneath the eternal moon.',

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
            'A wandering Soul guided by the pale moon of Las Noches.',

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
     */
    {
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
            'lord_of_hollows',

        name:
            'Lord of Hollows',

        displayName:
            '👑 Lord of Hollows',

        description:
            'Unlocked by evolving into a Vasto Lorde.',

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
            'perfect_arrancar',

        name:
            'The Perfect Arrancar',

        displayName:
            '⚔️ The Perfect Arrancar',

        description:
            'Unlocked after reaching the final Hollow Evolution stage.',

        category:
            TITLE_CATEGORIES.EVOLUTION,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.EVOLUTION,

            roleName:
                '⚔️ Arrancar'
        }
    },

    /*
     * ======================================================
     * Arrancar Hierarchy Titles
     * ======================================================
     */
    {
        id:
            'unranked_arrancar',

        name:
            'Unranked Arrancar',

        displayName:
            '⚪ Unranked Arrancar',

        description:
            'Unlocked after receiving the first official Arrancar classification.',

        category:
            TITLE_CATEGORIES.ARRANCAR,

        rarity:
            TITLE_RARITIES.COMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                '⚪ Unranked Arrancar'
        }
    },
    {
        id:
            'numbered_soul',

        name:
            'Numbered Soul',

        displayName:
            '🦴 Numbered Soul',

        description:
            'Unlocked after receiving the Numeros Rank.',

        category:
            TITLE_CATEGORIES.ARRANCAR,

        rarity:
            TITLE_RARITIES.UNCOMMON,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                '🦴 Numeros'
        }
    },
    {
        id:
            'blade_of_the_espada',

        name:
            'Blade of the Espada',

        displayName:
            '⚔️ Blade of the Espada',

        description:
            'Unlocked after joining an Espada’s Fracción.',

        category:
            TITLE_CATEGORIES.ARRANCAR,

        rarity:
            TITLE_RARITIES.RARE,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                '⚔️ Fracción'
        }
    },
    {
        id:
            'fallen_espada',

        name:
            'The Fallen Espada',

        displayName:
            '🌘 The Fallen Espada',

        description:
            'Unlocked after receiving the Privaron Espada Rank.',

        category:
            TITLE_CATEGORIES.ARRANCAR,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                '🌘 Privaron Espada'
        }
    },

    /*
     * ======================================================
     * Espada Titles
     * ======================================================
     */
    {
        id:
            'tenth_throne',

        name:
            'Bearer of the Tenth Throne',

        displayName:
            'Ⅹ Bearer of the Tenth Throne',

        description:
            'Unlocked after becoming the Tenth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅹ Espada'
        }
    },
    {
        id:
            'ninth_throne',

        name:
            'Bearer of the Ninth Throne',

        displayName:
            'Ⅸ Bearer of the Ninth Throne',

        description:
            'Unlocked after becoming the Ninth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅸ Espada'
        }
    },
    {
        id:
            'eighth_throne',

        name:
            'Bearer of the Eighth Throne',

        displayName:
            'Ⅷ Bearer of the Eighth Throne',

        description:
            'Unlocked after becoming the Eighth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅷ Espada'
        }
    },
    {
        id:
            'seventh_throne',

        name:
            'Bearer of the Seventh Throne',

        displayName:
            'Ⅶ Bearer of the Seventh Throne',

        description:
            'Unlocked after becoming the Seventh Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅶ Espada'
        }
    },
    {
        id:
            'sixth_throne',

        name:
            'Bearer of the Sixth Throne',

        displayName:
            'Ⅵ Bearer of the Sixth Throne',

        description:
            'Unlocked after becoming the Sixth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.EPIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅵ Espada'
        }
    },
    {
        id:
            'fifth_throne',

        name:
            'Bearer of the Fifth Throne',

        displayName:
            'Ⅴ Bearer of the Fifth Throne',

        description:
            'Unlocked after becoming the Fifth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅴ Espada'
        }
    },
    {
        id:
            'fourth_throne',

        name:
            'Bearer of the Fourth Throne',

        displayName:
            'Ⅳ Bearer of the Fourth Throne',

        description:
            'Unlocked after becoming the Fourth Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅳ Espada'
        }
    },
    {
        id:
            'third_throne',

        name:
            'Bearer of the Third Throne',

        displayName:
            'Ⅲ Bearer of the Third Throne',

        description:
            'Unlocked after becoming the Third Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅲ Espada'
        }
    },
    {
        id:
            'second_throne',

        name:
            'Bearer of the Second Throne',

        displayName:
            'Ⅱ Bearer of the Second Throne',

        description:
            'Unlocked after becoming the Second Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.LEGENDARY,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅱ Espada'
        }
    },
    {
        id:
            'first_throne',

        name:
            'Bearer of the First Throne',

        displayName:
            'Ⅰ Bearer of the First Throne',

        description:
            'Unlocked after becoming the First Espada.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                'Ⅰ Espada'
        }
    },
    {
        id:
            'cero_espada',

        name:
            'The Cero Espada',

        displayName:
            '👑 The Cero Espada',

        description:
            'Unlocked after claiming the hidden throne of Espada 0.',

        category:
            TITLE_CATEGORIES.ESPADA,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.ARRANCAR_RANK,

            rankName:
                '👑 Espada 0'
        }
    },

    /*
     * ======================================================
     * High Command Titles
     * ======================================================
     */
    {
        id:
            'lieutenant_of_las_noches',

        name:
            'Lieutenant of Las Noches',

        displayName:
            '⚔️ Lieutenant of Las Noches',

        description:
            'Reserved for recognized Lieutenants of the kingdom.',

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
    {
        id:
            'captain_of_las_noches',

        name:
            'Captain of Las Noches',

        displayName:
            '🛡️ Captain of Las Noches',

        description:
            'Reserved for recognized Captains of the kingdom.',

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
            'head_captain',

        name:
            'The Head Captain',

        displayName:
            '⚜️ The Head Captain',

        description:
            'Reserved for the Head Captain of Las Noches.',

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
            'ruler_of_las_noches',

        name:
            'Ruler of Las Noches',

        displayName:
            '👑 Ruler of Las Noches',

        description:
            'The sovereign Title of the kingdom’s ruler.',

        category:
            TITLE_CATEGORIES.STAFF,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.STAFF_ROLE,

            roleName:
                '👑 Ruler of Las Noches',

            ownerFallback:
                true
        }
    },

    /*
     * ======================================================
     * Event Titles
     * ======================================================
     */
    {
        id:
            'event_participant',

        name:
            'Realm Challenger',

        displayName:
            '🎮 Realm Challenger',

        description:
            'Awarded for participation in an official Las Noches event.',

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
            'Champion of the Realms',

        displayName:
            '🏆 Champion of the Realms',

        description:
            'Awarded to the winner of an official Las Noches event.',

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
            'The Moon’s Chosen',

        displayName:
            '🌙 The Moon’s Chosen',

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
            'A special Title for those who have witnessed extraordinary spiritual growth.',

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
            'guardian_of_las_noches',

        name:
            'Guardian of Las Noches',

        displayName:
            '🌙 Guardian of Las Noches',

        description:
            'A unique designation reserved for the eternal guardian of the kingdom.',

        category:
            TITLE_CATEGORIES.LEGENDARY,

        rarity:
            TITLE_RARITIES.MYTHIC,

        unlock: {
            type:
                TITLE_UNLOCK_TYPES.MANUAL
        }
    }
];

/**
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
    return TITLE_DEFINITIONS.filter(
        title =>
            title.category ===
            category
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
    getAllTitleDefinitions,
    isValidTitleId
};
const {
    query
} = require('./connection');

const {
    TITLE_DEFINITIONS,
    getTitleDefinition,
    isValidTitleId
} = require('../config/titles');

/**
 * Convert a PostgreSQL Title definition
 * row into Umbra's Title structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapTitleDefinitionRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        id:
            row.title_id,

        name:
            row.name,

        displayName:
            row.display_name,

        description:
            row.description,

        category:
            row.category,

        rarity:
            row.rarity,

        unlockType:
            row.unlock_type,

        unlockData:
            row.unlock_data &&
            typeof row.unlock_data ===
                'object'
                ? row.unlock_data
                : {},

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                )
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                    row.updated_at
                )
                : null
    };
}

/**
 * Convert a Soul Title row into
 * Umbra's unlocked Title structure.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapSoulTitleRow(
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

        titleId:
            row.title_id,

        name:
            row.name,

        displayName:
            row.display_name,

        description:
            row.description,

        category:
            row.category,

        rarity:
            row.rarity,

        unlockType:
            row.unlock_type,

        unlockData:
            row.unlock_data &&
            typeof row.unlock_data ===
                'object'
                ? row.unlock_data
                : {},

        unlockedBy:
            row.unlocked_by,

        unlockSource:
            row.unlock_source,

        isActive:
            Boolean(
                row.is_active
            ),

        unlockedAt:
            row.unlocked_at
                ? new Date(
                    row.unlocked_at
                )
                : null,

        activatedAt:
            row.activated_at
                ? new Date(
                    row.activated_at
                )
                : null
    };
}

/**
 * Create or update every configured
 * Umbra Title definition.
 *
 * This function is safe to run whenever
 * Umbra starts.
 *
 * @returns {Promise<number>}
 */
async function initializeTitles() {
    for (
        const title
        of TITLE_DEFINITIONS
    ) {
        await query(
            `
                INSERT INTO title_definitions (
                    title_id,
                    name,
                    display_name,
                    description,
                    category,
                    rarity,
                    unlock_type,
                    unlock_data,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8::JSONB,
                    NOW()
                )

                ON CONFLICT (
                    title_id
                )

                DO UPDATE SET
                    name =
                        EXCLUDED.name,

                    display_name =
                        EXCLUDED.display_name,

                    description =
                        EXCLUDED.description,

                    category =
                        EXCLUDED.category,

                    rarity =
                        EXCLUDED.rarity,

                    unlock_type =
                        EXCLUDED.unlock_type,

                    unlock_data =
                        EXCLUDED.unlock_data,

                    updated_at =
                        NOW();
            `,
            [
                title.id,
                title.name,
                title.displayName,
                title.description,
                title.category,
                title.rarity,
                title.unlock.type,
                JSON.stringify(
                    title.unlock
                )
            ]
        );
    }

    return TITLE_DEFINITIONS.length;
}

/**
 * Get one Title definition.
 *
 * @param {string} titleId
 * @returns {Promise<Object|null>}
 */
async function getTitle(
    titleId
) {
    const result =
        await query(
            `
                SELECT
                    title_id,
                    name,
                    display_name,
                    description,
                    category,
                    rarity,
                    unlock_type,
                    unlock_data,
                    created_at,
                    updated_at

                FROM title_definitions

                WHERE title_id = $1

                LIMIT 1;
            `,
            [
                titleId
            ]
        );

    return mapTitleDefinitionRow(
        result.rows[0] ||
        null
    );
}

/**
 * Get every configured Title.
 *
 * @returns {Promise<Object[]>}
 */
async function getAllTitles() {
    const result =
        await query(
            `
                SELECT
                    title_id,
                    name,
                    display_name,
                    description,
                    category,
                    rarity,
                    unlock_type,
                    unlock_data,
                    created_at,
                    updated_at

                FROM title_definitions

                ORDER BY
                    category ASC,
                    rarity ASC,
                    created_at ASC,
                    title_id ASC;
            `
        );

    return result.rows.map(
        mapTitleDefinitionRow
    );
}

/**
 * Get every Title definition belonging
 * to one category.
 *
 * @param {string} category
 * @returns {Promise<Object[]>}
 */
async function getTitlesByCategory(
    category
) {
    const result =
        await query(
            `
                SELECT
                    title_id,
                    name,
                    display_name,
                    description,
                    category,
                    rarity,
                    unlock_type,
                    unlock_data,
                    created_at,
                    updated_at

                FROM title_definitions

                WHERE category = $1

                ORDER BY
                    rarity ASC,
                    created_at ASC,
                    title_id ASC;
            `,
            [
                category
            ]
        );

    return result.rows.map(
        mapTitleDefinitionRow
    );
}

/**
 * Count every configured Title.
 *
 * @returns {Promise<number>}
 */
async function countAllTitles() {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS title_count

                FROM title_definitions;
            `
        );

    return Number(
        result.rows[0]
            ?.title_count || 0
    );
}

/**
 * Check whether one Soul has already
 * unlocked a specific Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} titleId
 * @returns {Promise<boolean>}
 */
async function hasSoulTitle(
    guildId,
    userId,
    titleId
) {
    const result =
        await query(
            `
                SELECT 1

                FROM soul_titles

                WHERE guild_id = $1
                  AND user_id = $2
                  AND title_id = $3

                LIMIT 1;
            `,
            [
                guildId,
                userId,
                titleId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Get one unlocked Soul Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} titleId
 * @returns {Promise<Object|null>}
 */
async function getSoulTitle(
    guildId,
    userId,
    titleId
) {
    const result =
        await query(
            `
                SELECT
                    soul_titles.guild_id,
                    soul_titles.user_id,
                    soul_titles.title_id,
                    soul_titles.unlocked_by,
                    soul_titles.unlock_source,
                    soul_titles.is_active,
                    soul_titles.unlocked_at,
                    soul_titles.activated_at,

                    title_definitions.name,
                    title_definitions.display_name,
                    title_definitions.description,
                    title_definitions.category,
                    title_definitions.rarity,
                    title_definitions.unlock_type,
                    title_definitions.unlock_data

                FROM soul_titles

                INNER JOIN title_definitions
                    ON title_definitions.title_id =
                        soul_titles.title_id

                WHERE soul_titles.guild_id = $1
                  AND soul_titles.user_id = $2
                  AND soul_titles.title_id = $3

                LIMIT 1;
            `,
            [
                guildId,
                userId,
                titleId
            ]
        );

    return mapSoulTitleRow(
        result.rows[0] ||
        null
    );
}

/**
 * Get every Title unlocked by one Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getSoulTitles(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    soul_titles.guild_id,
                    soul_titles.user_id,
                    soul_titles.title_id,
                    soul_titles.unlocked_by,
                    soul_titles.unlock_source,
                    soul_titles.is_active,
                    soul_titles.unlocked_at,
                    soul_titles.activated_at,

                    title_definitions.name,
                    title_definitions.display_name,
                    title_definitions.description,
                    title_definitions.category,
                    title_definitions.rarity,
                    title_definitions.unlock_type,
                    title_definitions.unlock_data

                FROM soul_titles

                INNER JOIN title_definitions
                    ON title_definitions.title_id =
                        soul_titles.title_id

                WHERE soul_titles.guild_id = $1
                  AND soul_titles.user_id = $2

                ORDER BY
                    soul_titles.is_active DESC,
                    soul_titles.unlocked_at DESC,
                    title_definitions.category ASC,
                    title_definitions.name ASC;
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows.map(
        mapSoulTitleRow
    );
}

/**
 * Get one Soul's active Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getActiveTitle(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    soul_titles.guild_id,
                    soul_titles.user_id,
                    soul_titles.title_id,
                    soul_titles.unlocked_by,
                    soul_titles.unlock_source,
                    soul_titles.is_active,
                    soul_titles.unlocked_at,
                    soul_titles.activated_at,

                    title_definitions.name,
                    title_definitions.display_name,
                    title_definitions.description,
                    title_definitions.category,
                    title_definitions.rarity,
                    title_definitions.unlock_type,
                    title_definitions.unlock_data

                FROM soul_titles

                INNER JOIN title_definitions
                    ON title_definitions.title_id =
                        soul_titles.title_id

                WHERE soul_titles.guild_id = $1
                  AND soul_titles.user_id = $2
                  AND soul_titles.is_active = TRUE

                ORDER BY
                    soul_titles.activated_at DESC

                LIMIT 1;
            `,
            [
                guildId,
                userId
            ]
        );

    return mapSoulTitleRow(
        result.rows[0] ||
        null
    );
}/**
 * Unlock one Title for a Soul.
 *
 * The same Title can never be unlocked
 * twice by the same Soul in one server.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {string} options.titleId
 * @param {string|null} [options.unlockedBy]
 * @param {string} [options.unlockSource]
 * @param {boolean} [options.activate]
 * @returns {Promise<{
 *     unlocked: boolean,
 *     title: Object|null
 * }>}
 */
async function unlockSoulTitle({
    guildId,
    userId,
    titleId,
    unlockedBy = null,
    unlockSource = 'AUTOMATIC',
    activate = false
}) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to unlock a Title.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to unlock a Title.'
        );
    }

    if (!titleId) {
        throw new TypeError(
            'A Title ID is required.'
        );
    }

    if (
        !isValidTitleId(
            titleId
        )
    ) {
        throw new Error(
            `Unknown Umbra Title: ${titleId}`
        );
    }

    const definition =
        getTitleDefinition(
            titleId
        );

    if (!definition) {
        return {
            unlocked:
                false,

            title:
                null
        };
    }

    const safeSource =
        String(
            unlockSource ||
            'AUTOMATIC'
        )
            .trim()
            .slice(
                0,
                100
            ) ||
        'AUTOMATIC';

    /*
     * Insert the unlocked Title first
     * as an inactive record.
     *
     * Activation is handled separately
     * afterward by setActiveTitle().
     */
    const result =
        await query(
            `
                INSERT INTO soul_titles (
                    guild_id,
                    user_id,
                    title_id,
                    unlocked_by,
                    unlock_source,
                    is_active,
                    activated_at
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    FALSE,
                    NULL
                )

                ON CONFLICT (
                    guild_id,
                    user_id,
                    title_id
                )

                DO NOTHING

                RETURNING
                    guild_id,
                    user_id,
                    title_id,
                    unlocked_by,
                    unlock_source,
                    is_active,
                    unlocked_at,
                    activated_at;
            `,
            [
                guildId,
                userId,
                titleId,
                unlockedBy,
                safeSource
            ]
        );

    const wasUnlocked =
        result.rows.length >
        0;

    if (activate) {
        const activatedTitle =
            await setActiveTitle(
                guildId,
                userId,
                titleId
            );

        return {
            unlocked:
                wasUnlocked,

            title:
                activatedTitle
        };
    }

    const title =
        await getSoulTitle(
            guildId,
            userId,
            titleId
        );

    return {
        unlocked:
            wasUnlocked,

        title
    };
}

/**
 * Ensure that the default Nameless Soul
 * Title is unlocked.
 *
 * It becomes active only when the Soul
 * currently has no active Title.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function ensureDefaultSoulTitle(
    guildId,
    userId
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to ensure a default Title.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to ensure a default Title.'
        );
    }

    const defaultTitleId =
        'nameless_soul';

    const alreadyUnlocked =
        await hasSoulTitle(
            guildId,
            userId,
            defaultTitleId
        );

    if (!alreadyUnlocked) {
        await unlockSoulTitle({
            guildId,
            userId,

            titleId:
                defaultTitleId,

            unlockedBy:
                null,

            unlockSource:
                'DEFAULT',

            activate:
                false
        });
    }

    const activeTitle =
        await getActiveTitle(
            guildId,
            userId
        );

    if (activeTitle) {
        return activeTitle;
    }

    return setActiveTitle(
        guildId,
        userId,
        defaultTitleId
    );
}

/**
 * Set one already-unlocked Title as
 * the Soul's active Title.
 *
 * The previous active Title is deactivated
 * before the selected Title is activated.
 *
 * This fixes PostgreSQL error 23505 from
 * soul_titles_one_active_title_index.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} titleId
 * @returns {Promise<Object|null>}
 */
async function setActiveTitle(
    guildId,
    userId,
    titleId
) {
    if (!guildId) {
        throw new TypeError(
            'A guild ID is required to activate a Title.'
        );
    }

    if (!userId) {
        throw new TypeError(
            'A user ID is required to activate a Title.'
        );
    }

    if (
        !isValidTitleId(
            titleId
        )
    ) {
        throw new Error(
            `Unknown Umbra Title: ${titleId}`
        );
    }

    const unlocked =
        await hasSoulTitle(
            guildId,
            userId,
            titleId
        );

    if (!unlocked) {
        return null;
    }

    const currentActiveTitle =
        await getActiveTitle(
            guildId,
            userId
        );

    if (
        currentActiveTitle?.titleId ===
        titleId
    ) {
        return currentActiveTitle;
    }

    /*
     * First remove the active state from
     * every currently active Title.
     *
     * This query must complete before
     * the next activation query starts.
     */
    await query(
        `
            UPDATE soul_titles

            SET
                is_active = FALSE,
                activated_at = NULL

            WHERE guild_id = $1
              AND user_id = $2
              AND is_active = TRUE;
        `,
        [
            guildId,
            userId
        ]
    );

    /*
     * Activate the requested unlocked Title.
     */
    const result =
        await query(
            `
                UPDATE soul_titles

                SET
                    is_active = TRUE,
                    activated_at = NOW()

                WHERE guild_id = $1
                  AND user_id = $2
                  AND title_id = $3

                RETURNING
                    title_id;
            `,
            [
                guildId,
                userId,
                titleId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        /*
         * The selected Title unexpectedly
         * disappeared after the validation.
         *
         * Restore Nameless Soul if possible.
         */
        if (
            titleId !==
            'nameless_soul'
        ) {
            await ensureDefaultSoulTitle(
                guildId,
                userId
            );
        }

        return null;
    }

    return getActiveTitle(
        guildId,
        userId
    );
}

/**
 * Remove the currently active Title.
 *
 * The Title remains unlocked and may
 * be selected again later.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function clearActiveTitle(
    guildId,
    userId
) {
    const currentTitle =
        await getActiveTitle(
            guildId,
            userId
        );

    if (!currentTitle) {
        return null;
    }

    await query(
        `
            UPDATE soul_titles

            SET
                is_active = FALSE,
                activated_at = NULL

            WHERE guild_id = $1
              AND user_id = $2
              AND is_active = TRUE;
        `,
        [
            guildId,
            userId
        ]
    );

    return currentTitle;
}

/**
 * Count every Title unlocked
 * by one Soul.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function countSoulTitles(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER
                        AS title_count

                FROM soul_titles

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
            ?.title_count || 0
    );
}

/**
 * Revoke one unlocked Title.
 *
 * Intended for manually granted Titles
 * and future administrator commands.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {string} titleId
 * @returns {Promise<Object|null>}
 */
async function revokeSoulTitle(
    guildId,
    userId,
    titleId
) {
    const existingTitle =
        await getSoulTitle(
            guildId,
            userId,
            titleId
        );

    if (!existingTitle) {
        return null;
    }

    await query(
        `
            DELETE FROM soul_titles

            WHERE guild_id = $1
              AND user_id = $2
              AND title_id = $3;
        `,
        [
            guildId,
            userId,
            titleId
        ]
    );

    if (
        titleId !==
        'nameless_soul'
    ) {
        const remainingActiveTitle =
            await getActiveTitle(
                guildId,
                userId
            );

        if (!remainingActiveTitle) {
            await ensureDefaultSoulTitle(
                guildId,
                userId
            );
        }
    }

    return existingTitle;
}/**
 * Remove every unlocked Title belonging
 * to one Soul.
 *
 * The default Title is restored afterward.
 *
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function resetSoulTitles(
    guildId,
    userId
) {
    const result =
        await query(
            `
                DELETE FROM soul_titles

                WHERE guild_id = $1
                  AND user_id = $2

                RETURNING
                    title_id;
            `,
            [
                guildId,
                userId
            ]
        );

    await ensureDefaultSoulTitle(
        guildId,
        userId
    );

    return result.rows.length;
}

/**
 * Unlock multiple Titles for one Soul.
 *
 * Useful for automatic checks after
 * Level, Achievement, Evolution or
 * Arrancar Rank updates.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {string[]} options.titleIds
 * @param {string|null} [options.unlockedBy]
 * @param {string} [options.unlockSource]
 * @returns {Promise<Object[]>}
 */
async function unlockSoulTitles({
    guildId,
    userId,
    titleIds,
    unlockedBy = null,
    unlockSource = 'AUTOMATIC'
}) {
    const uniqueTitleIds =
        [
            ...new Set(
                Array.isArray(
                    titleIds
                )
                    ? titleIds
                    : []
            )
        ];

    const newlyUnlocked =
        [];

    for (
        const titleId
        of uniqueTitleIds
    ) {
        if (
            !isValidTitleId(
                titleId
            )
        ) {
            continue;
        }

        const result =
            await unlockSoulTitle({
                guildId,
                userId,
                titleId,
                unlockedBy,
                unlockSource,

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
    }

    return newlyUnlocked;
}

/**
 * Get Title System statistics
 * for one server.
 *
 * @param {string} guildId
 * @returns {Promise<Object>}
 */
async function getGuildTitleStatistics(
    guildId
) {
    const result =
        await query(
            `
                SELECT
                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM title_definitions
                    ) AS available_titles,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS total_unlocks,

                    (
                        SELECT
                            COUNT(
                                DISTINCT user_id
                            )::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                    ) AS souls_with_titles,

                    (
                        SELECT
                            COUNT(*)::INTEGER

                        FROM soul_titles

                        WHERE guild_id = $1
                          AND is_active = TRUE
                    ) AS active_titles;
            `,
            [
                guildId
            ]
        );

    const row =
        result.rows[0] ||
        {};

    return {
        availableTitles:
            Number(
                row.available_titles || 0
            ),

        totalUnlocks:
            Number(
                row.total_unlocks || 0
            ),

        soulsWithTitles:
            Number(
                row.souls_with_titles || 0
            ),

        activeTitles:
            Number(
                row.active_titles || 0
            )
    };
}

module.exports = {
    initializeTitles,

    getTitle,
    getAllTitles,
    getTitlesByCategory,
    countAllTitles,

    hasSoulTitle,
    getSoulTitle,
    getSoulTitles,
    getActiveTitle,
    countSoulTitles,

    unlockSoulTitle,
    unlockSoulTitles,
    ensureDefaultSoulTitle,

    setActiveTitle,
    clearActiveTitle,

    revokeSoulTitle,
    resetSoulTitles,

    getGuildTitleStatistics
};
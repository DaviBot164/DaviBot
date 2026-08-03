const {
    query
} = require('./connection');

/**
 * Convert one Rank Trial publication row
 * into the format used by Umbra.
 *
 * @param {Object} row
 * @returns {Object}
 */
function mapPublicationRow(
    row
) {
    return {
        id:
            Number(
                row.id
            ),

        guildId:
            row.guild_id,

        trialKey:
            row.trial_key,

        publicationType:
            row.publication_type,

        channelId:
            row.channel_id,

        messageId:
            row.message_id,

        scheduledFor:
            row.scheduled_for
                ? new Date(
                    row.scheduled_for
                )
                : null,

        publishedAt:
            row.published_at
                ? new Date(
                    row.published_at
                )
                : null,

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                )
                : null
    };
}

/**
 * Build the permanent identifier used for
 * one monthly Rank Trial.
 *
 * Example:
 *
 * 2026-08
 *
 * @param {number} year
 * @param {number} month
 * @returns {string}
 */
function buildTrialKey(
    year,
    month
) {
    const safeYear =
        Number(
            year
        );

    const safeMonth =
        Number(
            month
        );

    if (
        !Number.isInteger(
            safeYear
        ) ||
        !Number.isInteger(
            safeMonth
        ) ||
        safeMonth < 1 ||
        safeMonth > 12
    ) {
        throw new TypeError(
            'Invalid Rank Trial year or month.'
        );
    }

    return (
        `${safeYear}-` +
        String(
            safeMonth
        ).padStart(
            2,
            '0'
        )
    );
}

/**
 * Check whether one monthly Rank Trial
 * publication already exists.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} publicationType
 * @returns {Promise<boolean>}
 */
async function hasPublication(
    guildId,
    trialKey,
    publicationType
) {
    const result =
        await query(
            `
                SELECT 1
                FROM rank_trial_publications
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND publication_type = $3
                LIMIT 1;
            `,
            [
                guildId,
                trialKey,
                publicationType
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Atomically reserve one Rank Trial
 * publication before sending it to Discord.
 *
 * This protects Umbra from duplicate posts
 * when multiple checks happen at the same time
 * or after a restart/redeploy.
 *
 * @param {Object} publicationData
 * @param {string} publicationData.guildId
 * @param {string} publicationData.trialKey
 * @param {string} publicationData.publicationType
 * @param {string} publicationData.channelId
 * @param {Date} publicationData.scheduledFor
 * @returns {Promise<Object|null>}
 */
async function reservePublication(
    publicationData
) {
    const result =
        await query(
            `
                INSERT INTO rank_trial_publications (
                    guild_id,
                    trial_key,
                    publication_type,
                    channel_id,
                    scheduled_for
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                ON CONFLICT (
                    guild_id,
                    trial_key,
                    publication_type
                )
                DO NOTHING
                RETURNING *;
            `,
            [
                publicationData.guildId,
                publicationData.trialKey,
                publicationData.publicationType,
                publicationData.channelId,
                publicationData.scheduledFor
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapPublicationRow(
        result.rows[0]
    );
}

/**
 * Mark one reserved publication as
 * successfully published.
 *
 * @param {number} publicationId
 * @param {string} messageId
 * @returns {Promise<Object|null>}
 */
async function completePublication(
    publicationId,
    messageId
) {
    const result =
        await query(
            `
                UPDATE rank_trial_publications
                SET
                    message_id = $2,
                    published_at = NOW()
                WHERE id = $1
                RETURNING *;
            `,
            [
                publicationId,
                messageId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapPublicationRow(
        result.rows[0]
    );
}

/**
 * Remove an unfinished reservation.
 *
 * This allows Umbra to retry later if the
 * Discord message could not be published.
 *
 * Only rows without a published message
 * may be deleted.
 *
 * @param {number} publicationId
 * @returns {Promise<boolean>}
 */
async function releasePublication(
    publicationId
) {
    const result =
        await query(
            `
                DELETE FROM rank_trial_publications
                WHERE id = $1
                  AND message_id IS NULL
                  AND published_at IS NULL
                RETURNING id;
            `,
            [
                publicationId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Get one Rank Trial publication.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} publicationType
 * @returns {Promise<Object|null>}
 */
async function getPublication(
    guildId,
    trialKey,
    publicationType
) {
    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_publications
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND publication_type = $3
                LIMIT 1;
            `,
            [
                guildId,
                trialKey,
                publicationType
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapPublicationRow(
        result.rows[0]
    );
}

/**
 * Get all publication history for one
 * monthly Rank Trial.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object[]>}
 */
async function getTrialPublications(
    guildId,
    trialKey
) {
    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_publications
                WHERE guild_id = $1
                  AND trial_key = $2
                ORDER BY scheduled_for ASC;
            `,
            [
                guildId,
                trialKey
            ]
        );

    return result.rows.map(
        mapPublicationRow
    );
}

/**
 * Get recent Rank Trial publication history.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentPublications(
    guildId,
    limit =
        50
) {
    const safeLimit =
        Number.isInteger(
            limit
        )
            ? Math.min(
                Math.max(
                    limit,
                    1
                ),
                200
            )
            : 50;

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_publications
                WHERE guild_id = $1
                ORDER BY created_at DESC
                LIMIT $2;
            `,
            [
                guildId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapPublicationRow
    );
}

/**
 * Remove abandoned unpublished reservations.
 *
 * This is useful if Umbra stopped after
 * reserving a publication but before sending
 * the Discord message.
 *
 * @param {number} olderThanMinutes
 * @returns {Promise<number>}
 */
async function clearStaleReservations(
    olderThanMinutes =
        30
) {
    const safeMinutes =
        Number.isFinite(
            olderThanMinutes
        )
            ? Math.max(
                5,
                Math.floor(
                    olderThanMinutes
                )
            )
            : 30;

    const result =
        await query(
            `
                DELETE FROM rank_trial_publications
                WHERE message_id IS NULL
                  AND published_at IS NULL
                  AND created_at <
                      NOW() -
                      ($1 * INTERVAL '1 minute')
                RETURNING id;
            `,
            [
                safeMinutes
            ]
        );

    return (
        result.rows.length
    );
}

module.exports = {
    buildTrialKey,
    hasPublication,
    reservePublication,
    completePublication,
    releasePublication,
    getPublication,
    getTrialPublications,
    getRecentPublications,
    clearStaleReservations
};
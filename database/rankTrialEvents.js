const {
    query
} = require('./connection');

/**
 * Convert one Rank Trial Scheduled Event row
 * into the format used by Umbra.
 *
 * @param {Object} row
 * @returns {Object}
 */
function mapRankTrialEventRow(
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

        discordEventId:
            row.discord_event_id,

        eventName:
            row.event_name,

        eventDescription:
            row.event_description,

        eventLocation:
            row.event_location,

        startsAt:
            row.starts_at
                ? new Date(
                    row.starts_at
                )
                : null,

        endsAt:
            row.ends_at
                ? new Date(
                    row.ends_at
                )
                : null,

        status:
            row.status,

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
                : null,

        syncedAt:
            row.synced_at
                ? new Date(
                    row.synced_at
                )
                : null,

        deletedAt:
            row.deleted_at
                ? new Date(
                    row.deleted_at
                )
                : null
    };
}

/**
 * Get one Rank Trial Scheduled Event record.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object|null>}
 */
async function getRankTrialEvent(
    guildId,
    trialKey
) {
    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_events
                WHERE guild_id = $1
                  AND trial_key = $2
                LIMIT 1;
            `,
            [
                guildId,
                trialKey
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Reserve one monthly Rank Trial Event record.
 *
 * Only one record may exist for each guild
 * and monthly trial cycle.
 *
 * @param {Object} eventData
 * @param {string} eventData.guildId
 * @param {string} eventData.trialKey
 * @param {string} eventData.eventName
 * @param {string} eventData.eventDescription
 * @param {string} eventData.eventLocation
 * @param {Date} eventData.startsAt
 * @param {Date} eventData.endsAt
 * @param {string} eventData.status
 * @returns {Promise<Object|null>}
 */
async function reserveRankTrialEvent(
    eventData
) {
    const result =
        await query(
            `
                INSERT INTO rank_trial_events (
                    guild_id,
                    trial_key,
                    event_name,
                    event_description,
                    event_location,
                    starts_at,
                    ends_at,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )
                ON CONFLICT (
                    guild_id,
                    trial_key
                )
                DO NOTHING
                RETURNING *;
            `,
            [
                eventData.guildId,
                eventData.trialKey,
                eventData.eventName,
                eventData.eventDescription,
                eventData.eventLocation,
                eventData.startsAt,
                eventData.endsAt,
                eventData.status
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Attach the Discord Scheduled Event ID
 * after successful creation.
 *
 * @param {number} recordId
 * @param {string} discordEventId
 * @returns {Promise<Object|null>}
 */
async function completeRankTrialEventCreation(
    recordId,
    discordEventId
) {
    const result =
        await query(
            `
                UPDATE rank_trial_events
                SET
                    discord_event_id = $2,
                    status = 'SCHEDULED',
                    synced_at = NOW(),
                    updated_at = NOW(),
                    deleted_at = NULL
                WHERE id = $1
                RETURNING *;
            `,
            [
                recordId,
                discordEventId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Update the stored Event details after
 * synchronization with Discord.
 *
 * @param {Object} eventData
 * @param {string} eventData.guildId
 * @param {string} eventData.trialKey
 * @param {string|null} eventData.discordEventId
 * @param {string} eventData.eventName
 * @param {string} eventData.eventDescription
 * @param {string} eventData.eventLocation
 * @param {Date} eventData.startsAt
 * @param {Date} eventData.endsAt
 * @param {string} eventData.status
 * @returns {Promise<Object|null>}
 */
async function updateRankTrialEvent(
    eventData
) {
    const result =
        await query(
            `
                UPDATE rank_trial_events
                SET
                    discord_event_id = $3,
                    event_name = $4,
                    event_description = $5,
                    event_location = $6,
                    starts_at = $7,
                    ends_at = $8,
                    status = $9,
                    synced_at = NOW(),
                    updated_at = NOW(),
                    deleted_at =
                        CASE
                            WHEN $9 = 'DELETED'
                                THEN NOW()
                            ELSE NULL
                        END
                WHERE guild_id = $1
                  AND trial_key = $2
                RETURNING *;
            `,
            [
                eventData.guildId,
                eventData.trialKey,
                eventData.discordEventId,
                eventData.eventName,
                eventData.eventDescription,
                eventData.eventLocation,
                eventData.startsAt,
                eventData.endsAt,
                eventData.status
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Update only the stored Event status.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {'SCHEDULED'|'ACTIVE'|'COMPLETED'|'CANCELLED'|'DELETED'} status
 * @returns {Promise<Object|null>}
 */
async function updateRankTrialEventStatus(
    guildId,
    trialKey,
    status
) {
    const allowedStatuses =
        new Set([
            'SCHEDULED',
            'ACTIVE',
            'COMPLETED',
            'CANCELLED',
            'DELETED'
        ]);

    if (
        !allowedStatuses.has(
            status
        )
    ) {
        throw new TypeError(
            'Invalid Rank Trial Event status.'
        );
    }

    const result =
        await query(
            `
                UPDATE rank_trial_events
                SET
                    status = $3,
                    synced_at = NOW(),
                    updated_at = NOW(),
                    deleted_at =
                        CASE
                            WHEN $3 = 'DELETED'
                                THEN NOW()
                            ELSE deleted_at
                        END
                WHERE guild_id = $1
                  AND trial_key = $2
                RETURNING *;
            `,
            [
                guildId,
                trialKey,
                status
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Mark a Rank Trial Event as deleted and
 * remove its Discord Event ID.
 *
 * This allows Umbra to recreate the Event
 * later if configured to do so.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object|null>}
 */
async function markRankTrialEventDeleted(
    guildId,
    trialKey
) {
    const result =
        await query(
            `
                UPDATE rank_trial_events
                SET
                    discord_event_id = NULL,
                    status = 'DELETED',
                    deleted_at = NOW(),
                    synced_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                RETURNING *;
            `,
            [
                guildId,
                trialKey
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Restore a deleted Event record so Umbra
 * may attach a newly recreated Discord Event.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} discordEventId
 * @returns {Promise<Object|null>}
 */
async function restoreRankTrialEvent(
    guildId,
    trialKey,
    discordEventId
) {
    const result =
        await query(
            `
                UPDATE rank_trial_events
                SET
                    discord_event_id = $3,
                    status = 'SCHEDULED',
                    deleted_at = NULL,
                    synced_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                RETURNING *;
            `,
            [
                guildId,
                trialKey,
                discordEventId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialEventRow(
        result.rows[0]
    );
}

/**
 * Get all current Event records for one guild.
 *
 * @param {string} guildId
 * @returns {Promise<Object[]>}
 */
async function getActiveRankTrialEvents(
    guildId
) {
    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_events
                WHERE guild_id = $1
                  AND status IN (
                      'SCHEDULED',
                      'ACTIVE'
                  )
                ORDER BY starts_at ASC;
            `,
            [
                guildId
            ]
        );

    return result.rows.map(
        mapRankTrialEventRow
    );
}

/**
 * Get recent Rank Trial Event records.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRecentRankTrialEvents(
    guildId,
    limit =
        25
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
                100
            )
            : 25;

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_events
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
        mapRankTrialEventRow
    );
}

/**
 * Release an unfinished Event reservation.
 *
 * Only records without a Discord Event ID
 * may be deleted.
 *
 * @param {number} recordId
 * @returns {Promise<boolean>}
 */
async function releaseRankTrialEventReservation(
    recordId
) {
    const result =
        await query(
            `
                DELETE FROM rank_trial_events
                WHERE id = $1
                  AND discord_event_id IS NULL
                  AND status = 'SCHEDULED'
                RETURNING id;
            `,
            [
                recordId
            ]
        );

    return (
        result.rows.length >
        0
    );
}

/**
 * Remove stale Event reservations left behind
 * by an interrupted creation process.
 *
 * @param {number} olderThanMinutes
 * @returns {Promise<number>}
 */
async function clearStaleRankTrialEventReservations(
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
                DELETE FROM rank_trial_events
                WHERE discord_event_id IS NULL
                  AND status = 'SCHEDULED'
                  AND created_at <
                      NOW() -
                      ($1 * INTERVAL '1 minute')
                RETURNING id;
            `,
            [
                safeMinutes
            ]
        );

    return result.rows.length;
}

module.exports = {
    getRankTrialEvent,
    reserveRankTrialEvent,
    completeRankTrialEventCreation,
    updateRankTrialEvent,
    updateRankTrialEventStatus,
    markRankTrialEventDeleted,
    restoreRankTrialEvent,
    getActiveRankTrialEvents,
    getRecentRankTrialEvents,
    releaseRankTrialEventReservation,
    clearStaleRankTrialEventReservations
};
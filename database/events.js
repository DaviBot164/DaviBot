const {
    query
} = require('./connection');

/**
 * Convert a database Event row into the shape
 * used by the Evelynn Event System.
 *
 * @param {Object} row
 * @param {string[]} participantIds
 * @returns {Object}
 */
function mapEventRow(
    row,
    participantIds = []
) {
    return {
        id:
            row.event_id,

        guildId:
            row.guild_id,

        channelId:
            row.channel_id,

        messageId:
            row.message_id,

        hostId:
            row.host_id,

        title:
            row.title,

        description:
            row.description,

        time:
            row.event_time,

        reward:
            row.reward,

        maxPlayers:
            Number(row.max_players),

        status:
            row.status,

        winnerId:
            row.winner_id,

        participants:
            new Set(
                participantIds
            ),

        createdAt:
            row.created_at
                ? new Date(
                    row.created_at
                ).getTime()
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                    row.updated_at
                ).getTime()
                : null,

        endedAt:
            row.ended_at
                ? new Date(
                    row.ended_at
                ).getTime()
                : null,

        cancelledAt:
            row.cancelled_at
                ? new Date(
                    row.cancelled_at
                ).getTime()
                : null
    };
}

/**
 * Create a new Event in PostgreSQL.
 *
 * @param {Object} eventData
 * @returns {Promise<Object>}
 */
async function createEvent(
    eventData
) {
    const result =
        await query(
            `
                INSERT INTO events (
                    event_id,
                    guild_id,
                    channel_id,
                    message_id,
                    host_id,
                    title,
                    description,
                    event_time,
                    reward,
                    max_players,
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
                    $8,
                    $9,
                    $10,
                    $11
                )
                RETURNING *;
            `,
            [
                eventData.id,
                eventData.guildId,
                eventData.channelId,
                eventData.messageId,
                eventData.hostId,
                eventData.title,
                eventData.description,
                eventData.time,
                eventData.reward,
                eventData.maxPlayers,
                eventData.status
            ]
        );

    return mapEventRow(
        result.rows[0]
    );
}

/**
 * Get one Event with all participants.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Promise<Object|null>}
 */
async function getEvent(
    eventId,
    guildId
) {
    const normalizedEventId =
        eventId
            ?.trim()
            .toLowerCase();

    if (!normalizedEventId) {
        return null;
    }

    const eventResult =
        await query(
            `
                SELECT *
                FROM events
                WHERE event_id = $1
                  AND guild_id = $2
                LIMIT 1;
            `,
            [
                normalizedEventId,
                guildId
            ]
        );

    if (
        eventResult.rows.length === 0
    ) {
        return null;
    }

    const participantResult =
        await query(
            `
                SELECT user_id
                FROM event_participants
                WHERE event_id = $1
                  AND guild_id = $2
                ORDER BY joined_at ASC;
            `,
            [
                normalizedEventId,
                guildId
            ]
        );

    const participantIds =
        participantResult.rows.map(
            row => row.user_id
        );

    return mapEventRow(
        eventResult.rows[0],
        participantIds
    );
}

/**
 * Get all Events for a guild.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getGuildEvents(
    guildId,
    limit = 25
) {
    const safeLimit =
        Number.isInteger(limit)
            ? Math.min(
                Math.max(limit, 1),
                100
            )
            : 25;

    const result =
        await query(
            `
                SELECT *
                FROM events
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
        row =>
            mapEventRow(
                row
            )
    );
}

/**
 * Get active Events for a guild.
 *
 * @param {string} guildId
 * @returns {Promise<Object[]>}
 */
async function getActiveEvents(
    guildId
) {
    const result =
        await query(
            `
                SELECT *
                FROM events
                WHERE guild_id = $1
                  AND status = 'Active'
                ORDER BY created_at ASC;
            `,
            [
                guildId
            ]
        );

    return result.rows.map(
        row =>
            mapEventRow(
                row
            )
    );
}

/**
 * Add a participant to an Event.
 *
 * Duplicate joins are safely ignored.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function addEventParticipant(
    eventId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                INSERT INTO event_participants (
                    event_id,
                    guild_id,
                    user_id
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    event_id,
                    user_id
                )
                DO NOTHING
                RETURNING user_id;
            `,
            [
                eventId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Remove a participant from an Event.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function removeEventParticipant(
    eventId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                DELETE FROM event_participants
                WHERE event_id = $1
                  AND guild_id = $2
                  AND user_id = $3
                RETURNING user_id;
            `,
            [
                eventId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Return every participant ID for an Event.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Promise<string[]>}
 */
async function getEventParticipants(
    eventId,
    guildId
) {
    const result =
        await query(
            `
                SELECT user_id
                FROM event_participants
                WHERE event_id = $1
                  AND guild_id = $2
                ORDER BY joined_at ASC;
            `,
            [
                eventId,
                guildId
            ]
        );

    return result.rows.map(
        row => row.user_id
    );
}

/**
 * Count Event participants.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function countEventParticipants(
    eventId,
    guildId
) {
    const result =
        await query(
            `
                SELECT COUNT(*)::INTEGER AS count
                FROM event_participants
                WHERE event_id = $1
                  AND guild_id = $2;
            `,
            [
                eventId,
                guildId
            ]
        );

    return Number(
        result.rows[0]?.count || 0
    );
}

/**
 * Check whether a user has joined an Event.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isEventParticipant(
    eventId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT 1
                FROM event_participants
                WHERE event_id = $1
                  AND guild_id = $2
                  AND user_id = $3
                LIMIT 1;
            `,
            [
                eventId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Update an Event status.
 *
 * Supported values:
 * Active, Ended, Cancelled
 *
 * @param {string} eventId
 * @param {string} guildId
 * @param {'Active'|'Ended'|'Cancelled'} status
 * @returns {Promise<Object|null>}
 */
async function updateEventStatus(
    eventId,
    guildId,
    status
) {
    const allowedStatuses =
        new Set([
            'Active',
            'Ended',
            'Cancelled'
        ]);

    if (
        !allowedStatuses.has(
            status
        )
    ) {
        throw new TypeError(
            'Invalid Event status.'
        );
    }

    const endedAtExpression =
        status === 'Ended'
            ? 'NOW()'
            : 'ended_at';

    const cancelledAtExpression =
        status === 'Cancelled'
            ? 'NOW()'
            : 'cancelled_at';

    const result =
        await query(
            `
                UPDATE events
                SET
                    status = $3,
                    updated_at = NOW(),
                    ended_at =
                        ${endedAtExpression},
                    cancelled_at =
                        ${cancelledAtExpression}
                WHERE event_id = $1
                  AND guild_id = $2
                RETURNING *;
            `,
            [
                eventId,
                guildId,
                status
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    const participantIds =
        await getEventParticipants(
            eventId,
            guildId
        );

    return mapEventRow(
        result.rows[0],
        participantIds
    );
}

/**
 * Assign a winner to an Event.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @param {string|null} winnerId
 * @returns {Promise<Object|null>}
 */
async function setEventWinner(
    eventId,
    guildId,
    winnerId
) {
    const result =
        await query(
            `
                UPDATE events
                SET
                    winner_id = $3,
                    updated_at = NOW()
                WHERE event_id = $1
                  AND guild_id = $2
                RETURNING *;
            `,
            [
                eventId,
                guildId,
                winnerId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    const participantIds =
        await getEventParticipants(
            eventId,
            guildId
        );

    return mapEventRow(
        result.rows[0],
        participantIds
    );
}

/**
 * Delete an Event.
 *
 * Participants are deleted automatically
 * through ON DELETE CASCADE.
 *
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
async function deleteEvent(
    eventId,
    guildId
) {
    const result =
        await query(
            `
                DELETE FROM events
                WHERE event_id = $1
                  AND guild_id = $2
                RETURNING event_id;
            `,
            [
                eventId,
                guildId
            ]
        );

    return result.rows.length > 0;
}

module.exports = {
    createEvent,
    getEvent,
    getGuildEvents,
    getActiveEvents,
    addEventParticipant,
    removeEventParticipant,
    getEventParticipants,
    countEventParticipants,
    isEventParticipant,
    updateEventStatus,
    setEventWinner,
    deleteEvent
};
const {
    query
} = require('./connection');

/**
 * Convert a PostgreSQL Giveaway row
 * into Evelynn's Giveaway data shape.
 *
 * @param {Object} row
 * @param {string[]} participantIds
 * @param {string[]} winnerIds
 * @returns {Object}
 */
function mapGiveawayRow(
    row,
    participantIds = [],
    winnerIds = []
) {
    return {
        id:
            row.giveaway_id,

        guildId:
            row.guild_id,

        channelId:
            row.channel_id,

        messageId:
            row.message_id,

        hostId:
            row.host_id,

        prize:
            row.prize,

        description:
            row.description,

        requirement:
            row.requirement || '',

        winnerCount:
            Number(
                row.winner_count
            ),

        status:
            row.status,

        participants:
            new Set(
                participantIds
            ),

        winners:
            winnerIds,

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

        endsAt:
            row.ends_at
                ? new Date(
                    row.ends_at
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
 * Create a Giveaway.
 *
 * @param {Object} giveawayData
 * @returns {Promise<Object>}
 */
async function createGiveaway(
    giveawayData
) {
    const result =
        await query(
            `
                INSERT INTO giveaways (
                    giveaway_id,
                    guild_id,
                    channel_id,
                    message_id,
                    host_id,
                    prize,
                    description,
                    requirement,
                    winner_count,
                    status,
                    ends_at
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
                giveawayData.id,
                giveawayData.guildId,
                giveawayData.channelId,
                giveawayData.messageId,
                giveawayData.hostId,
                giveawayData.prize,
                giveawayData.description,
                giveawayData.requirement || null,
                giveawayData.winnerCount,
                giveawayData.status,
                new Date(
                    giveawayData.endsAt
                )
            ]
        );

    return mapGiveawayRow(
        result.rows[0]
    );
}

/**
 * Get Giveaway participants.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<string[]>}
 */
async function getGiveawayParticipants(
    giveawayId,
    guildId
) {
    const result =
        await query(
            `
                SELECT user_id
                FROM giveaway_participants
                WHERE giveaway_id = $1
                  AND guild_id = $2
                ORDER BY joined_at ASC;
            `,
            [
                giveawayId,
                guildId
            ]
        );

    return result.rows.map(
        row => row.user_id
    );
}

/**
 * Get Giveaway winners.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<string[]>}
 */
async function getGiveawayWinners(
    giveawayId,
    guildId
) {
    const result =
        await query(
            `
                SELECT user_id
                FROM giveaway_winners
                WHERE giveaway_id = $1
                  AND guild_id = $2
                ORDER BY selected_at ASC;
            `,
            [
                giveawayId,
                guildId
            ]
        );

    return result.rows.map(
        row => row.user_id
    );
}

/**
 * Get one Giveaway with entries and winners.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<Object|null>}
 */
async function getGiveaway(
    giveawayId,
    guildId
) {
    const normalizedGiveawayId =
        giveawayId
            ?.trim()
            .toLowerCase();

    if (!normalizedGiveawayId) {
        return null;
    }

    const giveawayResult =
        await query(
            `
                SELECT *
                FROM giveaways
                WHERE giveaway_id = $1
                  AND guild_id = $2
                LIMIT 1;
            `,
            [
                normalizedGiveawayId,
                guildId
            ]
        );

    if (
        giveawayResult.rows.length === 0
    ) {
        return null;
    }

    const [
        participantIds,
        winnerIds
    ] = await Promise.all([
        getGiveawayParticipants(
            normalizedGiveawayId,
            guildId
        ),

        getGiveawayWinners(
            normalizedGiveawayId,
            guildId
        )
    ]);

    return mapGiveawayRow(
        giveawayResult.rows[0],
        participantIds,
        winnerIds
    );
}

/**
 * Get active Giveaways.
 *
 * @param {string|null} guildId
 * @returns {Promise<Object[]>}
 */
async function getActiveGiveaways(
    guildId = null
) {
    const result =
        guildId
            ? await query(
                `
                    SELECT *
                    FROM giveaways
                    WHERE guild_id = $1
                      AND status = 'Active'
                    ORDER BY ends_at ASC;
                `,
                [guildId]
            )
            : await query(
                `
                    SELECT *
                    FROM giveaways
                    WHERE status = 'Active'
                    ORDER BY ends_at ASC;
                `
            );

    return result.rows.map(
        row =>
            mapGiveawayRow(row)
    );
}

/**
 * Add one participant.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function addGiveawayParticipant(
    giveawayId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                INSERT INTO giveaway_participants (
                    giveaway_id,
                    guild_id,
                    user_id
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    giveaway_id,
                    user_id
                )
                DO NOTHING
                RETURNING user_id;
            `,
            [
                giveawayId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Remove one participant.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function removeGiveawayParticipant(
    giveawayId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                DELETE FROM giveaway_participants
                WHERE giveaway_id = $1
                  AND guild_id = $2
                  AND user_id = $3
                RETURNING user_id;
            `,
            [
                giveawayId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Check whether a user entered.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isGiveawayParticipant(
    giveawayId,
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT 1
                FROM giveaway_participants
                WHERE giveaway_id = $1
                  AND guild_id = $2
                  AND user_id = $3
                LIMIT 1;
            `,
            [
                giveawayId,
                guildId,
                userId
            ]
        );

    return result.rows.length > 0;
}

/**
 * Count Giveaway entries.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<number>}
 */
async function countGiveawayParticipants(
    giveawayId,
    guildId
) {
    const result =
        await query(
            `
                SELECT COUNT(*)::INTEGER AS count
                FROM giveaway_participants
                WHERE giveaway_id = $1
                  AND guild_id = $2;
            `,
            [
                giveawayId,
                guildId
            ]
        );

    return Number(
        result.rows[0]?.count || 0
    );
}

/**
 * Save Giveaway winners.
 *
 * Existing winners are replaced.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @param {string[]} winnerIds
 * @returns {Promise<void>}
 */
async function saveGiveawayWinners(
    giveawayId,
    guildId,
    winnerIds
) {
    await query(
        `
            DELETE FROM giveaway_winners
            WHERE giveaway_id = $1
              AND guild_id = $2;
        `,
        [
            giveawayId,
            guildId
        ]
    );

    for (const winnerId of winnerIds) {
        await query(
            `
                INSERT INTO giveaway_winners (
                    giveaway_id,
                    guild_id,
                    user_id
                )
                VALUES (
                    $1,
                    $2,
                    $3
                )
                ON CONFLICT (
                    giveaway_id,
                    user_id
                )
                DO NOTHING;
            `,
            [
                giveawayId,
                guildId,
                winnerId
            ]
        );
    }
}

/**
 * Update Giveaway status.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @param {'Active'|'Ended'|'Cancelled'} status
 * @returns {Promise<Object|null>}
 */
async function updateGiveawayStatus(
    giveawayId,
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
        !allowedStatuses.has(status)
    ) {
        throw new TypeError(
            'Invalid Giveaway status.'
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
                UPDATE giveaways
                SET
                    status = $3,
                    updated_at = NOW(),
                    ended_at =
                        ${endedAtExpression},
                    cancelled_at =
                        ${cancelledAtExpression}
                WHERE giveaway_id = $1
                  AND guild_id = $2
                RETURNING *;
            `,
            [
                giveawayId,
                guildId,
                status
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    const [
        participantIds,
        winnerIds
    ] = await Promise.all([
        getGiveawayParticipants(
            giveawayId,
            guildId
        ),

        getGiveawayWinners(
            giveawayId,
            guildId
        )
    ]);

    return mapGiveawayRow(
        result.rows[0],
        participantIds,
        winnerIds
    );
}

/**
 * Delete a Giveaway.
 *
 * Related participants and winners
 * are deleted automatically.
 *
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<boolean>}
 */
async function deleteGiveaway(
    giveawayId,
    guildId
) {
    const result =
        await query(
            `
                DELETE FROM giveaways
                WHERE giveaway_id = $1
                  AND guild_id = $2
                RETURNING giveaway_id;
            `,
            [
                giveawayId,
                guildId
            ]
        );

    return result.rows.length > 0;
}

module.exports = {
    createGiveaway,
    getGiveaway,
    getActiveGiveaways,
    getGiveawayParticipants,
    getGiveawayWinners,
    addGiveawayParticipant,
    removeGiveawayParticipant,
    isGiveawayParticipant,
    countGiveawayParticipants,
    saveGiveawayWinners,
    updateGiveawayStatus,
    deleteGiveaway
};
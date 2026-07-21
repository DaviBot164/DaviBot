const { query } = require('./connection');

/**
 * Create a new Raid Shield case.
 *
 * @param {Object} data
 * @param {string} data.guildId
 * @param {number} data.joinCount
 * @param {number} data.joinLimit
 * @param {number} data.detectionWindowMilliseconds
 * @param {number} data.raidModeDurationMilliseconds
 * @param {Array<string>} data.memberIds
 * @returns {Promise<Object>}
 */
async function addRaidCase({
    guildId,
    joinCount,
    joinLimit,
    detectionWindowMilliseconds,
    raidModeDurationMilliseconds,
    memberIds = []
}) {
    const result = await query(
        `
            INSERT INTO raid_cases (
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                member_ids,
                ends_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6::jsonb,
                NOW() + ($5 * INTERVAL '1 millisecond')
            )
            RETURNING
                id,
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                status,
                member_ids,
                detected_at,
                ends_at,
                closed_at;
        `,
        [
            guildId,
            joinCount,
            joinLimit,
            detectionWindowMilliseconds,
            raidModeDurationMilliseconds,
            JSON.stringify(memberIds)
        ]
    );

    return result.rows[0];
}

/**
 * Add another member to an active Raid Case.
 *
 * The member ID is only stored once.
 *
 * @param {string|number} raidCaseId
 * @param {string} memberId
 * @returns {Promise<Object|null>}
 */
async function addMemberToRaidCase(
    raidCaseId,
    memberId
) {
    const result = await query(
        `
            UPDATE raid_cases
            SET
                member_ids = CASE
                    WHEN member_ids ? $2
                        THEN member_ids
                    ELSE member_ids || jsonb_build_array($2)
                END,

                join_count = CASE
                    WHEN member_ids ? $2
                        THEN join_count
                    ELSE join_count + 1
                END
            WHERE id = $1
              AND status = 'ACTIVE'
            RETURNING
                id,
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                status,
                member_ids,
                detected_at,
                ends_at,
                closed_at;
        `,
        [
            raidCaseId,
            memberId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Close an active Raid Case.
 *
 * @param {string|number} raidCaseId
 * @returns {Promise<Object|null>}
 */
async function closeRaidCase(raidCaseId) {
    const result = await query(
        `
            UPDATE raid_cases
            SET
                status = 'CLOSED',
                closed_at = NOW()
            WHERE id = $1
              AND status = 'ACTIVE'
            RETURNING
                id,
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                status,
                member_ids,
                detected_at,
                ends_at,
                closed_at;
        `,
        [
            raidCaseId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Get one Raid Case inside a server.
 *
 * @param {string} guildId
 * @param {string|number} raidCaseId
 * @returns {Promise<Object|null>}
 */
async function getRaidCaseById(
    guildId,
    raidCaseId
) {
    const result = await query(
        `
            SELECT
                id,
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                status,
                member_ids,
                detected_at,
                ends_at,
                closed_at
            FROM raid_cases
            WHERE guild_id = $1
              AND id = $2
            LIMIT 1;
        `,
        [
            guildId,
            raidCaseId
        ]
    );

    return result.rows[0] || null;
}

/**
 * Get recent Raid Cases for a server.
 *
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentRaidCases(
    guildId,
    limit = 10
) {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const result = await query(
        `
            SELECT
                id,
                guild_id,
                join_count,
                join_limit,
                detection_window_ms,
                raid_mode_duration_ms,
                status,
                member_ids,
                detected_at,
                ends_at,
                closed_at
            FROM raid_cases
            WHERE guild_id = $1
            ORDER BY id DESC
            LIMIT $2;
        `,
        [
            guildId,
            safeLimit
        ]
    );

    return result.rows;
}

module.exports = {
    addRaidCase,
    addMemberToRaidCase,
    closeRaidCase,
    getRaidCaseById,
    getRecentRaidCases
};
const {
    query
} = require('./connection');

/**
 * Official Captain Trials 2.0 participant
 * states stored inside PostgreSQL.
 */
const PARTICIPANT_STATUS = Object.freeze({
    REGISTERED:
        'REGISTERED',

    WITHDRAWN:
        'WITHDRAWN',

    UNDER_REVIEW:
        'UNDER_REVIEW',

    APPROVED:
        'APPROVED',

    REJECTED:
        'REJECTED'
});

/**
 * Convert one PostgreSQL participant row
 * into the clean object format used by Evelynn.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
function mapRankTrialParticipantRow(
    row
) {
    if (!row) {
        return null;
    }

    return {
        id:
            Number(
                row.id
            ),

        guildId:
            row.guild_id,

        trialKey:
            row.trial_key,

        userId:
            row.user_id,

        status:
            row.status,

        previousRank:
            row.previous_rank,

        newRank:
            row.new_rank,

        reviewedBy:
            row.reviewed_by,

        reviewReason:
            row.review_reason,

        registeredAt:
            row.registered_at
                ? new Date(
                    row.registered_at
                )
                : null,

        withdrawnAt:
            row.withdrawn_at
                ? new Date(
                    row.withdrawn_at
                )
                : null,

        reviewedAt:
            row.reviewed_at
                ? new Date(
                    row.reviewed_at
                )
                : null,

        promotedAt:
            row.promoted_at
                ? new Date(
                    row.promoted_at
                )
                : null,

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
 * Validate one permanent monthly
 * Captain Trial identifier.
 *
 * Expected format:
 *
 * 2026-08
 *
 * @param {string} trialKey
 * @returns {string}
 */
function normalizeTrialKey(
    trialKey
) {
    const normalizedTrialKey =
        String(
            trialKey ??
            ''
        ).trim();

    if (
        !/^[0-9]{4}-(0[1-9]|1[0-2])$/
            .test(
                normalizedTrialKey
            )
    ) {
        throw new TypeError(
            'Invalid Captain Trial key.'
        );
    }

    return normalizedTrialKey;
}

/**
 * Normalize one optional review reason.
 *
 * @param {unknown} reason
 * @returns {string|null}
 */
function normalizeReviewReason(
    reason
) {
    if (
        reason ===
        null ||
        reason ===
        undefined
    ) {
        return null;
    }

    const normalizedReason =
        String(
            reason
        ).trim();

    if (!normalizedReason) {
        return null;
    }

    return normalizedReason.slice(
        0,
        500
    );
}

/**
 * Get one participant from one
 * monthly Captain Trial.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getParticipant(
    guildId,
    trialKey,
    userId
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                LIMIT 1;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Register one Soul for a monthly
 * Captain Trial.
 *
 * A brand-new participant creates a row.
 *
 * A previously WITHDRAWN participant may
 * register again during the same open
 * registration window.
 *
 * Existing active/reviewed participants are
 * not modified.
 *
 * @param {Object} participantData
 * @param {string} participantData.guildId
 * @param {string} participantData.trialKey
 * @param {string} participantData.userId
 * @param {string|null} [participantData.previousRank]
 * @returns {Promise<{
 *     status: 'registered'|'restored'|'existing',
 *     participant: Object|null
 * }>}
 */
async function registerParticipant({
    guildId,
    trialKey,
    userId,
    previousRank =
        null
}) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const existingParticipant =
        await getParticipant(
            guildId,
            normalizedTrialKey,
            userId
        );

    /*
     * Restore a voluntary withdrawal.
     */
    if (
        existingParticipant &&
        existingParticipant.status ===
            PARTICIPANT_STATUS.WITHDRAWN
    ) {
        const restoredResult =
            await query(
                `
                    UPDATE rank_trial_participants
                    SET
                        status = 'REGISTERED',
                        previous_rank = $4,
                        new_rank = NULL,
                        reviewed_by = NULL,
                        review_reason = NULL,
                        withdrawn_at = NULL,
                        reviewed_at = NULL,
                        promoted_at = NULL,
                        registered_at = NOW(),
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND trial_key = $2
                      AND user_id = $3
                      AND status = 'WITHDRAWN'
                    RETURNING *;
                `,
                [
                    guildId,
                    normalizedTrialKey,
                    userId,
                    previousRank
                ]
            );

        if (
            restoredResult.rows.length ===
            0
        ) {
            return {
                status:
                    'existing',

                participant:
                    await getParticipant(
                        guildId,
                        normalizedTrialKey,
                        userId
                    )
            };
        }

        return {
            status:
                'restored',

            participant:
                mapRankTrialParticipantRow(
                    restoredResult.rows[0]
                )
        };
    }

    if (existingParticipant) {
        return {
            status:
                'existing',

            participant:
                existingParticipant
        };
    }

    const result =
        await query(
            `
                INSERT INTO rank_trial_participants (
                    guild_id,
                    trial_key,
                    user_id,
                    status,
                    previous_rank
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    'REGISTERED',
                    $4
                )
                ON CONFLICT (
                    guild_id,
                    trial_key,
                    user_id
                )
                DO NOTHING
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId,
                previousRank
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return {
            status:
                'existing',

            participant:
                await getParticipant(
                    guildId,
                    normalizedTrialKey,
                    userId
                )
        };
    }

    return {
        status:
            'registered',

        participant:
            mapRankTrialParticipantRow(
                result.rows[0]
            )
    };
}/**
 * Withdraw one registered Soul from
 * the selected monthly Captain Trial.
 *
 * Only REGISTERED participants may
 * withdraw themselves.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function withdrawParticipant(
    guildId,
    trialKey,
    userId
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    status = 'WITHDRAWN',
                    withdrawn_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                  AND status = 'REGISTERED'
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Move every currently registered
 * participant into Staff Review.
 *
 * This function is intended to run when
 * registration closes automatically.
 *
 * WITHDRAWN / APPROVED / REJECTED rows
 * are left untouched.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object[]>}
 */
async function moveRegisteredToReview(
    guildId,
    trialKey
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    status = 'UNDER_REVIEW',
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND status = 'REGISTERED'
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey
            ]
        );

    return result.rows.map(
        mapRankTrialParticipantRow
    );
}

/**
 * Get the full participant roster for
 * one monthly Captain Trial.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object[]>}
 */
async function getTrialParticipants(
    guildId,
    trialKey
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2
                ORDER BY
                    registered_at ASC,
                    id ASC;
            `,
            [
                guildId,
                normalizedTrialKey
            ]
        );

    return result.rows.map(
        mapRankTrialParticipantRow
    );
}

/**
 * Get participants with one selected
 * Captain Trial status.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} status
 * @returns {Promise<Object[]>}
 */
async function getTrialParticipantsByStatus(
    guildId,
    trialKey,
    status
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const normalizedStatus =
        String(
            status ??
            ''
        )
            .trim()
            .toUpperCase();

    if (
        !Object.values(
            PARTICIPANT_STATUS
        ).includes(
            normalizedStatus
        )
    ) {
        throw new TypeError(
            'Invalid Captain Trial participant status.'
        );
    }

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND status = $3
                ORDER BY
                    registered_at ASC,
                    id ASC;
            `,
            [
                guildId,
                normalizedTrialKey,
                normalizedStatus
            ]
        );

    return result.rows.map(
        mapRankTrialParticipantRow
    );
}

/**
 * Count all participants for one
 * monthly Captain Trial.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<number>}
 */
async function countTrialParticipants(
    guildId,
    trialKey
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                SELECT COUNT(*)::BIGINT AS total
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2;
            `,
            [
                guildId,
                normalizedTrialKey
            ]
        );

    return Number(
        result.rows[0]?.total ??
        0
    );
}

/**
 * Count participants with one selected
 * Captain Trial status.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} status
 * @returns {Promise<number>}
 */
async function countTrialParticipantsByStatus(
    guildId,
    trialKey,
    status
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const normalizedStatus =
        String(
            status ??
            ''
        )
            .trim()
            .toUpperCase();

    if (
        !Object.values(
            PARTICIPANT_STATUS
        ).includes(
            normalizedStatus
        )
    ) {
        throw new TypeError(
            'Invalid Captain Trial participant status.'
        );
    }

    const result =
        await query(
            `
                SELECT COUNT(*)::BIGINT AS total
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND status = $3;
            `,
            [
                guildId,
                normalizedTrialKey,
                normalizedStatus
            ]
        );

    return Number(
        result.rows[0]?.total ??
        0
    );
}

/**
 * Get one Soul's permanent Captain Trial
 * participation history.
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getParticipantHistory(
    guildId,
    userId,
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
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND user_id = $2
                ORDER BY
                    trial_key DESC,
                    registered_at DESC
                LIMIT $3;
            `,
            [
                guildId,
                userId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapRankTrialParticipantRow
    );
}/**
 * Approve one participant inside
 * the Staff Review flow.
 *
 * This does not directly change the
 * Captain Rank. Promotion execution is
 * handled by the Captain Trials 2.0 service.
 *
 * @param {Object} reviewData
 * @param {string} reviewData.guildId
 * @param {string} reviewData.trialKey
 * @param {string} reviewData.userId
 * @param {string} reviewData.reviewedBy
 * @param {string|null} [reviewData.reviewReason]
 * @param {string|null} [reviewData.newRank]
 * @returns {Promise<Object|null>}
 */
async function approveParticipant({
    guildId,
    trialKey,
    userId,
    reviewedBy,
    reviewReason =
        null,
    newRank =
        null
}) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const normalizedReason =
        normalizeReviewReason(
            reviewReason
        );

    const normalizedNewRank =
        newRank ===
            null ||
        newRank ===
            undefined
            ? null
            : String(
                newRank
            )
                .trim()
                .slice(
                    0,
                    100
                ) ||
              null;

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    status = 'APPROVED',
                    new_rank = $5,
                    reviewed_by = $4,
                    review_reason = $6,
                    reviewed_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                  AND status IN (
                      'REGISTERED',
                      'UNDER_REVIEW'
                  )
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId,
                reviewedBy,
                normalizedNewRank,
                normalizedReason
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Reject one participant inside
 * the Staff Review flow.
 *
 * @param {Object} reviewData
 * @param {string} reviewData.guildId
 * @param {string} reviewData.trialKey
 * @param {string} reviewData.userId
 * @param {string} reviewData.reviewedBy
 * @param {string|null} [reviewData.reviewReason]
 * @returns {Promise<Object|null>}
 */
async function rejectParticipant({
    guildId,
    trialKey,
    userId,
    reviewedBy,
    reviewReason =
        null
}) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const normalizedReason =
        normalizeReviewReason(
            reviewReason
        );

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    status = 'REJECTED',
                    new_rank = NULL,
                    reviewed_by = $4,
                    review_reason = $5,
                    reviewed_at = NOW(),
                    promoted_at = NULL,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                  AND status IN (
                      'REGISTERED',
                      'UNDER_REVIEW'
                  )
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId,
                reviewedBy,
                normalizedReason
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Mark an approved participant as
 * successfully promoted.
 *
 * Call this only after the Captain Rank
 * System has completed the real rank
 * assignment successfully.
 *
 * @param {Object} promotionData
 * @param {string} promotionData.guildId
 * @param {string} promotionData.trialKey
 * @param {string} promotionData.userId
 * @param {string|null} [promotionData.newRank]
 * @returns {Promise<Object|null>}
 */
async function completePromotion({
    guildId,
    trialKey,
    userId,
    newRank =
        null
}) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const normalizedNewRank =
        newRank ===
            null ||
        newRank ===
            undefined
            ? null
            : String(
                newRank
            )
                .trim()
                .slice(
                    0,
                    100
                ) ||
              null;

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    new_rank =
                        COALESCE(
                            $4,
                            new_rank
                        ),
                    promoted_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                  AND status = 'APPROVED'
                  AND promoted_at IS NULL
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId,
                normalizedNewRank
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Reopen one reviewed participant for
 * another Staff decision.
 *
 * Useful if Staff selected the wrong
 * result and needs to review again.
 *
 * Promoted participants are deliberately
 * not reopened here because the real rank
 * may already have changed.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function reopenParticipantReview(
    guildId,
    trialKey,
    userId
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                UPDATE rank_trial_participants
                SET
                    status = 'UNDER_REVIEW',
                    new_rank = NULL,
                    reviewed_by = NULL,
                    review_reason = NULL,
                    reviewed_at = NULL,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND user_id = $3
                  AND status IN (
                      'APPROVED',
                      'REJECTED'
                  )
                  AND promoted_at IS NULL
                RETURNING *;
            `,
            [
                guildId,
                normalizedTrialKey,
                userId
            ]
        );

    if (
        result.rows.length ===
        0
    ) {
        return null;
    }

    return mapRankTrialParticipantRow(
        result.rows[0]
    );
}

/**
 * Get every participant waiting for
 * a Staff decision.
 *
 * REGISTERED is also included so the
 * Review Panel remains usable even if a
 * manual review starts before the automatic
 * registration-close transition.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<Object[]>}
 */
async function getPendingReviewParticipants(
    guildId,
    trialKey
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                SELECT *
                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2
                  AND status IN (
                      'REGISTERED',
                      'UNDER_REVIEW'
                  )
                ORDER BY
                    registered_at ASC,
                    id ASC;
            `,
            [
                guildId,
                normalizedTrialKey
            ]
        );

    return result.rows.map(
        mapRankTrialParticipantRow
    );
}

/**
 * Return compact statistics for one
 * monthly Captain Trial.
 *
 * @param {string} guildId
 * @param {string} trialKey
 * @returns {Promise<{
 *     total: number,
 *     registered: number,
 *     withdrawn: number,
 *     underReview: number,
 *     approved: number,
 *     rejected: number,
 *     promoted: number
 * }>}
 */
async function getTrialParticipantStatistics(
    guildId,
    trialKey
) {
    const normalizedTrialKey =
        normalizeTrialKey(
            trialKey
        );

    const result =
        await query(
            `
                SELECT
                    COUNT(*)::BIGINT AS total,

                    COUNT(*) FILTER (
                        WHERE status = 'REGISTERED'
                    )::BIGINT AS registered,

                    COUNT(*) FILTER (
                        WHERE status = 'WITHDRAWN'
                    )::BIGINT AS withdrawn,

                    COUNT(*) FILTER (
                        WHERE status = 'UNDER_REVIEW'
                    )::BIGINT AS under_review,

                    COUNT(*) FILTER (
                        WHERE status = 'APPROVED'
                    )::BIGINT AS approved,

                    COUNT(*) FILTER (
                        WHERE status = 'REJECTED'
                    )::BIGINT AS rejected,

                    COUNT(*) FILTER (
                        WHERE promoted_at IS NOT NULL
                    )::BIGINT AS promoted

                FROM rank_trial_participants
                WHERE guild_id = $1
                  AND trial_key = $2;
            `,
            [
                guildId,
                normalizedTrialKey
            ]
        );

    const row =
        result.rows[0] ??
        {};

    return {
        total:
            Number(
                row.total ??
                0
            ),

        registered:
            Number(
                row.registered ??
                0
            ),

        withdrawn:
            Number(
                row.withdrawn ??
                0
            ),

        underReview:
            Number(
                row.under_review ??
                0
            ),

        approved:
            Number(
                row.approved ??
                0
            ),

        rejected:
            Number(
                row.rejected ??
                0
            ),

        promoted:
            Number(
                row.promoted ??
                0
            )
    };
}

module.exports = {
    PARTICIPANT_STATUS,

    mapRankTrialParticipantRow,
    normalizeTrialKey,

    getParticipant,
    registerParticipant,
    withdrawParticipant,

    moveRegisteredToReview,

    getTrialParticipants,
    getTrialParticipantsByStatus,
    countTrialParticipants,
    countTrialParticipantsByStatus,

    getParticipantHistory,
    getPendingReviewParticipants,
    getTrialParticipantStatistics,

    approveParticipant,
    rejectParticipant,
    reopenParticipantReview,
    completePromotion
};

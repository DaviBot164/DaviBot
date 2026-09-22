const { query } = require('./connection');

function mapTrial(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        guildId: row.guild_id,
        trialType: row.trial_type,
        status: row.status,
        createdBy: row.created_by,
        channelId: row.channel_id,
        messageId: row.message_id,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function mapParticipant(row) {
    if (!row) {
        return null;
    }

    return {
        trialId: row.trial_id,
        guildId: row.guild_id,
        userId: row.user_id,
        status: row.status,
        reviewedBy: row.reviewed_by,
        reviewReason: row.review_reason,
        registeredAt: row.registered_at,
        reviewedAt: row.reviewed_at
    };
}

async function createTrial({
    guildId,
    trialType,
    createdBy,
    opensAt = null,
    closesAt = null
}) {
    const { rows } = await query(
        `
            INSERT INTO akane_trials (
                guild_id,
                trial_type,
                created_by,
                opens_at,
                closes_at
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `,
        [
            guildId,
            trialType,
            createdBy,
            opensAt,
            closesAt
        ]
    );

    return mapTrial(rows[0]);
}

async function getTrial(trialId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_trials
            WHERE id = $1
        `,
        [trialId]
    );

    return mapTrial(rows[0]);
}

async function getActiveTrial(
    guildId,
    trialType
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_trials
            WHERE guild_id = $1
              AND trial_type = $2
              AND status = 'open'
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [
            guildId,
            trialType
        ]
    );

    return mapTrial(rows[0]);
}

async function setTrialStatus(
    trialId,
    status
) {
    const { rows } = await query(
        `
            UPDATE akane_trials
            SET
                status = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `,
        [
            trialId,
            status
        ]
    );

    return mapTrial(rows[0]);
}

async function setTrialMessage(
    trialId,
    channelId,
    messageId
) {
    const { rows } = await query(
        `
            UPDATE akane_trials
            SET
                channel_id = $2,
                message_id = $3,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `,
        [
            trialId,
            channelId,
            messageId
        ]
    );

    return mapTrial(rows[0]);
}

async function registerParticipant(
    trialId,
    guildId,
    userId
) {
    const { rows } = await query(
        `
            INSERT INTO akane_trial_participants (
                trial_id,
                guild_id,
                user_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (
                trial_id,
                user_id
            )
            DO UPDATE SET
                status = 'registered',
                reviewed_by = NULL,
                review_reason = NULL,
                reviewed_at = NULL
            RETURNING *
        `,
        [
            trialId,
            guildId,
            userId
        ]
    );

    return mapParticipant(rows[0]);
}

async function getParticipant(
    trialId,
    userId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_trial_participants
            WHERE trial_id = $1
              AND user_id = $2
        `,
        [
            trialId,
            userId
        ]
    );

    return mapParticipant(rows[0]);
}

async function withdrawParticipant(
    trialId,
    userId
) {
    const { rows } = await query(
        `
            UPDATE akane_trial_participants
            SET
                status = 'withdrawn',
                reviewed_by = NULL,
                review_reason = NULL,
                reviewed_at = NULL
            WHERE trial_id = $1
              AND user_id = $2
              AND status = 'registered'
            RETURNING *
        `,
        [
            trialId,
            userId
        ]
    );

    return mapParticipant(rows[0]);
}

async function getParticipants(
    trialId,
    status = null
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_trial_participants
            WHERE trial_id = $1
              AND (
                    $2::TEXT IS NULL
                    OR status = $2
              )
            ORDER BY registered_at ASC
        `,
        [
            trialId,
            status
        ]
    );

    return rows.map(
        mapParticipant
    );
}

async function reviewParticipant(
    trialId,
    userId,
    status,
    reviewedBy,
    reason = null
) {
    const { rows } = await query(
        `
            UPDATE akane_trial_participants
            SET
                status = $3,
                reviewed_by = $4,
                review_reason = $5,
                reviewed_at = NOW()
            WHERE trial_id = $1
              AND user_id = $2
              AND status = 'registered'
            RETURNING *
        `,
        [
            trialId,
            userId,
            status,
            reviewedBy,
            reason
        ]
    );

    return mapParticipant(rows[0]);
}

async function resetParticipantReview(
    trialId,
    userId
) {
    const { rows } = await query(
        `
            UPDATE akane_trial_participants
            SET
                status = 'registered',
                reviewed_by = NULL,
                review_reason = NULL,
                reviewed_at = NULL
            WHERE trial_id = $1
              AND user_id = $2
              AND status IN (
                  'passed',
                  'failed'
              )
            RETURNING *
        `,
        [
            trialId,
            userId
        ]
    );

    return mapParticipant(rows[0]);
}

async function countPendingParticipants(
    trialId
) {
    const { rows } = await query(
        `
            SELECT COUNT(*)::INTEGER AS count
            FROM akane_trial_participants
            WHERE trial_id = $1
              AND status = 'registered'
        `,
        [trialId]
    );

    return rows[0]?.count ?? 0;
}

module.exports = {
    createTrial,
    getTrial,
    getActiveTrial,
    setTrialStatus,
    setTrialMessage,
    registerParticipant,
    getParticipant,
    withdrawParticipant,
    getParticipants,
    reviewParticipant,
    resetParticipantReview,
    countPendingParticipants
};
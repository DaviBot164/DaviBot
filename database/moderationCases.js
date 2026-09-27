const {
    query
} = require('./connection');

function mapCase(row) {
    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        guildId:
            row.guild_id,

        userId:
            row.user_id,

        moderatorId:
            row.moderator_id,

        action:
            row.action,

        reason:
            row.reason,

        durationMs:
            row.duration_ms === null
                ? null
                : Number(row.duration_ms),

        channelId:
            row.channel_id,

        messageId:
            row.message_id,

        metadata:
            row.metadata ?? {},

        active:
            row.active,

        expiresAt:
            row.expires_at,

        createdAt:
            row.created_at,

        resolvedAt:
            row.resolved_at,

        resolvedBy:
            row.resolved_by,

        resolutionReason:
            row.resolution_reason
    };
}

async function createCase({
    guildId,
    userId,
    moderatorId = null,
    action,
    reason = null,
    durationMs = null,
    channelId = null,
    messageId = null,
    metadata = {},
    active = true,
    expiresAt = null
}) {
    const result =
        await query(
            `
                INSERT INTO akane_moderation_cases (
                    guild_id,
                    user_id,
                    moderator_id,
                    action,
                    reason,
                    duration_ms,
                    channel_id,
                    message_id,
                    metadata,
                    active,
                    expires_at
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
                    $9::jsonb,
                    $10,
                    $11
                )
                RETURNING *
            `,
            [
                guildId,
                userId,
                moderatorId,
                action,
                reason,
                durationMs,
                channelId,
                messageId,
                JSON.stringify(metadata),
                active,
                expiresAt
            ]
        );

    return mapCase(
        result.rows[0]
    );
}

async function getCase(
    guildId,
    caseId
) {
    const result =
        await query(
            `
                SELECT *
                FROM akane_moderation_cases
                WHERE
                    guild_id = $1
                    AND id = $2
                LIMIT 1
            `,
            [
                guildId,
                caseId
            ]
        );

    return mapCase(
        result.rows[0]
    );
}

async function getUserCases(
    guildId,
    userId,
    limit = 20
) {
    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );

    const result =
        await query(
            `
                SELECT *
                FROM akane_moderation_cases
                WHERE
                    guild_id = $1
                    AND user_id = $2
                ORDER BY created_at DESC
                LIMIT $3
            `,
            [
                guildId,
                userId,
                safeLimit
            ]
        );

    return result.rows.map(
        mapCase
    );
}

async function getActiveCases(
    guildId,
    userId
) {
    const result =
        await query(
            `
                SELECT *
                FROM akane_moderation_cases
                WHERE
                    guild_id = $1
                    AND user_id = $2
                    AND active = TRUE
                ORDER BY created_at DESC
            `,
            [
                guildId,
                userId
            ]
        );

    return result.rows.map(
        mapCase
    );
}

async function resolveCase(
    guildId,
    caseId,
    {
        resolvedBy = null,
        reason = null
    } = {}
) {
    const result =
        await query(
            `
                UPDATE akane_moderation_cases
                SET
                    active = FALSE,
                    resolved_at = NOW(),
                    resolved_by = $3,
                    resolution_reason = $4
                WHERE
                    guild_id = $1
                    AND id = $2
                    AND active = TRUE
                RETURNING *
            `,
            [
                guildId,
                caseId,
                resolvedBy,
                reason
            ]
        );

    return mapCase(
        result.rows[0]
    );
}

async function resolveActiveCases(
    guildId,
    userId,
    action,
    {
        resolvedBy = null,
        reason = null
    } = {}
) {
    const result =
        await query(
            `
                UPDATE akane_moderation_cases
                SET
                    active = FALSE,
                    resolved_at = NOW(),
                    resolved_by = $4,
                    resolution_reason = $5
                WHERE
                    guild_id = $1
                    AND user_id = $2
                    AND action = $3
                    AND active = TRUE
                RETURNING *
            `,
            [
                guildId,
                userId,
                action,
                resolvedBy,
                reason
            ]
        );

    return result.rows.map(
        mapCase
    );
}

module.exports = {
    createCase,
    getCase,
    getUserCases,
    getActiveCases,
    resolveCase,
    resolveActiveCases
};
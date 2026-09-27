const { query } = require('./connection');

function mapState(row) {
    if (!row) return null;

    return {
        id: Number(row.id),
        guildId: row.guild_id,
        moderatorId: row.moderator_id,
        caseId:
            row.case_id === null
                ? null
                : Number(row.case_id),
        mode: row.mode,
        active: row.active,
        createdAt: row.created_at,
        releasedAt: row.released_at,
        releasedBy: row.released_by
    };
}

function mapSnapshot(row) {
    if (!row) return null;

    return {
        emergencyId:
            Number(row.emergency_id),

        guildId:
            row.guild_id,

        channelId:
            row.channel_id,

        previousSendMessages:
            row.previous_send_messages,

        previousSendMessagesInThreads:
            row.previous_send_messages_in_threads,

        previousAddReactions:
            row.previous_add_reactions
    };
}

async function createEmergency({
    guildId,
    moderatorId,
    caseId = null,
    mode = 'lockdown'
}) {
    const result = await query(
        `
            INSERT INTO akane_emergency_states (
                guild_id,
                moderator_id,
                case_id,
                mode
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `,
        [
            guildId,
            moderatorId,
            caseId,
            mode
        ]
    );

    return mapState(
        result.rows[0]
    );
}

async function getActiveEmergency(
    guildId
) {
    const result = await query(
        `
            SELECT *
            FROM akane_emergency_states
            WHERE
                guild_id = $1
                AND active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [
            guildId
        ]
    );

    return mapState(
        result.rows[0]
    );
}

async function saveSnapshot({
    emergencyId,
    guildId,
    channelId,
    previousSendMessages = null,
    previousSendMessagesInThreads = null,
    previousAddReactions = null
}) {
    const result = await query(
        `
            INSERT INTO akane_emergency_snapshots (
                emergency_id,
                guild_id,
                channel_id,
                previous_send_messages,
                previous_send_messages_in_threads,
                previous_add_reactions
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            ON CONFLICT (
                emergency_id,
                channel_id
            )
            DO UPDATE SET
                previous_send_messages =
                    EXCLUDED.previous_send_messages,

                previous_send_messages_in_threads =
                    EXCLUDED.previous_send_messages_in_threads,

                previous_add_reactions =
                    EXCLUDED.previous_add_reactions
            RETURNING *
        `,
        [
            emergencyId,
            guildId,
            channelId,
            previousSendMessages,
            previousSendMessagesInThreads,
            previousAddReactions
        ]
    );

    return mapSnapshot(
        result.rows[0]
    );
}

async function getSnapshots(
    emergencyId
) {
    const result = await query(
        `
            SELECT *
            FROM akane_emergency_snapshots
            WHERE emergency_id = $1
            ORDER BY channel_id ASC
        `,
        [
            emergencyId
        ]
    );

    return result.rows.map(
        mapSnapshot
    );
}

async function releaseEmergency(
    emergencyId,
    releasedBy
) {
    const result = await query(
        `
            UPDATE akane_emergency_states
            SET
                active = FALSE,
                released_at = NOW(),
                released_by = $2
            WHERE
                id = $1
                AND active = TRUE
            RETURNING *
        `,
        [
            emergencyId,
            releasedBy
        ]
    );

    return mapState(
        result.rows[0]
    );
}

async function deleteEmergency(
    emergencyId
) {
    const result = await query(
        `
            DELETE FROM akane_emergency_states
            WHERE id = $1
            RETURNING *
        `,
        [
            emergencyId
        ]
    );

    return mapState(
        result.rows[0]
    );
}

module.exports = {
    createEmergency,
    getActiveEmergency,
    saveSnapshot,
    getSnapshots,
    releaseEmergency,
    deleteEmergency
};
const { query } = require('./connection');

function mapLock(row) {
    if (!row) return null;

    return {
        guildId: row.guild_id,
        channelId: row.channel_id,
        moderatorId: row.moderator_id,
        previousSendMessages:
            row.previous_send_messages,
        caseId:
            row.case_id === null
                ? null
                : Number(row.case_id),
        createdAt: row.created_at
    };
}

async function getChannelLock(
    guildId,
    channelId
) {
    const result = await query(
        `
            SELECT *
            FROM akane_channel_locks
            WHERE
                guild_id = $1
                AND channel_id = $2
            LIMIT 1
        `,
        [
            guildId,
            channelId
        ]
    );

    return mapLock(
        result.rows[0]
    );
}

async function saveChannelLock({
    guildId,
    channelId,
    moderatorId,
    previousSendMessages = null,
    caseId = null
}) {
    const result = await query(
        `
            INSERT INTO akane_channel_locks (
                guild_id,
                channel_id,
                moderator_id,
                previous_send_messages,
                case_id
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (
                guild_id,
                channel_id
            )
            DO UPDATE SET
                moderator_id =
                    EXCLUDED.moderator_id,
                previous_send_messages =
                    EXCLUDED.previous_send_messages,
                case_id =
                    EXCLUDED.case_id,
                created_at =
                    NOW()
            RETURNING *
        `,
        [
            guildId,
            channelId,
            moderatorId,
            previousSendMessages,
            caseId
        ]
    );

    return mapLock(
        result.rows[0]
    );
}

async function deleteChannelLock(
    guildId,
    channelId
) {
    const result = await query(
        `
            DELETE FROM akane_channel_locks
            WHERE
                guild_id = $1
                AND channel_id = $2
            RETURNING *
        `,
        [
            guildId,
            channelId
        ]
    );

    return mapLock(
        result.rows[0]
    );
}

module.exports = {
    getChannelLock,
    saveChannelLock,
    deleteChannelLock
};
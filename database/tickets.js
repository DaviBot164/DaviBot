const { query } = require('./connection');

function mapTicket(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        guildId: row.guild_id,
        userId: row.user_id,
        channelId: row.channel_id,
        category: row.category,
        subject: row.subject,
        status: row.status,
        createdAt: row.created_at,
        closedAt: row.closed_at,
        closedBy: row.closed_by,
        reopenedAt: row.reopened_at,
        reopenedBy: row.reopened_by,
        updatedAt: row.updated_at
    };
}

function mapAction(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        ticketId: row.ticket_id,
        guildId: row.guild_id,
        action: row.action,
        actorId: row.actor_id,
        reason: row.reason,
        createdAt: row.created_at
    };
}

async function createTicket({
    guildId,
    userId,
    category,
    subject = null
}) {
    const { rows } = await query(
        `
            INSERT INTO akane_tickets (
                guild_id,
                user_id,
                category,
                subject
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `,
        [
            guildId,
            userId,
            category,
            subject
        ]
    );

    return mapTicket(rows[0]);
}

async function getTicket(ticketId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_tickets
            WHERE id = $1
        `,
        [ticketId]
    );

    return mapTicket(rows[0]);
}

async function getTicketByChannel(
    guildId,
    channelId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_tickets
            WHERE guild_id = $1
              AND channel_id = $2
            LIMIT 1
        `,
        [
            guildId,
            channelId
        ]
    );

    return mapTicket(rows[0]);
}

async function getOpenTicket(
    guildId,
    userId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_tickets
            WHERE guild_id = $1
              AND user_id = $2
              AND status = 'open'
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [
            guildId,
            userId
        ]
    );

    return mapTicket(rows[0]);
}

async function setTicketChannel(
    ticketId,
    channelId
) {
    const { rows } = await query(
        `
            UPDATE akane_tickets
            SET
                channel_id = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `,
        [
            ticketId,
            channelId
        ]
    );

    return mapTicket(rows[0]);
}

async function closeTicket(
    ticketId,
    actorId
) {
    const { rows } = await query(
        `
            UPDATE akane_tickets
            SET
                status = 'closed',
                closed_at = NOW(),
                closed_by = $2,
                updated_at = NOW()
            WHERE id = $1
              AND status = 'open'
            RETURNING *
        `,
        [
            ticketId,
            actorId
        ]
    );

    return mapTicket(rows[0]);
}

async function reopenTicket(
    ticketId,
    actorId
) {
    const { rows } = await query(
        `
            UPDATE akane_tickets
            SET
                status = 'open',
                closed_at = NULL,
                closed_by = NULL,
                reopened_at = NOW(),
                reopened_by = $2,
                updated_at = NOW()
            WHERE id = $1
              AND status = 'closed'
            RETURNING *
        `,
        [
            ticketId,
            actorId
        ]
    );

    return mapTicket(rows[0]);
}

async function detachTicketChannel(
    ticketId
) {
    const { rows } = await query(
        `
            UPDATE akane_tickets
            SET
                channel_id = NULL,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `,
        [ticketId]
    );

    return mapTicket(rows[0]);
}

async function addTicketAction({
    ticketId,
    guildId,
    action,
    actorId,
    reason = null
}) {
    const { rows } = await query(
        `
            INSERT INTO akane_ticket_actions (
                ticket_id,
                guild_id,
                action,
                actor_id,
                reason
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `,
        [
            ticketId,
            guildId,
            action,
            actorId,
            reason
        ]
    );

    return mapAction(rows[0]);
}

async function getTicketActions(
    ticketId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_ticket_actions
            WHERE ticket_id = $1
            ORDER BY created_at ASC
        `,
        [ticketId]
    );

    return rows.map(
        mapAction
    );
}

async function getTicketHistory(
    guildId,
    userId,
    limit = 10
) {
    const safeLimit =
        Math.min(
            Math.max(limit, 1),
            25
        );

    const { rows } = await query(
        `
            SELECT *
            FROM akane_tickets
            WHERE guild_id = $1
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

    return rows.map(
        mapTicket
    );
}

module.exports = {
    createTicket,
    getTicket,
    getTicketByChannel,
    getOpenTicket,
    setTicketChannel,
    closeTicket,
    reopenTicket,
    detachTicketChannel,
    addTicketAction,
    getTicketActions,
    getTicketHistory
};
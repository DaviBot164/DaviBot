const { query } = require('./connection');

function mapEntry(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        guildId: row.guild_id,
        userId: row.user_id,
        faction: row.faction,
        previousRank: row.previous_rank,
        newRank: row.new_rank,
        changedBy: row.changed_by,
        reason: row.reason,
        createdAt: row.created_at
    };
}

async function addRankHistory({
    guildId,
    userId,
    faction,
    previousRank,
    newRank,
    changedBy = null,
    reason = null
}) {
    const { rows } = await query(
        `
            INSERT INTO akane_rank_history (
                guild_id,
                user_id,
                faction,
                previous_rank,
                new_rank,
                changed_by,
                reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `,
        [
            guildId,
            userId,
            faction,
            previousRank,
            newRank,
            changedBy,
            reason
        ]
    );

    return mapEntry(rows[0]);
}

async function getRankHistory(
    guildId,
    userId,
    limit = 10
) {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        25
    );

    const { rows } = await query(
        `
            SELECT *
            FROM akane_rank_history
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

    return rows.map(mapEntry);
}

module.exports = {
    addRankHistory,
    getRankHistory
};
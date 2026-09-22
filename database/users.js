const { query } = require('./connection');

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        guildId: row.guild_id,
        userId: row.user_id,
        xp: row.xp,
        level: row.level,
        messages: row.messages,
        faction: row.faction,
        rank: row.rank,
        rankPoints: row.rank_points,
        joinedAt: row.joined_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

async function getUser(guildId, userId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_users
            WHERE guild_id = $1
              AND user_id = $2
        `,
        [guildId, userId]
    );

    return mapUser(rows[0]);
}

async function ensureUser(guildId, userId, joinedAt = null) {
    const { rows } = await query(
        `
            INSERT INTO akane_users (
                guild_id,
                user_id,
                joined_at
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id, user_id)
            DO UPDATE SET
                joined_at = COALESCE(
                    akane_users.joined_at,
                    EXCLUDED.joined_at
                )
            RETURNING *
        `,
        [guildId, userId, joinedAt]
    );

    return mapUser(rows[0]);
}

async function addActivity(guildId, userId, xp) {
    const { rows } = await query(
        `
            UPDATE akane_users
            SET
                xp = xp + $3,
                messages = messages + 1,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
            RETURNING *
        `,
        [guildId, userId, xp]
    );

    return mapUser(rows[0]);
}

async function setProgress(guildId, userId, level, xp) {
    const { rows } = await query(
        `
            UPDATE akane_users
            SET
                level = $3,
                xp = $4,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
            RETURNING *
        `,
        [guildId, userId, level, xp]
    );

    return mapUser(rows[0]);
}

async function setFaction(guildId, userId, faction, rank = null) {
    const { rows } = await query(
        `
            UPDATE akane_users
            SET
                faction = $3,
                rank = $4,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
            RETURNING *
        `,
        [guildId, userId, faction, rank]
    );

    return mapUser(rows[0]);
}

async function setRank(guildId, userId, rank) {
    const { rows } = await query(
        `
            UPDATE akane_users
            SET
                rank = $3,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
            RETURNING *
        `,
        [guildId, userId, rank]
    );

    return mapUser(rows[0]);
}

module.exports = {
    getUser,
    ensureUser,
    addActivity,
    setProgress,
    setFaction,
    setRank
};
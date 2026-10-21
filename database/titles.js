const { query, pool } = require('./connection');

function mapTitle(row) {
    if (!row) return null;

    return {
        guildId: row.guild_id,
        userId: row.user_id,
        titleId: row.title_id,
        equipped: row.equipped,
        unlockedAt: row.unlocked_at
    };
}

async function unlockTitle(guildId, userId, titleId) {
    const { rows } = await query(
        `
            INSERT INTO akane_titles (
                guild_id,
                user_id,
                title_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id, user_id, title_id)
            DO NOTHING
            RETURNING *
        `,
        [guildId, userId, titleId]
    );

    return mapTitle(rows[0]);
}

async function getTitles(guildId, userId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_titles
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY unlocked_at ASC, title_id ASC
        `,
        [guildId, userId]
    );

    return rows.map(mapTitle);
}

async function getEquippedTitle(guildId, userId) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_titles
            WHERE guild_id = $1
              AND user_id = $2
              AND equipped = TRUE
            LIMIT 1
        `,
        [guildId, userId]
    );

    return mapTitle(rows[0]);
}

async function withPlayerLock(guildId, userId, action) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT user_id
                FROM akane_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        if (!rows.length) {
            await client.query('COMMIT');
            return null;
        }

        const result = await action(client);

        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK').catch(() => null);
        throw error;
    } finally {
        client.release();
    }
}

async function equipTitle(guildId, userId, titleId) {
    return withPlayerLock(guildId, userId, async client => {
        const { rows: ownedRows } = await client.query(
            `
                SELECT *
                FROM akane_titles
                WHERE guild_id = $1
                  AND user_id = $2
                  AND title_id = $3
                FOR UPDATE
            `,
            [guildId, userId, titleId]
        );

        const owned = ownedRows[0];

        // An unavailable selection leaves the current title unchanged.
        if (!owned) return null;

        if (owned.equipped) {
            return mapTitle(owned);
        }

        await client.query(
            `
                UPDATE akane_titles
                SET equipped = FALSE
                WHERE guild_id = $1
                  AND user_id = $2
                  AND equipped = TRUE
            `,
            [guildId, userId]
        );

        const { rows } = await client.query(
            `
                UPDATE akane_titles
                SET equipped = TRUE
                WHERE guild_id = $1
                  AND user_id = $2
                  AND title_id = $3
                RETURNING *
            `,
            [guildId, userId, titleId]
        );

        if (!rows.length) {
            throw new Error('Title disappeared during equip.');
        }

        return mapTitle(rows[0]);
    });
}

async function clearEquippedTitle(guildId, userId) {
    await withPlayerLock(guildId, userId, async client => {
        await client.query(
            `
                UPDATE akane_titles
                SET equipped = FALSE
                WHERE guild_id = $1
                  AND user_id = $2
                  AND equipped = TRUE
            `,
            [guildId, userId]
        );
    });
}

module.exports = {
    unlockTitle,
    getTitles,
    getEquippedTitle,
    equipTitle,
    clearEquippedTitle
};
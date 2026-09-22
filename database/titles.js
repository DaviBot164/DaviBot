const { query } = require('./connection');

function mapTitle(row) {
    if (!row) {
        return null;
    }

    return {
        guildId: row.guild_id,
        userId: row.user_id,
        titleId: row.title_id,
        equipped: row.equipped,
        unlockedAt: row.unlocked_at
    };
}

async function unlockTitle(
    guildId,
    userId,
    titleId
) {
    const { rows } = await query(
        `
            INSERT INTO akane_titles (
                guild_id,
                user_id,
                title_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
        `,
        [
            guildId,
            userId,
            titleId
        ]
    );

    return mapTitle(rows[0]);
}

async function getTitles(
    guildId,
    userId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_titles
            WHERE guild_id = $1
              AND user_id = $2
            ORDER BY unlocked_at ASC
        `,
        [
            guildId,
            userId
        ]
    );

    return rows.map(mapTitle);
}

async function getEquippedTitle(
    guildId,
    userId
) {
    const { rows } = await query(
        `
            SELECT *
            FROM akane_titles
            WHERE guild_id = $1
              AND user_id = $2
              AND equipped = TRUE
            LIMIT 1
        `,
        [
            guildId,
            userId
        ]
    );

    return mapTitle(rows[0]);
}

async function equipTitle(
    guildId,
    userId,
    titleId
) {
    const { rows } = await query(
        `
            WITH owned AS (
                SELECT 1
                FROM akane_titles
                WHERE guild_id = $1
                  AND user_id = $2
                  AND title_id = $3
            ),
            cleared AS (
                UPDATE akane_titles
                SET equipped = FALSE
                WHERE guild_id = $1
                  AND user_id = $2
                  AND equipped = TRUE
                  AND EXISTS (
                      SELECT 1
                      FROM owned
                  )
            )
            UPDATE akane_titles
            SET equipped = TRUE
            WHERE guild_id = $1
              AND user_id = $2
              AND title_id = $3
              AND EXISTS (
                  SELECT 1
                  FROM owned
              )
            RETURNING *
        `,
        [
            guildId,
            userId,
            titleId
        ]
    );

    return mapTitle(rows[0]);
}

async function clearEquippedTitle(
    guildId,
    userId
) {
    await query(
        `
            UPDATE akane_titles
            SET equipped = FALSE
            WHERE guild_id = $1
              AND user_id = $2
              AND equipped = TRUE
        `,
        [
            guildId,
            userId
        ]
    );
}

module.exports = {
    unlockTitle,
    getTitles,
    getEquippedTitle,
    equipTitle,
    clearEquippedTitle
};
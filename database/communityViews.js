const { query } = require('./connection');

async function getLeaderboard(guildId, faction = null) {
    const { rows } = await query(
        `
            SELECT user_id, level, xp, messages, faction, rank
            FROM kitsune_users
            WHERE guild_id = $1
              AND ($2::TEXT IS NULL OR faction = $2)
            ORDER BY level DESC, xp DESC, user_id ASC
        `,
        [guildId, faction]
    );

    return rows.map((row, index) => ({
        userId: row.user_id,
        level: Number(row.level),
        xp: Number(row.xp),
        messages: Number(row.messages),
        faction: row.faction,
        rank: row.rank,
        position: index + 1
    }));
}

module.exports = {
    getLeaderboard
};

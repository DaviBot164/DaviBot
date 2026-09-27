const { query } = require('./connection');

function mapMember(row) {
    return {
        guildId: row.guild_id,
        userId: row.user_id,
        faction: row.faction,
        rank: row.rank,
        level: Number(row.level),
        xp: Number(row.xp),
        messages: Number(row.messages),

        titleId:
            row.title_id ??
            null,

        joinedAt:
            row.joined_at
    };
}

async function getCorpsMembers(
    guildId
) {
    const result = await query(
        `
            SELECT
                users.guild_id,
                users.user_id,
                users.faction,
                users.rank,
                users.level,
                users.xp,
                users.messages,
                users.joined_at,

                titles.title_id

            FROM akane_users AS users

            LEFT JOIN akane_titles AS titles
                ON titles.guild_id =
                    users.guild_id
                AND titles.user_id =
                    users.user_id
                AND titles.equipped =
                    TRUE

            WHERE
                users.guild_id = $1
                AND users.faction
                    IS NOT NULL

            ORDER BY
                users.level DESC,
                users.xp DESC,
                users.user_id ASC
        `,
        [
            guildId
        ]
    );

    return result.rows.map(
        mapMember
    );
}

async function getFactionMembers(
    guildId,
    faction
) {
    const result = await query(
        `
            SELECT
                users.guild_id,
                users.user_id,
                users.faction,
                users.rank,
                users.level,
                users.xp,
                users.messages,
                users.joined_at,

                titles.title_id

            FROM akane_users AS users

            LEFT JOIN akane_titles AS titles
                ON titles.guild_id =
                    users.guild_id
                AND titles.user_id =
                    users.user_id
                AND titles.equipped =
                    TRUE

            WHERE
                users.guild_id = $1
                AND users.faction = $2

            ORDER BY
                users.level DESC,
                users.xp DESC,
                users.user_id ASC
        `,
        [
            guildId,
            faction
        ]
    );

    return result.rows.map(
        mapMember
    );
}

async function getRankMembers(
    guildId,
    faction,
    rank
) {
    const result = await query(
        `
            SELECT
                users.guild_id,
                users.user_id,
                users.faction,
                users.rank,
                users.level,
                users.xp,
                users.messages,
                users.joined_at,

                titles.title_id

            FROM akane_users AS users

            LEFT JOIN akane_titles AS titles
                ON titles.guild_id =
                    users.guild_id
                AND titles.user_id =
                    users.user_id
                AND titles.equipped =
                    TRUE

            WHERE
                users.guild_id = $1
                AND users.faction = $2
                AND users.rank = $3

            ORDER BY
                users.level DESC,
                users.xp DESC,
                users.user_id ASC
        `,
        [
            guildId,
            faction,
            rank
        ]
    );

    return result.rows.map(
        mapMember
    );
}

async function getCorpsCounts(
    guildId
) {
    const result = await query(
        `
            SELECT
                faction,
                rank,
                COUNT(*)::INTEGER
                    AS members

            FROM akane_users

            WHERE
                guild_id = $1
                AND faction IS NOT NULL

            GROUP BY
                faction,
                rank

            ORDER BY
                faction,
                rank
        `,
        [
            guildId
        ]
    );

    return result.rows.map(
        row => ({
            faction:
                row.faction,

            rank:
                row.rank,

            members:
                Number(
                    row.members
                )
        })
    );
}

module.exports = {
    getCorpsMembers,
    getFactionMembers,
    getRankMembers,
    getCorpsCounts
};
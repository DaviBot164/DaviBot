const { pool } = require('./connection');

const TEAMS = ['crimson', 'azure'];

function formatMatch(row) {
    return {
        id: String(row.id),
        guildId: row.guild_id,
        gameName: row.game_name,
        teamSize: row.team_size,
        status: row.status,
        reportedWinner: row.reported_winner,
        reportedBy: row.reported_by,
        winnerTeam: row.winner_team,
        completedAt: row.completed_at
    };
}

async function transaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        await client.query('ROLLBACK')
            .catch(() => null);

        throw error;
    } finally {
        client.release();
    }
}

async function lockMatch(client, guildId, matchId) {
    const { rows } = await client.query(
        `
            SELECT *
            FROM kitsune_matches
            WHERE guild_id = $1
              AND id = $2
            FOR UPDATE
        `,
        [guildId, matchId]
    );

    if (!rows.length) {
        throw new Error('Match not found.');
    }

    return rows[0];
}

async function getPlayers(client, match) {
    const { rows } = await client.query(
        `
            SELECT user_id, team, is_captain
            FROM kitsune_match_players
            WHERE match_id = $1
              AND guild_id = $2
            ORDER BY user_id
        `,
        [match.id, match.guild_id]
    );

    return rows;
}

function getCaptainTeam(players, userId) {
    const player = players.find(
        entry =>
            entry.user_id === userId &&
            entry.is_captain
    );

    return player?.team || null;
}

function validateTeams(match, players) {
    for (const team of TEAMS) {
        const members = players.filter(
            player => player.team === team
        );

        const captains = members.filter(
            player => player.is_captain
        );

        if (
            members.length !== match.team_size ||
            captains.length !== 1
        ) {
            throw new Error(
                'Both teams must be complete.'
            );
        }
    }
}

async function recordStatistics(client, match, players, winnerTeam) {
    const ordered = [...players].sort(
        (a, b) => a.user_id.localeCompare(b.user_id)
    );

    for (const player of ordered) {
        const { rowCount } = await client.query(
            `
                SELECT user_id
                FROM kitsune_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [match.guild_id, player.user_id]
        );

        if (!rowCount) {
            throw new Error(
                'A participant is missing their player profile.'
            );
        }

        await client.query(
            `
                INSERT INTO kitsune_player_stats (
                    guild_id,
                    user_id
                )
                VALUES ($1, $2)
                ON CONFLICT (guild_id, user_id)
                DO NOTHING
            `,
            [match.guild_id, player.user_id]
        );
    }

    for (const player of ordered) {
        const column = player.team === winnerTeam
            ? 'duel_wins'
            : 'duel_losses';

        await client.query(
            `
                UPDATE kitsune_player_stats
                SET
                    ${column} = ${column} + 1,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
            `,
            [match.guild_id, player.user_id]
        );
    }
}

async function completeMatch(
    client,
    match,
    players,
    winnerTeam
) {
    await recordStatistics(
        client,
        match,
        players,
        winnerTeam
    );

    const { rows } = await client.query(
        `
            UPDATE kitsune_matches
            SET
                status = 'completed',
                winner_team = $3,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE guild_id = $1
              AND id = $2
            RETURNING *
        `,
        [match.guild_id, match.id, winnerTeam]
    );

    await client.query(
        `
            DELETE FROM kitsune_match_active_players
            WHERE match_id = $1
        `,
        [match.id]
    );

    return formatMatch(rows[0]);
}

async function reportMatchResult(
    guildId,
    matchId,
    reporterId,
    winnerTeam
) {
    if (!TEAMS.includes(winnerTeam)) {
        throw new Error('Invalid winning team.');
    }

    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        if (match.status !== 'active') {
            throw new Error(
                'Only active matches can report a result.'
            );
        }

        const players = await getPlayers(client, match);

        validateTeams(match, players);

        const captainTeam = getCaptainTeam(
            players,
            reporterId
        );

        if (!captainTeam) {
            throw new Error(
                'Only team captains can report a result.'
            );
        }

        const { rows } = await client.query(
            `
                UPDATE kitsune_matches
                SET
                    status = 'reported',
                    reported_winner = $3,
                    reported_by = $4,
                    reported_at = NOW(),
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND id = $2
                RETURNING *
            `,
            [
                guildId,
                matchId,
                winnerTeam,
                reporterId
            ]
        );

        return formatMatch(rows[0]);
    });
}

async function confirmMatchResult(
    guildId,
    matchId,
    confirmerId
) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        if (match.status !== 'reported') {
            throw new Error(
                'This match has no pending result.'
            );
        }

        const players = await getPlayers(client, match);

        validateTeams(match, players);

        const reporterTeam = getCaptainTeam(
            players,
            match.reported_by
        );

        const confirmerTeam = getCaptainTeam(
            players,
            confirmerId
        );

        if (
            !reporterTeam ||
            !confirmerTeam ||
            reporterTeam === confirmerTeam
        ) {
            throw new Error(
                'The opposing captain must confirm the result.'
            );
        }

        await client.query(
            `
                INSERT INTO kitsune_match_confirmations (
                    match_id,
                    guild_id,
                    captain_id,
                    confirmation_type
                )
                VALUES ($1, $2, $3, 'result')
                ON CONFLICT DO NOTHING
            `,
            [matchId, guildId, confirmerId]
        );

        return completeMatch(
            client,
            match,
            players,
            match.reported_winner
        );
    });
}

async function disputeMatchResult(
    guildId,
    matchId,
    captainId
) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        if (match.status !== 'reported') {
            throw new Error(
                'This match has no result to dispute.'
            );
        }

        const players = await getPlayers(client, match);

        const reporterTeam = getCaptainTeam(
            players,
            match.reported_by
        );

        const opposingTeam = getCaptainTeam(
            players,
            captainId
        );

        if (
            !reporterTeam ||
            !opposingTeam ||
            reporterTeam === opposingTeam
        ) {
            throw new Error(
                'Only the opposing captain can dispute.'
            );
        }

        const { rows } = await client.query(
            `
                UPDATE kitsune_matches
                SET
                    status = 'disputed',
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND id = $2
                RETURNING *
            `,
            [guildId, matchId]
        );

        return formatMatch(rows[0]);
    });
}

async function resolveMatchDispute(
    guildId,
    matchId,
    winnerTeam
) {
    if (!TEAMS.includes(winnerTeam)) {
        throw new Error('Invalid winning team.');
    }

    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        if (match.status !== 'disputed') {
            throw new Error(
                'This match is not disputed.'
            );
        }

        const players = await getPlayers(client, match);

        validateTeams(match, players);

        return completeMatch(
            client,
            match,
            players,
            winnerTeam
        );
    });
}

module.exports = {
    reportMatchResult,
    confirmMatchResult,
    disputeMatchResult,
    resolveMatchDispute
};

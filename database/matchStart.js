const { pool } = require('./connection');

const TEAMS = ['crimson', 'azure'];

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

async function getStartState(client, match) {
    const { rows: players } = await client.query(
        `
            SELECT user_id, team, is_captain
            FROM kitsune_match_players
            WHERE match_id = $1
              AND guild_id = $2
        `,
        [match.id, match.guild_id]
    );

    const teams = {};

    for (const team of TEAMS) {
        const members = players.filter(
            player => player.team === team
        );

        const captains = members.filter(
            player => player.is_captain
        );

        teams[team] = {
            count: members.length,
            captainId: captains.length === 1
                ? captains[0].user_id
                : null
        };
    }

    const full = TEAMS.every(team =>
        teams[team].count === match.team_size &&
        teams[team].captainId !== null
    );

    const { rows: confirmations } = await client.query(
        `
            SELECT captain_id
            FROM kitsune_match_confirmations
            WHERE match_id = $1
              AND guild_id = $2
              AND confirmation_type = 'start'
        `,
        [match.id, match.guild_id]
    );

    const confirmedIds = new Set(
        confirmations.map(row => row.captain_id)
    );

    const confirmed = TEAMS.filter(team =>
        confirmedIds.has(teams[team].captainId)
    );

    return {
        matchId: String(match.id),
        status: match.status,
        teamSize: match.team_size,
        teams,
        full,
        confirmedTeams: confirmed,
        readyToStart: full && confirmed.length === 2
    };
}

async function getMatchStartState(guildId, matchId) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        return getStartState(client, match);
    });
}

async function confirmMatchStart(
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

        if (match.status !== 'recruiting') {
            throw new Error(
                'This match cannot be started.'
            );
        }

        const state = await getStartState(
            client,
            match
        );

        if (!state.full) {
            throw new Error(
                'Both teams must be full before starting.'
            );
        }

        const captainTeam = TEAMS.find(team =>
            state.teams[team].captainId === captainId
        );

        if (!captainTeam) {
            throw new Error(
                'Only team captains can confirm the start.'
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
                VALUES ($1, $2, $3, 'start')
                ON CONFLICT DO NOTHING
            `,
            [match.id, guildId, captainId]
        );

        const updated = await getStartState(
            client,
            match
        );

        if (!updated.readyToStart) {
            return {
                ...updated,
                started: false
            };
        }

        await client.query(
            `
                UPDATE kitsune_matches
                SET
                    status = 'active',
                    started_at = NOW(),
                    updated_at = NOW()
                WHERE id = $1
                  AND guild_id = $2
            `,
            [match.id, guildId]
        );

        return {
            ...updated,
            status: 'active',
            started: true
        };
    });
}

async function withdrawStartConfirmation(
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

        if (match.status !== 'recruiting') {
            throw new Error(
                'Start confirmation can no longer be withdrawn.'
            );
        }

        const state = await getStartState(
            client,
            match
        );

        const isCaptain = TEAMS.some(team =>
            state.teams[team].captainId === captainId
        );

        if (!isCaptain) {
            throw new Error(
                'Only a current team captain can withdraw.'
            );
        }

        await client.query(
            `
                DELETE FROM kitsune_match_confirmations
                WHERE match_id = $1
                  AND guild_id = $2
                  AND captain_id = $3
                  AND confirmation_type = 'start'
            `,
            [match.id, guildId, captainId]
        );

        return getStartState(client, match);
    });
}

module.exports = {
    getMatchStartState,
    confirmMatchStart,
    withdrawStartConfirmation
};

const { pool } = require('./connection');

const TEAMS = Object.freeze({
    CRIMSON: 'crimson',
    AZURE: 'azure'
});

const TEAM_VALUES = Object.values(TEAMS);

function mapMatch(row) {
    if (!row) return null;

    return {
        id: String(row.id),
        guildId: row.guild_id,
        channelId: row.channel_id,
        messageId: row.message_id,
        gameName: row.game_name,
        teamSize: row.team_size,
        creatorId: row.creator_id,
        status: row.status,
        reportedWinner: row.reported_winner,
        reportedBy: row.reported_by,
        winnerTeam: row.winner_team,
        createdAt: row.created_at,
        startedAt: row.started_at,
        reportedAt: row.reported_at,
        completedAt: row.completed_at
    };
}

function mapPlayer(row) {
    return {
        userId: row.user_id,
        team: row.team,
        isCaptain: row.is_captain,
        isReady: row.is_ready,
        joinedAt: row.joined_at
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
        await client.query('ROLLBACK').catch(() => null);
        throw error;
    } finally {
        client.release();
    }
}

async function lockMatch(client, guildId, matchId) {
    const { rows } = await client.query(
        `
            SELECT *
            FROM akane_matches
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

async function getPlayers(client, matchId) {
    const { rows } = await client.query(
        `
            SELECT *
            FROM akane_match_players
            WHERE match_id = $1
            ORDER BY joined_at, user_id
        `,
        [matchId]
    );

    return rows.map(mapPlayer);
}

async function loadMatch(client, match) {
    return {
        ...mapMatch(match),
        players: await getPlayers(client, match.id)
    };
}

function validateTeam(team) {
    if (!TEAM_VALUES.includes(team)) {
        throw new Error('Invalid team.');
    }
}

function requireRecruiting(match) {
    if (match.status !== 'recruiting') {
        throw new Error(
            'Team changes are no longer available.'
        );
    }
}

function handleDatabaseError(error) {
    if (
        error.code === '23505' &&
        [
            'akane_match_active_players_pkey',
            'akane_match_active_players_match_id_user_id_key'
        ].includes(error.constraint)
    ) {
        throw new Error(
            'You are already participating in another match.'
        );
    }

    if (error.code === '40P01') {
        throw new Error(
            'The match is busy. Please try again.'
        );
    }

    if (error.code === '40001') {
        throw new Error(
            'The match changed during your request. Please try again.'
        );
    }

    throw error;
}

async function reservePlayer(
    client,
    guildId,
    userId,
    matchId
) {
    await client.query(
        `
            INSERT INTO akane_match_active_players (
                guild_id,
                user_id,
                match_id
            )
            VALUES ($1, $2, $3)
        `,
        [guildId, userId, matchId]
    );
}

async function releasePlayer(
    client,
    guildId,
    userId,
    matchId
) {
    await client.query(
        `
            DELETE FROM akane_match_active_players
            WHERE guild_id = $1
              AND user_id = $2
              AND match_id = $3
        `,
        [guildId, userId, matchId]
    );
}

async function resetStartConfirmations(client, matchId) {
    await client.query(
        `
            DELETE FROM akane_match_confirmations
            WHERE match_id = $1
              AND confirmation_type = 'start'
        `,
        [matchId]
    );

    await client.query(
        `
            UPDATE akane_match_players
            SET is_ready = FALSE
            WHERE match_id = $1
        `,
        [matchId]
    );
}

async function createMatch(
    guildId,
    channelId,
    creatorId,
    gameName,
    teamSize
) {
    const game = String(gameName || '').trim();

    if (!game || game.length > 100) {
        throw new Error(
            'Game name must contain 1-100 characters.'
        );
    }

    if (
        !Number.isInteger(teamSize) ||
        teamSize < 1 ||
        teamSize > 5
    ) {
        throw new Error(
            'Match format must be between 1v1 and 5v5.'
        );
    }

    try {
        return await transaction(async client => {
            const { rows } = await client.query(
                `
                    INSERT INTO akane_matches (
                        guild_id,
                        channel_id,
                        creator_id,
                        game_name,
                        team_size
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `,
                [
                    guildId,
                    channelId,
                    creatorId,
                    game,
                    teamSize
                ]
            );

            const match = rows[0];

            await reservePlayer(
                client,
                guildId,
                creatorId,
                match.id
            );

            await client.query(
                `
                    INSERT INTO akane_match_players (
                        match_id,
                        guild_id,
                        user_id,
                        team,
                        is_captain
                    )
                    VALUES ($1, $2, $3, $4, TRUE)
                `,
                [
                    match.id,
                    guildId,
                    creatorId,
                    TEAMS.CRIMSON
                ]
            );

            return loadMatch(client, match);
        });
    } catch (error) {
        handleDatabaseError(error);
    }
}

async function getMatch(guildId, matchId) {
    const client = await pool.connect();

    try {
        const { rows } = await client.query(
            `
                SELECT *
                FROM akane_matches
                WHERE guild_id = $1
                  AND id = $2
            `,
            [guildId, matchId]
        );

        if (!rows.length) return null;

        return loadMatch(client, rows[0]);
    } finally {
        client.release();
    }
}

async function setMatchMessage(
    guildId,
    matchId,
    messageId
) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        requireRecruiting(match);

        const { rows } = await client.query(
            `
                UPDATE akane_matches
                SET
                    message_id = $3,
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND id = $2
                RETURNING *
            `,
            [guildId, matchId, messageId]
        );

        return loadMatch(client, rows[0]);
    });
}

async function joinTeam(
    guildId,
    matchId,
    userId,
    team
) {
    validateTeam(team);

    try {
        return await transaction(async client => {
            const match = await lockMatch(
                client,
                guildId,
                matchId
            );

            requireRecruiting(match);

            const players = await getPlayers(
                client,
                match.id
            );

            if (players.some(p => p.userId === userId)) {
                throw new Error(
                    'You have already joined this match.'
                );
            }

            const teammates = players.filter(
                p => p.team === team
            );

            if (teammates.length >= match.team_size) {
                throw new Error(
                    'This team is already full.'
                );
            }

            await reservePlayer(
                client,
                guildId,
                userId,
                match.id
            );

            await client.query(
                `
                    INSERT INTO akane_match_players (
                        match_id,
                        guild_id,
                        user_id,
                        team,
                        is_captain
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    match.id,
                    guildId,
                    userId,
                    team,
                    teammates.length === 0
                ]
            );

            await resetStartConfirmations(
                client,
                match.id
            );

            return loadMatch(client, match);
        });
    } catch (error) {
        handleDatabaseError(error);
    }
}

async function leaveMatch(
    guildId,
    matchId,
    userId
) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        requireRecruiting(match);

        const players = await getPlayers(
            client,
            match.id
        );

        const member = players.find(
            p => p.userId === userId
        );

        if (!member) {
            throw new Error(
                'You are not participating in this match.'
            );
        }

        await client.query(
            `
                DELETE FROM akane_match_players
                WHERE match_id = $1
                  AND user_id = $2
            `,
            [match.id, userId]
        );

        await releasePlayer(
            client,
            guildId,
            userId,
            match.id
        );

        const remaining = players.filter(
            p => p.userId !== userId
        );

        await resetStartConfirmations(
            client,
            match.id
        );

        if (!remaining.length) {
            const { rows } = await client.query(
                `
                    UPDATE akane_matches
                    SET
                        status = 'cancelled',
                        updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                `,
                [match.id]
            );

            return loadMatch(client, rows[0]);
        }

        if (member.isCaptain) {
            const replacement = remaining.find(
                p => p.team === member.team
            );

            if (replacement) {
                await client.query(
                    `
                        UPDATE akane_match_players
                        SET is_captain = TRUE
                        WHERE match_id = $1
                          AND user_id = $2
                    `,
                    [match.id, replacement.userId]
                );
            }
        }

        return loadMatch(client, match);
    });
}

async function cancelMatch(
    guildId,
    matchId,
    userId
) {
    return transaction(async client => {
        const match = await lockMatch(
            client,
            guildId,
            matchId
        );

        if (match.creator_id !== userId) {
            throw new Error(
                'Only the match creator can cancel.'
            );
        }

        requireRecruiting(match);

        const { rows } = await client.query(
            `
                UPDATE akane_matches
                SET
                    status = 'cancelled',
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `,
            [match.id]
        );

        await client.query(
            `
                DELETE FROM akane_match_active_players
                WHERE match_id = $1
            `,
            [match.id]
        );

        await resetStartConfirmations(
            client,
            match.id
        );

        return loadMatch(client, rows[0]);
    });
}

module.exports = {
    TEAMS,
    createMatch,
    getMatch,
    setMatchMessage,
    joinTeam,
    leaveMatch,
    cancelMatch
};
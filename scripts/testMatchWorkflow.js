const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const db = new PGlite();

const connection = require('../database/connection');

// Test-only adapter. No external PostgreSQL connection is opened.
connection.pool.connect = async () => ({
    query: (sql, params) => db.query(sql, params),
    release() {}
});

const {
    createMatch,
    getMatch,
    joinTeam,
    leaveMatch
} = require('../database/matches');

const {
    confirmMatchStart
} = require('../database/matchStart');

const {
    reportMatchResult,
    confirmMatchResult,
    disputeMatchResult,
    resolveMatchDispute
} = require('../database/matchResults');

const {
    forceCancelMatch
} = require('../database/matchModeration');

const GUILD = 'test-guild';
const CHANNEL = 'test-pvp';

const USERS = [
    'player-1',
    'player-2',
    'player-3',
    'player-4',
    'player-5',
    'player-6'
];

async function setup() {
    await db.exec(`
        CREATE TABLE kitsune_users (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            PRIMARY KEY (guild_id, user_id)
        );

        CREATE TABLE kitsune_player_stats (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            duel_wins INTEGER NOT NULL DEFAULT 0,
            duel_losses INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (guild_id, user_id),
            FOREIGN KEY (guild_id, user_id)
                REFERENCES kitsune_users (guild_id, user_id)
        );
    `);

    const schemaPath = path.join(
        __dirname,
        '../database/matchSchema.js'
    );

    const source = await fs.readFile(schemaPath, 'utf8');

    const statements = [
        ...source.matchAll(/await query\(`([\s\S]*?)`\);/g)
    ].map(match => match[1]);

    assert.equal(
        statements.length,
        9,
        'Unexpected Match Schema structure.'
    );

    for (const statement of statements) {
        await db.exec(statement);
    }

    for (const userId of USERS) {
        await db.query(
            `
                INSERT INTO kitsune_users (guild_id, user_id)
                VALUES ($1, $2)
            `,
            [GUILD, userId]
        );

        await db.query(
            `
                INSERT INTO kitsune_player_stats (
                    guild_id, user_id
                )
                VALUES ($1, $2)
            `,
            [GUILD, userId]
        );
    }

    console.log('PASS: Test database initialized');
}

async function expectFailure(action, message) {
    let failed = false;

    try {
        await action();
    } catch {
        failed = true;
    }

    assert.ok(failed, message);
}

async function getStats(userId) {
    const { rows } = await db.query(
        `
            SELECT duel_wins, duel_losses
            FROM kitsune_player_stats
            WHERE guild_id = $1 AND user_id = $2
        `,
        [GUILD, userId]
    );

    return rows[0];
}

async function testCompletedMatch() {
    const match = await createMatch(
        GUILD,
        CHANNEL,
        USERS[0],
        'Slayers 2',
        2
    );

    assert.equal(match.status, 'recruiting');
    assert.equal(match.players.length, 1);
    assert.equal(match.players[0].isCaptain, true);

    console.log('PASS: 2v2 match created');

    await joinTeam(GUILD, match.id, USERS[1], 'crimson');
    await joinTeam(GUILD, match.id, USERS[2], 'azure');
    await joinTeam(GUILD, match.id, USERS[3], 'azure');

    const filled = await getMatch(GUILD, match.id);

    assert.equal(filled.players.length, 4);

    console.log('PASS: Both teams filled');

    await expectFailure(
        () => joinTeam(GUILD, match.id, USERS[4], 'azure'),
        'Full teams must reject new players.'
    );

    await expectFailure(
        () => createMatch(
            GUILD,
            CHANNEL,
            USERS[0],
            'Another Game',
            1
        ),
        'A player must not create two active matches.'
    );

    console.log('PASS: Team limits and player reservation');

    const firstReady = await confirmMatchStart(
        GUILD,
        match.id,
        USERS[0]
    );

    assert.equal(firstReady.started, false);

    const secondReady = await confirmMatchStart(
        GUILD,
        match.id,
        USERS[2]
    );

    assert.equal(secondReady.started, true);

    const active = await getMatch(GUILD, match.id);

    assert.equal(active.status, 'active');

    console.log('PASS: Both captains confirmed start');

    await reportMatchResult(
        GUILD,
        match.id,
        USERS[0],
        'crimson'
    );

    const reported = await getMatch(GUILD, match.id);

    assert.equal(reported.status, 'reported');

    await confirmMatchResult(
        GUILD,
        match.id,
        USERS[2]
    );

    const completed = await getMatch(GUILD, match.id);

    assert.equal(completed.status, 'completed');
    assert.equal(completed.winnerTeam, 'crimson');

    console.log('PASS: Opposing captain confirmed result');

    for (const userId of USERS.slice(0, 2)) {
        const stats = await getStats(userId);

        assert.equal(stats.duel_wins, 1);
        assert.equal(stats.duel_losses, 0);
    }

    for (const userId of USERS.slice(2, 4)) {
        const stats = await getStats(userId);

        assert.equal(stats.duel_wins, 0);
        assert.equal(stats.duel_losses, 1);
    }

    console.log('PASS: Correct Win/Loss statistics');

    await expectFailure(
        () => confirmMatchResult(
            GUILD,
            match.id,
            USERS[2]
        ),
        'A completed match must not be counted twice.'
    );

    assert.equal((await getStats(USERS[0])).duel_wins, 1);

    console.log('PASS: Duplicate results prevented');

    return match.id;
}

async function testModeration() {
    const match = await createMatch(
        GUILD,
        CHANNEL,
        USERS[4],
        'Training Battle',
        1
    );

    await joinTeam(
        GUILD,
        match.id,
        USERS[5],
        'azure'
    );

    await confirmMatchStart(
        GUILD,
        match.id,
        USERS[4]
    );

    await confirmMatchStart(
        GUILD,
        match.id,
        USERS[5]
    );

    await reportMatchResult(
        GUILD,
        match.id,
        USERS[4],
        'crimson'
    );

    await disputeMatchResult(
        GUILD,
        match.id,
        USERS[5]
    );

    assert.equal(
        (await getMatch(GUILD, match.id)).status,
        'disputed'
    );

    console.log('PASS: Result dispute');

    await resolveMatchDispute(
        GUILD,
        match.id,
        'azure'
    );

    assert.equal(
        (await getMatch(GUILD, match.id)).winnerTeam,
        'azure'
    );

    assert.equal((await getStats(USERS[5])).duel_wins, 1);
    assert.equal((await getStats(USERS[4])).duel_losses, 1);

    console.log('PASS: Staff dispute resolution');

    const abandoned = await createMatch(
        GUILD,
        CHANNEL,
        USERS[4],
        'Cancelled Battle',
        1
    );

    await forceCancelMatch(GUILD, abandoned.id);

    assert.equal(
        (await getMatch(GUILD, abandoned.id)).status,
        'cancelled'
    );

    const replacement = await createMatch(
        GUILD,
        CHANNEL,
        USERS[4],
        'New Battle',
        1
    );

    assert.equal(replacement.status, 'recruiting');

    await leaveMatch(
        GUILD,
        replacement.id,
        USERS[4]
    );

    assert.equal(
        (await getMatch(GUILD, replacement.id)).status,
        'cancelled'
    );

    console.log('PASS: Cancellation releases players');
}

async function main() {
    try {
        await setup();
        await testCompletedMatch();
        await testModeration();

        console.log('');
        console.log('ALL MATCH WORKFLOW TESTS PASSED');
    } finally {
        await db.close();
        await connection.pool.end();
    }
}

main().catch(error => {
    console.error('');
    console.error('MATCH WORKFLOW TEST FAILED');
    console.error(error);

    process.exitCode = 1;
});

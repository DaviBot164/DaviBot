const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const db = new PGlite();

const connection = require('../database/connection');

connection.pool.connect = async () => ({
    query: (sql, params) => db.query(sql, params),
    release() {}
});

const {
    createMatch,
    getMatch,
    joinTeam
} = require('../database/matches');

const {
    confirmMatchStart
} = require('../database/matchStart');

const {
    expireRecruitingMatches,
    RECRUITING_HOURS,
    BATCH_SIZE
} = require('../database/matchExpiry');

const GUILD = 'expiry-test-guild';
const CHANNEL = 'expiry-test-channel';

async function setup() {
    await db.exec(`
        CREATE TABLE kitsune_users (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            PRIMARY KEY (guild_id, user_id)
        );
    `);

    const schemaPath = path.join(
        __dirname,
        '../database/matchSchema.js'
    );

    const source = await fs.readFile(
        schemaPath,
        'utf8'
    );

    const statements = [
        ...source.matchAll(
            /await query\(`([\s\S]*?)`\);/g
        )
    ].map(match => match[1]);

    assert.equal(
        statements.length,
        9,
        'Unexpected Match Schema structure.'
    );

    for (const statement of statements) {
        await db.exec(statement);
    }

    for (let i = 1; i <= 6; i++) {
        await db.query(
            `
                INSERT INTO kitsune_users (
                    guild_id,
                    user_id
                )
                VALUES ($1, $2)
            `,
            [GUILD, `player-${i}`]
        );
    }

    console.log('PASS: Test database initialized');
}

async function makeOld(matchId) {
    await db.query(
        `
            UPDATE kitsune_matches
            SET created_at = NOW() - INTERVAL '25 hours'
            WHERE id = $1
        `,
        [matchId]
    );
}

async function isReserved(userId) {
    const { rows } = await db.query(
        `
            SELECT EXISTS (
                SELECT 1
                FROM kitsune_match_active_players
                WHERE guild_id = $1
                  AND user_id = $2
            ) AS reserved
        `,
        [GUILD, userId]
    );

    return rows[0].reserved;
}

async function testExpiry() {
    assert.equal(RECRUITING_HOURS, 24);
    assert.equal(BATCH_SIZE, 50);

    const expired = await createMatch(
        GUILD,
        CHANNEL,
        'player-1',
        'Old Recruiting Match',
        1
    );

    await joinTeam(
        GUILD,
        expired.id,
        'player-2',
        'azure'
    );

    await makeOld(expired.id);

    const fresh = await createMatch(
        GUILD,
        CHANNEL,
        'player-3',
        'New Recruiting Match',
        1
    );

    const active = await createMatch(
        GUILD,
        CHANNEL,
        'player-4',
        'Active Match',
        1
    );

    await joinTeam(
        GUILD,
        active.id,
        'player-5',
        'azure'
    );

    await confirmMatchStart(
        GUILD,
        active.id,
        'player-4'
    );

    await confirmMatchStart(
        GUILD,
        active.id,
        'player-5'
    );

    await makeOld(active.id);

    console.log('PASS: Test matches created');

    assert.equal(
        await isReserved('player-1'),
        true
    );

    const results = await expireRecruitingMatches();

    assert.equal(results.length, 1);

    assert.deepEqual(results[0], {
        guildId: GUILD,
        matchId: expired.id
    });

    console.log('PASS: Old recruiting match detected');

    assert.equal(
        (await getMatch(GUILD, expired.id)).status,
        'cancelled'
    );

    assert.equal(
        await isReserved('player-1'),
        false
    );

    assert.equal(
        await isReserved('player-2'),
        false
    );

    console.log('PASS: Expired players released');

    assert.equal(
        (await getMatch(GUILD, fresh.id)).status,
        'recruiting'
    );

    assert.equal(
        await isReserved('player-3'),
        true
    );

    console.log('PASS: Recent recruiting match preserved');

    assert.equal(
        (await getMatch(GUILD, active.id)).status,
        'active'
    );

    assert.equal(
        await isReserved('player-4'),
        true
    );

    assert.equal(
        await isReserved('player-5'),
        true
    );

    console.log('PASS: Active match preserved');

    const secondRun = await expireRecruitingMatches();

    assert.deepEqual(secondRun, []);

    console.log('PASS: Repeated expiration is safe');

    const replacement = await createMatch(
        GUILD,
        CHANNEL,
        'player-1',
        'Replacement Match',
        1
    );

    assert.equal(replacement.status, 'recruiting');

    console.log('PASS: Released player can create a new match');
}

async function main() {
    try {
        await setup();
        await testExpiry();

        console.log('');
        console.log('ALL MATCH EXPIRATION TESTS PASSED');
    } finally {
        await db.close();
        await connection.pool.end();
    }
}

main().catch(error => {
    console.error('');
    console.error('MATCH EXPIRATION TEST FAILED');
    console.error(error);

    process.exitCode = 1;
});

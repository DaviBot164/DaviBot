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
    joinTeam,
    getMatch,
    leaveMatch
} = require('../database/matches');

const {
    confirmMatchStart
} = require('../database/matchStart');

const GUILD = 'safety-test';
const CHANNEL = 'pvp-test';

async function setup() {
    await db.exec(`
        CREATE TABLE akane_users (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            PRIMARY KEY (guild_id, user_id)
        );
    `);

    const source = await fs.readFile(
        path.join(__dirname, '../database/matchSchema.js'),
        'utf8'
    );

    const statements = [
        ...source.matchAll(/await query\(`([\s\S]*?)`\);/g)
    ].map(match => match[1]);

    assert.equal(statements.length, 9);

    for (const statement of statements) {
        await db.exec(statement);
    }

    for (let i = 1; i <= 8; i++) {
        await db.query(
            `INSERT INTO akane_users (guild_id, user_id)
             VALUES ($1, $2)`,
            [GUILD, `player-${i}`]
        );
    }
}

async function expectFailure(action) {
    await assert.rejects(action);
}

async function testTeamCapacity() {
    const match = await createMatch(
        GUILD, CHANNEL, 'player-1', 'Slayers 2', 1
    );

    await joinTeam(
        GUILD, match.id, 'player-2', 'azure'
    );

    await expectFailure(() =>
        joinTeam(GUILD, match.id, 'player-3', 'azure')
    );

    assert.equal(
        (await getMatch(GUILD, match.id)).players.length,
        2
    );

    console.log('PASS: Team capacity enforced');
}

async function testDuplicateParticipation() {
    const first = await createMatch(
        GUILD, CHANNEL, 'player-3', 'Game A', 2
    );

    const second = await createMatch(
        GUILD, CHANNEL, 'player-4', 'Game B', 2
    );

    await joinTeam(
        GUILD, first.id, 'player-5', 'azure'
    );

    await expectFailure(() =>
        joinTeam(GUILD, second.id, 'player-5', 'azure')
    );

    console.log('PASS: Duplicate participation rejected');

    await leaveMatch(GUILD, first.id, 'player-5');

    await joinTeam(
        GUILD, second.id, 'player-5', 'azure'
    );

    console.log('PASS: Player can join after leaving');
}

async function testCaptainStart() {
    const match = await createMatch(
        GUILD, CHANNEL, 'player-6', 'Game C', 1
    );

    await joinTeam(
        GUILD, match.id, 'player-7', 'azure'
    );

    await expectFailure(() =>
        confirmMatchStart(GUILD, match.id, 'player-8')
    );

    await confirmMatchStart(
        GUILD, match.id, 'player-6'
    );

    const started = await confirmMatchStart(
        GUILD, match.id, 'player-7'
    );

    assert.equal(started.started, true);

    await expectFailure(() =>
        leaveMatch(GUILD, match.id, 'player-7')
    );

    console.log('PASS: Captain permissions and active lock');
}

async function main() {
    try {
        await setup();
        await testTeamCapacity();
        await testDuplicateParticipation();
        await testCaptainStart();

        console.log('');
        console.log('ALL MATCH SAFETY TESTS PASSED');
    } finally {
        await db.close();
        await connection.pool.end();
    }
}

main().catch(error => {
    console.error('MATCH SAFETY TEST FAILED');
    console.error(error);
    process.exitCode = 1;
});
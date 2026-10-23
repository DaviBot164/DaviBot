const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs/promises');

async function main() {
    const db = new PGlite();

    try {
        const schemaFile = await fs.readFile(
            'database/matchSchema.js',
            'utf8'
        );

        const statements = [
            ...schemaFile.matchAll(
                /await query\(`([\s\S]*?)`\);/g
            )
        ].map(match => match[1]);

        if (statements.length !== 9) {
            throw new Error(
                `Expected 9 SQL statements, found ${statements.length}.`
            );
        }

        await db.exec(`
            CREATE TABLE kitsune_users (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                PRIMARY KEY (guild_id, user_id)
            );
        `);

        for (const statement of statements) {
            await db.exec(statement);
        }

        const { rows } = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name LIKE 'kitsune_match%'
            ORDER BY table_name
        `);

        const expected = [
            'kitsune_match_active_players',
            'kitsune_match_confirmations',
            'kitsune_match_players',
            'kitsune_matches'
        ];

        const actual = rows.map(row => row.table_name);

        for (const table of expected) {
            if (!actual.includes(table)) {
                throw new Error(`Missing table: ${table}`);
            }

            console.log(`OK: ${table}`);
        }

        console.log('Match schema: PASSED');
    } finally {
        await db.close();
    }
}

main().catch(error => {
    console.error('Match schema: FAILED');
    console.error(error);
    process.exitCode = 1;
});

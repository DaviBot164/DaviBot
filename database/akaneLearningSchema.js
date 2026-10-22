const {query} = require('./connection');
async function initializeAkaneLearningSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS akane_learned_phrases (
            guild_id TEXT NOT NULL, phrase VARCHAR(160) NOT NULL,
            intent VARCHAR(40) NOT NULL, taught_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (guild_id, phrase)
        );
        CREATE TABLE IF NOT EXISTS akane_unknown_phrases (
            guild_id TEXT NOT NULL, phrase VARCHAR(160) NOT NULL,
            seen_count INTEGER NOT NULL DEFAULT 1 CHECK (seen_count > 0),
            first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (guild_id, phrase)
        );
        CREATE INDEX IF NOT EXISTS akane_unknown_expiry
            ON akane_unknown_phrases (expires_at);
        DELETE FROM akane_unknown_phrases WHERE expires_at<=NOW();
    `);
}
module.exports={initializeAkaneLearningSchema};

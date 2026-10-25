const {query} = require('./connection');
async function initializeKitsuneLearningSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_learned_phrases (
            guild_id TEXT NOT NULL, phrase VARCHAR(160) NOT NULL,
            intent VARCHAR(40) NOT NULL, taught_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (guild_id, phrase)
        );
        CREATE TABLE IF NOT EXISTS kitsune_unknown_phrases (
            guild_id TEXT NOT NULL, phrase VARCHAR(160) NOT NULL,
            seen_count INTEGER NOT NULL DEFAULT 1 CHECK (seen_count > 0),
            first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            PRIMARY KEY (guild_id, phrase)
        );
        CREATE TABLE IF NOT EXISTS kitsune_knowledge (
            guild_id TEXT NOT NULL, name VARCHAR(80) NOT NULL,
            kind VARCHAR(20) NOT NULL CHECK(kind IN ('member','term','phrase','role','channel','command','fact','reply')),
            explanation VARCHAR(500) NOT NULL DEFAULT '', target_id TEXT,
            taught_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(guild_id,name)
        );
        CREATE INDEX IF NOT EXISTS kitsune_unknown_expiry
            ON kitsune_unknown_phrases (expires_at);
        DELETE FROM kitsune_unknown_phrases WHERE expires_at<=NOW();
    `);
}
module.exports={initializeKitsuneLearningSchema};

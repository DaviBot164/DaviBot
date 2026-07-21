const { query } = require('./connection');

/**
 * Create all required database tables and indexes.
 *
 * @returns {Promise<void>}
 */
async function initializeSchema() {
    /*
     * Warning System
     */
    await query(`
        CREATE TABLE IF NOT EXISTS warnings (
            id BIGSERIAL PRIMARY KEY,
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            moderator_id VARCHAR(32) NOT NULL,
            reason VARCHAR(500) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS warnings_guild_user_index
        ON warnings (guild_id, user_id);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS warnings_created_at_index
        ON warnings (created_at DESC);
    `);

    /*
     * AutoMod Case System
     */
    await query(`
        CREATE TABLE IF NOT EXISTS automod_cases (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            channel_id VARCHAR(32) NOT NULL,

            reason VARCHAR(500) NOT NULL,
            action VARCHAR(500) NOT NULL,

            message_content TEXT,

            message_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            timeout_applied BOOLEAN NOT NULL DEFAULT FALSE,
            timeout_duration_ms BIGINT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_guild_user_index
        ON automod_cases (guild_id, user_id);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_guild_id_index
        ON automod_cases (guild_id, id DESC);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_created_at_index
        ON automod_cases (created_at DESC);
    `);

    /*
     * Raid Shield Case System
     */
    await query(`
        CREATE TABLE IF NOT EXISTS raid_cases (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,

            join_count INTEGER NOT NULL,
            join_limit INTEGER NOT NULL,

            detection_window_ms BIGINT NOT NULL,
            raid_mode_duration_ms BIGINT NOT NULL,

            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

            member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

            detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ends_at TIMESTAMPTZ NOT NULL,
            closed_at TIMESTAMPTZ
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_guild_status_index
        ON raid_cases (guild_id, status);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_guild_id_index
        ON raid_cases (guild_id, id DESC);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_detected_at_index
        ON raid_cases (detected_at DESC);
    `);
}

module.exports = {
    initializeSchema
};
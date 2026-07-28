const {
    query
} = require('./connection');

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

    /*
     * Crimson Eclipse Event System
     *
     * Stores the main information for every
     * Event created through Umbra.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS events (
            event_id VARCHAR(32) PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            channel_id VARCHAR(32) NOT NULL,
            message_id VARCHAR(32) NOT NULL,
            host_id VARCHAR(32) NOT NULL,

            title VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,

            event_time VARCHAR(100) NOT NULL,
            reward VARCHAR(200) NOT NULL,

            max_players INTEGER NOT NULL,

            status VARCHAR(20) NOT NULL DEFAULT 'Active',

            winner_id VARCHAR(32),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ended_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_guild_status_index
        ON events (guild_id, status);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_guild_created_at_index
        ON events (guild_id, created_at DESC);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_host_index
        ON events (guild_id, host_id);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_message_index
        ON events (guild_id, message_id);
    `);

    /*
     * Event Participants
     *
     * Stores every Soul who joins an Event.
     *
     * The composite primary key prevents the
     * same user from joining the same Event twice.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS event_participants (
            event_id VARCHAR(32) NOT NULL,
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (event_id, user_id),

            CONSTRAINT event_participants_event_foreign_key
                FOREIGN KEY (event_id)
                REFERENCES events (event_id)
                ON DELETE CASCADE
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_event_index
        ON event_participants (event_id, joined_at ASC);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_guild_user_index
        ON event_participants (guild_id, user_id);
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_joined_at_index
        ON event_participants (joined_at DESC);
    `);
}

module.exports = {
    initializeSchema
};
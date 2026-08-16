const {
    query
} = require('./connection');

/**
 * Create the PostgreSQL table and indexes
 * required by the Rank Trials Scheduled
 * Event Manager.
 *
 * This schema remains separate from the
 * general database/schema.js file so future
 * Event Manager updates stay isolated and safe.
 *
 * @returns {Promise<void>}
 */
async function initializeRankTrialEventSchema() {
    /*
     * ======================================================
     * Evelynn Rank Trials Discord Event Manager
     * ======================================================
     *
     * Stores one Discord Scheduled Event for
     * each monthly Rank Trial cycle.
     *
     * The unique guild/trial constraint prevents
     * duplicate Discord Events after restart,
     * redeploy or simultaneous synchronization.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS rank_trial_events (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,

            trial_key VARCHAR(7) NOT NULL,

            discord_event_id VARCHAR(32),

            event_name VARCHAR(100) NOT NULL,

            event_description TEXT NOT NULL,

            event_location VARCHAR(100) NOT NULL,

            starts_at TIMESTAMPTZ NOT NULL,

            ends_at TIMESTAMPTZ NOT NULL,

            status VARCHAR(20) NOT NULL
                DEFAULT 'SCHEDULED',

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            synced_at TIMESTAMPTZ,

            deleted_at TIMESTAMPTZ,

            CONSTRAINT rank_trial_events_trial_key_valid
                CHECK (
                    trial_key ~
                    '^[0-9]{4}-(0[1-9]|1[0-2])$'
                ),

            CONSTRAINT rank_trial_events_status_valid
                CHECK (
                    status IN (
                        'SCHEDULED',
                        'ACTIVE',
                        'COMPLETED',
                        'CANCELLED',
                        'DELETED'
                    )
                ),

            CONSTRAINT rank_trial_events_dates_valid
                CHECK (
                    ends_at >
                    starts_at
                ),

            CONSTRAINT rank_trial_events_unique_cycle
                UNIQUE (
                    guild_id,
                    trial_key
                )
        );
    `);

    /*
     * A Discord Scheduled Event ID must belong
     * to only one Rank Trial record.
     *
     * Rows may temporarily have no Event ID
     * while creation is being reserved.
     */
    await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS rank_trial_events_discord_event_unique_index
        ON rank_trial_events (
            discord_event_id
        )
        WHERE discord_event_id IS NOT NULL;
    `);

    /*
     * Quickly loads one monthly Rank Trial Event.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_events_cycle_index
        ON rank_trial_events (
            guild_id,
            trial_key
        );
    `);

    /*
     * Used when loading current Scheduled
     * or Active Rank Trial Events.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_events_guild_status_index
        ON rank_trial_events (
            guild_id,
            status,
            starts_at ASC
        );
    `);

    /*
     * Used by automatic Event synchronization.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_events_start_index
        ON rank_trial_events (
            starts_at ASC
        )
        WHERE status IN (
            'SCHEDULED',
            'ACTIVE'
        );
    `);

    /*
     * Used when loading the most recently
     * synchronized Event records.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_events_synced_index
        ON rank_trial_events (
            guild_id,
            synced_at DESC
        )
        WHERE synced_at IS NOT NULL;
    `);

    /*
     * Used for auditing deleted or missing
     * Discord Scheduled Events.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_events_deleted_index
        ON rank_trial_events (
            guild_id,
            deleted_at DESC
        )
        WHERE status = 'DELETED';
    `);
}

module.exports = {
    initializeRankTrialEventSchema
};
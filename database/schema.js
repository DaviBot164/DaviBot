const {
    query
} = require('./connection');

/**
 * Create all required database tables
 * and indexes.
 *
 * @returns {Promise<void>}
 */
async function initializeSchema() {
    /*
     * ======================================================
     * Warning System
     * ======================================================
     */
    await query(`
        CREATE TABLE IF NOT EXISTS warnings (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            moderator_id VARCHAR(32) NOT NULL,

            reason VARCHAR(500) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS warnings_guild_user_index
        ON warnings (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS warnings_created_at_index
        ON warnings (
            created_at DESC
        );
    `);

    /*
     * ======================================================
     * AutoMod Case System
     * ======================================================
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

            message_deleted BOOLEAN NOT NULL
                DEFAULT FALSE,

            timeout_applied BOOLEAN NOT NULL
                DEFAULT FALSE,

            timeout_duration_ms BIGINT,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_guild_user_index
        ON automod_cases (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_guild_id_index
        ON automod_cases (
            guild_id,
            id DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS automod_cases_created_at_index
        ON automod_cases (
            created_at DESC
        );
    `);

    /*
     * ======================================================
     * Raid Shield Case System
     * ======================================================
     */
    await query(`
        CREATE TABLE IF NOT EXISTS raid_cases (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,

            join_count INTEGER NOT NULL,
            join_limit INTEGER NOT NULL,

            detection_window_ms BIGINT NOT NULL,
            raid_mode_duration_ms BIGINT NOT NULL,

            status VARCHAR(20) NOT NULL
                DEFAULT 'ACTIVE',

            member_ids JSONB NOT NULL
                DEFAULT '[]'::jsonb,

            detected_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            ends_at TIMESTAMPTZ NOT NULL,

            closed_at TIMESTAMPTZ
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_guild_status_index
        ON raid_cases (
            guild_id,
            status
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_guild_id_index
        ON raid_cases (
            guild_id,
            id DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS raid_cases_detected_at_index
        ON raid_cases (
            detected_at DESC
        );
    `);

    /*
     * ======================================================
     * Umbra Monthly Rank Trials System
     * ======================================================
     *
     * Stores every automatic Rank Trial
     * announcement published by Umbra.
     *
     * The unique constraint prevents duplicate
     * announcements after restart or redeploy.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS rank_trial_publications (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,

            trial_key VARCHAR(7) NOT NULL,

            publication_type VARCHAR(50) NOT NULL,

            channel_id VARCHAR(32) NOT NULL,

            message_id VARCHAR(32),

            scheduled_for TIMESTAMPTZ NOT NULL,

            published_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            CONSTRAINT rank_trial_publications_type_valid
                CHECK (
                    publication_type IN (
                        'OPENING',
                        'REGISTRATION_REMINDER',
                        'FINAL_REMINDER',
                        'BATTLE_START',
                        'CLOSING'
                    )
                ),

            CONSTRAINT rank_trial_publications_trial_key_valid
                CHECK (
                    trial_key ~
                    '^[0-9]{4}-(0[1-9]|1[0-2])$'
                ),

            CONSTRAINT rank_trial_publications_unique
                UNIQUE (
                    guild_id,
                    trial_key,
                    publication_type
                )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_publications_trial_index
        ON rank_trial_publications (
            guild_id,
            trial_key,
            scheduled_for ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_publications_schedule_index
        ON rank_trial_publications (
            scheduled_for ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_publications_published_index
        ON rank_trial_publications (
            guild_id,
            published_at DESC
        )
        WHERE published_at IS NOT NULL;
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_publications_pending_index
        ON rank_trial_publications (
            created_at ASC
        )
        WHERE message_id IS NULL
          AND published_at IS NULL;
    `);    /*
     * ======================================================
     * Las Noches Event System
     * ======================================================
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

            status VARCHAR(20) NOT NULL
                DEFAULT 'Active',

            winner_id VARCHAR(32),

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            ended_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_guild_status_index
        ON events (
            guild_id,
            status
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_guild_created_at_index
        ON events (
            guild_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_host_index
        ON events (
            guild_id,
            host_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS events_message_index
        ON events (
            guild_id,
            message_id
        );
    `);

    /*
     * Event Participants
     */
    await query(`
        CREATE TABLE IF NOT EXISTS event_participants (
            event_id VARCHAR(32) NOT NULL,
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            joined_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                event_id,
                user_id
            ),

            CONSTRAINT event_participants_event_foreign_key
                FOREIGN KEY (
                    event_id
                )
                REFERENCES events (
                    event_id
                )
                ON DELETE CASCADE
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_event_index
        ON event_participants (
            event_id,
            joined_at ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_guild_user_index
        ON event_participants (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS event_participants_joined_at_index
        ON event_participants (
            joined_at DESC
        );
    `);

    /*
     * ======================================================
     * Las Noches Giveaway System
     * ======================================================
     */
    await query(`
        CREATE TABLE IF NOT EXISTS giveaways (
            giveaway_id VARCHAR(32) PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            channel_id VARCHAR(32) NOT NULL,
            message_id VARCHAR(32) NOT NULL,
            host_id VARCHAR(32) NOT NULL,

            prize VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            requirement VARCHAR(200),

            winner_count INTEGER NOT NULL,

            status VARCHAR(20) NOT NULL
                DEFAULT 'Active',

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            ends_at TIMESTAMPTZ NOT NULL,

            ended_at TIMESTAMPTZ,
            cancelled_at TIMESTAMPTZ
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaways_guild_status_index
        ON giveaways (
            guild_id,
            status
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaways_guild_created_at_index
        ON giveaways (
            guild_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaways_host_index
        ON giveaways (
            guild_id,
            host_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaways_ends_at_index
        ON giveaways (
            status,
            ends_at ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaways_message_index
        ON giveaways (
            guild_id,
            message_id
        );
    `);

    /*
     * Giveaway Participants
     */
    await query(`
        CREATE TABLE IF NOT EXISTS giveaway_participants (
            giveaway_id VARCHAR(32) NOT NULL,
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            joined_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                giveaway_id,
                user_id
            ),

            CONSTRAINT giveaway_participants_giveaway_foreign_key
                FOREIGN KEY (
                    giveaway_id
                )
                REFERENCES giveaways (
                    giveaway_id
                )
                ON DELETE CASCADE
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaway_participants_giveaway_index
        ON giveaway_participants (
            giveaway_id,
            joined_at ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaway_participants_guild_user_index
        ON giveaway_participants (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaway_participants_joined_at_index
        ON giveaway_participants (
            joined_at DESC
        );
    `);

    /*
     * Giveaway Winners
     */
    await query(`
        CREATE TABLE IF NOT EXISTS giveaway_winners (
            giveaway_id VARCHAR(32) NOT NULL,
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            selected_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                giveaway_id,
                user_id
            ),

            CONSTRAINT giveaway_winners_giveaway_foreign_key
                FOREIGN KEY (
                    giveaway_id
                )
                REFERENCES giveaways (
                    giveaway_id
                )
                ON DELETE CASCADE
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaway_winners_giveaway_index
        ON giveaway_winners (
            giveaway_id,
            selected_at ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS giveaway_winners_guild_user_index
        ON giveaway_winners (
            guild_id,
            user_id
        );
    `);    /*
     * ======================================================
     * Umbra Level System
     * ======================================================
     *
     * Stores each Soul's XP, Level and
     * message activity separately per server.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS levels (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            xp BIGINT NOT NULL DEFAULT 0,
            level INTEGER NOT NULL DEFAULT 0,
            message_count BIGINT NOT NULL DEFAULT 0,

            last_xp_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id
            ),

            CONSTRAINT levels_xp_non_negative
                CHECK (
                    xp >= 0
                ),

            CONSTRAINT levels_level_non_negative
                CHECK (
                    level >= 0
                ),

            CONSTRAINT levels_message_count_non_negative
                CHECK (
                    message_count >= 0
                )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS levels_guild_xp_index
        ON levels (
            guild_id,
            xp DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS levels_guild_level_xp_index
        ON levels (
            guild_id,
            level DESC,
            xp DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS levels_guild_message_count_index
        ON levels (
            guild_id,
            message_count DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS levels_updated_at_index
        ON levels (
            updated_at DESC
        );
    `);

    /*
     * Level Reward Roles
     *
     * Stores the Discord roles Umbra should
     * grant when a Soul reaches a Level.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS level_rewards (
            guild_id VARCHAR(32) NOT NULL,
            level INTEGER NOT NULL,
            role_id VARCHAR(32) NOT NULL,

            created_by VARCHAR(32) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                level,
                role_id
            ),

            CONSTRAINT level_rewards_level_positive
                CHECK (
                    level > 0
                )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS level_rewards_guild_level_index
        ON level_rewards (
            guild_id,
            level ASC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS level_rewards_guild_role_index
        ON level_rewards (
            guild_id,
            role_id
        );
    `);

    /*
     * ======================================================
     * Umbra Achievement System
     * ======================================================
     */

    /*
     * Achievement Definitions
     *
     * Stores every Achievement available
     * inside Umbra.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS achievements (
            achievement_id VARCHAR(100) PRIMARY KEY,

            name VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,

            icon VARCHAR(20) NOT NULL,
            category VARCHAR(50) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS achievements_category_index
        ON achievements (
            category
        );
    `);

    /*
     * Soul Achievements
     *
     * Stores every Achievement unlocked
     * by each Soul inside each server.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS soul_achievements (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            achievement_id VARCHAR(100) NOT NULL,

            unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id,
                achievement_id
            ),

            CONSTRAINT soul_achievements_achievement_foreign_key
                FOREIGN KEY (
                    achievement_id
                )
                REFERENCES achievements (
                    achievement_id
                )
                ON DELETE CASCADE
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS soul_achievements_guild_user_index
        ON soul_achievements (
            guild_id,
            user_id
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS soul_achievements_unlocked_at_index
        ON soul_achievements (
            unlocked_at DESC
        );
    `);

    /*
     * ======================================================
     * Las Noches Arrancar Rank System
     * ======================================================
     */

    /*
     * Stores the current manually assigned
     * Arrancar Rank of every Soul.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS arrancar_ranks (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            rank_name VARCHAR(100) NOT NULL,
            assigned_by VARCHAR(32) NOT NULL,

            reason VARCHAR(500) NOT NULL
                DEFAULT 'No reason was provided.',

            assigned_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id
            )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS arrancar_ranks_guild_rank_index
        ON arrancar_ranks (
            guild_id,
            rank_name
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS arrancar_ranks_updated_at_index
        ON arrancar_ranks (
            updated_at DESC
        );
    `);

    /*
     * Arrancar Rank History
     *
     * Stores every promotion, demotion,
     * replacement and removal.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS arrancar_rank_history (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            moderator_id VARCHAR(32) NOT NULL,

            action VARCHAR(20) NOT NULL,

            old_rank VARCHAR(100),
            new_rank VARCHAR(100),

            reason VARCHAR(500) NOT NULL
                DEFAULT 'No reason was provided.',

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            CONSTRAINT arrancar_rank_history_action_valid
                CHECK (
                    action IN (
                        'SET',
                        'REMOVE'
                    )
                ),

            CONSTRAINT arrancar_rank_history_rank_valid
                CHECK (
                    old_rank IS NOT NULL
                    OR new_rank IS NOT NULL
                )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS arrancar_rank_history_guild_user_index
        ON arrancar_rank_history (
            guild_id,
            user_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS arrancar_rank_history_moderator_index
        ON arrancar_rank_history (
            guild_id,
            moderator_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS arrancar_rank_history_created_at_index
        ON arrancar_rank_history (
            created_at DESC
        );
    `);    /*
     * ======================================================
     * Umbra Title System
     * ======================================================
     */

    /*
     * Title Definitions
     *
     * Stores every Title available inside
     * Umbra's Soul Record system.
     *
     * These Titles are not Discord roles.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS title_definitions (
            title_id VARCHAR(100) PRIMARY KEY,

            name VARCHAR(100) NOT NULL,
            display_name VARCHAR(150) NOT NULL,
            description TEXT NOT NULL,

            category VARCHAR(100) NOT NULL,
            rarity VARCHAR(50) NOT NULL,

            unlock_type VARCHAR(50) NOT NULL,

            unlock_data JSONB NOT NULL
                DEFAULT '{}'::jsonb,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );
    `);

    /*
     * Helps Umbra organize Titles by
     * category and rarity inside /titles.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS title_definitions_category_rarity_index
        ON title_definitions (
            category,
            rarity
        );
    `);

    /*
     * Used by automatic Title unlock checks.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS title_definitions_unlock_type_index
        ON title_definitions (
            unlock_type
        );
    `);

    /*
     * Used when sorting recently updated
     * Title definitions.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS title_definitions_updated_at_index
        ON title_definitions (
            updated_at DESC
        );
    `);

    /*
     * Soul Titles
     *
     * Stores every Title unlocked by each
     * Soul inside each Discord server.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS soul_titles (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,
            title_id VARCHAR(100) NOT NULL,

            unlocked_by VARCHAR(32),

            unlock_source VARCHAR(100) NOT NULL
                DEFAULT 'AUTOMATIC',

            is_active BOOLEAN NOT NULL
                DEFAULT FALSE,

            unlocked_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            activated_at TIMESTAMPTZ,

            PRIMARY KEY (
                guild_id,
                user_id,
                title_id
            ),

            CONSTRAINT soul_titles_definition_foreign_key
                FOREIGN KEY (
                    title_id
                )
                REFERENCES title_definitions (
                    title_id
                )
                ON DELETE CASCADE,

            CONSTRAINT soul_titles_activation_date_valid
                CHECK (
                    (
                        is_active = TRUE
                        AND activated_at IS NOT NULL
                    )
                    OR
                    (
                        is_active = FALSE
                    )
                )
        );
    `);

    /*
     * Quickly loads every Title unlocked
     * by one Soul.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS soul_titles_guild_user_index
        ON soul_titles (
            guild_id,
            user_id,
            unlocked_at DESC
        );
    `);

    /*
     * Used for Title unlock statistics
     * and future Kingdom leaderboards.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS soul_titles_guild_title_index
        ON soul_titles (
            guild_id,
            title_id
        );
    `);

    /*
     * Used for manual Title auditing.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS soul_titles_unlocked_by_index
        ON soul_titles (
            guild_id,
            unlocked_by,
            unlocked_at DESC
        );
    `);

    /*
     * Used when sorting the latest Title
     * unlocks throughout Las Noches.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS soul_titles_unlocked_at_index
        ON soul_titles (
            unlocked_at DESC
        );
    `);

    /*
     * PostgreSQL partial unique index.
     *
     * Guarantees that each Soul may have
     * only one active Title per server.
     */
    await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS soul_titles_one_active_title_index
        ON soul_titles (
            guild_id,
            user_id
        )
        WHERE is_active = TRUE;
    `);

    /*
     * Quickly loads the currently active
     * Title displayed inside /profile.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS soul_titles_active_lookup_index
        ON soul_titles (
            guild_id,
            user_id,
            activated_at DESC
        )
        WHERE is_active = TRUE;
    `);

    /*
     * ======================================================
     * Umbra Terminal Incident Archive
     * ======================================================
     *
     * Stores every system Incident generated
     * by Umbra Core Terminal.
     *
     * These records are used by the
     * Incident Center inside /controlpanel.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS terminal_incidents (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32),

            incident_type VARCHAR(100) NOT NULL,

            severity VARCHAR(20) NOT NULL,

            title VARCHAR(200) NOT NULL,

            message TEXT NOT NULL,

            fields JSONB NOT NULL
                DEFAULT '[]'::jsonb,

            error_name VARCHAR(200),

            error_message TEXT,

            error_stack TEXT,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            CONSTRAINT terminal_incidents_severity_valid
                CHECK (
                    severity IN (
                        'info',
                        'success',
                        'warning',
                        'critical'
                    )
                )
        );
    `);

    /*
     * Quickly loads the latest Incidents
     * for one Discord server.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_guild_created_index
        ON terminal_incidents (
            guild_id,
            created_at DESC
        );
    `);

    /*
     * Used by Incident Center severity
     * statistics and filters.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_severity_index
        ON terminal_incidents (
            guild_id,
            severity,
            created_at DESC
        );
    `);

    /*
     * Used when searching Incidents by
     * their official Umbra Incident type.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_type_index
        ON terminal_incidents (
            guild_id,
            incident_type,
            created_at DESC
        );
    `);

    /*
     * Used for retention cleanup of old
     * Incident Archive records.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_created_at_index
        ON terminal_incidents (
            created_at DESC
        );
    `);
}

module.exports = {
    initializeSchema
};
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
    `);    /*
     * ======================================================
     * Evelynn Monthly Captain Trials System
     * ======================================================
     *
     * Stores every automatic Captain Trial
     * announcement published by Evelynn.
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
    `);

    /*
     * ======================================================
     * Captain Trials 2.0 Participant Registry
     * ======================================================
     *
     * Stores every Soul who registers for
     * one monthly LUNAR SEIREITEI Captain Trial.
     *
     * Registration, withdrawal, Staff Review
     * and final promotion decisions remain
     * permanently preserved in PostgreSQL.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS rank_trial_participants (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32) NOT NULL,
            trial_key VARCHAR(7) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            status VARCHAR(30) NOT NULL
                DEFAULT 'REGISTERED',

            previous_rank VARCHAR(100),
            new_rank VARCHAR(100),

            reviewed_by VARCHAR(32),
            review_reason VARCHAR(500),

            registered_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            withdrawn_at TIMESTAMPTZ,

            reviewed_at TIMESTAMPTZ,

            promoted_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            CONSTRAINT rank_trial_participants_status_valid
                CHECK (
                    status IN (
                        'REGISTERED',
                        'WITHDRAWN',
                        'UNDER_REVIEW',
                        'APPROVED',
                        'REJECTED'
                    )
                ),

            CONSTRAINT rank_trial_participants_trial_key_valid
                CHECK (
                    trial_key ~
                    '^[0-9]{4}-(0[1-9]|1[0-2])$'
                ),

            CONSTRAINT rank_trial_participants_unique
                UNIQUE (
                    guild_id,
                    trial_key,
                    user_id
                ),

            CONSTRAINT rank_trial_participants_review_valid
                CHECK (
                    (
                        status IN (
                            'REGISTERED',
                            'WITHDRAWN',
                            'UNDER_REVIEW'
                        )
                    )
                    OR
                    (
                        status IN (
                            'APPROVED',
                            'REJECTED'
                        )
                        AND reviewed_by IS NOT NULL
                        AND reviewed_at IS NOT NULL
                    )
                ),

            CONSTRAINT rank_trial_participants_withdrawal_valid
                CHECK (
                    (
                        status = 'WITHDRAWN'
                        AND withdrawn_at IS NOT NULL
                    )
                    OR
                    (
                        status <> 'WITHDRAWN'
                    )
                ),

            CONSTRAINT rank_trial_participants_promotion_valid
                CHECK (
                    promoted_at IS NULL
                    OR status = 'APPROVED'
                )
        );
    `);

    /*
     * Quickly load the full participant roster
     * for one monthly Captain Trial.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_participants_trial_index
        ON rank_trial_participants (
            guild_id,
            trial_key,
            registered_at ASC
        );
    `);

    /*
     * Quickly load participants by their
     * current registration/review status.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_participants_status_index
        ON rank_trial_participants (
            guild_id,
            trial_key,
            status,
            registered_at ASC
        );
    `);

    /*
     * Load the permanent Captain Trial history
     * belonging to one Soul.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_participants_user_history_index
        ON rank_trial_participants (
            guild_id,
            user_id,
            trial_key DESC
        );
    `);

    /*
     * Used by the Staff Review Panel.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_participants_review_index
        ON rank_trial_participants (
            guild_id,
            trial_key,
            reviewed_at DESC
        )
        WHERE status IN (
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED'
        );
    `);

    /*
     * Used for successful promotion
     * auditing and historical records.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS rank_trial_participants_promoted_index
        ON rank_trial_participants (
            guild_id,
            promoted_at DESC
        )
        WHERE promoted_at IS NOT NULL;
    `);    /*
     * ======================================================
     * LUNAR SEIREITEI Event System
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
     * LUNAR SEIREITEI Giveaway System
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
     * Evelynn Level System
     * ======================================================
     *
     * Stores each Soul's XP, Level and
     * message activity separately per server.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS levels (
            guild_id VARCHAR(32) NOT NULL,
            user_id VARCHAR(32) NOT NULL,

            xp BIGINT NOT NULL
                DEFAULT 0,

            level INTEGER NOT NULL
                DEFAULT 0,

            message_count BIGINT NOT NULL
                DEFAULT 0,

            last_xp_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

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
     * Stores the Discord roles Evelynn should
     * grant when a Soul reaches a Level.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS level_rewards (
            guild_id VARCHAR(32) NOT NULL,
            level INTEGER NOT NULL,
            role_id VARCHAR(32) NOT NULL,

            created_by VARCHAR(32) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

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
     * Evelynn Achievement System
     * ======================================================
     */

    /*
     * Achievement Definitions
     *
     * Stores every Achievement available
     * inside LUNAR SEIREITEI.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS achievements (
            achievement_id VARCHAR(100) PRIMARY KEY,

            name VARCHAR(100) NOT NULL,

            description TEXT NOT NULL,

            icon VARCHAR(20) NOT NULL,

            category VARCHAR(50) NOT NULL,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
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

            unlocked_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

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
    `);    /*
     * ======================================================
     * LUNAR SEIREITEI Rank Migration
     * ======================================================
     *
     * Safely rename existing legacy Rank tables.
     *
     * PostgreSQL table renaming preserves all rows,
     * primary keys, constraints and sequence data.
     *
     * This block is idempotent and only runs when
     * the new table does not already exist.
     */
    await query(`
        DO $$
        BEGIN
            IF (
                TO_REGCLASS(
                    'public.sin_ranks'
                ) IS NULL
                AND TO_REGCLASS(
                    'public.arrancar_ranks'
                ) IS NOT NULL
            ) THEN
                ALTER TABLE arrancar_ranks
                RENAME TO sin_ranks;
            END IF;

            IF (
                TO_REGCLASS(
                    'public.sin_rank_history'
                ) IS NULL
                AND TO_REGCLASS(
                    'public.arrancar_rank_history'
                ) IS NOT NULL
            ) THEN
                ALTER TABLE arrancar_rank_history
                RENAME TO sin_rank_history;
            END IF;
        END
        $$;
    `);

    /*
     * ======================================================
     * LUNAR SEIREITEI Rank System
     * ======================================================
     */

    /*
     * Stores the current manually assigned
     * Captain Rank of every Soul.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS sin_ranks (
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
        CREATE INDEX IF NOT EXISTS sin_ranks_guild_rank_index
        ON sin_ranks (
            guild_id,
            rank_name
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS sin_ranks_updated_at_index
        ON sin_ranks (
            updated_at DESC
        );
    `);

    /*
     * Captain Rank History
     *
     * Stores every assignment, replacement
     * and removal.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS sin_rank_history (
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

            CONSTRAINT sin_rank_history_action_valid
                CHECK (
                    action IN (
                        'SET',
                        'REMOVE'
                    )
                ),

            CONSTRAINT sin_rank_history_rank_valid
                CHECK (
                    old_rank IS NOT NULL
                    OR new_rank IS NOT NULL
                )
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS sin_rank_history_guild_user_index
        ON sin_rank_history (
            guild_id,
            user_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS sin_rank_history_moderator_index
        ON sin_rank_history (
            guild_id,
            moderator_id,
            created_at DESC
        );
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS sin_rank_history_created_at_index
        ON sin_rank_history (
            created_at DESC
        );
    `);    /*
     * ======================================================
     * Evelynn Title System
     * ======================================================
     */

    /*
     * Title Definitions
     *
     * Stores every Title available inside
     * LUNAR SEIREITEI Soul Record system.
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
     * Helps Evelynn organize Titles by
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
     * unlocks throughout LUNAR SEIREITEI.
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
    `);    /*
     * ======================================================
     * Evelynn Terminal Incident Archive
     * ======================================================
     *
     * Stores important infrastructure,
     * Gateway, PostgreSQL and runtime
     * incidents detected by Evelynn.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS terminal_incidents (
            id BIGSERIAL PRIMARY KEY,

            guild_id VARCHAR(32),

            service_key VARCHAR(100),

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
                        'critical',
                        'warning',
                        'success',
                        'info'
                    )
                )
        );
    `);

    /*
     * Used when loading recent Terminal
     * incidents for one guild.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_guild_created_index
        ON terminal_incidents (
            guild_id,
            created_at DESC
        );
    `);

    /*
     * Used by service-specific incident
     * history and Black Box diagnostics.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_service_index
        ON terminal_incidents (
            guild_id,
            service_key,
            created_at DESC
        );
    `);

    /*
     * Used when filtering incidents
     * by severity.
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
     * Used for global infrastructure
     * incidents where guild_id is NULL.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_global_index
        ON terminal_incidents (
            created_at DESC
        )
        WHERE guild_id IS NULL;
    `);

    /*
     * ======================================================
     * Evelynn Terminal Services State
     * ======================================================
     *
     * Stores the latest known state of
     * every infrastructure service monitored
     * by the Evelynn Terminal / Black Box.
     */
    await query(`
        CREATE TABLE IF NOT EXISTS terminal_services (
            guild_id VARCHAR(32) NOT NULL,

            service_key VARCHAR(100) NOT NULL,

            display_name VARCHAR(150) NOT NULL,

            status VARCHAR(50) NOT NULL,

            severity VARCHAR(20) NOT NULL,

            status_message TEXT NOT NULL,

            incident_type VARCHAR(100),

            metadata JSONB NOT NULL
                DEFAULT '{}'::jsonb,

            started_at TIMESTAMPTZ,

            last_changed_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            last_checked_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                service_key
            ),

            CONSTRAINT terminal_services_severity_valid
                CHECK (
                    severity IN (
                        'critical',
                        'warning',
                        'success',
                        'info'
                    )
                )
        );
    `);

    /*
     * ======================================================
     * Terminal Services Index Migration
     * ======================================================
     *
     * Older schema versions created these
     * index names with shorter definitions.
     *
     * DROP INDEX IF EXISTS is safe here:
     * indexes contain no application data.
     *
     * They are recreated immediately below
     * using the final optimized definitions.
     */
    await query(`
        DROP INDEX IF EXISTS terminal_services_status_index;
    `);

    await query(`
        DROP INDEX IF EXISTS terminal_services_severity_index;
    `);    /*
     * Used when loading services by
     * current status.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_status_index
        ON terminal_services (
            guild_id,
            status,
            display_name
        );
    `);

    /*
     * Used by Terminal Dashboard severity
     * filtering and recent state ordering.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_severity_index
        ON terminal_services (
            guild_id,
            severity,
            updated_at DESC
        );
    `);

    /*
     * Used when loading the most recently
     * checked service states.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_checked_index
        ON terminal_services (
            guild_id,
            last_checked_at DESC
        );
    `);

    /*
     * Used when auditing service state
     * changes.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_changed_index
        ON terminal_services (
            guild_id,
            last_changed_at DESC
        );
    `);

    /*
     * Used when loading recently updated
     * Terminal service records.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_updated_index
        ON terminal_services (
            guild_id,
            updated_at DESC
        );
    `);

    /*
     * ======================================================
     * Terminal Schema Compatibility
     * ======================================================
     *
     * Preserve compatibility with both
     * fresh and older database versions.
     */

    /*
     * Older Terminal Incident tables may
     * not contain service_key yet.
     */
    await query(`
        ALTER TABLE terminal_incidents

        ADD COLUMN IF NOT EXISTS
            service_key VARCHAR(100);
    `);

    /*
     * Preserve the original Terminal Service
     * column limits.
     */
    await query(`
        ALTER TABLE terminal_services

        ALTER COLUMN display_name
            TYPE VARCHAR(200),

        ALTER COLUMN status
            TYPE VARCHAR(20);
    `);

    /*
     * Preserve strict Black Box
     * Service status validation.
     *
     * Safe for both existing and
     * freshly created databases.
     */
    await query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'terminal_services_status_valid'
            ) THEN
                ALTER TABLE terminal_services
                ADD CONSTRAINT
                    terminal_services_status_valid
                CHECK (
                    status IN (
                        'ONLINE',
                        'OFFLINE',
                        'DEGRADED',
                        'STARTING',
                        'STOPPED'
                    )
                );
            END IF;
        END
        $$;
    `);

    /*
     * Preserve strict Black Box
     * Service severity validation.
     */
    await query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'terminal_services_severity_valid'
            ) THEN
                ALTER TABLE terminal_services
                ADD CONSTRAINT
                    terminal_services_severity_valid
                CHECK (
                    severity IN (
                        'info',
                        'success',
                        'warning',
                        'critical'
                    )
                );
            END IF;
        END
        $$;
    `);

    /*
     * Incident type lookup.
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
     * General Incident retention and
     * chronological lookup.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_created_at_index
        ON terminal_incidents (
            created_at DESC
        );
    `);

    /*
     * Service history lookup.
     *
     * Kept for compatibility with existing
     * database installations.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_incidents_service_history_index
        ON terminal_incidents (
            guild_id,
            service_key,
            created_at DESC
        );
    `);

    /*
     * Detect stale Black Box services.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_last_checked_index
        ON terminal_services (
            guild_id,
            last_checked_at
        );
    `);

    /*
     * Service Details uses this when
     * displaying the latest state change.
     */
    await query(`
        CREATE INDEX IF NOT EXISTS terminal_services_last_changed_index
        ON terminal_services (
            guild_id,
            last_changed_at DESC
        );
    `);
}

module.exports = {
    initializeSchema
};
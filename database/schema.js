const { query } = require('./connection');

async function initializeSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS akane_users (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            xp INTEGER NOT NULL DEFAULT 0
                CHECK (xp >= 0),

            level INTEGER NOT NULL DEFAULT 1
                CHECK (level >= 1),

            messages INTEGER NOT NULL DEFAULT 0
                CHECK (messages >= 0),

            faction TEXT
                CHECK (
                    faction IS NULL
                    OR faction IN ('slayer', 'demon')
                ),

            rank TEXT,

            rank_points INTEGER NOT NULL DEFAULT 0
                CHECK (rank_points >= 0),

            joined_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id
            )
        );

        UPDATE akane_users
        SET
            level = 1,
            updated_at = NOW()
        WHERE level < 1;

        ALTER TABLE akane_users
            ALTER COLUMN level
            SET DEFAULT 1;

        ALTER TABLE akane_users
            DROP CONSTRAINT IF EXISTS
            akane_users_level_check;

        ALTER TABLE akane_users
            ADD CONSTRAINT
            akane_users_level_check
            CHECK (level >= 1);


        CREATE TABLE IF NOT EXISTS akane_achievements (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            achievement_id TEXT NOT NULL,

            unlocked_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id,
                achievement_id
            )
        );


        CREATE TABLE IF NOT EXISTS akane_titles (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            title_id TEXT NOT NULL,

            equipped BOOLEAN NOT NULL
                DEFAULT FALSE,

            unlocked_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                user_id,
                title_id
            )
        );

        CREATE UNIQUE INDEX IF NOT EXISTS
            akane_one_equipped_title
        ON akane_titles (
            guild_id,
            user_id
        )
        WHERE equipped = TRUE;


        CREATE TABLE IF NOT EXISTS akane_rank_history (
            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            faction TEXT NOT NULL
                CHECK (
                    faction IN (
                        'slayer',
                        'demon'
                    )
                ),

            previous_rank TEXT,
            new_rank TEXT NOT NULL,

            changed_by TEXT,
            reason TEXT,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS
            akane_rank_history_user
        ON akane_rank_history (
            guild_id,
            user_id,
            created_at DESC
        );


        CREATE TABLE IF NOT EXISTS akane_trials (
            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,

            trial_type TEXT NOT NULL
                CHECK (
                    trial_type IN (
                        'hashira',
                        'upper_moon'
                    )
                ),

            status TEXT NOT NULL
                DEFAULT 'open'
                CHECK (
                    status IN (
                        'open',
                        'closed',
                        'completed',
                        'cancelled'
                    )
                ),

            created_by TEXT NOT NULL,

            channel_id TEXT,
            message_id TEXT,

            opens_at TIMESTAMPTZ,
            closes_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );

        ALTER TABLE akane_trials
            ADD COLUMN IF NOT EXISTS
            channel_id TEXT;

        ALTER TABLE akane_trials
            ADD COLUMN IF NOT EXISTS
            message_id TEXT;

        CREATE INDEX IF NOT EXISTS
            akane_trials_guild_status
        ON akane_trials (
            guild_id,
            status,
            created_at DESC
        );


        CREATE TABLE IF NOT EXISTS akane_trial_participants (
            trial_id BIGINT NOT NULL
                REFERENCES akane_trials(id)
                ON DELETE CASCADE,

            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            status TEXT NOT NULL
                DEFAULT 'registered'
                CHECK (
                    status IN (
                        'registered',
                        'passed',
                        'failed',
                        'withdrawn'
                    )
                ),

            reviewed_by TEXT,
            review_reason TEXT,

            registered_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            reviewed_at TIMESTAMPTZ,

            PRIMARY KEY (
                trial_id,
                user_id
            )
        );

        CREATE INDEX IF NOT EXISTS
            akane_trial_participants_user
        ON akane_trial_participants (
            guild_id,
            user_id,
            registered_at DESC
        );


        CREATE TABLE IF NOT EXISTS akane_tickets (
            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            channel_id TEXT UNIQUE,

            category TEXT NOT NULL
                CHECK (
                    category IN (
                        'support',
                        'report',
                        'appeal',
                        'other'
                    )
                ),

            subject TEXT,

            status TEXT NOT NULL
                DEFAULT 'open'
                CHECK (
                    status IN (
                        'open',
                        'closed'
                    )
                ),

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            closed_at TIMESTAMPTZ,
            closed_by TEXT,

            reopened_at TIMESTAMPTZ,
            reopened_by TEXT,

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS
            akane_one_open_ticket
        ON akane_tickets (
            guild_id,
            user_id
        )
        WHERE status = 'open';

        CREATE INDEX IF NOT EXISTS
            akane_tickets_channel
        ON akane_tickets (
            guild_id,
            channel_id
        );

        CREATE INDEX IF NOT EXISTS
            akane_tickets_history
        ON akane_tickets (
            guild_id,
            user_id,
            created_at DESC
        );


        CREATE TABLE IF NOT EXISTS akane_ticket_actions (
            id BIGSERIAL PRIMARY KEY,

            ticket_id BIGINT NOT NULL
                REFERENCES akane_tickets(id)
                ON DELETE CASCADE,

            guild_id TEXT NOT NULL,

            action TEXT NOT NULL
                CHECK (
                    action IN (
                        'created',
                        'closed',
                        'reopened',
                        'deleted'
                    )
                ),

            actor_id TEXT NOT NULL,
            reason TEXT,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS
            akane_ticket_actions_ticket
        ON akane_ticket_actions (
            ticket_id,
            created_at ASC
        );


        CREATE TABLE IF NOT EXISTS akane_moderation_cases (
            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,

            user_id TEXT,
            moderator_id TEXT,

            action TEXT NOT NULL
                CHECK (
                    action IN (
                        'warn',
                        'unwarn',
                        'timeout',
                        'untimeout',
                        'kick',
                        'ban',
                        'unban',
                        'lock',
                        'unlock',
                        'slowmode',
                        'clear',
                        'guardian',
                        'emergency'
                    )
                ),

            reason TEXT,

            duration_ms BIGINT
                CHECK (
                    duration_ms IS NULL
                    OR duration_ms >= 0
                ),

            channel_id TEXT,
            message_id TEXT,

            metadata JSONB NOT NULL
                DEFAULT '{}'::jsonb,

            active BOOLEAN NOT NULL
                DEFAULT TRUE,

            expires_at TIMESTAMPTZ,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            resolved_at TIMESTAMPTZ,
            resolved_by TEXT,
            resolution_reason TEXT
        );

        ALTER TABLE akane_moderation_cases
            ALTER COLUMN user_id
            DROP NOT NULL;

        CREATE INDEX IF NOT EXISTS
            akane_moderation_cases_user
        ON akane_moderation_cases (
            guild_id,
            user_id,
            created_at DESC
        );

        CREATE INDEX IF NOT EXISTS
            akane_moderation_cases_action
        ON akane_moderation_cases (
            guild_id,
            action,
            created_at DESC
        );

        CREATE INDEX IF NOT EXISTS
            akane_moderation_cases_active
        ON akane_moderation_cases (
            guild_id,
            user_id,
            active
        )
        WHERE active = TRUE;


        CREATE TABLE IF NOT EXISTS akane_channel_locks (
            guild_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,

            moderator_id TEXT NOT NULL,

            previous_send_messages BOOLEAN,

            case_id BIGINT
                REFERENCES akane_moderation_cases(id)
                ON DELETE SET NULL,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                guild_id,
                channel_id
            )
        );


        CREATE TABLE IF NOT EXISTS akane_emergency_states (
            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,

            case_id BIGINT
                REFERENCES akane_moderation_cases(id)
                ON DELETE SET NULL,

            mode TEXT NOT NULL
                DEFAULT 'lockdown'
                CHECK (
                    mode IN (
                        'lockdown'
                    )
                ),

            active BOOLEAN NOT NULL
                DEFAULT TRUE,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            released_at TIMESTAMPTZ,
            released_by TEXT
        );

        CREATE UNIQUE INDEX IF NOT EXISTS
            akane_one_active_emergency
        ON akane_emergency_states (
            guild_id
        )
        WHERE active = TRUE;


        CREATE TABLE IF NOT EXISTS akane_emergency_snapshots (
            emergency_id BIGINT NOT NULL
                REFERENCES akane_emergency_states(id)
                ON DELETE CASCADE,

            guild_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,

            previous_send_messages BOOLEAN,

            previous_send_messages_in_threads BOOLEAN,

            previous_add_reactions BOOLEAN,

            created_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (
                emergency_id,
                channel_id
            )
        );

        CREATE INDEX IF NOT EXISTS
            akane_emergency_snapshots_guild
        ON akane_emergency_snapshots (
            guild_id,
            emergency_id
        );
    `);
}

module.exports = {
    initializeSchema
};
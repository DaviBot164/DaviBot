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

            PRIMARY KEY (guild_id, user_id)
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
            unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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
            equipped BOOLEAN NOT NULL DEFAULT FALSE,
            unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

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

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

            status TEXT NOT NULL DEFAULT 'open'
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

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE akane_trials
            ADD COLUMN IF NOT EXISTS channel_id TEXT;

        ALTER TABLE akane_trials
            ADD COLUMN IF NOT EXISTS message_id TEXT;

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

            status TEXT NOT NULL DEFAULT 'registered'
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

            registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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

            status TEXT NOT NULL DEFAULT 'open'
                CHECK (
                    status IN (
                        'open',
                        'closed'
                    )
                ),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            closed_at TIMESTAMPTZ,
            closed_by TEXT,

            reopened_at TIMESTAMPTZ,
            reopened_by TEXT,

            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS
            akane_ticket_actions_ticket
        ON akane_ticket_actions (
            ticket_id,
            created_at ASC
        );
    `);
}

module.exports = {
    initializeSchema
};
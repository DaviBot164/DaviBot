const { query } = require('./connection');

async function initializePlayerSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS akane_player_stats (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,

            duel_wins INTEGER NOT NULL DEFAULT 0
                CHECK (duel_wins >= 0),

            duel_losses INTEGER NOT NULL DEFAULT 0
                CHECK (duel_losses >= 0),

            daily_streak INTEGER NOT NULL DEFAULT 0
                CHECK (daily_streak >= 0),

            last_daily_claim_at TIMESTAMPTZ,

            event_points INTEGER NOT NULL DEFAULT 0
                CHECK (event_points >= 0),

            updated_at TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),

            PRIMARY KEY (guild_id, user_id),

            FOREIGN KEY (guild_id, user_id)
                REFERENCES akane_users (
                    guild_id,
                    user_id
                )
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS
            akane_player_stats_duels
        ON akane_player_stats (
            guild_id,
            duel_wins DESC
        );

        CREATE INDEX IF NOT EXISTS
            akane_player_stats_events
        ON akane_player_stats (
            guild_id,
            event_points DESC
        );
    `);
}

module.exports = {
    initializePlayerSchema
};
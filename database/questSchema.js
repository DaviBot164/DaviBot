const { query } = require('./connection');

async function initializeQuestSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_daily_quests (
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            cycle_id UUID NOT NULL DEFAULT gen_random_uuid(),
            cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            eligible_messages INTEGER NOT NULL DEFAULT 0
                CHECK (eligible_messages >= 0),
            daily_claimed BOOLEAN NOT NULL DEFAULT FALSE,
            claimed_rewards TEXT[] NOT NULL DEFAULT '{}',
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (guild_id, user_id),
            FOREIGN KEY (guild_id, user_id)
                REFERENCES kitsune_users (guild_id, user_id)
                ON DELETE CASCADE
        );
    `);

    await query(`
        ALTER TABLE kitsune_daily_quests
        ADD COLUMN IF NOT EXISTS cycle_id UUID;
    `);

    await query(`
        UPDATE kitsune_daily_quests
        SET cycle_id = gen_random_uuid()
        WHERE cycle_id IS NULL;
    `);

    await query(`
        ALTER TABLE kitsune_daily_quests
        ALTER COLUMN cycle_id SET DEFAULT gen_random_uuid();
    `);

    await query(`
        ALTER TABLE kitsune_daily_quests
        ALTER COLUMN cycle_id SET NOT NULL;
    `);
}

module.exports = {
    initializeQuestSchema
};

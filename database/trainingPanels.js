const { query } = require('./connection');

async function initializeTrainingPanels() {
    await query(`
        CREATE TABLE IF NOT EXISTS kitsune_training_panels (
            guild_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            message_id TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function getTrainingPanel(guildId) {
    const { rows } = await query(
        `
            SELECT channel_id, message_id
            FROM kitsune_training_panels
            WHERE guild_id = $1
        `,
        [guildId]
    );

    return rows[0] || null;
}

async function saveTrainingPanel(guildId, channelId, messageId) {
    await query(
        `
            INSERT INTO kitsune_training_panels (
                guild_id,
                channel_id,
                message_id
            )
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id)
            DO UPDATE SET
                channel_id = EXCLUDED.channel_id,
                message_id = EXCLUDED.message_id,
                updated_at = NOW()
        `,
        [guildId, channelId, messageId]
    );
}

module.exports = {
    initializeTrainingPanels,
    getTrainingPanel,
    saveTrainingPanel
};

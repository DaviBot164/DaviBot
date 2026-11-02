const { testConnection, closeConnection } = require('./connection');
const { initializeSchema } = require('./schema');
const { migrateKitsuneStorage } = require('./migrateKitsuneStorage');
const { initializeGuildSettings } = require('./guildSettings');
async function initializeDatabase() {
    await testConnection();
    await migrateKitsuneStorage();
    await initializeSchema();
    await initializeGuildSettings();
}
module.exports = { initializeDatabase, closeConnection };

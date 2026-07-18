const {
    testConnection,
    closeConnection
} = require('./connection');

const {
    initializeSchema
} = require('./schema');

const warnings = require('./warnings');

/**
 * Connect to PostgreSQL and initialize all tables.
 *
 * @returns {Promise<boolean>}
 */
async function initializeDatabase() {
    const databaseUrl =
        process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI ||
        process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log('======================================');
        console.log('⚠️ PostgreSQL connection skipped.');
        console.log(
            'ℹ️ No DATABASE_URL was found in the local environment.'
        );
        console.log(
            'ℹ️ PostgreSQL will connect automatically on Northflank.'
        );
        console.log('======================================');

        return false;
    }

    console.log('======================================');
    console.log('🗄️ Connecting to PostgreSQL...');
    console.log('======================================');

    await testConnection();

    console.log('✅ Connected to PostgreSQL.');

    await initializeSchema();

    console.log('✅ Database schema initialized.');
    console.log('======================================');

    return true;
}

module.exports = {
    initializeDatabase,
    closeConnection,
    warnings
};
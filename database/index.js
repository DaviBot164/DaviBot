const {
    testConnection,
    closeConnection
} = require('./connection');

const {
    initializeSchema
} = require('./schema');

async function initializeDatabase() {
    await testConnection();
    await initializeSchema();
}

module.exports = {
    initializeDatabase,
    closeConnection
};
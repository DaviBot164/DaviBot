const {
    testConnection,
    closeConnection
} = require('./connection');

const {
    initializeSchema
} = require('./schema');

const {
    initializePlayerSchema
} = require('./playerSchema');

async function initializeDatabase() {
    await testConnection();
    await initializeSchema();
    await initializePlayerSchema();
}

module.exports = {
    initializeDatabase,
    closeConnection
};
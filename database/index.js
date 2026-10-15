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

const {
    initializeTrainingPanels
} = require('./trainingPanels');

async function initializeDatabase() {
    await testConnection();
    await initializeSchema();
    await initializePlayerSchema();
    await initializeTrainingPanels();
}

module.exports = {
    initializeDatabase,
    closeConnection
};
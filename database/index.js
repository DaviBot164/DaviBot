
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

const {
    initializeQuestSchema
} = require('./questSchema');

async function initializeDatabase() {
    await testConnection();
    await initializeSchema();
    await initializePlayerSchema();
    await initializeTrainingPanels();
    await initializeQuestSchema();
}

module.exports = {
    initializeDatabase,
    closeConnection
};

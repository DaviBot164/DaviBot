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

const {
    initializeMatchSchema
} = require('./matchSchema');

const { initializeAkaneLearningSchema } = require('./akaneLearningSchema');

async function initializeDatabase() {
    await testConnection();
    await initializeSchema();
    await initializePlayerSchema();
    await initializeTrainingPanels();
    await initializeQuestSchema();
    await initializeMatchSchema();
    await initializeAkaneLearningSchema();
}

module.exports = {
    initializeDatabase,
    closeConnection
};

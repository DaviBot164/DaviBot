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

const { migrateKitsuneStorage } = require('./migrateKitsuneStorage');

const { initializeKitsuneLearningSchema } = require('./kitsuneLearningSchema');

async function initializeDatabase() {
    await testConnection();
    await migrateKitsuneStorage();
    await initializeSchema();
    await initializePlayerSchema();
    await initializeTrainingPanels();
    await initializeQuestSchema();
    await initializeMatchSchema();
    await initializeKitsuneLearningSchema();
}

module.exports = {
    initializeDatabase,
    closeConnection
};

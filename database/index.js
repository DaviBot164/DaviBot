const {
    testConnection,
    closeConnection
} = require('./connection');

const {
    initializeSchema
} = require('./schema');

const {
    initializeRankTrialEventSchema
} = require('./rankTrialEventSchema');

const warningDatabase =
    require('./warnings');

const autoModCaseDatabase =
    require('./automodCases');

const raidCaseDatabase =
    require('./raidCases');

const eventDatabase =
    require('./events');

const giveawayDatabase =
    require('./giveaways');

const levelDatabase =
    require('./levels');

const soulDatabase =
    require('./souls');

const achievementDatabase =
    require('./achievements');

const rankDatabase =
    require('./ranks');

const kingdomDatabase =
    require('./kingdom');

const titleDatabase =
    require('./titles');

const rankTrialDatabase =
    require('./rankTrials');

const rankTrialEventDatabase =
    require('./rankTrialEvents');

const terminalIncidentDatabase =
    require('./terminalIncidents');

/**
 * Connect to PostgreSQL and initialize
 * all required database tables and systems.
 *
 * @returns {Promise<boolean>}
 */
async function initializeDatabase() {
    const databaseUrl =
        process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI ||
        process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log(
            '======================================'
        );

        console.log(
            '⚠️ PostgreSQL connection skipped.'
        );

        console.log(
            'ℹ️ No DATABASE_URL was found in the local environment.'
        );

        console.log(
            'ℹ️ PostgreSQL will connect automatically on Northflank.'
        );

        console.log(
            '======================================'
        );

        return false;
    }

    console.log(
        '======================================'
    );

    console.log(
        '🗄️ Connecting to PostgreSQL...'
    );

    console.log(
        '======================================'
    );

    try {
        await testConnection();

        console.log(
            '✅ Connected to PostgreSQL.'
        );

        /*
         * Initialize Umbra's primary schema.
         */
        await initializeSchema();

        console.log(
            '✅ Database schema initialized.'
        );

        /*
         * Initialize the isolated Rank Trials
         * Discord Scheduled Event schema.
         */
        await initializeRankTrialEventSchema();

        console.log(
            '✅ Rank Trial Event Manager schema initialized.'
        );

        console.log(
            '✅ Warning database initialized.'
        );

        console.log(
            '✅ AutoMod database initialized.'
        );

        console.log(
            '✅ Raid database initialized.'
        );

        console.log(
            '✅ Event database initialized.'
        );

        console.log(
            '✅ Giveaway database initialized.'
        );

        console.log(
            '✅ Level database initialized.'
        );

        console.log(
            '✅ Soul Record core initialized.'
        );

        console.log(
            '✅ Arrancar Rank database initialized.'
        );

        console.log(
            '✅ Kingdom statistics core initialized.'
        );

        console.log(
            '✅ Monthly Rank Trials database initialized.'
        );

        console.log(
            '✅ Rank Trials Scheduled Event Manager initialized.'
        );

        console.log(
            '✅ Terminal Incident Archive initialized.'
        );

        const achievementCount =
            await achievementDatabase
                .initializeAchievements();

        console.log(
            `✅ Achievement database initialized with ${achievementCount} definitions.`
        );

        const titleCount =
            await titleDatabase
                .initializeTitles();

        console.log(
            `✅ Title database initialized with ${titleCount} definitions.`
        );

        console.log(
            '======================================'
        );

        return true;
    } catch (error) {
        console.error(
            '❌ PostgreSQL initialization failed:'
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        throw error;
    }
}

module.exports = {
    initializeDatabase,
    closeConnection,

    warnings:
        warningDatabase,

    automodCases:
        autoModCaseDatabase,

    raidCases:
        raidCaseDatabase,

    events:
        eventDatabase,

    giveaways:
        giveawayDatabase,

    levels:
        levelDatabase,

    souls:
        soulDatabase,

    achievements:
        achievementDatabase,

    ranks:
        rankDatabase,

    kingdom:
        kingdomDatabase,

    titles:
        titleDatabase,

    rankTrials:
        rankTrialDatabase,

    rankTrialEvents:
        rankTrialEventDatabase,

    terminalIncidents:
        terminalIncidentDatabase
};
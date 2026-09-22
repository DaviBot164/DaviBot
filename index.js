require('dotenv').config({ quiet: true });

const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const { loadCommands } = require('./handlers/commandLoader');
const { loadEvents } = require('./handlers/eventLoader');
const { initializeDatabase } = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function start() {
    loadCommands(client);
    loadEvents(client);

    if (process.env.NODE_ENV === 'production') {
        await initializeDatabase();
        console.log('Database: Connected');
    }

    await client.login(process.env.TOKEN);
}

start().catch(error => {
    console.error('Startup failed:', error);
    process.exit(1);
});
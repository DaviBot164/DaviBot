require('dotenv').config();

const {
    Client,
    Events,
    GatewayIntentBits,
    Collection,
    REST,
    Routes
} = require('discord.js');

const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

const {
    initializeDatabase,
    closeConnection
} = require('./database');

// Create Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Commands Collection
client.commands = new Collection();

// Load Commands
commandHandler(client);

// Load Events
eventHandler(client);

// Bot Ready Event
client.once(Events.ClientReady, async readyClient => {
    console.log('======================================');
    console.log(`🤖 Logged in as: ${readyClient.user.tag}`);
    console.log('======================================');

    try {
        const commands = Array
            .from(client.commands.values())
            .map(command => command.data.toJSON());

        const rest = new REST({
            version: '10'
        }).setToken(process.env.TOKEN);

        console.log(
            '🔄 Registering Guild Slash Commands...'
        );

        await rest.put(
            Routes.applicationGuildCommands(
                readyClient.user.id,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            `✅ Registered ${commands.length} Slash Commands.`
        );
        console.log('======================================');
    } catch (error) {
        console.error(
            '❌ Failed to register Slash Commands:'
        );
        console.error(error);
    }
});

// Slash Command Interaction
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) {
        console.error(
            `❌ Command not found: ${interaction.commandName}`
        );

        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(
            `❌ Error executing /${interaction.commandName}:`
        );
        console.error(error);

        const errorMessage = {
            content:
                '❌ An error occurred while executing this command.',
            ephemeral: true
        };

        try {
            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (replyError) {
            console.error(
                '❌ Failed to send the error message:'
            );
            console.error(replyError);
        }
    }
});

/**
 * Start DaviBot.
 *
 * @returns {Promise<void>}
 */
async function startBot() {
    try {
        await initializeDatabase();
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error('======================================');
        console.error('❌ Failed to start DaviBot:');
        console.error(error);
        console.error('======================================');

        process.exit(1);
    }
}

/**
 * Gracefully stop DaviBot.
 *
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function shutdown(signal) {
    console.log('======================================');
    console.log(`🛑 Received ${signal}. Shutting down...`);

    try {
        client.destroy();
        await closeConnection();

        console.log('✅ DaviBot shut down safely.');
        console.log('======================================');

        process.exit(0);
    } catch (error) {
        console.error('❌ Shutdown error:');
        console.error(error);

        process.exit(1);
    }
}

process.once('SIGINT', () => {
    shutdown('SIGINT');
});

process.once('SIGTERM', () => {
    shutdown('SIGTERM');
});

startBot();
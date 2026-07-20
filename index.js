require('dotenv').config();

const {
    Client,
    Events,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    MessageFlags
} = require('discord.js');

const commandHandler =
    require('./handlers/commandHandler');

const eventHandler =
    require('./handlers/eventHandler');

const {
    initializeDatabase,
    closeConnection
} = require('./database');

/**
 * Discord API error codes that do not require
 * another response attempt.
 */
const INTERACTION_ALREADY_ACKNOWLEDGED = 40060;
const UNKNOWN_INTERACTION = 10062;

// Create Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Commands Collection
client.commands = new Collection();

// Load Commands
commandHandler(client);

// Load Events
eventHandler(client);

/**
 * Read and validate configured Guild IDs.
 *
 * Expected .env format:
 *
 * GUILD_IDS=server_id_1,server_id_2
 *
 * @returns {string[]}
 */
function getConfiguredGuildIds() {
    const rawGuildIds =
        process.env.GUILD_IDS ??
        process.env.GUILD_ID ??
        '';

    const guildIds = rawGuildIds
        .split(',')
        .map(guildId => guildId.trim())
        .filter(Boolean);

    return [...new Set(guildIds)];
}

/**
 * Register every loaded Slash Command
 * in every configured Discord server.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @returns {Promise<void>}
 */
async function registerGuildCommands(readyClient) {
    const commands = Array
        .from(client.commands.values())
        .map(command => command.data.toJSON());

    const guildIds = getConfiguredGuildIds();

    if (guildIds.length === 0) {
        throw new Error(
            'No Guild IDs were configured. Add GUILD_IDS to the environment variables.'
        );
    }

    const rest = new REST({
        version: '10'
    }).setToken(process.env.TOKEN);

    console.log(
        '🔄 Registering Guild Slash Commands...'
    );

    for (const guildId of guildIds) {
        try {
            const guild =
                readyClient.guilds.cache.get(guildId) ??
                await readyClient.guilds.fetch(guildId);

            await rest.put(
                Routes.applicationGuildCommands(
                    readyClient.user.id,
                    guildId
                ),
                {
                    body: commands
                }
            );

            console.log(
                `✅ Registered ${commands.length} commands in: ` +
                `${guild.name} (${guildId})`
            );
        } catch (error) {
            console.error(
                `❌ Failed to register commands in Guild ID: ${guildId}`
            );

            console.error(error);
        }
    }

    console.log(
        '======================================'
    );
}

/**
 * Send an error message for a failed Slash Command.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function sendCommandError(interaction) {
    const content =
        '❌ An error occurred while executing this command.';

    try {
        if (interaction.deferred) {
            await interaction.editReply({
                content,
                embeds: [],
                components: []
            });

            return;
        }

        if (interaction.replied) {
            await interaction.followUp({
                content,
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.reply({
            content,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        if (
            error.code ===
            INTERACTION_ALREADY_ACKNOWLEDGED
        ) {
            try {
                await interaction.followUp({
                    content,
                    flags: MessageFlags.Ephemeral
                });
            } catch (followUpError) {
                if (
                    followUpError.code ===
                    UNKNOWN_INTERACTION
                ) {
                    console.warn(
                        '⚠️ The interaction expired before an error message could be sent.'
                    );

                    return;
                }

                console.error(
                    '❌ Failed to send the follow-up error message:'
                );

                console.error(followUpError);
            }

            return;
        }

        if (error.code === UNKNOWN_INTERACTION) {
            console.warn(
                '⚠️ The interaction expired before an error message could be sent.'
            );

            return;
        }

        console.error(
            '❌ Failed to send the command error message:'
        );

        console.error(error);
    }
}

// Bot Ready Event
client.once(
    Events.ClientReady,
    async readyClient => {
        console.log(
            '======================================'
        );

        console.log(
            `🪽 Logged in as: ${readyClient.user.tag}`
        );

        console.log(
            `🌐 Connected to ${readyClient.guilds.cache.size} servers.`
        );

        console.log(
            '======================================'
        );

        try {
            await registerGuildCommands(
                readyClient
            );
        } catch (error) {
            console.error(
                '❌ Failed to register Slash Commands:'
            );

            console.error(error);
        }
    }
);

// Slash Command Interaction
client.on(
    Events.InteractionCreate,
    async interaction => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const command = client.commands.get(
            interaction.commandName
        );

        if (!command) {
            console.error(
                `❌ Command not found: /${interaction.commandName}`
            );

            await sendCommandError(interaction);

            return;
        }

        try {
            await command.execute(
                interaction,
                client
            );
        } catch (error) {
            console.error(
                `❌ Error executing /${interaction.commandName}:`
            );

            console.error(error);

            await sendCommandError(interaction);
        }
    }
);

/**
 * Start Seraphiel.
 *
 * @returns {Promise<void>}
 */
async function startBot() {
    try {
        if (!process.env.TOKEN) {
            throw new Error(
                'TOKEN is missing from the environment variables.'
            );
        }

        await initializeDatabase();
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Failed to start Seraphiel:'
        );

        console.error(error);

        console.error(
            '======================================'
        );

        process.exit(1);
    }
}

/**
 * Gracefully stop Seraphiel.
 *
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function shutdown(signal) {
    console.log(
        '======================================'
    );

    console.log(
        `🛑 Received ${signal}. Shutting down...`
    );

    try {
        client.destroy();
        await closeConnection();

        console.log(
            '✅ Seraphiel shut down safely.'
        );

        console.log(
            '======================================'
        );

        process.exit(0);
    } catch (error) {
        console.error(
            '❌ Shutdown error:'
        );

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
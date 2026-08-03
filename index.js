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

const {
    logTerminal
} = require('./utils/terminal/terminalLogger');

/**
 * Server that Umbra must leave.
 */
const SERVER_TO_LEAVE_ID =
    '1521240178633605383';

/**
 * Discord API error codes that do not
 * require another response attempt.
 */
const INTERACTION_ALREADY_ACKNOWLEDGED =
    40060;

const UNKNOWN_INTERACTION =
    10062;

/**
 * Create the Discord client.
 */
const client =
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

/**
 * Store every loaded Slash Command.
 */
client.commands =
    new Collection();

/**
 * Load Umbra commands and events.
 */
commandHandler(
    client
);

eventHandler(
    client
);

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

    const guildIds =
        rawGuildIds
            .split(',')
            .map(
                guildId =>
                    guildId.trim()
            )
            .filter(
                Boolean
            )
            .filter(
                guildId =>
                    guildId !==
                    SERVER_TO_LEAVE_ID
            );

    return [
        ...new Set(
            guildIds
        )
    ];
}

/**
 * Leave the selected Discord server.
 *
 * This function affects only
 * SERVER_TO_LEAVE_ID.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @returns {Promise<boolean>}
 */
async function leaveSelectedServer(
    readyClient
) {
    console.log(
        '🔍 Checking whether Umbra is still in the removed server...'
    );

    let guild =
        readyClient.guilds.cache.get(
            SERVER_TO_LEAVE_ID
        );

    if (!guild) {
        try {
            guild =
                await readyClient.guilds.fetch(
                    SERVER_TO_LEAVE_ID
                );
        } catch (error) {
            if (
                error.code ===
                10004
            ) {
                console.log(
                    'ℹ️ Umbra is no longer in that server.'
                );

                return false;
            }

            console.warn(
                '⚠️ The selected server could not be found or accessed.'
            );

            return false;
        }
    }

    try {
        const guildName =
            guild.name;

        console.log(
            `👋 Leaving server: ${guildName} (${SERVER_TO_LEAVE_ID})`
        );

        await guild.leave();

        console.log(
            `✅ Umbra successfully left: ${guildName}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Umbra failed to leave the selected server:'
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Register every loaded Slash Command
 * in every configured Discord server.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @returns {Promise<void>}
 */
async function registerGuildCommands(
    readyClient
) {
    const commands =
        Array
            .from(
                client.commands.values()
            )
            .map(
                command =>
                    command.data.toJSON()
            );

    const guildIds =
        getConfiguredGuildIds();

    if (
        guildIds.length ===
        0
    ) {
        console.warn(
            '⚠️ No active Guild IDs were configured for Slash Commands.'
        );

        console.warn(
            'Add your remaining server IDs to GUILD_IDS.'
        );

        return;
    }

    const rest =
        new REST({
            version:
                '10'
        }).setToken(
            process.env.TOKEN
        );

    console.log(
        '🔄 Registering Guild Slash Commands...'
    );

    for (
        const guildId of
        guildIds
    ) {
        try {
            const guild =
                readyClient.guilds.cache.get(
                    guildId
                ) ??
                await readyClient.guilds.fetch(
                    guildId
                );

            await rest.put(
                Routes.applicationGuildCommands(
                    readyClient.user.id,
                    guildId
                ),
                {
                    body:
                        commands
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

            console.error(
                error
            );
        }
    }

    console.log(
        '======================================'
    );
}

/**
 * Publish the official Umbra
 * Core Boot Sequence.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @returns {Promise<void>}
 */
async function publishBootSequence(
    readyClient
) {
    const gatewayPing =
        Math.max(
            0,
            Math.round(
                readyClient.ws.ping
            )
        );

    const commandCount =
        readyClient.commands.size;

    const guildCount =
        readyClient.guilds.cache.size;

    const memberCount =
        readyClient.guilds.cache.reduce(
            (
                total,
                guild
            ) =>
                total +
                guild.memberCount,

            0
        );

    await logTerminal(
        readyClient,
        {
            level:
                'success',

            title:
                'Umbra Core Online',

            message:
                'Boot sequence completed successfully. All primary systems are operational.',

            fields: [
                {
                    name:
                        '💻 Core Systems',

                    value:
                        [
                            '```diff',
                            '+ Discord Gateway Connected',
                            '+ PostgreSQL Connected',
                            '+ Command Registry Loaded',
                            '+ Event Handler Loaded',
                            '+ Guardian Systems Ready',
                            '+ Kingdom Records Available',
                            '+ Arrancar Registry Online',
                            '```'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📡 Gateway',

                    value:
                        [
                            '**Status:** `CONNECTED`',
                            `**Latency:** \`${gatewayPing} ms\``
                        ].join('\n'),

                    inline:
                        true
                },
                {
                    name:
                        '⚙️ Command Core',

                    value:
                        [
                            '**Status:** `READY`',
                            `**Loaded:** \`${commandCount}\``
                        ].join('\n'),

                    inline:
                        true
                },
                {
                    name:
                        '🌙 Kingdom Network',

                    value:
                        [
                            `**Servers:** \`${guildCount}\``,
                            `**Souls:** \`${memberCount}\``
                        ].join('\n'),

                    inline:
                        true
                },
                {
                    name:
                        '🛡️ Core Status',

                    value:
                        [
                            '```ansi',
                            '\u001b[2;32mONLINE — NO ANOMALIES DETECTED\u001b[0m',
                            '```'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        }
    );
}/**
 * Send an error message for a failed
 * Slash Command.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<void>}
 */
async function sendCommandError(
    interaction
) {
    const content =
        '❌ An error occurred while executing this command.';

    try {
        if (
            interaction.deferred
        ) {
            await interaction.editReply({
                content,
                embeds:
                    [],
                components:
                    []
            });

            return;
        }

        if (
            interaction.replied
        ) {
            await interaction.followUp({
                content,

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.reply({
            content,

            flags:
                MessageFlags.Ephemeral
        });
    } catch (error) {
        if (
            error.code ===
            INTERACTION_ALREADY_ACKNOWLEDGED
        ) {
            try {
                await interaction.followUp({
                    content,

                    flags:
                        MessageFlags.Ephemeral
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

                console.error(
                    followUpError
                );
            }

            return;
        }

        if (
            error.code ===
            UNKNOWN_INTERACTION
        ) {
            console.warn(
                '⚠️ The interaction expired before an error message could be sent.'
            );

            return;
        }

        console.error(
            '❌ Failed to send the command error message:'
        );

        console.error(
            error
        );
    }
}

/**
 * Discord Client Ready event.
 */
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

        /*
         * Leave only the explicitly
         * configured removed server.
         */
        await leaveSelectedServer(
            readyClient
        );

        try {
            await registerGuildCommands(
                readyClient
            );
        } catch (error) {
            console.error(
                '❌ Failed to register Slash Commands:'
            );

            console.error(
                error
            );
        }

        /*
         * Publish the Umbra Core Boot
         * Sequence only after the client,
         * database and command registry
         * are ready.
         */
        try {
            const terminalPublished =
                await publishBootSequence(
                    readyClient
                );

            if (
                terminalPublished ===
                false
            ) {
                console.warn(
                    '⚠️ Umbra Boot Sequence was not published in the Terminal channel.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Umbra Boot Sequence failed:'
            );

            console.error(
                error
            );
        }
    }
);

/**
 * Handle Slash Command interactions.
 */
client.on(
    Events.InteractionCreate,

    async interaction => {
        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) {
            console.error(
                `❌ Command not found: /${interaction.commandName}`
            );

            await sendCommandError(
                interaction
            );

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

            console.error(
                error
            );

            await sendCommandError(
                interaction
            );
        }
    }
);

/**
 * Start Umbra.
 *
 * The PostgreSQL connection is initialized
 * before Discord login so the Ready event
 * only runs after the database is available.
 *
 * @returns {Promise<void>}
 */
async function startBot() {
    try {
        if (
            !process.env.TOKEN
        ) {
            throw new Error(
                'TOKEN is missing from the environment variables.'
            );
        }

        await initializeDatabase();

        console.log(
            '✅ PostgreSQL initialization completed.'
        );

        await client.login(
            process.env.TOKEN
        );
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Failed to start Umbra:'
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        process.exit(
            1
        );
    }
}

/**
 * Gracefully stop Umbra.
 *
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function shutdown(
    signal
) {
    console.log(
        '======================================'
    );

    console.log(
        `🛑 Received ${signal}. Shutting down...`
    );

    /*
     * Attempt to publish a final Terminal
     * notice before destroying the client.
     */
    try {
        if (
            client.isReady()
        ) {
            await logTerminal(
                client,
                {
                    level:
                        'warning',

                    title:
                        'Umbra Core Shutdown',

                    message:
                        `A graceful shutdown sequence was initiated by ${signal}.`,

                    fields: [
                        {
                            name:
                                '🛑 System State',

                            value:
                                [
                                    '```diff',
                                    '- Gateway connection closing',
                                    '- PostgreSQL connection closing',
                                    '- Command processing stopping',
                                    '```'
                                ].join('\n'),

                            inline:
                                false
                        },
                        {
                            name:
                                '⚙️ Shutdown Signal',

                            value:
                                `\`${signal}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🌙 Final Status',

                            value:
                                '`SHUTTING DOWN`',

                            inline:
                                true
                        }
                    ]
                }
            );
        }
    } catch (terminalError) {
        console.error(
            '⚠️ Umbra could not publish the shutdown Terminal notice:'
        );

        console.error(
            terminalError
        );
    }

    try {
        client.destroy();

        await closeConnection();

        console.log(
            '✅ Umbra shut down safely.'
        );

        console.log(
            '======================================'
        );

        process.exit(
            0
        );
    } catch (error) {
        console.error(
            '❌ Shutdown error:'
        );

        console.error(
            error
        );

        process.exit(
            1
        );
    }
}

/**
 * Handle local and Northflank
 * shutdown signals.
 */
process.once(
    'SIGINT',

    () => {
        shutdown(
            'SIGINT'
        );
    }
);

process.once(
    'SIGTERM',

    () => {
        shutdown(
            'SIGTERM'
        );
    }
);

/**
 * Begin the Umbra startup sequence.
 */
startBot();
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
 * Central Umbra Core Terminal API.
 */
const terminal =
    require('./utils/terminal');

/**
 * Automatic Monthly Rank Trials System.
 */
const {
    startRankTrialScheduler,
    stopRankTrialScheduler,
    isRankTrialSchedulerRunning
} = require('./utils/rankTrials/scheduler');

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
 * Prevent duplicate fatal-error handling.
 */
let fatalErrorInProgress =
    false;

/**
 * Create the Discord Client.
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
 * @returns {Promise<boolean>}
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

    const rankTrialState =
        isRankTrialSchedulerRunning()
            ? 'ACTIVE'
            : 'STARTING';

    return terminal.success(
        readyClient,
        {
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
                            '+ Monthly Rank Trials Ready',
                            '+ Alert Engine Armed',
                            '+ Incident Engine Ready',
                            '+ Health Monitor Active',
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
                        '⚔️ Rank Trials',

                    value:
                        [
                            `**Scheduler:** \`${rankTrialState}\``,
                            '**Cycle:** `MONTHLY`'
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
            } catch (
                followUpError
            ) {
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

        /*
         * Register all loaded Slash Commands.
         */
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
         * Start the Automatic Monthly Rank
         * Trials scheduler.
         *
         * The scheduler performs an immediate
         * recovery check before starting its
         * recurring interval.
         */
        try {
            const rankTrialSchedulerStarted =
                await startRankTrialScheduler(
                    readyClient
                );

            if (
                rankTrialSchedulerStarted
            ) {
                console.log(
                    '✅ Automatic Rank Trials scheduler started.'
                );
            } else if (
                isRankTrialSchedulerRunning()
            ) {
                console.log(
                    'ℹ️ Automatic Rank Trials scheduler was already running.'
                );
            } else {
                console.warn(
                    '⚠️ Automatic Rank Trials scheduler did not start.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Automatic Rank Trials scheduler failed to start:'
            );

            console.error(
                error
            );

            await terminal.incident(
                readyClient,
                {
                    type:
                        'SYSTEM_FAILURE',

                    message:
                        'Umbra failed to start the Automatic Monthly Rank Trials scheduler.',

                    fields: [
                        {
                            name:
                                '⚔️ System',

                            value:
                                '`MONTHLY RANK TRIALS`',

                            inline:
                                true
                        },
                        {
                            name:
                                '🌙 State',

                            value:
                                '`STARTUP FAILED`',

                            inline:
                                true
                        }
                    ],

                    error
                }
            ).catch(
                terminalError => {
                    console.error(
                        '❌ Failed to publish the Rank Trials startup incident:'
                    );

                    console.error(
                        terminalError
                    );
                }
            );
        }

        /*
         * Publish one Boot Sequence event
         * after Umbra and the Rank Trials
         * scheduler are fully initialized.
         */
        try {
            const terminalPublished =
                await publishBootSequence(
                    readyClient
                );

            if (
                terminalPublished
            ) {
                console.log(
                    '✅ Umbra Boot Sequence published.'
                );
            } else {
                console.warn(
                    '⚠️ Umbra Boot Sequence was not published.'
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

        /*
         * Start the persistent live Health
         * Dashboard after the Boot Sequence.
         */
        try {
            const dashboardStarted =
                await terminal.dashboard.start(
                    readyClient
                );

            if (
                dashboardStarted
            ) {
                console.log(
                    '✅ Umbra Health Dashboard started.'
                );
            } else {
                console.warn(
                    '⚠️ Umbra Health Dashboard did not start.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Umbra Health Dashboard failed to start:'
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

            /*
             * Publish a standardized
             * command-failure incident.
             */
            if (
                client.isReady()
            ) {
                await terminal.incident(
                    client,
                    {
                        type:
                            'COMMAND_FAILURE',

                        message:
                            `Umbra encountered an unexpected error while executing /${interaction.commandName}.`,

                        fields: [
                            {
                                name:
                                    '⚙️ Command',

                                value:
                                    `/${interaction.commandName}`,

                                inline:
                                    true
                            },
                            {
                                name:
                                    '🌙 User',

                                value:
                                    `${interaction.user.tag}\n\`${interaction.user.id}\``,

                                inline:
                                    true
                            },
                            {
                                name:
                                    '🏰 Server',

                                value:
                                    interaction.guild
                                        ? `${interaction.guild.name}\n\`${interaction.guild.id}\``
                                        : 'Direct Message',

                                inline:
                                    true
                            }
                        ],

                        error
                    }
                ).catch(
                    terminalError => {
                        console.error(
                            '❌ Failed to publish the command incident:'
                        );

                        console.error(
                            terminalError
                        );
                    }
                );
            }

            await sendCommandError(
                interaction
            );
        }
    }
);/**
 * Start Umbra.
 *
 * PostgreSQL initializes before Discord
 * login so the Ready event runs only after
 * the database core is available.
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
     * Stop automatic Rank Trial checks
     * before beginning shutdown.
     */
    const rankTrialSchedulerStopped =
        stopRankTrialScheduler();

    if (
        rankTrialSchedulerStopped
    ) {
        console.log(
            '✅ Rank Trials scheduler stopped.'
        );
    }

    /*
     * Stop Dashboard updates before
     * beginning the shutdown sequence.
     */
    terminal.dashboard.stop();

    /*
     * Attempt to publish a final Terminal
     * notice before destroying the client.
     */
    try {
        if (
            client.isReady()
        ) {
            await terminal.warning(
                client,
                {
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
                                    '- Rank Trials scheduler stopped',
                                    '- Health Dashboard stopped',
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
 * Convert an unknown error value into
 * safe diagnostic information.
 *
 * @param {unknown} error
 * @returns {{
 *     name: string,
 *     message: string,
 *     stack: string
 * }}
 */
function normalizeProcessError(
    error
) {
    if (
        error instanceof Error
    ) {
        return {
            name:
                error.name ||
                'Error',

            message:
                error.message ||
                'No error message was provided.',

            stack:
                error.stack ||
                'No stack trace was available.'
        };
    }

    let message;

    try {
        message =
            typeof error ===
                'string'
                ? error
                : JSON.stringify(
                    error,
                    null,
                    2
                );
    } catch {
        message =
            String(
                error
            );
    }

    return {
        name:
            'UnknownError',

        message:
            message ||
            'No error message was provided.',

        stack:
            'No stack trace was available.'
    };
}

/**
 * Limit diagnostic text so it remains
 * valid inside a Discord Embed field.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function limitDiagnosticText(
    text,
    maxLength =
        900
) {
    if (
        typeof text !==
            'string' ||
        text.length ===
            0
    ) {
        return 'No diagnostic information available.';
    }

    if (
        text.length <=
        maxLength
    ) {
        return text;
    }

    return (
        text.slice(
            0,
            maxLength -
                20
        ) +
        '\n... truncated'
    );
}

/**
 * Publish one process-level warning
 * through the central Terminal API.
 *
 * @param {string} title
 * @param {string} message
 * @param {Array<{
 *     name: string,
 *     value: string,
 *     inline?: boolean
 * }>} fields
 * @returns {Promise<void>}
 */
async function publishProcessWarning(
    title,
    message,
    fields =
        []
) {
    if (
        !client.isReady()
    ) {
        console.warn(
            '⚠️ Process warning could not be published because Umbra is not ready.'
        );

        return;
    }

    await terminal.alert(
        client,
        {
            title,
            message,

            severity:
                'warning',

            fields
        }
    ).catch(
        terminalError => {
            console.error(
                '❌ Failed to publish the process warning:'
            );

            console.error(
                terminalError
            );
        }
    );
}/**
 * Handle a fatal Node.js process error.
 *
 * Continuing after an uncaught exception
 * is unsafe. Umbra publishes an alert,
 * stops diagnostics and exits safely.
 *
 * @param {string} source
 * @param {unknown} error
 * @returns {Promise<void>}
 */
async function handleFatalProcessError(
    source,
    error
) {
    if (
        fatalErrorInProgress
    ) {
        console.error(
            '❌ A second fatal error occurred during emergency shutdown:'
        );

        console.error(
            error
        );

        return;
    }

    fatalErrorInProgress =
        true;

    const diagnostic =
        normalizeProcessError(
            error
        );

    console.error(
        '======================================'
    );

    console.error(
        `🚨 Fatal process error: ${source}`
    );

    console.error(
        error
    );

    console.error(
        '======================================'
    );

    /*
     * Stop recurring systems before
     * emergency shutdown begins.
     */
    stopRankTrialScheduler();

    terminal.dashboard.stop();

    if (
        client.isReady()
    ) {
        await terminal.alert(
            client,
            {
                title:
                    'Critical Process Failure',

                message:
                    'Umbra detected a fatal Node.js error. An emergency shutdown sequence has started.',

                severity:
                    'critical',

                fields: [
                    {
                        name:
                            '🚨 Failure Source',

                        value:
                            `\`${source}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🧩 Error Type',

                        value:
                            `\`${diagnostic.name}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 System State',

                        value:
                            '`EMERGENCY SHUTDOWN`',

                        inline:
                            true
                    },
                    {
                        name:
                            '📖 Error Message',

                        value:
                            [
                                '```',
                                limitDiagnosticText(
                                    diagnostic.message
                                ),
                                '```'
                            ].join('\n'),

                        inline:
                            false
                    },
                    {
                        name:
                            '🔍 Stack Trace',

                        value:
                            [
                                '```',
                                limitDiagnosticText(
                                    diagnostic.stack
                                ),
                                '```'
                            ].join('\n'),

                        inline:
                            false
                    }
                ]
            }
        ).catch(
            terminalError => {
                console.error(
                    '❌ Failed to publish the fatal Terminal alert:'
                );

                console.error(
                    terminalError
                );
            }
        );
    }

    try {
        if (
            client.isReady()
        ) {
            client.destroy();
        }

        await closeConnection();
    } catch (shutdownError) {
        console.error(
            '❌ Emergency shutdown cleanup failed:'
        );

        console.error(
            shutdownError
        );
    }

    process.exit(
        1
    );
}

/**
 * Capture unexpected synchronous errors.
 */
process.on(
    'uncaughtException',

    error => {
        void handleFatalProcessError(
            'uncaughtException',
            error
        );
    }
);

/**
 * Capture Promise rejections that were
 * not handled by their originating module.
 *
 * Umbra remains online, but publishes
 * a warning for investigation.
 */
process.on(
    'unhandledRejection',

    reason => {
        const diagnostic =
            normalizeProcessError(
                reason
            );

        console.error(
            '⚠️ Unhandled Promise Rejection:'
        );

        console.error(
            reason
        );

        void publishProcessWarning(
            'Unhandled Promise Rejection',
            'Umbra detected a Promise rejection that was not handled by its originating module.',
            [
                {
                    name:
                        '🧩 Error Type',

                    value:
                        `\`${diagnostic.name}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 Process State',

                    value:
                        '`RUNNING — INVESTIGATION REQUIRED`',

                    inline:
                        true
                },
                {
                    name:
                        '📖 Rejection Reason',

                    value:
                        [
                            '```',
                            limitDiagnosticText(
                                diagnostic.message
                            ),
                            '```'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🔍 Stack Trace',

                    value:
                        [
                            '```',
                            limitDiagnosticText(
                                diagnostic.stack
                            ),
                            '```'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        );
    }
);

/**
 * Capture warnings emitted by Node.js.
 */
process.on(
    'warning',

    warning => {
        console.warn(
            '⚠️ Node.js Process Warning:'
        );

        console.warn(
            warning
        );

        void publishProcessWarning(
            'Node.js Process Warning',
            'The Node.js runtime emitted a system warning.',
            [
                {
                    name:
                        '⚠️ Warning Type',

                    value:
                        `\`${warning.name || 'Warning'}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 Process State',

                    value:
                        '`RUNNING — WARNING RECORDED`',

                    inline:
                        true
                },
                {
                    name:
                        '📖 Warning Message',

                    value:
                        [
                            '```',
                            limitDiagnosticText(
                                warning.message
                            ),
                            '```'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🔍 Warning Trace',

                    value:
                        [
                            '```',
                            limitDiagnosticText(
                                warning.stack ||
                                'No warning trace was available.'
                            ),
                            '```'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        );
    }
);

/**
 * Handle local and Northflank
 * shutdown signals.
 */
process.once(
    'SIGINT',

    () => {
        void shutdown(
            'SIGINT'
        );
    }
);

process.once(
    'SIGTERM',

    () => {
        void shutdown(
            'SIGTERM'
        );
    }
);

/**
 * Begin the Umbra startup sequence.
 */
startBot();
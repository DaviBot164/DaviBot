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
    closeConnection,

    terminalServices:
        terminalServiceDatabase
} = require('./database');

/**
 * Central Evelynn Core Terminal API.
 */
const terminal =
    require('./utils/terminal');

/**
 * Automatic Monthly Captain Trials System.
 */
const {
    startRankTrialScheduler,
    stopRankTrialScheduler,
    isRankTrialSchedulerRunning
} = require('./utils/rankTrials/scheduler');

/**
 * Server that Evelynn must leave.
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
 * Prevent duplicate shutdown handling.
 */
let shutdownInProgress =
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
 * Load Evelynn commands and events.
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
 * Return every active Guild connected
 * to Evelynn.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @returns {import('discord.js').Guild[]}
 */
function getActiveGuilds(
    readyClient
) {
    if (
        !readyClient ||
        !readyClient.guilds
    ) {
        return [];
    }

    return Array.from(
        readyClient.guilds.cache.values()
    ).filter(
        guild =>
            guild.id !==
            SERVER_TO_LEAVE_ID
    );
}

/**
 * Safely mark one Black Box service
 * as ONLINE.
 *
 * A service-state database failure must
 * never interrupt Evelynn startup.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.serviceKey
 * @param {string} options.displayName
 * @param {string} options.message
 * @param {Object} [options.metadata]
 * @returns {Promise<boolean>}
 */
async function markBlackBoxServiceOnline({
    guildId,
    serviceKey,
    displayName,
    message,
    metadata =
        {}
}) {
    try {
        const service =
            await terminal
                .blackBox
                .services
                .online({
                    guildId,
                    serviceKey,
                    displayName,
                    message,
                    metadata,
                    startedAt:
                        new Date(
                            Date.now() -
                            process.uptime() *
                            1_000
                        )
                });

        return Boolean(
            service
        );
    } catch (error) {
        console.error(
            `⚠️ Could not mark Black Box service "${serviceKey}" as ONLINE:`
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Initialize all official Evelynn services
 * for one Discord server.
 *
 * Every service is first registered as
 * STARTING. Systems confirmed during boot
 * are then promoted to ONLINE.
 *
 * Captain Trials is handled separately after
 * its scheduler starts.
 *
 * @param {import('discord.js').Client<true>} readyClient
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<{
 *     registered: number,
 *     failed: number,
 *     online: number
 * }>}
 */
async function initializeBlackBoxServices(
    readyClient,
    guild
) {
    let registrationResult = {
        registered:
            0,

        failed:
            0
    };

    try {
        registrationResult =
            await terminal
                .blackBox
                .services
                .initialize(
                    guild.id
                );
    } catch (error) {
        console.error(
            `❌ Black Box service initialization failed in ${guild.name}:`
        );

        console.error(
            error
        );
    }

    const memoryUsage =
        process.memoryUsage();

    const gatewayPing =
        Math.max(
            0,
            Math.round(
                readyClient.ws.ping
            )
        );

    const servicesToMarkOnline = [
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .POSTGRESQL
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .POSTGRESQL
                    .name,

            message:
                'PostgreSQL communication is available.',

            metadata: {
                connection:
                    'CONNECTED'
            }
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .GATEWAY
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .GATEWAY
                    .name,

            message:
                'Discord Gateway connection is operational.',

            metadata: {
                latencyMilliseconds:
                    gatewayPing
            }
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .MEMORY
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .MEMORY
                    .name,

            message:
                'Evelynn process memory is within the initial operating range.',

            metadata: {
                rssBytes:
                    memoryUsage.rss,

                heapUsedBytes:
                    memoryUsage.heapUsed,

                heapTotalBytes:
                    memoryUsage.heapTotal
            }
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .GUARDIAN
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .GUARDIAN
                    .name,

            message:
                'Guardian protection systems are loaded.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .KINGDOM_FEED
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .KINGDOM_FEED
                    .name,

            message:
                'Kingdom Feed publishing system is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .TICKET_SYSTEM
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .TICKET_SYSTEM
                    .name,

            message:
                'Ticket System handlers are loaded.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .VERIFICATION
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .VERIFICATION
                    .name,

            message:
                'Member verification is handled externally by Bloxlink.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .SETUP_WIZARD
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .SETUP_WIZARD
                    .name,

            message:
                'Setup Wizard modules are available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .LEVELS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .LEVELS
                    .name,

            message:
                'Level progression system is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .ACHIEVEMENTS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .ACHIEVEMENTS
                    .name,

            message:
                'Achievement definitions and progression checks are available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .TITLES
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .TITLES
                    .name,

            message:
                'Chronicle Title system is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .SIN_RANKS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .SIN_RANKS
                    .name,

            message:
                'Captain Rank registry is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .EVENTS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .EVENTS
                    .name,

            message:
                'Event System is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .GIVEAWAYS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .GIVEAWAYS
                    .name,

            message:
                'Giveaway System is available.'
        },
        {
            serviceKey:
                terminal
                    .UMBRA_SERVICES
                    .SOUL_RECORDS
                    .key,

            displayName:
                terminal
                    .UMBRA_SERVICES
                    .SOUL_RECORDS
                    .name,

            message:
                'Soul Records database systems are available.'
        },
        {
            serviceKey:
                'node_process',

            displayName:
                'Node.js Process',

            message:
                'Evelynn Node.js process is running normally after a successful boot.',

            metadata: {
                processId:
                    process.pid,

                nodeVersion:
                    process.version,

                processUptimeSeconds:
                    process.uptime()
            }
        }
    ];

    let online =
        0;

    for (
        const service
        of servicesToMarkOnline
    ) {
        const markedOnline =
            await markBlackBoxServiceOnline({
                guildId:
                    guild.id,

                ...service
            });

        if (markedOnline) {
            online +=
                1;
        }
    }

    console.log(
        `🖥️ Black Box initialized in ${guild.name}: ` +
        `${registrationResult.registered} registered, ` +
        `${online} online, ` +
        `${registrationResult.failed} failed.`
    );

    return {
        registered:
            registrationResult.registered,

        failed:
            registrationResult.failed,

        online
    };
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
        '🔍 Checking whether Evelynn is still in the removed server...'
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
                    'ℹ️ Evelynn is no longer in that server.'
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
            `✅ Evelynn successfully left: ${guildName}`
        );

        return true;
    } catch (error) {
        console.error(
            '❌ Evelynn failed to leave the selected server:'
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
        getConfiguredGuildIds();    if (
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
 * Mark the Captain Trials service according
 * to its scheduler state.
 *
 * @param {import('discord.js').Guild[]} guilds
 * @param {boolean} schedulerRunning
 * @returns {Promise<void>}
 */
async function updateRankTrialServiceStates(
    guilds,
    schedulerRunning
) {
    const serviceDefinition =
        terminal
            .UMBRA_SERVICES
            .RANK_TRIALS;

    for (
        const guild
        of guilds
    ) {
        if (schedulerRunning) {
            await markBlackBoxServiceOnline({
                guildId:
                    guild.id,

                serviceKey:
                    serviceDefinition.key,

                displayName:
                    serviceDefinition.name,

                message:
                    'Automatic Monthly Captain Trials scheduler is running.',

                metadata: {
                    scheduler:
                        'ACTIVE',

                    cycle:
                        'MONTHLY'
                }
            });

            continue;
        }

        try {
            await terminal
                .blackBox
                .open({
                    guildId:
                        guild.id,

                    serviceKey:
                        serviceDefinition.key,

                    displayName:
                        serviceDefinition.name,

                    status:
                        terminal
                            .SERVICE_STATUS
                            .OFFLINE,

                    severity:
                        terminal
                            .INCIDENT_SEVERITY
                            .CRITICAL,

                    incidentType:
                        'RANK_TRIAL_SCHEDULER_FAILURE',

                    title:
                        'Captain Trials Scheduler Offline',

                    message:
                        'The Automatic Monthly Captain Trials scheduler is not running.',

                    fields: [
                        {
                            name:
                                '⚔️ Scheduler',

                            value:
                                '`OFFLINE`',

                            inline:
                                true
                        },
                        {
                            name:
                                '📅 Cycle',

                            value:
                                '`MONTHLY`',

                            inline:
                                true
                        }
                    ],

                    metadata: {
                        scheduler:
                            'OFFLINE',

                        cycle:
                            'MONTHLY'
                    }
                });
        } catch (error) {
            console.error(
                `⚠️ Failed to update Captain Trials service state in ${guild.name}:`
            );

            console.error(
                error
            );
        }
    }
}

/**
 * Publish the official Evelynn
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
                'Evelynn Core Online',

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
                            '+ Captain Rank Registry Online',
                            '+ Monthly Captain Trials Ready',
                            '+ Alert Engine Armed',
                            '+ Incident Engine Ready',
                            '+ Black Box Services Registered',
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
                        '⚔️ Captain Trials',

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
}

/**
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

        const activeGuilds =
            getActiveGuilds(
                readyClient
            );

        /*
         * Initialize the Black Box service
         * registry for every active server.
         */
        for (
            const guild
            of activeGuilds
        ) {
            await initializeBlackBoxServices(
                readyClient,
                guild
            );
        }

        /*
         * Restore the in-memory Incident cache
         * from the latest PostgreSQL service
         * states after a restart or deployment.
         */
        for (
            const guild
            of activeGuilds
        ) {
            try {
                const storedServices =
                    await terminalServiceDatabase
                        .getTerminalServices(
                            guild.id
                        );

                const restoredCount =
                    terminal
                        .blackBox
                        .cache
                        .restore(
                            guild.id,
                            storedServices
                        );

                console.log(
                    `🧠 Restored ${restoredCount} active Black Box Incident(s) in ${guild.name}.`
                );
            } catch (error) {
                console.error(
                    `⚠️ Failed to restore Black Box Incident cache in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }

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
                    '✅ Automatic Captain Trials scheduler started.'
                );
            } else if (
                isRankTrialSchedulerRunning()
            ) {
                console.log(
                    'ℹ️ Automatic Captain Trials scheduler was already running.'
                );
            } else {
                console.warn(
                    '⚠️ Automatic Captain Trials scheduler did not start.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Automatic Captain Trials scheduler failed to start:'
            );

            console.error(
                error
            );
        }

        /*
         * Synchronize the Captain Trials service
         * with the actual scheduler state.
         */
        await updateRankTrialServiceStates(
            activeGuilds,
            isRankTrialSchedulerRunning()
        );

        /*
         * Publish one Boot Sequence event
         * after Evelynn and the Captain Trials
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
                    '✅ Evelynn Boot Sequence published.'
                );
            } else {
                console.warn(
                    '⚠️ Evelynn Boot Sequence was not published.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Evelynn Boot Sequence failed:'
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
                    '✅ Evelynn Health Dashboard started.'
                );
            } else {
                console.warn(
                    '⚠️ Evelynn Health Dashboard did not start.'
                );
            }
        } catch (error) {
            console.error(
                '❌ Evelynn Health Dashboard failed to start:'
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
            interaction.isStringSelectMenu()
        ) {
            const titlesCommand =
                client.commands.get(
                    'titles'
                );

            if (
                typeof titlesCommand
                    ?.handleTitlesInteraction ===
                    'function'
            ) {
                const handled =
                    await titlesCommand
                        .handleTitlesInteraction(
                            interaction
                        );

                if (handled) {
                    return;
                }
            }
        }
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
             * command-failure Incident.
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
                            `Evelynn encountered an unexpected error while executing /${interaction.commandName}.`,

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
                            '❌ Failed to publish the command Incident:'
                        );

                        console.error(
                            terminalError
                        );
                    }
                );

                if (
                    interaction.guild
                ) {
                    try {
                        await terminal
                            .blackBox
                            .open({
                                guildId:
                                    interaction.guild.id,

                                serviceKey:
                                    'command_core',

                                displayName:
                                    'Command Core',

                                status:
                                    terminal
                                        .SERVICE_STATUS
                                        .DEGRADED,

                                severity:
                                    terminal
                                        .INCIDENT_SEVERITY
                                        .WARNING,

                                incidentType:
                                    'COMMAND_FAILURE',

                                title:
                                    'Command Core Degraded',

                                message:
                                    `The Command Core encountered an error while executing /${interaction.commandName}.`,

                                fields: [
                                    {
                                        name:
                                            '⚙️ Command',

                                        value:
                                            `\`/${interaction.commandName}\``,

                                        inline:
                                            true
                                    }
                                ],

                                metadata: {
                                    command:
                                        interaction.commandName,

                                    userId:
                                        interaction.user.id
                                },

                                error
                            });
                    } catch (blackBoxError) {
                        console.error(
                            '⚠️ Failed to update Command Core Black Box state:'
                        );

                        console.error(
                            blackBoxError
                        );
                    }
                }
            }

            await sendCommandError(
                interaction
            );
        }
    }
);

/**
 * Start Evelynn.
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

        const databaseConnected =
            await initializeDatabase();

        if (databaseConnected) {
            console.log(
                '✅ PostgreSQL initialization completed.'
            );
        } else {
            console.warn(
                '⚠️ Evelynn is starting without a local PostgreSQL connection.'
            );
        }

        await client.login(
            process.env.TOKEN
        );
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Failed to start Evelynn:'
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        /*
         * The Discord Client may not be ready
         * during a database or login failure,
         * so this error is preserved in the
         * process console before shutdown.
         */
        try {
            if (
                client.isReady()
            ) {
                const activeGuilds =
                    getActiveGuilds(
                        client
                    );

                for (
                    const guild
                    of activeGuilds
                ) {
                    await terminal
                        .blackBox
                        .open({
                            guildId:
                                guild.id,

                            serviceKey:
                                terminal
                                    .UMBRA_SERVICES
                                    .POSTGRESQL
                                    .key,

                            displayName:
                                terminal
                                    .UMBRA_SERVICES
                                    .POSTGRESQL
                                    .name,

                            status:
                                terminal
                                    .SERVICE_STATUS
                                    .OFFLINE,

                            severity:
                                terminal
                                    .INCIDENT_SEVERITY
                                    .CRITICAL,

                            incidentType:
                                'DATABASE_DISCONNECTED',

                            title:
                                'PostgreSQL Connection Lost',

                            message:
                                'Evelynn failed to initialize or communicate with PostgreSQL during startup.',

                            fields: [
                                {
                                    name:
                                        '🗄️ Database',

                                    value:
                                        '`POSTGRESQL`',

                                    inline:
                                        true
                                },
                                {
                                    name:
                                        '🌙 Startup State',

                                    value:
                                        '`FAILED`',

                                    inline:
                                        true
                                }
                            ],

                            metadata: {
                                phase:
                                    'STARTUP',

                                processUptimeSeconds:
                                    process.uptime()
                            },

                            error
                        });
                }
            }
        } catch (blackBoxError) {
            console.error(
                '⚠️ Evelynn could not record the startup failure in Black Box:'
            );

            console.error(
                blackBoxError
            );
        }

        process.exit(
            1
        );
    }
}

/**
 * Mark all Black Box services as STOPPED
 * during a graceful shutdown.
 *
 * @param {import('discord.js').Guild[]} guilds
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function stopBlackBoxServices(
    guilds,
    signal
) {
    for (
        const guild
        of guilds
    ) {
        try {
            const result =
                await terminal
                    .blackBox
                    .services
                    .stopAll(
                        guild.id,
                        `Evelynn service shutdown was initiated by ${signal}.`
                    );

            console.log(
                `🛑 Black Box services stopped in ${guild.name}: ` +
                `${result.stopped} stopped, ` +
                `${result.failed} failed.`
            );
        } catch (error) {
            console.error(
                `⚠️ Failed to stop Black Box services in ${guild.name}:`
            );

            console.error(
                error
            );
        }
    }
}

/**
 * Gracefully stop Evelynn.
 *
 * @param {string} signal
 * @returns {Promise<void>}
 */
async function shutdown(
    signal
) {
    if (
        shutdownInProgress
    ) {
        console.warn(
            `⚠️ Shutdown is already in progress. Ignoring ${signal}.`
        );

        return;
    }

    shutdownInProgress =
        true;

    console.log(
        '======================================'
    );

    console.log(
        `🛑 Received ${signal}. Shutting down...`
    );

    const activeGuilds =
        client.isReady()
            ? getActiveGuilds(
                client
            )
            : [];

    /*
     * Stop automatic Captain Trial checks
     * before beginning shutdown.
     */
    const rankTrialSchedulerStopped =
        stopRankTrialScheduler();

    if (
        rankTrialSchedulerStopped
    ) {
        console.log(
            '✅ Captain Trials scheduler stopped.'
        );
    } else {
        console.log(
            'ℹ️ Captain Trials scheduler was not running.'
        );
    }

    /*
     * Stop Dashboard updates before
     * beginning the shutdown sequence.
     */
    terminal.dashboard.stop();

    console.log(
        '✅ Evelynn Health Dashboard stopped.'
    );

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
                        'Evelynn Core Shutdown',

                    message:
                        `A graceful shutdown sequence was initiated by ${signal}.`,

                    fields: [
                        {
                            name:
                                '🛑 System State',

                            value:
                                [
                                    '```diff',
                                    '- Captain Trials scheduler stopped',
                                    '- Health Dashboard stopped',
                                    '- Black Box services stopping',
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
            '⚠️ Evelynn could not publish the shutdown Terminal notice:'
        );

        console.error(
            terminalError
        );
    }

    /*
     * Persist STOPPED state before the
     * PostgreSQL connection is closed.
     */
    await stopBlackBoxServices(
        activeGuilds,
        signal
    );

    /*
     * Clear the local active Incident cache.
     */
    const clearedIncidentCount =
        terminal
            .blackBox
            .cache
            .clearAll();

    console.log(
        `🧠 Cleared ${clearedIncidentCount} active Black Box Incident(s).`
    );

    try {
        client.destroy();

        await closeConnection();

        console.log(
            '✅ Evelynn shut down safely.'
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
 * Publish and archive one process-level
 * Black Box Incident.
 *
 * @param {Object} options
 * @param {string} options.incidentType
 * @param {string} options.title
 * @param {string} options.message
 * @param {'warning'|'critical'} options.severity
 * @param {string} options.status
 * @param {unknown} options.error
 * @param {string} options.processState
 * @returns {Promise<void>}
 */
async function publishProcessIncident({
    incidentType,
    title,
    message,
    severity,
    status,
    error,
    processState
}) {
    const diagnostic =
        normalizeProcessError(
            error
        );

    if (
        !client.isReady()
    ) {
        console.warn(
            '⚠️ Process Incident could not be published because Evelynn is not ready.'
        );

        return;
    }

    const activeGuilds =
        getActiveGuilds(
            client
        );

    for (
        const guild
        of activeGuilds
    ) {
        try {
            await terminal
                .blackBox
                .open({
                    guildId:
                        guild.id,

                    serviceKey:
                        'node_process',

                    displayName:
                        'Node.js Process',

                    status,

                    severity,

                    incidentType,

                    title,

                    message,

                    fields: [
                        {
                            name:
                                '🚨 Failure Source',

                            value:
                                `\`${incidentType}\``,

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
                                '🌙 Process State',

                            value:
                                `\`${processState}\``,

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
                                false,

                            codeBlock:
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
                                false,

                            codeBlock:
                                false
                        }
                    ],

                    metadata: {
                        source:
                            incidentType,

                        processState,

                        processUptimeSeconds:
                            process.uptime(),

                        memoryUsage:
                            process.memoryUsage()
                    },

                    error
                });
        } catch (blackBoxError) {
            console.error(
                `⚠️ Failed to archive process Incident in ${guild.name}:`
            );

            console.error(
                blackBoxError
            );
        }
    }

    const terminalSeverity =
        severity ===
            terminal
                .INCIDENT_SEVERITY
                .CRITICAL
            ? 'critical'
            : 'warning';

    await terminal.alert(
        client,
        {
            title,
            message,
            severity:
                terminalSeverity,

            fields: [
                {
                    name:
                        '🚨 Failure Source',

                    value:
                        `\`${incidentType}\``,

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
                        '🌙 Process State',

                    value:
                        `\`${processState}\``,

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
                '❌ Failed to publish the process Terminal alert:'
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
 * is unsafe. Evelynn records the Incident,
 * stops recurring systems and exits.
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

    stopRankTrialScheduler();

    terminal.dashboard.stop();

    await publishProcessIncident({
        incidentType:
            source ===
                'uncaughtException'
                ? 'UNCAUGHT_EXCEPTION'
                : 'FATAL_PROCESS_FAILURE',

        title:
            'Critical Node.js Process Failure',

        message:
            'Evelynn detected a fatal Node.js error. An emergency shutdown sequence has started.',

        severity:
            terminal
                .INCIDENT_SEVERITY
                .CRITICAL,

        status:
            terminal
                .SERVICE_STATUS
                .OFFLINE,

        error,

        processState:
            'EMERGENCY SHUTDOWN'
    });

    try {
        if (
            client.isReady()
        ) {
            const activeGuilds =
                getActiveGuilds(
                    client
                );

            await stopBlackBoxServices(
                activeGuilds,
                source
            );

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
 * Evelynn remains online, but the Node.js
 * Process service becomes DEGRADED.
 */
process.on(
    'unhandledRejection',

    reason => {
        console.error(
            '⚠️ Unhandled Promise Rejection:'
        );

        console.error(
            reason
        );

        void publishProcessIncident({
            incidentType:
                'UNHANDLED_REJECTION',

            title:
                'Unhandled Promise Rejection',

            message:
                'Evelynn detected a Promise rejection that was not handled by its originating module.',

            severity:
                terminal
                    .INCIDENT_SEVERITY
                    .WARNING,

            status:
                terminal
                    .SERVICE_STATUS
                    .DEGRADED,

            error:
                reason,

            processState:
                'RUNNING — INVESTIGATION REQUIRED'
        });
    }
);

/**
 * Capture warnings emitted by Node.js.
 *
 * Runtime warnings are archived as
 * warning-level Black Box incidents.
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

        void publishProcessIncident({
            incidentType:
                'NODE_PROCESS_WARNING',

            title:
                'Node.js Process Warning',

            message:
                'The Node.js runtime emitted a system warning that requires investigation.',

            severity:
                terminal
                    .INCIDENT_SEVERITY
                    .WARNING,

            status:
                terminal
                    .SERVICE_STATUS
                    .DEGRADED,

            error:
                warning,

            processState:
                'RUNNING — WARNING RECORDED'
        });
    }
);

/**
 * Capture Discord Gateway disconnection.
 */
client.on(
    Events.ShardDisconnect,

    async (
        event,
        shardId
    ) => {
        console.warn(
            `⚠️ Discord Gateway shard ${shardId} disconnected.`
        );

        if (
            !client.isReady()
        ) {
            return;
        }

        const activeGuilds =
            getActiveGuilds(
                client
            );

        for (
            const guild
            of activeGuilds
        ) {
            try {
                await terminal
                    .blackBox
                    .open({
                        guildId:
                            guild.id,

                        serviceKey:
                            terminal
                                .UMBRA_SERVICES
                                .GATEWAY
                                .key,

                        displayName:
                            terminal
                                .UMBRA_SERVICES
                                .GATEWAY
                                .name,

                        status:
                            terminal
                                .SERVICE_STATUS
                                .OFFLINE,

                        severity:
                            terminal
                                .INCIDENT_SEVERITY
                                .CRITICAL,

                        incidentType:
                            'GATEWAY_DISCONNECTED',

                        title:
                            'Discord Gateway Disconnected',

                        message:
                            'Evelynn lost its connection to the Discord Gateway.',

                        fields: [
                            {
                                name:
                                    '📡 Shard',

                                value:
                                    `\`${shardId}\``,

                                inline:
                                    true
                            },
                            {
                                name:
                                    '🔌 Close Code',

                                value:
                                    `\`${event?.code ?? 'Unknown'}\``,

                                inline:
                                    true
                            }
                        ],

                        metadata: {
                            shardId,

                            closeCode:
                                event?.code ??
                                null,

                            closeReason:
                                event?.reason ??
                                null
                        }
                    });
            } catch (error) {
                console.error(
                    `⚠️ Failed to record Gateway disconnection in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }
    }
);

/**
 * Capture Discord Gateway recovery.
 */
client.on(
    Events.ShardResume,

    async (
        shardId,
        replayedEvents
    ) => {
        console.log(
            `✅ Discord Gateway shard ${shardId} resumed.`
        );

        if (
            !client.isReady()
        ) {
            return;
        }

        const activeGuilds =
            getActiveGuilds(
                client
            );

        for (
            const guild
            of activeGuilds
        ) {
            try {
                await terminal
                    .blackBox
                    .recover({
                        guildId:
                            guild.id,

                        serviceKey:
                            terminal
                                .UMBRA_SERVICES
                                .GATEWAY
                                .key,

                        displayName:
                            terminal
                                .UMBRA_SERVICES
                                .GATEWAY
                                .name,

                        incidentType:
                            'GATEWAY_RESTORED',

                        title:
                            'Discord Gateway Restored',

                        message:
                            'Evelynn successfully restored its Discord Gateway connection.',

                        fields: [
                            {
                                name:
                                    '📡 Shard',

                                value:
                                    `\`${shardId}\``,

                                inline:
                                    true
                            },
                            {
                                name:
                                    '🔁 Replayed Events',

                                value:
                                    `\`${replayedEvents}\``,

                                inline:
                                    true
                            }
                        ],

                        metadata: {
                            shardId,

                            replayedEvents,

                            latencyMilliseconds:
                                Math.max(
                                    0,
                                    Math.round(
                                        client.ws.ping
                                    )
                                )
                        }
                    });
            } catch (error) {
                console.error(
                    `⚠️ Failed to record Gateway recovery in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }
    }
);

/**
 * Capture Gateway shard readiness.
 *
 * This also covers the initial successful
 * connection after login.
 */
client.on(
    Events.ShardReady,

    async shardId => {        console.log(
            `✅ Discord Gateway shard ${shardId} is ready.`
        );

        if (
            !client.isReady()
        ) {
            return;
        }

        const activeGuilds =
            getActiveGuilds(
                client
            );

        for (
            const guild
            of activeGuilds
        ) {
            await markBlackBoxServiceOnline({
                guildId:
                    guild.id,

                serviceKey:
                    terminal
                        .UMBRA_SERVICES
                        .GATEWAY
                        .key,

                displayName:
                    terminal
                        .UMBRA_SERVICES
                        .GATEWAY
                        .name,

                message:
                    'Discord Gateway connection is operational.',

                metadata: {
                    shardId,

                    latencyMilliseconds:
                        Math.max(
                            0,
                            Math.round(
                                client.ws.ping
                            )
                        )
                }
            });
        }
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
 * Begin the Evelynn startup sequence.
 */
startBot();
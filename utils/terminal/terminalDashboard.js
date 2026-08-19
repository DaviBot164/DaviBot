const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    testConnection
} = require('../../database/connection');

const {
    terminalServices:
        terminalServiceDatabase
} = require('../../database');

const {
    TERMINAL_CHANNEL_ID,
    formatUptime
} = require('./terminalLogger');

const {
    logIncident
} = require('./incidentLogger');

const {
    collectTerminalStatistics,
    createStatisticsFields
} = require('./terminalStatistics');

/**
 * Health Dashboard refresh interval.
 */
const DASHBOARD_REFRESH_INTERVAL =
    60_000;

/**
 * Discord Gateway latency thresholds.
 */
const GATEWAY_WARNING_LATENCY =
    500;

const GATEWAY_CRITICAL_LATENCY =
    1_500;

/**
 * Process memory thresholds.
 *
 * These values may be adjusted later
 * according to the Northflank plan.
 */
const MEMORY_WARNING_BYTES =
    512 *
    1_024 *
    1_024;

const MEMORY_CRITICAL_BYTES =
    768 *
    1_024 *
    1_024;

/**
 * Valid Black Box service states.
 */
const SERVICE_STATUS = {
    ONLINE:
        'ONLINE',

    OFFLINE:
        'OFFLINE',

    DEGRADED:
        'DEGRADED',

    STARTING:
        'STARTING',

    STOPPED:
        'STOPPED'
};

/**
 * Display order for the Services module.
 */
const SERVICE_DISPLAY_ORDER = [
    'postgresql',
    'gateway',
    'memory',
    'guardian',
    'kingdom_feed',
    'rank_trials',
    'ticket_system',
    'verification',
    'setup_wizard',
    'levels',
    'achievements',
    'titles',
    'sin_ranks',
    'events',
    'giveaways',
    'soul_records'
];

/**
 * Maximum services displayed in one
 * compact Dashboard field.
 */
const SERVICES_PER_FIELD =
    5;

/**
 * Stored Dashboard message reference.
 */
let dashboardMessageId =
    null;

/**
 * Active Dashboard refresh interval.
 */
let dashboardInterval =
    null;

/**
 * Last known system-health snapshot.
 *
 * The first Dashboard update establishes
 * the baseline and does not send Incidents.
 */
let previousHealthSnapshot =
    null;

/**
 * Format bytes into a readable size.
 *
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(
    bytes
) {
    if (
        !Number.isFinite(
            bytes
        ) ||
        bytes <= 0
    ) {
        return '0 MB';
    }

    const megabytes =
        bytes /
        1_024 /
        1_024;

    return `${megabytes.toFixed(1)} MB`;
}

/**
 * Return the visual marker for one
 * service status.
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
function getServiceStatusEmoji(
    status
) {
    const statusEmojiMap = {
        ONLINE:
            '🟢',

        OFFLINE:
            '🔴',

        DEGRADED:
            '🟡',

        STARTING:
            '🔵',

        STOPPED:
            '⚫'
    };

    return (
        statusEmojiMap[
            status
        ] ||
        '⚪'
    );
}

/**
 * Normalize one stored service so the
 * Dashboard never receives unsafe values.
 *
 * @param {Object|null|undefined} service
 * @returns {Object|null}
 */
function normalizeDashboardService(
    service
) {
    if (
        !service ||
        typeof service.serviceKey !==
            'string'
    ) {
        return null;
    }

    const status =
        Object.values(
            SERVICE_STATUS
        ).includes(
            service.status
        )
            ? service.status
            : SERVICE_STATUS.STARTING;

    return {
        serviceKey:
            service.serviceKey,

        displayName:
            service.displayName ||
            service.serviceKey,

        status,

        severity:
            service.severity ||
            'info',

        statusMessage:
            service.statusMessage ||
            'No service status message was recorded.',

        incidentType:
            service.incidentType ||
            null,

        metadata:
            service.metadata ??
            {},

        startedAt:
            service.startedAt ??
            null,

        lastChangedAt:
            service.lastChangedAt ??
            null,

        lastCheckedAt:
            service.lastCheckedAt ??
            null
    };
}

/**
 * Sort services by the official Evelynn
 * Dashboard display order.
 *
 * Unknown future services are displayed
 * after the official service list.
 *
 * @param {Object[]} services
 * @returns {Object[]}
 */
function sortDashboardServices(
    services
) {
    return [
        ...services
    ].sort(
        (
            first,
            second
        ) => {
            const firstIndex =
                SERVICE_DISPLAY_ORDER.indexOf(
                    first.serviceKey
                );

            const secondIndex =
                SERVICE_DISPLAY_ORDER.indexOf(
                    second.serviceKey
                );

            const safeFirstIndex =
                firstIndex ===
                    -1
                    ? Number.MAX_SAFE_INTEGER
                    : firstIndex;

            const safeSecondIndex =
                secondIndex ===
                    -1
                    ? Number.MAX_SAFE_INTEGER
                    : secondIndex;

            if (
                safeFirstIndex !==
                safeSecondIndex
            ) {
                return (
                    safeFirstIndex -
                    safeSecondIndex
                );
            }

            return first.displayName
                .localeCompare(
                    second.displayName
                );
        }
    );
}

/**
 * Load current Black Box services for
 * one Discord server.
 *
 * A service database failure must not
 * prevent the Dashboard from updating.
 *
 * @param {string|null} guildId
 * @returns {Promise<Object[]>}
 */
async function getDashboardServices(
    guildId
) {
    if (
        !guildId ||
        !terminalServiceDatabase ||
        typeof terminalServiceDatabase
            .getTerminalServices !==
            'function'
    ) {
        return [];
    }

    try {
        const storedServices =
            await terminalServiceDatabase
                .getTerminalServices(
                    guildId
                );

        return sortDashboardServices(
            storedServices
                .map(
                    normalizeDashboardService
                )
                .filter(
                    Boolean
                )
        );
    } catch (error) {
        console.error(
            '⚠️ Evelynn Dashboard could not load Black Box services:'
        );

        console.error(
            error
        );

        return [];
    }
}/**
 * Format one service for a compact
 * Dashboard Services field.
 *
 * @param {Object} service
 * @returns {string}
 */
function formatDashboardService(
    service
) {
    return [
        `${getServiceStatusEmoji(
            service.status
        )} **${service.displayName}**`,
        `-# \`${service.status}\``
    ].join('\n');
}

/**
 * Build compact Services fields.
 *
 * Services are grouped to avoid Discord's
 * maximum limit of 25 Embed fields.
 *
 * @param {Object[]} services
 * @returns {Object[]}
 */
function createServiceFields(
    services
) {
    if (
        !Array.isArray(
            services
        ) ||
        services.length ===
            0
    ) {
        return [
            {
                name:
                    '🖥 Services',

                value:
                    [
                        '`SERVICE DATA UNAVAILABLE`',
                        '',
                        'The Black Box service registry could not be loaded.'
                    ].join('\n'),

                inline:
                    false
            }
        ];
    }

    const fields =
        [];

    for (
        let index = 0;
        index < services.length;
        index += SERVICES_PER_FIELD
    ) {
        const serviceGroup =
            services.slice(
                index,
                index +
                    SERVICES_PER_FIELD
            );

        const groupNumber =
            Math.floor(
                index /
                    SERVICES_PER_FIELD
            ) +
            1;

        fields.push({
            name:
                `🖥 Services ${groupNumber}`,

            value:
                serviceGroup
                    .map(
                        formatDashboardService
                    )
                    .join('\n\n'),

            inline:
                true
        });
    }

    return fields;
}

/**
 * Measure PostgreSQL connection latency.
 *
 * @returns {Promise<{
 *     connected: boolean,
 *     latency: number|null
 * }>}
 */
async function getDatabaseHealth() {
    const startedAt =
        Date.now();

    try {
        const connected =
            await testConnection();

        return {
            connected:
                Boolean(
                    connected
                ),

            latency:
                connected
                    ? Date.now() -
                        startedAt
                    : null
        };
    } catch (error) {
        console.error(
            '⚠️ Evelynn Dashboard database health check failed:'
        );

        console.error(
            error
        );

        return {
            connected:
                false,

            latency:
                null
        };
    }
}

/**
 * Safely collect Evelynn Core Statistics.
 *
 * A Statistics failure must not prevent
 * the Health Dashboard from updating.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<Object|null>}
 */
async function getTerminalStatistics(
    client
) {
    try {
        return await collectTerminalStatistics(
            client
        );
    } catch (error) {
        console.error(
            '⚠️ Evelynn Terminal statistics collection failed:'
        );

        console.error(
            error
        );

        return null;
    }
}

/**
 * Find and validate the Terminal channel.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getDashboardChannel(
    client
) {
    let channel =
        client.channels.cache.get(
            TERMINAL_CHANNEL_ID
        );

    if (!channel) {
        channel =
            await client.channels
                .fetch(
                    TERMINAL_CHANNEL_ID
                )
                .catch(
                    () => null
                );
    }

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        console.warn(
            '⚠️ Evelynn Dashboard channel was not found.'
        );

        return null;
    }

    const botMember =
        channel.guild.members.me;

    if (!botMember) {
        console.warn(
            '⚠️ Evelynn could not access its GuildMember record for the Dashboard channel.'
        );

        return null;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory
        ])
    ) {
        console.warn(
            '⚠️ Evelynn is missing Dashboard channel permissions.'
        );

        return null;
    }

    return channel;
}

/**
 * Determine the current memory state.
 *
 * @param {number} rss
 * @returns {'normal'|'warning'|'critical'}
 */
function getMemoryState(
    rss
) {
    if (
        rss >=
        MEMORY_CRITICAL_BYTES
    ) {
        return 'critical';
    }

    if (
        rss >=
        MEMORY_WARNING_BYTES
    ) {
        return 'warning';
    }

    return 'normal';
}

/**
 * Determine the current Gateway
 * latency state.
 *
 * @param {number} gatewayPing
 * @returns {'normal'|'warning'|'critical'}
 */
function getGatewayLatencyState(
    gatewayPing
) {
    if (
        gatewayPing >=
        GATEWAY_CRITICAL_LATENCY
    ) {
        return 'critical';
    }

    if (
        gatewayPing >=
        GATEWAY_WARNING_LATENCY
    ) {
        return 'warning';
    }

    return 'normal';
}

/**
 * Determine whether one Black Box service
 * should affect overall system health.
 *
 * STOPPED services are treated as expected
 * shutdown states and do not create a
 * degraded or critical Dashboard state.
 *
 * @param {Object} service
 * @returns {boolean}
 */
function isUnhealthyDashboardService(
    service
) {
    if (
        !service ||
        service.status ===
            SERVICE_STATUS.STOPPED
    ) {
        return false;
    }

    return (
        service.status ===
            SERVICE_STATUS.OFFLINE ||
        service.status ===
            SERVICE_STATUS.DEGRADED
    );
}

/**
 * Determine the highest Black Box
 * service-state severity.
 *
 * @param {Object[]} services
 * @returns {'normal'|'warning'|'critical'}
 */
function getServicesHealthState(
    services
) {
    if (
        !Array.isArray(
            services
        ) ||
        services.length ===
            0
    ) {
        return 'normal';
    }

    const unhealthyServices =
        services.filter(
            isUnhealthyDashboardService
        );

    if (
        unhealthyServices.some(
            service =>
                service.status ===
                    SERVICE_STATUS.OFFLINE ||
                service.severity ===
                    'critical'
        )
    ) {
        return 'critical';
    }

    if (
        unhealthyServices.some(
            service =>
                service.status ===
                    SERVICE_STATUS.DEGRADED ||
                service.severity ===
                    'warning'
        )
    ) {
        return 'warning';
    }

    return 'normal';
}

/**
 * Determine overall Evelynn system health.
 *
 * @param {Object} health
 * @param {boolean} health.gatewayConnected
 * @param {boolean} health.databaseConnected
 * @param {'normal'|'warning'|'critical'} health.gatewayLatencyState
 * @param {'normal'|'warning'|'critical'} health.memoryState
 * @param {'normal'|'warning'|'critical'} health.servicesHealthState
 * @returns {{
 *     label: 'HEALTHY'|'DEGRADED'|'CRITICAL',
 *     emoji: string,
 *     color: string,
 *     message: string
 * }}
 */
function getOverallHealth({
    gatewayConnected,
    databaseConnected,
    gatewayLatencyState,
    memoryState,
    servicesHealthState =
        'normal'
}) {
    if (
        !gatewayConnected ||
        !databaseConnected ||
        gatewayLatencyState ===
            'critical' ||
        memoryState ===
            'critical' ||
        servicesHealthState ===
            'critical'
    ) {
        return {
            label:
                'CRITICAL',

            emoji:
                '🔴',

            color:
                '#ED4245',

            message:
                'One or more critical systems require immediate attention.'
        };
    }

    if (
        gatewayLatencyState ===
            'warning' ||
        memoryState ===
            'warning' ||
        servicesHealthState ===
            'warning'
    ) {
        return {
            label:
                'DEGRADED',

            emoji:
                '🟡',

            color:
                '#FEE75C',

            message:
                'Evelynn remains operational, but performance degradation was detected.'
        };
    }

    return {
        label:
            'HEALTHY',

        emoji:
            '🟢',

        color:
            '#57F287',

        message:
            'All monitored systems are operating normally.'
    };
}/**
 * Collect one complete Evelynn
 * system-health snapshot.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {string|null} [guildId]
 * @returns {Promise<{
 *     gatewayConnected: boolean,
 *     gatewayPing: number,
 *     gatewayLatencyState: 'normal'|'warning'|'critical',
 *     databaseConnected: boolean,
 *     databaseLatency: number|null,
 *     memoryUsage: NodeJS.MemoryUsage,
 *     memoryState: 'normal'|'warning'|'critical',
 *     services: Object[],
 *     servicesHealthState: 'normal'|'warning'|'critical',
 *     guildCount: number,
 *     memberCount: number,
 *     commandCount: number,
 *     checkedAt: number,
 *     statistics: Object|null,
 *     overallHealth: Object
 * }>}
 */
async function collectHealthSnapshot(
    client,
    guildId =
        null
) {
    const gatewayConnected =
        client.isReady();

    const gatewayPing =
        Math.max(
            0,
            Math.round(
                client.ws.ping
            )
        );

    const resolvedGuildId =
        guildId ||
        client.guilds.cache.first()
            ?.id ||
        null;

    const [
        databaseHealth,
        statistics,
        services
    ] = await Promise.all([
        getDatabaseHealth(),

        getTerminalStatistics(
            client
        ),

        getDashboardServices(
            resolvedGuildId
        )
    ]);

    const memoryUsage =
        process.memoryUsage();

    const gatewayLatencyState =
        getGatewayLatencyState(
            gatewayPing
        );

    const memoryState =
        getMemoryState(
            memoryUsage.rss
        );

    const servicesHealthState =
        getServicesHealthState(
            services
        );

    const guildCount =
        statistics?.guildCount ??
        client.guilds.cache.size;

    const memberCount =
        statistics?.memberCount ??
        client.guilds.cache.reduce(
            (
                total,
                guild
            ) =>
                total +
                guild.memberCount,

            0
        );

    const commandCount =
        statistics?.commandCount ??
        client.commands?.size ??
        0;

    const checkedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    const overallHealth =
        getOverallHealth({
            gatewayConnected,

            databaseConnected:
                databaseHealth.connected,

            gatewayLatencyState,

            memoryState,

            servicesHealthState
        });

    return {
        guildId:
            resolvedGuildId,

        gatewayConnected,
        gatewayPing,
        gatewayLatencyState,

        databaseConnected:
            databaseHealth.connected,

        databaseLatency:
            databaseHealth.latency,

        memoryUsage,
        memoryState,

        services,
        servicesHealthState,

        guildCount,
        memberCount,
        commandCount,
        checkedAt,

        statistics,

        overallHealth
    };
}

/**
 * Build the live Evelynn Health Dashboard.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @returns {EmbedBuilder}
 */
function buildDashboardEmbed(
    client,
    snapshot
) {
    const {
        gatewayConnected,
        gatewayPing,
        databaseConnected,
        databaseLatency,
        memoryUsage,
        guildCount,
        memberCount,
        commandCount,
        checkedAt,
        statistics,
        services,
        servicesHealthState,
        overallHealth
    } = snapshot;

    const serviceFields =
        createServiceFields(
            services
        );

    const dashboardFields = [
        {
            name:
                '📡 Discord Gateway',

            value:
                [
                    `**Status:** ${
                        gatewayConnected
                            ? '`CONNECTED`'
                            : '`DISCONNECTED`'
                    }`,
                    `**Latency:** \`${gatewayPing} ms\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🗄️ PostgreSQL',

            value:
                [
                    `**Status:** ${
                        databaseConnected
                            ? '`CONNECTED`'
                            : '`DISCONNECTED`'
                    }`,
                    `**Latency:** ${
                        databaseLatency !==
                        null
                            ? `\`${databaseLatency} ms\``
                            : '`Unavailable`'
                    }`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⏱️ Process',

            value:
                [
                    `**Uptime:** \`${formatUptime(
                        process.uptime() *
                        1_000
                    )}\``,
                    `**PID:** \`${process.pid}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧠 Memory',

            value:
                [
                    `**RSS:** \`${formatBytes(
                        memoryUsage.rss
                    )}\``,
                    `**Heap Used:** \`${formatBytes(
                        memoryUsage.heapUsed
                    )}\``,
                    `**Heap Total:** \`${formatBytes(
                        memoryUsage.heapTotal
                    )}\``
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
                '🖥 Black Box',

            value:
                [
                    `**Services:** \`${services.length}\``,
                    `**Health:** \`${servicesHealthState.toUpperCase()}\``,
                    `**Active Incidents:** \`${services.filter(
                        service =>
                            service.status ===
                                SERVICE_STATUS.OFFLINE ||
                            service.status ===
                                SERVICE_STATUS.DEGRADED
                    ).length}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🕒 Last Health Check',

            value:
                `<t:${checkedAt}:F>\n<t:${checkedAt}:R>`,

            inline:
                true
        },
        {
            name:
                '━━━━━━━━ UMBRA SERVICES ━━━━━━━━',

            value:
                [
                    'Current operational state of every',
                    'service registered inside Evelynn Black Box.'
                ].join('\n'),

            inline:
                false
        },
        ...serviceFields
    ];

    if (statistics) {
        dashboardFields.push(
            {
                name:
                    '━━━━━━━━ UMBRA CORE STATISTICS ━━━━━━━━',

                value:
                    [
                        'Live operational statistics collected from',
                        'Discord, PostgreSQL and the current Node.js process.'
                    ].join('\n'),

                inline:
                    false
            },
            ...createStatisticsFields(
                statistics
            )
        );
    } else {
        dashboardFields.push({
            name:
                '📊 Evelynn Core Statistics',

            value:
                [
                    '`STATISTICS TEMPORARILY UNAVAILABLE`',
                    '',
                    'The Health Dashboard remains operational.'
                ].join('\n'),

            inline:
                false
        });
    }

    return new EmbedBuilder()
        .setColor(
            overallHealth.color
        )
        .setAuthor({
            name:
                'Evelynn Core Health Monitor',

            iconURL:
                client.user
                    ?.displayAvatarURL({
                        extension:
                            'png',

                        size:
                            256,

                        forceStatic:
                            false
                    })
        })
        .setTitle(
            `${overallHealth.emoji} System Status: ${overallHealth.label}`
        )
        .setDescription(
            [
                '```ansi',
                '\u001b[2;35mUMBRA CORE DIAGNOSTICS\u001b[0m',
                '',
                overallHealth.message,
                '```'
            ].join('\n')
        )
        .addFields(
            dashboardFields
        )
        .setFooter({
            text:
                'Evelynn • Black Box Services & Live Diagnostics'
        })
        .setTimestamp();
}/**
 * Convert one snapshot into compact
 * Incident diagnostic fields.
 *
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @returns {Array<{
 *     name: string,
 *     value: string,
 *     inline: boolean
 * }>}
 */
function createHealthAlertFields(
    snapshot
) {
    const unhealthyServiceCount =
        snapshot.services.filter(
            service =>
                service.status ===
                    SERVICE_STATUS.OFFLINE ||
                service.status ===
                    SERVICE_STATUS.DEGRADED
        ).length;

    return [
        {
            name:
                '📡 Gateway',

            value:
                [
                    `**Status:** ${
                        snapshot.gatewayConnected
                            ? '`CONNECTED`'
                            : '`DISCONNECTED`'
                    }`,
                    `**Latency:** \`${snapshot.gatewayPing} ms\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🗄️ PostgreSQL',

            value:
                [
                    `**Status:** ${
                        snapshot.databaseConnected
                            ? '`CONNECTED`'
                            : '`DISCONNECTED`'
                    }`,
                    `**Latency:** ${
                        snapshot.databaseLatency !==
                        null
                            ? `\`${snapshot.databaseLatency} ms\``
                            : '`Unavailable`'
                    }`
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧠 Memory',

            value:
                [
                    `**RSS:** \`${formatBytes(
                        snapshot.memoryUsage.rss
                    )}\``,
                    `**State:** \`${snapshot.memoryState.toUpperCase()}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🖥 Services',

            value:
                [
                    `**Registered:** \`${snapshot.services.length}\``,
                    `**Unhealthy:** \`${unhealthyServiceCount}\``,
                    `**State:** \`${snapshot.servicesHealthState.toUpperCase()}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🌙 Overall State',

            value:
                `\`${snapshot.overallHealth.label}\``,

            inline:
                true
        },
        {
            name:
                '🕒 Detected At',

            value:
                `<t:${snapshot.checkedAt}:F>\n<t:${snapshot.checkedAt}:R>`,

            inline:
                true
        }
    ];
}

const {
    openIncident,
    recoverIncident,
    UMBRA_SERVICES
} = require('./incidentEngine');

/**
 * Publish a standardized Incident when
 * the overall system health changes.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} previous
 * @returns {Promise<void>}
 */
async function processOverallHealthTransition(
    client,
    snapshot,
    previous
) {
    const previousLabel =
        previous
            .overallHealth
            .label;

    const currentLabel =
        snapshot
            .overallHealth
            .label;

    if (
        previousLabel ===
        currentLabel
    ) {
        return;
    }

    const fields =
        createHealthAlertFields(
            snapshot
        );

    if (
        currentLabel ===
        'HEALTHY'
    ) {
        await logIncident(
            client,
            {
                type:
                    'SYSTEM_RECOVERED',

                message:
                    `Evelynn recovered from ${previousLabel} status. All monitored systems are operating normally again.`,

                fields
            }
        );

        return;
    }

    await logIncident(
        client,
        {
            type:
                currentLabel ===
                    'CRITICAL'
                    ? 'SYSTEM_CRITICAL'
                    : 'SYSTEM_WARNING',

            message:
                currentLabel ===
                    'CRITICAL'
                    ? 'Evelynn detected a critical system condition requiring immediate investigation.'
                    : 'Evelynn detected degraded performance in one or more monitored systems.',

            fields: [
                ...fields,
                {
                    name:
                        '⚠️ Previous State',

                    value:
                        `\`${previousLabel}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🚨 Current State',

                    value:
                        `\`${currentLabel}\``,

                    inline:
                        true
                }
            ]
        }
    );
}

/**
 * Open one Dashboard-managed Black Box
 * service Incident for every active Guild.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} options
 * @param {Object} options.service
 * @param {string} options.status
 * @param {string} options.severity
 * @param {string} options.incidentType
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<Object>} [options.fields]
 * @param {Object} [options.metadata]
 * @param {unknown} [options.error]
 * @returns {Promise<void>}
 */
async function openDashboardServiceIncident(
    client,
    {
        service,
        status,
        severity,
        incidentType,
        title,
        message,
        fields =
            [],
        metadata =
            {},
        error =
            null
    }
) {
    if (
        !service ||
        !client?.guilds
    ) {
        return;
    }

    const guilds =
        Array.from(
            client.guilds.cache.values()
        );

    for (
        const guild
        of guilds
    ) {
        try {
            await openIncident({
                guildId:
                    guild.id,

                serviceKey:
                    service.key,

                displayName:
                    service.name,

                status,

                severity,

                incidentType,

                title,

                message,

                fields,

                metadata,

                error
            });
        } catch (incidentError) {
            console.error(
                `⚠️ Dashboard could not open ${service.name} Incident in ${guild.name}:`
            );

            console.error(
                incidentError
            );
        }
    }
}

/**
 * Recover one Dashboard-managed Black Box
 * service for every active Guild.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} options
 * @param {Object} options.service
 * @param {string} options.incidentType
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<Object>} [options.fields]
 * @param {Object} [options.metadata]
 * @returns {Promise<void>}
 */
async function recoverDashboardServiceIncident(
    client,
    {
        service,
        incidentType,
        title,
        message,
        fields =
            [],
        metadata =
            {}
    }
) {
    if (
        !service ||
        !client?.guilds
    ) {
        return;
    }

    const guilds =
        Array.from(
            client.guilds.cache.values()
        );

    for (
        const guild
        of guilds
    ) {
        try {
            await recoverIncident({
                guildId:
                    guild.id,

                serviceKey:
                    service.key,

                displayName:
                    service.name,

                incidentType,

                title,

                message,

                fields,

                metadata
            });
        } catch (incidentError) {
            console.error(
                `⚠️ Dashboard could not recover ${service.name} in ${guild.name}:`
            );

            console.error(
                incidentError
            );
        }
    }
}

/**
 * Publish standardized Incidents and update
 * Black Box service states when an individual
 * monitored component changes.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} current
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} previous
 * @returns {Promise<void>}
 */
async function processComponentTransitions(
    client,
    current,
    previous
) {
    /*
     * PostgreSQL connection lost.
     */
    if (
        previous.databaseConnected &&
        !current.databaseConnected
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .POSTGRESQL,

                status:
                    SERVICE_STATUS.OFFLINE,

                severity:
                    'critical',

                incidentType:
                    'DATABASE_DISCONNECTED',

                title:
                    'PostgreSQL Connection Lost',

                message:
                    'Evelynn can no longer communicate with the PostgreSQL database.',

                fields: [
                    {
                        name:
                            '🗄️ Database State',

                        value:
                            '`DISCONNECTED`',

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 Overall Health',

                        value:
                            `\`${current.overallHealth.label}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '⚠️ Affected Systems',

                        value:
                            [
                                '• Soul Records',
                                '• Levels',
                                '• Achievements',
                                '• Chronicle Titles',
                                '• Captain Ranks',
                                '• Kingdom Records'
                            ].join('\n'),

                        inline:
                            false
                    }
                ],

                metadata: {
                    connected:
                        false,

                    latencyMilliseconds:
                        null
                }
            }
        );
    }

    /*
     * PostgreSQL connection restored.
     */
    if (
        !previous.databaseConnected &&
        current.databaseConnected
    ) {
        await recoverDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .POSTGRESQL,

                incidentType:
                    'DATABASE_RESTORED',

                title:
                    'PostgreSQL Connection Restored',

                message:
                    'Database communication has been restored successfully.',

                fields: [
                    {
                        name:
                            '🗄️ Database State',

                        value:
                            '`CONNECTED`',

                        inline:
                            true
                    },
                    {
                        name:
                            '⚡ Current Latency',

                        value:
                            current.databaseLatency !==
                            null
                                ? `\`${current.databaseLatency} ms\``
                                : '`Unavailable`',

                        inline:
                            true
                    }
                ],

                metadata: {
                    connected:
                        true,

                    latencyMilliseconds:
                        current.databaseLatency
                }
            }
        );
    }    /*
     * Discord Gateway connection lost.
     */
    if (
        previous.gatewayConnected &&
        !current.gatewayConnected
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .GATEWAY,

                status:
                    SERVICE_STATUS.OFFLINE,

                severity:
                    'critical',

                incidentType:
                    'GATEWAY_DISCONNECTED',

                title:
                    'Discord Gateway Disconnected',

                message:
                    'Evelynn lost its connection to the Discord Gateway.',

                fields: [
                    {
                        name:
                            '📡 Gateway State',

                        value:
                            '`DISCONNECTED`',

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 Overall Health',

                        value:
                            `\`${current.overallHealth.label}\``,

                        inline:
                            true
                    }
                ],

                metadata: {
                    connected:
                        false,

                    latencyMilliseconds:
                        current.gatewayPing
                }
            }
        );
    }

    /*
     * Discord Gateway connection recovered.
     */
    if (
        !previous.gatewayConnected &&
        current.gatewayConnected
    ) {
        await recoverDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .GATEWAY,

                incidentType:
                    'GATEWAY_RESTORED',

                title:
                    'Discord Gateway Restored',

                message:
                    'Evelynn successfully restored its Discord Gateway connection.',

                fields: [
                    {
                        name:
                            '📡 Gateway State',

                        value:
                            '`CONNECTED`',

                        inline:
                            true
                    },
                    {
                        name:
                            '⚡ Current Latency',

                        value:
                            `\`${current.gatewayPing} ms\``,

                        inline:
                            true
                    }
                ],

                metadata: {
                    connected:
                        true,

                    latencyMilliseconds:
                        current.gatewayPing
                }
            }
        );
    }

    /*
     * Gateway latency entered warning state.
     */
    if (
        previous.gatewayLatencyState ===
            'normal' &&
        current.gatewayLatencyState ===
            'warning'
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .GATEWAY,

                status:
                    SERVICE_STATUS.DEGRADED,

                severity:
                    'warning',

                incidentType:
                    'HIGH_GATEWAY_LATENCY',

                title:
                    'High Gateway Latency',

                message:
                    'Discord Gateway latency exceeded the configured warning threshold.',

                fields: [
                    {
                        name:
                            '📡 Current Latency',

                        value:
                            `\`${current.gatewayPing} ms\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '⚠️ Latency State',

                        value:
                            '`WARNING`',

                        inline:
                            true
                    }
                ],

                metadata: {
                    latencyMilliseconds:
                        current.gatewayPing,

                    thresholdMilliseconds:
                        GATEWAY_WARNING_LATENCY
                }
            }
        );
    }

    /*
     * Gateway latency escalated to critical.
     */
    if (
        previous.gatewayLatencyState !==
            'critical' &&
        current.gatewayLatencyState ===
            'critical'
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .GATEWAY,

                status:
                    SERVICE_STATUS.DEGRADED,

                severity:
                    'critical',

                incidentType:
                    'CRITICAL_GATEWAY_LATENCY',

                title:
                    'Critical Gateway Latency',

                message:
                    'Discord Gateway latency exceeded the configured critical threshold.',

                fields: [
                    {
                        name:
                            '📡 Current Latency',

                        value:
                            `\`${current.gatewayPing} ms\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🚨 Latency State',

                        value:
                            '`CRITICAL`',

                        inline:
                            true
                    }
                ],

                metadata: {
                    latencyMilliseconds:
                        current.gatewayPing,

                    thresholdMilliseconds:
                        GATEWAY_CRITICAL_LATENCY
                }
            }
        );
    }

    /*
     * Gateway latency returned to normal.
     */
    if (
        previous.gatewayLatencyState !==
            'normal' &&
        current.gatewayLatencyState ===
            'normal' &&
        current.gatewayConnected
    ) {
        await recoverDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .GATEWAY,

                incidentType:
                    'GATEWAY_LATENCY_NORMALIZED',

                title:
                    'Gateway Latency Normalized',

                message:
                    'Discord Gateway latency returned to a normal operating range.',

                fields: [
                    {
                        name:
                            '📡 Current Latency',

                        value:
                            `\`${current.gatewayPing} ms\``,

                        inline:
                            true
                    }
                ],

                metadata: {
                    connected:
                        true,

                    latencyMilliseconds:
                        current.gatewayPing
                }
            }
        );
    }

    /*
     * Memory entered warning state.
     */
    if (
        previous.memoryState ===
            'normal' &&
        current.memoryState ===
            'warning'
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .MEMORY,

                status:
                    SERVICE_STATUS.DEGRADED,

                severity:
                    'warning',

                incidentType:
                    'HIGH_MEMORY_USAGE',

                title:
                    'High Memory Usage',

                message:
                    'Evelynn process memory exceeded the configured warning threshold.',

                fields: [
                    {
                        name:
                            '🧠 Current RSS',

                        value:
                            `\`${formatBytes(
                                current.memoryUsage.rss
                            )}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '⚠️ Memory State',

                        value:
                            '`WARNING`',

                        inline:
                            true
                    }
                ],

                metadata: {
                    rssBytes:
                        current.memoryUsage.rss,

                    heapUsedBytes:
                        current.memoryUsage.heapUsed,

                    thresholdBytes:
                        MEMORY_WARNING_BYTES
                }
            }
        );
    }

    /*
     * Memory escalated to critical.
     */
    if (
        previous.memoryState !==
            'critical' &&
        current.memoryState ===
            'critical'
    ) {
        await openDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .MEMORY,

                status:
                    SERVICE_STATUS.DEGRADED,

                severity:
                    'critical',

                incidentType:
                    'CRITICAL_MEMORY_USAGE',

                title:
                    'Critical Memory Usage',

                message:
                    'Evelynn process memory exceeded the configured critical threshold.',

                fields: [
                    {
                        name:
                            '🧠 Current RSS',

                        value:
                            `\`${formatBytes(
                                current.memoryUsage.rss
                            )}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🚨 Memory State',

                        value:
                            '`CRITICAL`',

                        inline:
                            true
                    }
                ],

                metadata: {
                    rssBytes:
                        current.memoryUsage.rss,

                    heapUsedBytes:
                        current.memoryUsage.heapUsed,

                    thresholdBytes:
                        MEMORY_CRITICAL_BYTES
                }
            }
        );
    }

    /*
     * Memory returned to normal.
     */
    if (
        previous.memoryState !==
            'normal' &&
        current.memoryState ===
            'normal'
    ) {
        await recoverDashboardServiceIncident(
            client,
            {
                service:
                    UMBRA_SERVICES
                        .MEMORY,

                incidentType:
                    'MEMORY_USAGE_NORMALIZED',

                title:
                    'Memory Usage Normalized',

                message:
                    'Evelynn process memory returned to a normal operating range.',

                fields: [
                    {
                        name:
                            '🧠 Current RSS',

                        value:
                            `\`${formatBytes(
                                current.memoryUsage.rss
                            )}\``,

                        inline:
                            true
                    }
                ],

                metadata: {
                    rssBytes:
                        current.memoryUsage.rss,

                    heapUsedBytes:
                        current.memoryUsage.heapUsed
                }
            }
        );
    }
}

/**
 * Compare the latest snapshot with the
 * previous snapshot and publish Incidents.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @returns {Promise<void>}
 */
async function processHealthTransitions(
    client,
    snapshot
) {
    if (!previousHealthSnapshot) {
        previousHealthSnapshot =
            snapshot;

        return;
    }

    const previousSnapshot =
        previousHealthSnapshot;

    await processComponentTransitions(
        client,
        snapshot,
        previousSnapshot
    );

    await processOverallHealthTransition(
        client,
        snapshot,
        previousSnapshot
    );

    previousHealthSnapshot =
        snapshot;
}/**
 * Find the existing Dashboard message.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function findDashboardMessage(
    channel
) {
    if (dashboardMessageId) {
        const cachedMessage =
            channel.messages.cache.get(
                dashboardMessageId
            );

        if (cachedMessage) {
            return cachedMessage;
        }

        const fetchedMessage =
            await channel.messages
                .fetch(
                    dashboardMessageId
                )
                .catch(
                    () => null
                );

        if (fetchedMessage) {
            return fetchedMessage;
        }

        dashboardMessageId =
            null;
    }

    const recentMessages =
        await channel.messages
            .fetch({
                limit:
                    25
            })
            .catch(
                () => null
            );

    if (!recentMessages) {
        return null;
    }

    const dashboard =
        recentMessages.find(
            message =>
                message.author.id ===
                    channel.client.user.id &&
                message.embeds.some(
                    embed =>
                        embed.author?.name ===
                        'Evelynn Core Health Monitor'
                )
        ) ||
        null;

    if (dashboard) {
        dashboardMessageId =
            dashboard.id;
    }

    return dashboard;
}

/**
 * Update the healthy service heartbeat
 * information after every Dashboard check.
 *
 * This keeps PostgreSQL, Gateway and Memory
 * metadata current even when no transition
 * Incident was triggered.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @returns {Promise<void>}
 */
async function synchronizeHealthyServiceStates(
    client,
    snapshot
) {
    if (
        !client?.guilds
    ) {
        return;
    }

    const guilds =
        Array.from(
            client.guilds.cache.values()
        );

    for (
        const guild
        of guilds
    ) {
        /*
         * PostgreSQL is refreshed only while
         * the health check confirms connectivity.
         */
        if (
            snapshot.databaseConnected
        ) {
            try {
                await terminalServiceDatabase
                    .upsertTerminalService({
                        guildId:
                            guild.id,

                        serviceKey:
                            UMBRA_SERVICES
                                .POSTGRESQL
                                .key,

                        displayName:
                            UMBRA_SERVICES
                                .POSTGRESQL
                                .name,

                        status:
                            SERVICE_STATUS.ONLINE,

                        severity:
                            'success',

                        statusMessage:
                            'PostgreSQL communication is available.',

                        incidentType:
                            null,

                        metadata: {
                            connected:
                                true,

                            latencyMilliseconds:
                                snapshot.databaseLatency
                        },

                        startedAt:
                            new Date(
                                Date.now() -
                                process.uptime() *
                                1_000
                            )
                    });
            } catch (error) {
                console.error(
                    `⚠️ Dashboard could not refresh PostgreSQL service state in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }

        /*
         * Gateway is refreshed only when both
         * the connection and latency are normal.
         */
        if (
            snapshot.gatewayConnected &&
            snapshot.gatewayLatencyState ===
                'normal'
        ) {
            try {
                await terminalServiceDatabase
                    .upsertTerminalService({
                        guildId:
                            guild.id,

                        serviceKey:
                            UMBRA_SERVICES
                                .GATEWAY
                                .key,

                        displayName:
                            UMBRA_SERVICES
                                .GATEWAY
                                .name,

                        status:
                            SERVICE_STATUS.ONLINE,

                        severity:
                            'success',

                        statusMessage:
                            'Discord Gateway connection is operating normally.',

                        incidentType:
                            null,

                        metadata: {
                            connected:
                                true,

                            latencyMilliseconds:
                                snapshot.gatewayPing
                        },

                        startedAt:
                            new Date(
                                Date.now() -
                                process.uptime() *
                                1_000
                            )
                    });
            } catch (error) {
                console.error(
                    `⚠️ Dashboard could not refresh Gateway service state in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }

        /*
         * Memory is refreshed only while it
         * remains in the normal range.
         */
        if (
            snapshot.memoryState ===
            'normal'
        ) {
            try {
                await terminalServiceDatabase
                    .upsertTerminalService({
                        guildId:
                            guild.id,

                        serviceKey:
                            UMBRA_SERVICES
                                .MEMORY
                                .key,

                        displayName:
                            UMBRA_SERVICES
                                .MEMORY
                                .name,

                        status:
                            SERVICE_STATUS.ONLINE,

                        severity:
                            'success',

                        statusMessage:
                            'Evelynn process memory is within the normal operating range.',

                        incidentType:
                            null,

                        metadata: {
                            rssBytes:
                                snapshot
                                    .memoryUsage
                                    .rss,

                            heapUsedBytes:
                                snapshot
                                    .memoryUsage
                                    .heapUsed,

                            heapTotalBytes:
                                snapshot
                                    .memoryUsage
                                    .heapTotal
                        },

                        startedAt:
                            new Date(
                                Date.now() -
                                process.uptime() *
                                1_000
                            )
                    });
            } catch (error) {
                console.error(
                    `⚠️ Dashboard could not refresh Memory service state in ${guild.name}:`
                );

                console.error(
                    error
                );
            }
        }
    }
}

/**
 * Update or create the Dashboard.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<boolean>}
 */
async function updateTerminalDashboard(
    client
) {
    try {
        if (
            !client ||
            !client.isReady()
        ) {
            return false;
        }

        const channel =
            await getDashboardChannel(
                client
            );

        if (!channel) {
            return false;
        }

        /*
         * The Terminal channel identifies the
         * server whose service registry should
         * appear in this Dashboard.
         */
        const guildId =
            channel.guild.id;

        const snapshot =
            await collectHealthSnapshot(
                client,
                guildId
            );

        await processHealthTransitions(
            client,
            snapshot
        );

        /*
         * Refresh healthy service metadata after
         * transition processing. Unhealthy states
         * remain untouched until recovery.
         */
        await synchronizeHealthyServiceStates(
            client,
            snapshot
        );

        /*
         * Reload services because transition
         * processing may have changed their
         * PostgreSQL state.
         */
        const refreshedSnapshot =
            await collectHealthSnapshot(
                client,
                guildId
            );

        const embed =
            buildDashboardEmbed(
                client,
                refreshedSnapshot
            );

        const existing =
            await findDashboardMessage(
                channel
            );

        if (existing) {
            await existing.edit({
                embeds: [
                    embed
                ]
            });

            return true;
        }

        const created =
            await channel.send({
                embeds: [
                    embed
                ]
            });

        dashboardMessageId =
            created.id;

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to update Evelynn Dashboard:'
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Start Dashboard updates.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<boolean>}
 */
async function startTerminalDashboard(
    client
) {
    if (
        dashboardInterval
    ) {
        clearInterval(
            dashboardInterval
        );
    }

    previousHealthSnapshot =
        null;

    const initial =
        await updateTerminalDashboard(
            client
        );

    dashboardInterval =
        setInterval(
            async () => {
                await updateTerminalDashboard(
                    client
                );
            },
            DASHBOARD_REFRESH_INTERVAL
        );

    dashboardInterval.unref?.();

    return initial;
}

/**
 * Stop Dashboard updates.
 */
function stopTerminalDashboard() {
    if (
        dashboardInterval
    ) {
        clearInterval(
            dashboardInterval
        );

        dashboardInterval =
            null;
    }

    previousHealthSnapshot =
        null;
}

/**
 * Return refresh interval.
 *
 * @returns {number}
 */
function getDashboardRefreshInterval() {
    return DASHBOARD_REFRESH_INTERVAL;
}

module.exports = {
    DASHBOARD_REFRESH_INTERVAL,

    GATEWAY_WARNING_LATENCY,
    GATEWAY_CRITICAL_LATENCY,

    MEMORY_WARNING_BYTES,
    MEMORY_CRITICAL_BYTES,

    SERVICE_STATUS,
    SERVICE_DISPLAY_ORDER,
    SERVICES_PER_FIELD,

    formatBytes,

    getServiceStatusEmoji,
    normalizeDashboardService,
    sortDashboardServices,
    getDashboardServices,
    formatDashboardService,
    createServiceFields,

    getDatabaseHealth,
    getTerminalStatistics,
    getDashboardChannel,

    getMemoryState,
    getGatewayLatencyState,

    isUnhealthyDashboardService,
    getServicesHealthState,
    getOverallHealth,

    collectHealthSnapshot,

    buildDashboardEmbed,
    createHealthAlertFields,

    processOverallHealthTransition,
    openDashboardServiceIncident,
    recoverDashboardServiceIncident,
    processComponentTransitions,
    processHealthTransitions,

    findDashboardMessage,
    synchronizeHealthyServiceStates,

    updateTerminalDashboard,

    startTerminalDashboard,
    stopTerminalDashboard,

    getDashboardRefreshInterval
};
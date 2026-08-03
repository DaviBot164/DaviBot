const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    testConnection
} = require('../../database/connection');

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
            '⚠️ Umbra Dashboard database health check failed:'
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
 * Safely collect Umbra Core Statistics.
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
            '⚠️ Umbra Terminal statistics collection failed:'
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
            '⚠️ Umbra Dashboard channel was not found.'
        );

        return null;
    }

    const botMember =
        channel.guild.members.me;

    if (!botMember) {
        console.warn(
            '⚠️ Umbra could not access its GuildMember record for the Dashboard channel.'
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
            '⚠️ Umbra is missing Dashboard channel permissions.'
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
 * Determine overall Umbra system health.
 *
 * @param {Object} health
 * @param {boolean} health.gatewayConnected
 * @param {boolean} health.databaseConnected
 * @param {'normal'|'warning'|'critical'} health.gatewayLatencyState
 * @param {'normal'|'warning'|'critical'} health.memoryState
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
    memoryState
}) {
    if (
        !gatewayConnected ||
        !databaseConnected ||
        gatewayLatencyState ===
            'critical' ||
        memoryState ===
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
                'Umbra remains operational, but performance degradation was detected.'
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
}

/**
 * Collect one complete Umbra
 * system-health snapshot.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<{
 *     gatewayConnected: boolean,
 *     gatewayPing: number,
 *     gatewayLatencyState: 'normal'|'warning'|'critical',
 *     databaseConnected: boolean,
 *     databaseLatency: number|null,
 *     memoryUsage: NodeJS.MemoryUsage,
 *     memoryState: 'normal'|'warning'|'critical',
 *     guildCount: number,
 *     memberCount: number,
 *     commandCount: number,
 *     checkedAt: number,
 *     statistics: Object|null,
 *     overallHealth: {
 *         label: 'HEALTHY'|'DEGRADED'|'CRITICAL',
 *         emoji: string,
 *         color: string,
 *         message: string
 *     }
 * }>}
 */
async function collectHealthSnapshot(
    client
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

    const [
        databaseHealth,
        statistics
    ] = await Promise.all([
        getDatabaseHealth(),

        getTerminalStatistics(
            client
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

            memoryState
        });

    return {
        gatewayConnected,
        gatewayPing,
        gatewayLatencyState,

        databaseConnected:
            databaseHealth.connected,

        databaseLatency:
            databaseHealth.latency,

        memoryUsage,
        memoryState,

        guildCount,
        memberCount,
        commandCount,
        checkedAt,

        statistics,

        overallHealth
    };
}/**
 * Build the live Umbra Health Dashboard.
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
        overallHealth
    } = snapshot;

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
                '🛡️ Guardian',

            value:
                [
                    '**Status:** `ACTIVE`',
                    '**Monitoring:** `ENABLED`'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎫 Ticket Core',

            value:
                [
                    '**Status:** `READY`',
                    '**System:** `OPERATIONAL`'
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
        }
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
                '📊 Umbra Core Statistics',

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
                'Umbra Core Health Monitor',

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
                'Umbra • Live System Diagnostics & Statistics'
        })
        .setTimestamp();
}

/**
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
                    `Umbra recovered from ${previousLabel} status. All monitored systems are operating normally again.`,

                fields
            }
        );

        return;
    }

    await logIncident(
        client,
        {
            type:
                'SYSTEM_WARNING',

            message:
                currentLabel ===
                    'CRITICAL'
                    ? 'Umbra detected a critical system condition requiring immediate investigation.'
                    : 'Umbra detected degraded performance in one or more monitored systems.',

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
}/**
 * Publish standardized Incidents for
 * individual component-state changes.
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
    if (
        previous.databaseConnected &&
        !current.databaseConnected
    ) {
        await logIncident(
            client,
            {
                type:
                    'DATABASE_DISCONNECTED',

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
                                '• Arrancar Ranks',
                                '• Kingdom Records'
                            ].join('\n'),

                        inline:
                            false
                    }
                ]
            }
        );
    }

    if (
        !previous.databaseConnected &&
        current.databaseConnected
    ) {
        await logIncident(
            client,
            {
                type:
                    'DATABASE_RESTORED',

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
                ]
            }
        );
    }

    if (
        previous.gatewayConnected &&
        !current.gatewayConnected
    ) {
        await logIncident(
            client,
            {
                type:
                    'GATEWAY_DISCONNECTED',

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
                ]
            }
        );
    }

    if (
        !previous.gatewayConnected &&
        current.gatewayConnected
    ) {
        await logIncident(
            client,
            {
                type:
                    'GATEWAY_RESTORED',

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
                ]
            }
        );
    }

    if (
        previous.gatewayLatencyState ===
            'normal' &&
        current.gatewayLatencyState !==
            'normal'
    ) {
        await logIncident(
            client,
            {
                type:
                    'HIGH_GATEWAY_LATENCY',

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
                            `\`${current.gatewayLatencyState.toUpperCase()}\``,

                        inline:
                            true
                    }
                ]
            }
        );
    }

    if (
        previous.gatewayLatencyState !==
            'normal' &&
        current.gatewayLatencyState ===
            'normal'
    ) {
        await logIncident(
            client,
            {
                type:
                    'GATEWAY_LATENCY_NORMALIZED',

                fields: [
                    {
                        name:
                            '📡 Current Latency',

                        value:
                            `\`${current.gatewayPing} ms\``,

                        inline:
                            true
                    }
                ]
            }
        );
    }

    if (
        previous.memoryState ===
            'normal' &&
        current.memoryState !==
            'normal'
    ) {
        await logIncident(
            client,
            {
                type:
                    'HIGH_MEMORY_USAGE',

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
                            `\`${current.memoryState.toUpperCase()}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '📊 Memory Share',

                        value:
                            current.statistics
                                ? `\`${current.statistics.memoryPercentage.toFixed(2)}%\``
                                : '`Unavailable`',

                        inline:
                            true
                    }
                ]
            }
        );
    }

    if (
        previous.memoryState !==
            'normal' &&
        current.memoryState ===
            'normal'
    ) {
        await logIncident(
            client,
            {
                type:
                    'MEMORY_USAGE_NORMALIZED',

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
                            '📊 Memory Share',

                        value:
                            current.statistics
                                ? `\`${current.statistics.memoryPercentage.toFixed(2)}%\``
                                : '`Unavailable`',

                        inline:
                            true
                    }
                ]
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
                limit: 25
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
                        'Umbra Core Health Monitor'
                )
        ) || null;

    if (dashboard) {
        dashboardMessageId =
            dashboard.id;
    }

    return dashboard;
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

        const snapshot =
            await collectHealthSnapshot(
                client
            );

        await processHealthTransitions(
            client,
            snapshot
        );

        const embed =
            buildDashboardEmbed(
                client,
                snapshot
            );

        const existing =
            await findDashboardMessage(
                channel
            );

        if (existing) {
            await existing.edit({
                embeds: [embed]
            });

            return true;
        }

        const created =
            await channel.send({
                embeds: [embed]
            });

        dashboardMessageId =
            created.id;

        return true;
    } catch (error) {
        console.error(
            '❌ Failed to update Umbra Dashboard:'
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

    formatBytes,

    getDatabaseHealth,

    getMemoryState,
    getGatewayLatencyState,
    getOverallHealth,

    collectHealthSnapshot,

    buildDashboardEmbed,

    processHealthTransitions,

    updateTerminalDashboard,

    startTerminalDashboard,
    stopTerminalDashboard,

    getDashboardRefreshInterval
};
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    testConnection
} = require('../../database/connection');

const {
    TERMINAL_CHANNEL_ID,
    formatUptime,
    logTerminal
} = require('./terminalLogger');

const {
    logAlert
} = require('./alertLogger');

/**
 * Health Dashboard refresh interval.
 */
const DASHBOARD_REFRESH_INTERVAL =
    60_000;

/**
 * Gateway latency thresholds.
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
 * the baseline and does not send alerts.
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

    const databaseHealth =
        await getDatabaseHealth();

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
        client.guilds.cache.size;

    const memberCount =
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
        overallHealth
    } = snapshot;

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
        )
        .setFooter({
            text:
                'Umbra • Live System Diagnostics'
        })
        .setTimestamp();
}

/**
 * Convert one snapshot into compact
 * alert diagnostic fields.
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
 * Publish an alert when overall system
 * health changes.
 *
 * The first collected snapshot establishes
 * a baseline and does not create an alert.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Awaited<ReturnType<typeof collectHealthSnapshot>>} snapshot
 * @returns {Promise<void>}
 */
async function processOverallHealthTransition(
    client,
    snapshot
) {
    if (!previousHealthSnapshot) {
        previousHealthSnapshot =
            snapshot;

        return;
    }

    const previousLabel =
        previousHealthSnapshot
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
        await logTerminal(
            client,
            {
                level:
                    'success',

                title:
                    'System Health Restored',

                message:
                    `Umbra recovered from ${previousLabel} status. All monitored systems are operating normally again.`,

                fields
            }
        );

        return;
    }

    await logAlert(
        client,
        {
            title:
                currentLabel ===
                    'CRITICAL'
                    ? 'Critical System Health Alert'
                    : 'System Performance Warning',

            message:
                currentLabel ===
                    'CRITICAL'
                    ? 'Umbra detected a critical system condition requiring immediate investigation.'
                    : 'Umbra detected degraded performance in one or more monitored systems.',

            severity:
                currentLabel ===
                    'CRITICAL'
                    ? 'critical'
                    : 'warning',

            fields
        }
    );
}

/**
 * Publish targeted alerts for specific
 * component-state changes.
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
        await logAlert(
            client,
            {
                title:
                    'PostgreSQL Connection Lost',

                message:
                    'Umbra can no longer communicate with the PostgreSQL database.',

                severity:
                    'critical',

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
                            '🌙 Affected Systems',

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
        await logTerminal(
            client,
            {
                level:
                    'success',

                title:
                    'PostgreSQL Connection Restored',

                message:
                    'Database communication has been restored and dependent systems may resume normal operation.',

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
        previous.gatewayLatencyState ===
            'normal' &&
        current.gatewayLatencyState !==
            'normal'
    ) {
        await logAlert(
            client,
            {
                title:
                    'Gateway Latency Increased',

                message:
                    'Umbra detected unusually high Discord Gateway latency.',

                severity:
                    current.gatewayLatencyState ===
                        'critical'
                        ? 'critical'
                        : 'warning',

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
        await logTerminal(
            client,
            {
                level:
                    'success',

                title:
                    'Gateway Latency Normalized',

                message:
                    'Discord Gateway latency has returned to a normal operating range.',

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
        await logAlert(
            client,
            {
                title:
                    'High Memory Usage Detected',

                message:
                    'Umbra process memory usage exceeded the configured safety threshold.',

                severity:
                    current.memoryState ===
                        'critical'
                        ? 'critical'
                        : 'warning',

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
        await logTerminal(
            client,
            {
                level:
                    'success',

                title:
                    'Memory Usage Normalized',

                message:
                    'Umbra process memory usage returned below the configured warning threshold.',

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
                ]
            }
        );
    }
}

/**
 * Compare the latest snapshot with the
 * previous snapshot and publish alerts.
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
        snapshot
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

    const existingDashboard =
        recentMessages.find(
            message =>
                message.author.id ===
                    channel.client.user.id &&
                message.embeds.some(
                    embed =>
                        embed.author?.name ===
                        'Umbra Core Health Monitor'
                )
        ) ||
        null;

    if (existingDashboard) {
        dashboardMessageId =
            existingDashboard.id;
    }

    return existingDashboard;
}

/**
 * Create or update the live
 * Umbra Health Dashboard.
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

        const dashboardEmbed =
            buildDashboardEmbed(
                client,
                snapshot
            );

        const existingDashboard =
            await findDashboardMessage(
                channel
            );

        if (existingDashboard) {
            await existingDashboard.edit({
                embeds: [
                    dashboardEmbed
                ],

                allowedMentions: {
                    parse:
                        []
                }
            });

            return true;
        }

        const newDashboardMessage =
            await channel.send({
                embeds: [
                    dashboardEmbed
                ],

                allowedMentions: {
                    parse:
                        []
                }
            });

        dashboardMessageId =
            newDashboardMessage.id;

        return true;
    } catch (error) {
        console.error(
            '❌ Umbra Health Dashboard update failed:'
        );

        console.error(
            error
        );

        return false;
    }
}

/**
 * Start the live Umbra Health
 * Dashboard refresh cycle.
 *
 * The first update establishes the
 * health baseline. Every later update
 * may publish alerts when state changes.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<boolean>}
 */
async function startTerminalDashboard(
    client
) {
    if (
        !client ||
        !client.isReady()
    ) {
        console.warn(
            '⚠️ Umbra Health Dashboard could not start because the client is not ready.'
        );

        return false;
    }

    if (dashboardInterval) {
        clearInterval(
            dashboardInterval
        );

        dashboardInterval =
            null;
    }

    previousHealthSnapshot =
        null;

    const initialUpdate =
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

    /*
     * Allow Node.js to exit naturally
     * during shutdown.
     */
    dashboardInterval.unref?.();

    return initialUpdate;
}

/**
 * Stop the live Umbra Health
 * Dashboard refresh cycle.
 *
 * @returns {void}
 */
function stopTerminalDashboard() {
    if (dashboardInterval) {
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
 * Return the current Dashboard
 * refresh interval.
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
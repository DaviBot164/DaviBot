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

/**
 * Health Dashboard refresh interval.
 */
const DASHBOARD_REFRESH_INTERVAL =
    60_000;

/**
 * Stored dashboard message reference.
 */
let dashboardMessageId =
    null;

/**
 * Active dashboard interval.
 */
let dashboardInterval =
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
 * Determine overall Umbra system health.
 *
 * @param {Object} health
 * @param {boolean} health.gatewayConnected
 * @param {boolean} health.databaseConnected
 * @param {number} health.gatewayPing
 * @returns {{
 *     label: string,
 *     emoji: string,
 *     color: string,
 *     message: string
 * }}
 */
function getOverallHealth({
    gatewayConnected,
    databaseConnected,
    gatewayPing
}) {
    if (
        !gatewayConnected ||
        !databaseConnected
    ) {
        return {
            label:
                'CRITICAL',

            emoji:
                '🔴',

            color:
                '#ED4245',

            message:
                'One or more critical systems are unavailable.'
        };
    }

    if (
        gatewayPing >
        500
    ) {
        return {
            label:
                'DEGRADED',

            emoji:
                '🟡',

            color:
                '#FEE75C',

            message:
                'Umbra is operational, but performance degradation was detected.'
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
 * Build the live Umbra Health Dashboard.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<EmbedBuilder>}
 */
async function buildDashboardEmbed(
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
            gatewayPing
        });

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
                `\u001b[2;35mUMBRA CORE DIAGNOSTICS\u001b[0m`,
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
                            databaseHealth.connected
                                ? '`CONNECTED`'
                                : '`DISCONNECTED`'
                        }`,
                        `**Latency:** ${
                            databaseHealth.latency !==
                            null
                                ? `\`${databaseHealth.latency} ms\``
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

        const dashboardEmbed =
            await buildDashboardEmbed(
                client
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
 * The Dashboard updates the same message
 * every 60 seconds.
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
    if (!dashboardInterval) {
        return;
    }

    clearInterval(
        dashboardInterval
    );

    dashboardInterval =
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
    formatBytes,
    getDatabaseHealth,
    buildDashboardEmbed,
    updateTerminalDashboard,
    startTerminalDashboard,
    stopTerminalDashboard,
    getDashboardRefreshInterval
};
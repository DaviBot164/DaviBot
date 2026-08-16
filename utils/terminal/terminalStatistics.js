const os =
    require('node:os');

const {
    version: discordJsVersion
} = require('discord.js');

const packageInformation =
    require('../../package.json');

const {
    query
} = require('../../database/connection');

/**
 * Evelynn process boot timestamp.
 *
 * This remains fixed until the current
 * Node.js process is restarted.
 */
const PROCESS_BOOT_TIMESTAMP =
    Math.floor(
        (
            Date.now() -
            process.uptime() *
            1_000
        ) /
        1_000
    );

/**
 * Safely convert a database value
 * into a finite number.
 *
 * @param {unknown} value
 * @returns {number}
 */
function toSafeNumber(
    value
) {
    const number =
        Number(
            value
        );

    return Number.isFinite(
        number
    )
        ? number
        : 0;
}

/**
 * Return all Guild IDs currently
 * connected to Evelynn.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {string[]}
 */
function getConnectedGuildIds(
    client
) {
    return Array.from(
        client.guilds.cache.keys()
    );
}

/**
 * Count records created today across
 * Evelynn's currently connected servers.
 *
 * @param {string} tableName
 * @param {string[]} guildIds
 * @returns {Promise<number>}
 */
async function countTodayRecords(
    tableName,
    guildIds
) {
    if (
        guildIds.length ===
        0
    ) {
        return 0;
    }

    /*
     * tableName is supplied internally
     * and never comes from user input.
     */
    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER AS count
                FROM ${tableName}
                WHERE guild_id =
                    ANY($1::TEXT[])
                  AND created_at >=
                    DATE_TRUNC(
                        'day',
                        NOW()
                    );
            `,
            [
                guildIds
            ]
        );

    return toSafeNumber(
        result.rows[0]?.count
    );
}

/**
 * Count active records in a table.
 *
 * @param {'events'|'giveaways'} tableName
 * @param {string[]} guildIds
 * @returns {Promise<number>}
 */
async function countActiveRecords(
    tableName,
    guildIds
) {
    if (
        guildIds.length ===
        0
    ) {
        return 0;
    }

    const result =
        await query(
            `
                SELECT
                    COUNT(*)::INTEGER AS count
                FROM ${tableName}
                WHERE guild_id =
                    ANY($1::TEXT[])
                  AND status =
                    'Active';
            `,
            [
                guildIds
            ]
        );

    return toSafeNumber(
        result.rows[0]?.count
    );
}

/**
 * Count all cached Discord channels
 * across Evelynn's connected servers.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {number}
 */
function countChannels(
    client
) {
    return client.guilds.cache.reduce(
        (
            total,
            guild
        ) =>
            total +
            guild.channels.cache.size,

        0
    );
}

/**
 * Count all cached Discord roles
 * across Evelynn's connected servers.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {number}
 */
function countRoles(
    client
) {
    return client.guilds.cache.reduce(
        (
            total,
            guild
        ) =>
            total +
            guild.roles.cache.size,

        0
    );
}

/**
 * Count all known members across
 * Evelynn's connected servers.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {number}
 */
function countMembers(
    client
) {
    return client.guilds.cache.reduce(
        (
            total,
            guild
        ) =>
            total +
            guild.memberCount,

        0
    );
}

/**
 * Return the current process
 * memory percentage.
 *
 * This compares RSS memory with the
 * total memory visible to Node.js.
 *
 * @returns {number}
 */
function getMemoryPercentage() {
    const totalMemory =
        os.totalmem();

    if (
        !Number.isFinite(
            totalMemory
        ) ||
        totalMemory <= 0
    ) {
        return 0;
    }

    const rss =
        process.memoryUsage().rss;

    return Math.min(
        100,
        Math.max(
            0,
            (
                rss /
                totalMemory
            ) *
            100
        )
    );
}

/**
 * Collect database activity statistics.
 *
 * A failed individual query does not break
 * the entire Health Dashboard.
 *
 * @param {string[]} guildIds
 * @returns {Promise<{
 *     warningsToday: number,
 *     automodCasesToday: number,
 *     activeEvents: number,
 *     activeGiveaways: number
 * }>}
 */
async function collectDatabaseStatistics(
    guildIds
) {
    const results =
        await Promise.allSettled([
            countTodayRecords(
                'warnings',
                guildIds
            ),

            countTodayRecords(
                'automod_cases',
                guildIds
            ),

            countActiveRecords(
                'events',
                guildIds
            ),

            countActiveRecords(
                'giveaways',
                guildIds
            )
        ]);

    const getResultValue =
        index =>
            results[index].status ===
                'fulfilled'
                ? results[index].value
                : 0;

    results.forEach(
        result => {
            if (
                result.status ===
                'rejected'
            ) {
                console.warn(
                    '⚠️ Evelynn Terminal statistics query failed:'
                );

                console.warn(
                    result.reason
                );
            }
        }
    );

    return {
        warningsToday:
            getResultValue(
                0
            ),

        automodCasesToday:
            getResultValue(
                1
            ),

        activeEvents:
            getResultValue(
                2
            ),

        activeGiveaways:
            getResultValue(
                3
            )
    };
}/**
 * Collect one complete Evelynn
 * statistics snapshot.
 *
 * @param {import('discord.js').Client<true>} client
 * @returns {Promise<{
 *     guildCount: number,
 *     memberCount: number,
 *     channelCount: number,
 *     roleCount: number,
 *     commandCount: number,
 *     warningsToday: number,
 *     automodCasesToday: number,
 *     activeEvents: number,
 *     activeGiveaways: number,
 *     memoryPercentage: number,
 *     nodeVersion: string,
 *     discordJsVersion: string,
 *     botVersion: string,
 *     environment: string,
 *     platform: string,
 *     processId: number,
 *     processBootTimestamp: number,
 *     collectedAt: number
 * }>}
 */
async function collectTerminalStatistics(
    client
) {
    const guildIds =
        getConnectedGuildIds(
            client
        );

    const databaseStatistics =
        await collectDatabaseStatistics(
            guildIds
        );

    const guildCount =
        client.guilds.cache.size;

    const memberCount =
        countMembers(
            client
        );

    const channelCount =
        countChannels(
            client
        );

    const roleCount =
        countRoles(
            client
        );

    const commandCount =
        client.commands?.size ??
        0;

    const environment =
        process.env.NODE_ENV ||
        (
            process.env
                .NF_DAVIBOT_DATABASE_POSTGRES_URI
                ? 'production'
                : 'development'
        );

    return {
        guildCount,
        memberCount,
        channelCount,
        roleCount,
        commandCount,

        warningsToday:
            databaseStatistics
                .warningsToday,

        automodCasesToday:
            databaseStatistics
                .automodCasesToday,

        activeEvents:
            databaseStatistics
                .activeEvents,

        activeGiveaways:
            databaseStatistics
                .activeGiveaways,

        memoryPercentage:
            getMemoryPercentage(),

        nodeVersion:
            process.version,

        discordJsVersion,

        botVersion:
            packageInformation.version ||
            'Unknown',

        environment,

        platform:
            `${process.platform} ${process.arch}`,

        processId:
            process.pid,

        processBootTimestamp:
            PROCESS_BOOT_TIMESTAMP,

        collectedAt:
            Math.floor(
                Date.now() /
                1_000
            )
    };
}

/**
 * Convert the statistics snapshot into
 * Discord Embed fields.
 *
 * @param {Awaited<ReturnType<typeof collectTerminalStatistics>>} statistics
 * @returns {Array<{
 *     name: string,
 *     value: string,
 *     inline: boolean
 * }>}
 */
function createStatisticsFields(
    statistics
) {
    return [
        {
            name:
                '📊 Kingdom Overview',

            value:
                [
                    `**Servers:** \`${statistics.guildCount}\``,
                    `**Souls:** \`${statistics.memberCount}\``,
                    `**Channels:** \`${statistics.channelCount}\``,
                    `**Roles:** \`${statistics.roleCount}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🛡️ Guardian Activity',

            value:
                [
                    `**AutoMod Cases Today:** \`${statistics.automodCasesToday}\``,
                    `**Warnings Today:** \`${statistics.warningsToday}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎉 Live Activities',

            value:
                [
                    `**Active Events:** \`${statistics.activeEvents}\``,
                    `**Active Giveaways:** \`${statistics.activeGiveaways}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚙️ Evelynn Runtime',

            value:
                [
                    `**Commands:** \`${statistics.commandCount}\``,
                    `**Bot Version:** \`v${statistics.botVersion}\``,
                    `**Environment:** \`${statistics.environment.toUpperCase()}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧩 Core Versions',

            value:
                [
                    `**Node.js:** \`${statistics.nodeVersion}\``,
                    `**discord.js:** \`v${statistics.discordJsVersion}\``,
                    `**Platform:** \`${statistics.platform}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧠 Resource Snapshot',

            value:
                [
                    `**Memory Share:** \`${statistics.memoryPercentage.toFixed(2)}%\``,
                    `**Process ID:** \`${statistics.processId}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🚀 Current Deployment',

            value:
                [
                    `**Booted:** <t:${statistics.processBootTimestamp}:F>`,
                    `**Booted:** <t:${statistics.processBootTimestamp}:R>`,
                    `**Updated:** <t:${statistics.collectedAt}:R>`
                ].join('\n'),

            inline:
                false
        }
    ];
}

module.exports = {
    PROCESS_BOOT_TIMESTAMP,

    toSafeNumber,
    getConnectedGuildIds,
    countTodayRecords,
    countActiveRecords,
    countChannels,
    countRoles,
    countMembers,
    getMemoryPercentage,
    collectDatabaseStatistics,
    collectTerminalStatistics,
    createStatisticsFields
};
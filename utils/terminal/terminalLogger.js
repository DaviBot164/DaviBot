const {
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

/**
 * Official Evelynn Terminal channel.
 */
const TERMINAL_CHANNEL_ID =
    '1530901956342710302';

/**
 * Terminal event types.
 */
const TERMINAL_LEVELS = {
    info: {
        color:
            '#6F42C1',

        emoji:
            '💻',

        label:
            'SYSTEM'
    },

    success: {
        color:
            '#57F287',

        emoji:
            '✅',

        label:
            'SUCCESS'
    },

    warning: {
        color:
            '#FEE75C',

        emoji:
            '⚠️',

        label:
            'WARNING'
    },

    error: {
        color:
            '#ED4245',

        emoji:
            '❌',

        label:
            'ERROR'
    }
};

/**
 * Convert milliseconds into
 * readable uptime text.
 *
 * @param {number} milliseconds
 * @returns {string}
 */
function formatUptime(
    milliseconds
) {
    const totalSeconds =
        Math.floor(
            milliseconds /
            1_000
        );

    const days =
        Math.floor(
            totalSeconds /
            86_400
        );

    const hours =
        Math.floor(
            (
                totalSeconds %
                86_400
            ) /
            3_600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds %
                3_600
            ) /
            60
        );

    const seconds =
        totalSeconds %
        60;

    const parts =
        [];

    if (days > 0) {
        parts.push(
            `${days}d`
        );
    }

    if (
        hours > 0 ||
        days > 0
    ) {
        parts.push(
            `${hours}h`
        );
    }

    if (
        minutes > 0 ||
        hours > 0 ||
        days > 0
    ) {
        parts.push(
            `${minutes}m`
        );
    }

    parts.push(
        `${seconds}s`
    );

    return parts.join(' ');
}

/**
 * Find and validate the Evelynn
 * Terminal channel.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getTerminalChannel(
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
            `⚠️ Evelynn Terminal channel ID "${TERMINAL_CHANNEL_ID}" was not found or is not a valid text channel.`
        );

        return null;
    }

    const botMember =
        channel.guild.members.me;

    if (!botMember) {
        console.warn(
            '⚠️ Evelynn could not access its GuildMember record for the Terminal channel.'
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
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        console.warn(
            '⚠️ Evelynn is missing Terminal channel permissions: View Channel, Send Messages or Embed Links.'
        );

        return null;
    }

    return channel;
}

/**
 * Build one Evelynn Terminal Embed.
 *
 * @param {Object} options
 * @param {'info'|'success'|'warning'|'error'} options.level
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<{
 *     name: string,
 *     value: string,
 *     inline?: boolean
 * }>} options.fields
 * @param {import('discord.js').Client} options.client
 * @returns {EmbedBuilder}
 */
function buildTerminalEmbed({
    level,
    title,
    message,
    fields,
    client
}) {
    const terminalLevel =
        TERMINAL_LEVELS[level] ||
        TERMINAL_LEVELS.info;

    const now =
        Math.floor(
            Date.now() /
            1_000
        );

    const uptime =
        formatUptime(
            process.uptime() *
            1_000
        );

    const embed =
        new EmbedBuilder()
            .setColor(
                terminalLevel.color
            )
            .setAuthor({
                name:
                    'Evelynn Core Terminal',

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
                `${terminalLevel.emoji} ${title}`
            )
            .setDescription(
                [
                    '```ansi',
                    `\u001b[2;35m[${terminalLevel.label}]\u001b[0m ${message}`,
                    '```'
                ].join('\n')
            )
            .addFields(
                {
                    name:
                        '🕒 Terminal Time',

                    value:
                        `<t:${now}:F>\n<t:${now}:R>`,

                    inline:
                        true
                },
                {
                    name:
                        '⏱️ Process Uptime',

                    value:
                        `\`${uptime}\``,

                    inline:
                        true
                }
            )
            .setFooter({
                text:
                    'Evelynn • Guardian of THE Ⅹ SINS'
            })
            .setTimestamp();

    if (
        Array.isArray(
            fields
        ) &&
        fields.length >
            0
    ) {
        embed.addFields(
            fields
        );
    }

    return embed;
}

/**
 * Publish one event inside
 * Evelynn Core Terminal.
 *
 * This function never throws into the
 * calling system. Terminal failures are
 * logged locally instead.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} options
 * @param {'info'|'success'|'warning'|'error'} [options.level]
 * @param {string} options.title
 * @param {string} options.message
 * @param {Array<{
 *     name: string,
 *     value: string,
 *     inline?: boolean
 * }>} [options.fields]
 * @returns {Promise<boolean>}
 */
async function logTerminal(
    client,
    {
        level =
            'info',

        title,
        message,
        fields =
            []
    }
) {
    try {
        if (
            !client ||
            !client.isReady()
        ) {
            console.warn(
                '⚠️ Evelynn Terminal log skipped because the Discord client is not ready.'
            );

            return false;
        }

        if (
            typeof title !==
                'string' ||
            title.trim()
                .length ===
                0
        ) {
            console.warn(
                '⚠️ Evelynn Terminal log skipped because no title was provided.'
            );

            return false;
        }

        if (
            typeof message !==
                'string' ||
            message.trim()
                .length ===
                0
        ) {
            console.warn(
                '⚠️ Evelynn Terminal log skipped because no message was provided.'
            );

            return false;
        }

        const channel =
            await getTerminalChannel(
                client
            );

        if (!channel) {
            return false;
        }

        const embed =
            buildTerminalEmbed({
                level,

                title:
                    title.trim(),

                message:
                    message.trim(),

                fields,

                client
            });

        await channel.send({
            embeds: [
                embed
            ],

            allowedMentions: {
                parse:
                    []
            }
        });

        return true;
    } catch (error) {
        console.error(
            '❌ Evelynn Terminal logger failed:'
        );

        console.error(
            error
        );

        return false;
    }
}

module.exports = {
    TERMINAL_CHANNEL_ID,
    formatUptime,
    logTerminal
};
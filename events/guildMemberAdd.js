const {
    Events,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const path =
    require('path');

const {
    WELCOME_BANNER_NAME,
    createWelcomeEmbed
} = require('../utils/welcomeEmbed');

const automodConfig =
    require('../config/automod');

const {
    addRaidCase,
    addMemberToRaidCase,
    closeRaidCase
} = require('../database/raidCases');

/**
 * Recent member joins for each guild.
 *
 * Key:
 * guildId
 *
 * Value:
 * Array of:
 * {
 *   memberId: string,
 *   joinedAt: number
 * }
 */
const recentJoins =
    new Map();

/**
 * Currently active Raid Mode data.
 *
 * Key:
 * guildId
 *
 * Value:
 * {
 *   caseId: string|number|null,
 *   startedAt: number,
 *   endsAt: number,
 *   memberIds: Set<string>
 * }
 */
const activeRaids =
    new Map();

/**
 * Find the moderation log channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findLogChannel(
    guild
) {
    if (
        automodConfig.logChannelId
    ) {
        const channelById =
            guild.channels.cache.get(
                automodConfig.logChannelId
            );

        if (
            channelById &&
            channelById.isTextBased()
        ) {
            return channelById;
        }
    }

    const channelByName =
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                channel.name ===
                    automodConfig
                        .logChannelName
        );

    return (
        channelByName ??
        null
    );
}

/**
 * Format milliseconds into readable text.
 *
 * @param {number} durationMilliseconds
 * @returns {string}
 */
function formatDuration(
    durationMilliseconds
) {
    const totalSeconds =
        Math.floor(
            durationMilliseconds /
            1_000
        );

    const minutes =
        Math.floor(
            totalSeconds /
            60
        );

    const seconds =
        totalSeconds %
        60;

    const parts = [];

    if (
        minutes >
        0
    ) {
        parts.push(
            `${minutes} minute${minutes === 1 ? '' : 's'}`
        );
    }

    if (
        seconds >
        0
    ) {
        parts.push(
            `${seconds} second${seconds === 1 ? '' : 's'}`
        );
    }

    return (
        parts.join(', ') ||
        '0 seconds'
    );
}

/**
 * Convert a timestamp into Discord
 * timestamp syntax.
 *
 * @param {number} timestamp
 * @returns {string}
 */
function formatDiscordTimestamp(
    timestamp
) {
    const unixTimestamp =
        Math.floor(
            timestamp /
            1_000
        );

    return (
        `<t:${unixTimestamp}:F>\n` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Send Raid detected log.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object|null} savedRaidCase
 * @param {Array<string>} memberIds
 * @returns {Promise<void>}
 */
async function sendRaidDetectedLog(
    guild,
    savedRaidCase,
    memberIds
) {
    const logChannel =
        findLogChannel(
            guild
        );

    if (!logChannel) {
        console.warn(
            `⚠️ Raid log channel was not found in ${guild.name}.`
        );

        return;
    }

    const antiRaid =
        automodConfig.antiRaid;

    const raidCaseId =
        savedRaidCase?.id
            ? `#${savedRaidCase.id}`
            : 'Database error';

    const memberList =
        memberIds
            .slice(
                0,
                10
            )
            .map(
                memberId =>
                    `<@${memberId}>`
            )
            .join(
                '\n'
            );

    const endsAt =
        Date.now() +
        antiRaid
            .raidModeDurationMilliseconds;

    const embed =
        new EmbedBuilder()
            .setColor(
                '#FF0000'
            )

            .setAuthor({
                name:
                    'Umbra Raid Shield',

                iconURL:
                    guild.client.user
                        .displayAvatarURL({
                            extension:
                                'png',

                            size:
                                256
                        })
            })

            .setTitle(
                '🚨 RAID DETECTED'
            )

            .setDescription(
                [
                    'Umbra detected an unusual number of member joins.',
                    '',
                    '🔴 **Raid Mode has been activated.**'
                ].join(
                    '\n'
                )
            )

            .addFields(
                {
                    name:
                        '🆔 Raid Case',

                    value:
                        savedRaidCase?.id
                            ? `\`${savedRaidCase.id}\``
                            : '`Database error`',

                    inline:
                        true
                },
                {
                    name:
                        '👥 Detected Joins',

                    value:
                        `\`${memberIds.length}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🚧 Status',

                    value:
                        '`ACTIVE`',

                    inline:
                        true
                },
                {
                    name:
                        '📊 Detection Rule',

                    value:
                        `**${antiRaid.joinLimit} joins** within ` +
                        `**${formatDuration(
                            antiRaid
                                .joinIntervalMilliseconds
                        )}**`,

                    inline:
                        false
                },
                {
                    name:
                        '⏳ Raid Mode Duration',

                    value:
                        formatDuration(
                            antiRaid
                                .raidModeDurationMilliseconds
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '🕒 Expected End',

                    value:
                        formatDiscordTimestamp(
                            endsAt
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '👤 Detected Members',

                    value:
                        memberList ||
                        'No member IDs stored.',

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Current Protection',

                    value:
                        [
                            '✅ Raid activity is being recorded',
                            '✅ New joins are being added to this Raid Case',
                            '✅ Moderation logs are active',
                            'ℹ️ Automatic channel lockdown is currently disabled'
                        ].join(
                            '\n'
                        ),

                    inline:
                        false
                }
            )

            .setFooter({
                text:
                    `Umbra Raid Shield • Case ${raidCaseId}`
            })

            .setTimestamp();

    try {
        await logChannel.send({
            embeds:
                [embed]
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Raid detected log:'
        );

        console.error(
            error
        );
    }
}/**
 * Send Raid Mode ended log.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} raidData
 * @returns {Promise<void>}
 */
async function sendRaidEndedLog(
    guild,
    raidData
) {
    const logChannel =
        findLogChannel(
            guild
        );

    if (!logChannel) {
        return;
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                '#2ECC71'
            )

            .setAuthor({
                name:
                    'Umbra Raid Shield',

                iconURL:
                    guild.client.user
                        .displayAvatarURL({
                            extension:
                                'png',

                            size:
                                256
                        })
            })

            .setTitle(
                '✅ Raid Mode Ended'
            )

            .setDescription(
                'The Raid Mode monitoring period has ended.'
            )

            .addFields(
                {
                    name:
                        '🆔 Raid Case',

                    value:
                        raidData.caseId
                            ? `\`${raidData.caseId}\``
                            : '`Not stored`',

                    inline:
                        true
                },
                {
                    name:
                        '👥 Recorded Members',

                    value:
                        `\`${raidData.memberIds.size}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🚧 Status',

                    value:
                        '`CLOSED`',

                    inline:
                        true
                }
            )

            .setFooter({
                text:
                    'Umbra Raid Shield'
            })

            .setTimestamp();

    try {
        await logChannel.send({
            embeds:
                [embed]
        });
    } catch (error) {
        console.error(
            '❌ Failed to send Raid ended log:'
        );

        console.error(
            error
        );
    }
}

/**
 * End Raid Mode for a guild.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<void>}
 */
async function endRaidMode(
    guild
) {
    const raidData =
        activeRaids.get(
            guild.id
        );

    if (!raidData) {
        return;
    }

    activeRaids.delete(
        guild.id
    );

    recentJoins.delete(
        guild.id
    );

    if (
        raidData.caseId
    ) {
        try {
            await closeRaidCase(
                raidData.caseId
            );

            console.log(
                `✅ Raid Case #${raidData.caseId} closed in ${guild.name}.`
            );
        } catch (error) {
            console.error(
                `❌ Failed to close Raid Case #${raidData.caseId}:`
            );

            console.error(
                error
            );
        }
    }

    await sendRaidEndedLog(
        guild,
        raidData
    );

    console.log(
        `🟢 Raid Mode ended in ${guild.name}.`
    );
}

/**
 * Activate Raid Mode.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Array<string>} memberIds
 * @returns {Promise<void>}
 */
async function activateRaidMode(
    guild,
    memberIds
) {
    const existingRaid =
        activeRaids.get(
            guild.id
        );

    if (existingRaid) {
        return;
    }

    const antiRaid =
        automodConfig.antiRaid;

    let savedRaidCase =
        null;

    try {
        savedRaidCase =
            await addRaidCase({
                guildId:
                    guild.id,

                joinCount:
                    memberIds.length,

                joinLimit:
                    antiRaid.joinLimit,

                detectionWindowMilliseconds:
                    antiRaid
                        .joinIntervalMilliseconds,

                raidModeDurationMilliseconds:
                    antiRaid
                        .raidModeDurationMilliseconds,

                memberIds
            });

        console.log(
            `🚨 Raid Case #${savedRaidCase.id} created in ${guild.name}.`
        );
    } catch (error) {
        console.error(
            `❌ Failed to save Raid Case in ${guild.name}:`
        );

        console.error(
            error
        );
    }

    const raidData = {
        caseId:
            savedRaidCase?.id ??
            null,

        startedAt:
            Date.now(),

        endsAt:
            Date.now() +
            antiRaid
                .raidModeDurationMilliseconds,

        memberIds:
            new Set(
                memberIds
            )
    };

    activeRaids.set(
        guild.id,
        raidData
    );

    console.log(
        '======================================'
    );

    console.log(
        `🚨 RAID DETECTED: ${guild.name}`
    );

    console.log(
        `👥 Joins: ${memberIds.length}`
    );

    console.log(
        `⏳ Raid Mode: ${formatDuration(
            antiRaid
                .raidModeDurationMilliseconds
        )}`
    );

    console.log(
        '======================================'
    );

    await sendRaidDetectedLog(
        guild,
        savedRaidCase,
        memberIds
    );

    const raidTimer =
        setTimeout(
            () => {
                endRaidMode(
                    guild
                ).catch(
                    error => {
                        console.error(
                            '❌ Failed to end Raid Mode:'
                        );

                        console.error(
                            error
                        );
                    }
                );
            },

            antiRaid
                .raidModeDurationMilliseconds
        );

    if (
        typeof raidTimer.unref ===
        'function'
    ) {
        raidTimer.unref();
    }
}

/**
 * Record a member join and detect raid activity.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<void>}
 */
async function processRaidDetection(
    member
) {
    const antiRaid =
        automodConfig.antiRaid;

    if (
        !antiRaid ||
        !antiRaid.enabled
    ) {
        return;
    }

    const guildId =
        member.guild.id;

    const currentRaid =
        activeRaids.get(
            guildId
        );

    /*
     * A Raid Mode is already active.
     * Add this new member to the existing case.
     */
    if (currentRaid) {
        if (
            !currentRaid.memberIds.has(
                member.id
            )
        ) {
            currentRaid.memberIds.add(
                member.id
            );

            activeRaids.set(
                guildId,
                currentRaid
            );

            if (
                currentRaid.caseId
            ) {
                try {
                    await addMemberToRaidCase(
                        currentRaid.caseId,
                        member.id
                    );
                } catch (error) {
                    console.error(
                        `❌ Failed to add ${member.user.tag} to Raid Case #${currentRaid.caseId}:`
                    );

                    console.error(
                        error
                    );
                }
            }
        }

        console.log(
            `🔴 Raid Mode join recorded: ${member.user.tag}`
        );

        return;
    }

    const now =
        Date.now();

    const minimumTimestamp =
        now -
        antiRaid
            .joinIntervalMilliseconds;

    const previousJoins =
        recentJoins.get(
            guildId
        ) ??
        [];

    const activeJoins =
        previousJoins.filter(
            join =>
                join.joinedAt >=
                minimumTimestamp
        );

    activeJoins.push({
        memberId:
            member.id,

        joinedAt:
            now
    });

    recentJoins.set(
        guildId,
        activeJoins
    );

    console.log(
        `🛡️ Raid Shield: ${activeJoins.length}/${antiRaid.joinLimit} recent joins in ${member.guild.name}.`
    );

    if (
        activeJoins.length >=
        antiRaid.joinLimit
    ) {
        const memberIds =
            activeJoins.map(
                join =>
                    join.memberId
            );

        await activateRaidMode(
            member.guild,
            memberIds
        );
    }
}/**
 * Send the Umbra Welcome message.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<void>}
 */
async function sendWelcomeMessage(
    member
) {
    try {
        const welcomeChannel =
            member.guild.channels.cache.find(
                channel =>
                    channel.isTextBased() &&
                    channel.name ===
                        '👋・welcome'
            );

        if (!welcomeChannel) {
            console.error(
                '❌ Welcome channel "👋・welcome" was not found.'
            );

            return;
        }

        const welcomeBannerPath =
            path.join(
                __dirname,
                '..',
                'assets',
                'images',
                WELCOME_BANNER_NAME
            );

        const welcomeBanner =
            new AttachmentBuilder(
                welcomeBannerPath,
                {
                    name:
                        WELCOME_BANNER_NAME
                }
            );

        const welcomeEmbed =
            createWelcomeEmbed(
                member
            );

        await welcomeChannel.send({
            content:
                `${member}`,

            embeds: [
                welcomeEmbed
            ],

            files: [
                welcomeBanner
            ],

            allowedMentions: {
                users: [
                    member.id
                ]
            }
        });

        console.log(
            `✅ Umbra welcomed ${member.user.tag} to ${member.guild.name}.`
        );

        console.log(
            `🖼️ Welcome banner attached: ${WELCOME_BANNER_NAME}`
        );
    } catch (error) {
        console.error(
            `❌ Failed to welcome ${member.user.tag}:`
        );

        console.error(
            error
        );
    }
}

module.exports = {
    name:
        Events.GuildMemberAdd,

    once:
        false,

    /**
     * Handle new server members.
     *
     * @param {import('discord.js').GuildMember} member
     * @returns {Promise<void>}
     */
    async execute(
        member
    ) {
        console.log(
            '======================================'
        );

        console.log(
            `👋 New Member Joined: ${member.user.tag}`
        );

        console.log(
            `🏰 Server: ${member.guild.name}`
        );

        console.log(
            '======================================'
        );

        /*
         * Raid detection and Welcome System
         * are separated so one failure does
         * not stop the other feature.
         */
        try {
            await processRaidDetection(
                member
            );
        } catch (error) {
            console.error(
                `❌ Raid Shield failed while processing ${member.user.tag}:`
            );

            console.error(
                error
            );
        }

        await sendWelcomeMessage(
            member
        );
    }
};

/**
 * Remove old join data from memory.
 */
const cleanupTimer =
    setInterval(
        () => {
            const antiRaid =
                automodConfig.antiRaid;

            if (!antiRaid) {
                return;
            }

            const now =
                Date.now();

            for (
                const [
                    guildId,
                    joins
                ]
                of recentJoins.entries()
            ) {
                const activeJoins =
                    joins.filter(
                        join =>
                            now -
                                join.joinedAt <
                            antiRaid.joinIntervalMilliseconds
                    );

                if (
                    activeJoins.length ===
                    0
                ) {
                    recentJoins.delete(
                        guildId
                    );
                } else {
                    recentJoins.set(
                        guildId,
                        activeJoins
                    );
                }
            }
        },

        60_000
    );

if (
    typeof cleanupTimer.unref ===
    'function'
) {
    cleanupTimer.unref();
}
const {
    Events,
    EmbedBuilder,
    AttachmentBuilder,
    PermissionFlagsBits
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

const WELCOME_CHANNEL_ID =
    '1528401903438925906';

const recentJoins =
    new Map();

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
        const channel =
            guild.channels.cache.get(
                automodConfig.logChannelId
            );

        if (
            channel?.isTextBased()
        ) {
            return channel;
        }
    }

    return (
        guild.channels.cache.find(
            channel =>
                channel.isTextBased() &&
                channel.name ===
                    automodConfig.logChannelName
        ) ||
        null
    );
}

/**
 * Format milliseconds.
 *
 * @param {number} milliseconds
 * @returns {string}
 */
function formatDuration(
    milliseconds
) {
    const totalSeconds =
        Math.floor(
            milliseconds /
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

    const parts =
        [];

    if (
        minutes >
        0
    ) {
        parts.push(
            `${minutes}m`
        );
    }

    if (
        seconds >
        0
    ) {
        parts.push(
            `${seconds}s`
        );
    }

    return (
        parts.join(' ') ||
        '0s'
    );
}

/**
 * Send Raid Mode activation log.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object|null} savedRaidCase
 * @param {string[]} memberIds
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

    if (
        !logChannel
    ) {
        return;
    }

    const antiRaid =
        automodConfig.antiRaid;

    const endsAt =
        Math.floor(
            (
                Date.now() +
                antiRaid
                    .raidModeDurationMilliseconds
            ) /
            1_000
        );

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
            .join('\n');

    const embed =
        new EmbedBuilder()
            .setColor(
                '#D7263D'
            )
            .setAuthor({
                name:
                    'Evelynn • Raid Shield',

                iconURL:
                    guild.client.user
                        .displayAvatarURL({
                            size:
                                256,

                            forceStatic:
                                false
                        })
            })
            .setTitle(
                '🚨 Raid Detected'
            )
            .setDescription(
                'Unusual join activity triggered Raid Mode.'
            )
            .addFields(
                {
                    name:
                        '🆔・CASE',

                    value:
                        savedRaidCase?.id
                            ? `\`#${savedRaidCase.id}\``
                            : 'Unavailable',

                    inline:
                        true
                },

                {
                    name:
                        '👥・JOINS',

                    value:
                        `\`${memberIds.length}\``,

                    inline:
                        true
                },

                {
                    name:
                        '⏳・DURATION',

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
                        '📊・TRIGGER',

                    value:
                        `${antiRaid.joinLimit} joins within ${formatDuration(
                            antiRaid.joinIntervalMilliseconds
                        )}`,

                    inline:
                        false
                },

                {
                    name:
                        '🕒・ENDS',

                    value:
                        `<t:${endsAt}:R>`,

                    inline:
                        true
                },

                {
                    name:
                        '✦・MEMBERS',

                    value:
                        memberList ||
                        'None recorded.',

                    inline:
                        false
                }
            )
            .setFooter({
                text:
                    'TTS • Raid Shield'
            })
            .setTimestamp();

    try {
        await logChannel.send({
            embeds: [
                embed
            ]
        });
    } catch (error) {
        console.error(
            '❌ Raid alert failed:',
            error
        );
    }
}

/**
 * Send Raid Mode end log.
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

    if (
        !logChannel
    ) {
        return;
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                '#7CFC98'
            )
            .setAuthor({
                name:
                    'Evelynn • Raid Shield',

                iconURL:
                    guild.client.user
                        .displayAvatarURL({
                            size:
                                256,

                            forceStatic:
                                false
                        })
            })
            .setTitle(
                '✅ Raid Mode Ended'
            )
            .setDescription(
                'Join monitoring returned to normal.'
            )
            .addFields(
                {
                    name:
                        '🆔・CASE',

                    value:
                        raidData.caseId
                            ? `\`#${raidData.caseId}\``
                            : 'Unknown',

                    inline:
                        true
                },

                {
                    name:
                        '👥・MEMBERS',

                    value:
                        `\`${raidData.memberIds.size}\``,

                    inline:
                        true
                }
            )
            .setFooter({
                text:
                    'TTS • Raid Shield'
            })
            .setTimestamp();

    try {
        await logChannel.send({
            embeds: [
                embed
            ]
        });
    } catch (error) {
        console.error(
            '❌ Raid end log failed:',
            error
        );
    }
}/**
 * End Raid Mode.
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

    if (
        !raidData
    ) {
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
        } catch (error) {
            console.error(
                `❌ Failed to close Raid Case #${raidData.caseId}:`,
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
 * @param {string[]} memberIds
 * @returns {Promise<void>}
 */
async function activateRaidMode(
    guild,
    memberIds
) {
    if (
        activeRaids.has(
            guild.id
        )
    ) {
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
    } catch (error) {
        console.error(
            `❌ Failed to save Raid Case in ${guild.name}:`,
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
        `🚨 Raid detected in ${guild.name} • ${memberIds.length} joins`
    );

    await sendRaidDetectedLog(
        guild,
        savedRaidCase,
        memberIds
    );

    const raidTimer =
        setTimeout(
            () => {
                void endRaidMode(
                    guild
                ).catch(
                    error => {
                        console.error(
                            '❌ Failed to end Raid Mode:',
                            error
                        );
                    }
                );
            },

            antiRaid
                .raidModeDurationMilliseconds
        );

    raidTimer.unref?.();
}

/**
 * Record one member join
 * and detect raid activity.
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
        !antiRaid?.enabled
    ) {
        return;
    }

    const guildId =
        member.guild.id;

    const currentRaid =
        activeRaids.get(
            guildId
        );

    if (
        currentRaid
    ) {
        if (
            !currentRaid.memberIds.has(
                member.id
            )
        ) {
            currentRaid.memberIds.add(
                member.id
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
                        `❌ Failed to add ${member.user.tag} to Raid Case #${currentRaid.caseId}:`,
                        error
                    );
                }
            }
        }

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

    if (
        activeJoins.length >=
        antiRaid.joinLimit
    ) {
        await activateRaidMode(
            member.guild,
            activeJoins.map(
                join =>
                    join.memberId
            )
        );
    }
}

/**
 * Find the Welcome channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildTextBasedChannel|null}
 */
function findWelcomeChannel(
    guild
) {
    const channel =
        guild.channels.cache.get(
            WELCOME_CHANNEL_ID
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        return null;
    }

    return channel;
}

/**
 * Check Welcome permissions.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @returns {boolean}
 */
function canSendWelcomeMessage(
    channel
) {
    const botMember =
        channel?.guild?.members.me;

    if (
        !botMember
    ) {
        return false;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    return Boolean(
        permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles
        ])
    );
}

/**
 * Send the Welcome message.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<boolean>}
 */
async function sendWelcomeMessage(
    member
) {
    try {
        const welcomeChannel =
            findWelcomeChannel(
                member.guild
            );

        if (
            !welcomeChannel
        ) {
            console.error(
                `❌ Welcome channel not found in ${member.guild.name}.`
            );

            return false;
        }

        if (
            !canSendWelcomeMessage(
                welcomeChannel
            )
        ) {
            console.error(
                `❌ Evelynn cannot send Welcome messages in #${welcomeChannel.name}.`
            );

            return false;
        }

        const welcomeBannerPath =
            path.join(
                __dirname,
                '..',
                'assets',
                'images',
                WELCOME_BANNER_NAME
            );

        let welcomeBanner =
            null;

        try {
            welcomeBanner =
                new AttachmentBuilder(
                    welcomeBannerPath,
                    {
                        name:
                            WELCOME_BANNER_NAME
                    }
                );
        } catch (error) {
            console.error(
                `⚠️ Welcome banner unavailable: ${WELCOME_BANNER_NAME}`,
                error
            );
        }

        const payload = {
            content:
                `${member}`,

            embeds: [
                createWelcomeEmbed(
                    member
                )
            ],

            allowedMentions: {
                users: [
                    member.id
                ]
            }
        };

        if (
            welcomeBanner
        ) {
            payload.files = [
                welcomeBanner
            ];
        }

        await welcomeChannel.send(
            payload
        );

        console.log(
            `✅ Welcomed ${member.user.tag} to ${member.guild.name}.`
        );

        return true;
    } catch (error) {
        console.error(
            `❌ Welcome failed for ${member.user.tag}:`,
            error
        );

        return false;
    }
}module.exports = {
    name:
        Events.GuildMemberAdd,

    once:
        false,

    /**
     * Handle new server members.
     *
     * Raid detection and Welcome
     * run independently.
     *
     * @param {import('discord.js').GuildMember} member
     * @returns {Promise<void>}
     */
    async execute(
        member
    ) {
        console.log(
            `👋 Member joined: ${member.user.tag} • ${member.guild.name}`
        );

        let welcomeSent =
            false;

        try {
            await processRaidDetection(
                member
            );
        } catch (error) {
            console.error(
                `❌ Raid Shield failed for ${member.user.tag}:`,
                error
            );
        }

        try {
            welcomeSent =
                await sendWelcomeMessage(
                    member
                );
        } catch (error) {
            console.error(
                `❌ Welcome System failed for ${member.user.tag}:`,
                error
            );
        }

        console.log(
            `👋 Welcome: ${
                welcomeSent
                    ? 'Sent'
                    : 'Not Sent'
            } • Verification: Bloxlink`
        );
    }
};

/**
 * Remove expired join records
 * from memory.
 */
const cleanupTimer =
    setInterval(
        () => {
            const antiRaid =
                automodConfig.antiRaid;

            if (
                !antiRaid
            ) {
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
                            antiRaid
                                .joinIntervalMilliseconds
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

cleanupTimer.unref?.();
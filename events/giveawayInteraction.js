const {
    Events,
    MessageFlags,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    randomUUID
} = require('crypto');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const {
    giveaways:
        giveawayDatabase
} = require('../database');

/**
 * Official Las Noches Community Events channel.
 *
 * Events and Giveaways are published
 * inside the same shared activity channel.
 */
const GIVEAWAY_CHANNEL_ID =
    '1535755486505476147';

/**
 * Maximum supported Giveaway duration.
 *
 * 14 days.
 */
const MAX_GIVEAWAY_DURATION_MS =
    14 * 24 * 60 * 60 * 1000;

/**
 * Minimum supported Giveaway duration.
 *
 * 10 seconds is allowed for testing.
 */
const MIN_GIVEAWAY_DURATION_MS =
    10 * 1000;

/**
 * Prevent duplicate interaction execution.
 */
const processingInteractions =
    new Set();

/**
 * Store active timers for the current process.
 *
 * The Giveaway data itself is stored permanently
 * inside PostgreSQL.
 */
const giveawayTimers =
    new Map();

/**
 * Generate a short Giveaway ID.
 *
 * @returns {string}
 */
function createGiveawayId() {
    return randomUUID()
        .replaceAll('-', '')
        .slice(0, 10)
        .toLowerCase();
}

/**
 * Parse a Giveaway duration.
 *
 * Supported examples:
 * 10s, 30m, 2h, 1d
 *
 * @param {string} rawDuration
 * @returns {number|null}
 */
function parseDuration(
    rawDuration
) {
    const normalizedDuration =
        rawDuration
            ?.trim()
            .toLowerCase();

    if (!normalizedDuration) {
        return null;
    }

    const match =
        normalizedDuration.match(
            /^(\d+)\s*(s|m|h|d)$/
        );

    if (!match) {
        return null;
    }

    const amount =
        Number.parseInt(
            match[1],
            10
        );

    const unit =
        match[2];

    const unitMultipliers = {
        s:
            1000,

        m:
            60 * 1000,

        h:
            60 * 60 * 1000,

        d:
            24 * 60 * 60 * 1000
    };

    const durationMs =
        amount *
        unitMultipliers[unit];

    if (
        !Number.isSafeInteger(
            durationMs
        ) ||
        durationMs <
            MIN_GIVEAWAY_DURATION_MS ||
        durationMs >
            MAX_GIVEAWAY_DURATION_MS
    ) {
        return null;
    }

    return durationMs;
}

/**
 * Parse the number of Giveaway winners.
 *
 * @param {string} rawWinnerCount
 * @returns {number|null}
 */
function parseWinnerCount(
    rawWinnerCount
) {
    const normalizedValue =
        rawWinnerCount
            ?.trim();

    if (
        !normalizedValue ||
        !/^\d+$/.test(
            normalizedValue
        )
    ) {
        return null;
    }

    const winnerCount =
        Number.parseInt(
            normalizedValue,
            10
        );

    if (
        !Number.isInteger(
            winnerCount
        ) ||
        winnerCount < 1 ||
        winnerCount > 20
    ) {
        return null;
    }

    return winnerCount;
}

/**
 * Fetch the official Community Events channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function fetchGiveawayChannel(
    guild
) {
    const channel =
        await guild.channels
            .fetch(
                GIVEAWAY_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        return null;
    }

    return channel;
}

/**
 * Check whether Umbra can publish Giveaways.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember} botMember
 * @returns {boolean}
 */
function hasGiveawayPermissions(
    channel,
    botMember
) {
    const permissions =
        channel.permissionsFor(
            botMember
        );

    return Boolean(
        permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory
        ])
    );
}

/**
 * Build the main Giveaway embed.
 *
 * @param {Object} giveawayData
 * @param {import('discord.js').User} host
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildGiveawayEmbed(
    giveawayData,
    host
) {
    const participantCount =
        giveawayData.participants
            instanceof Set
            ? giveawayData
                .participants
                .size
            : 0;

    const endTimestamp =
        Math.floor(
            giveawayData.endsAt /
            1000
        );

    const statusConfig = {
        Active:
            '🟢 Active',

        Ended:
            '🏁 Ended',

        Cancelled:
            '🔴 Cancelled'
    };

    const statusDisplay =
        statusConfig[
            giveawayData.status
        ] ||
        giveawayData.status;

    const requirement =
        giveawayData.requirement ||
        'No special requirement.';

    const winnerDisplay =
        Array.isArray(
            giveawayData.winners
        ) &&
        giveawayData.winners.length > 0
            ? giveawayData.winners
                .map(
                    userId =>
                        `<@${userId}>`
                )
                .join(', ')
            : null;

    const descriptionLines = [
        giveawayData.description,
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        '🎁 **Prize**',
        giveawayData.prize,
        '',
        '🏆 **Number of Winners**',
        `\`${giveawayData.winnerCount}\``,
        '',
        '📜 **Entry Requirement**',
        requirement,
        '',
        '👥 **Entries**',
        `\`${participantCount}\``,
        '',
        '⏳ **Ends**',
        `<t:${endTimestamp}:F>`,
        `(<t:${endTimestamp}:R>)`,
        '',
        `👑 **Hosted By:** ${host}`,
        `📍 **Status:** ${statusDisplay}`,
        '',
        `🆔 **Giveaway ID:** \`${giveawayData.id}\``
    ];

    if (winnerDisplay) {
        descriptionLines.push(
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            '',
            '🏆 **Selected Winner(s)**',
            winnerDisplay
        );
    }

    descriptionLines.push(
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        giveawayData.status ===
        'Active'
            ? '*Enter beneath the crimson moon and test your fortune.*'
            : '*This Giveaway has officially ended.*'
    );

    return createEmbed({
        title:
            `🎁 ${giveawayData.prize}`,

        description:
            descriptionLines.join(
                '\n'
            ),

        thumbnail:
            host.displayAvatarURL({
                extension:
                    'png',

                size:
                    512,

                forceStatic:
                    false
            })
    });
}/**
 * Build Giveaway buttons.
 *
 * @param {Object} giveawayData
 * @returns {ActionRowBuilder}
 */
function buildGiveawayButtons(
    giveawayData
) {
    const giveawayClosed =
        giveawayData.status !==
        'Active';

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:join:${giveawayData.id}`
                )
                .setLabel(
                    giveawayClosed
                        ? 'Giveaway Ended'
                        : 'Enter Giveaway'
                )
                .setEmoji('🎉')
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(
                    giveawayClosed
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:leave:${giveawayData.id}`
                )
                .setLabel(
                    'Leave Giveaway'
                )
                .setEmoji('❌')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    giveawayClosed
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:giveaway:participants:${giveawayData.id}`
                )
                .setLabel(
                    'Entries'
                )
                .setEmoji('👥')
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

/**
 * Build the Giveaway entries embed.
 *
 * @param {Object} giveawayData
 * @param {string|null} thumbnail
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildParticipantsEmbed(
    giveawayData,
    thumbnail = null
) {
    const participantIds =
        giveawayData.participants
            instanceof Set
            ? Array.from(
                giveawayData.participants
            )
            : [];

    const visibleParticipants =
        participantIds.slice(
            0,
            50
        );

    const participantLines =
        visibleParticipants.map(
            (
                userId,
                index
            ) =>
                `${index + 1}. <@${userId}>`
        );

    if (
        participantIds.length > 50
    ) {
        participantLines.push(
            '',
            `…and ${participantIds.length - 50} more Souls.`
        );
    }

    const participantList =
        participantLines.length > 0
            ? participantLines.join(
                '\n'
            )
            : 'No Souls have entered this Giveaway yet.';

    return createEmbed({
        title:
            `👥 Giveaway Entries • ${giveawayData.prize}`,

        description:
            [
                `📜 **Total Entries:** \`${participantIds.length}\``,
                `🏆 **Winners:** \`${giveawayData.winnerCount}\``,
                `🆔 **Giveaway ID:** \`${giveawayData.id}\``,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                participantList
            ].join('\n'),

        thumbnail
    });
}

/**
 * Select random winners without duplicates.
 *
 * @param {Set<string>} participants
 * @param {number} requestedWinnerCount
 * @returns {string[]}
 */
function selectWinners(
    participants,
    requestedWinnerCount
) {
    const participantIds =
        Array.from(
            participants
        );

    const shuffledParticipants =
        [...participantIds];

    for (
        let index =
            shuffledParticipants.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex =
            Math.floor(
                Math.random() *
                (index + 1)
            );

        [
            shuffledParticipants[index],
            shuffledParticipants[randomIndex]
        ] = [
            shuffledParticipants[randomIndex],
            shuffledParticipants[index]
        ];
    }

    return shuffledParticipants.slice(
        0,
        Math.min(
            requestedWinnerCount,
            shuffledParticipants.length
        )
    );
}

/**
 * Fetch the original Giveaway message.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} giveawayData
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function fetchGiveawayMessage(
    client,
    giveawayData
) {
    const guild =
        await client.guilds
            .fetch(
                giveawayData.guildId
            )
            .catch(
                () => null
            );

    if (!guild) {
        return null;
    }

    const channel =
        await guild.channels
            .fetch(
                giveawayData.channelId
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        return null;
    }

    return channel.messages
        .fetch(
            giveawayData.messageId
        )
        .catch(
            () => null
        );
}

/**
 * End a Giveaway and save winners permanently.
 *
 * @param {import('discord.js').Client} client
 * @param {string} giveawayId
 * @param {string} guildId
 * @returns {Promise<void>}
 */
async function endGiveaway(
    client,
    giveawayId,
    guildId
) {
    let giveawayData =
        await giveawayDatabase
            .getGiveaway(
                giveawayId,
                guildId
            );

    if (
        !giveawayData ||
        giveawayData.status !==
            'Active'
    ) {
        return;
    }

    const winners =
        selectWinners(
            giveawayData.participants,
            giveawayData.winnerCount
        );

    await giveawayDatabase
        .saveGiveawayWinners(
            giveawayData.id,
            giveawayData.guildId,
            winners
        );

    giveawayData =
        await giveawayDatabase
            .updateGiveawayStatus(
                giveawayData.id,
                giveawayData.guildId,
                'Ended'
            );

    if (!giveawayData) {
        return;
    }

    const giveawayMessage =
        await fetchGiveawayMessage(
            client,
            giveawayData
        );

    const host =
        await client.users
            .fetch(
                giveawayData.hostId
            )
            .catch(
                () => client.user
            );

    if (giveawayMessage) {
        await giveawayMessage.edit({
            embeds: [
                buildGiveawayEmbed(
                    giveawayData,
                    host
                )
            ],

            components: [
                buildGiveawayButtons(
                    giveawayData
                )
            ]
        });

        if (
            giveawayData.winners.length >
            0
        ) {
            const winnerMentions =
                giveawayData.winners
                    .map(
                        userId =>
                            `<@${userId}>`
                    )
                    .join(', ');

            await giveawayMessage.reply({
                content:
                    `🎉 Congratulations ${winnerMentions}!`,

                embeds: [
                    createSuccessEmbed(
                        '🏆 Giveaway Winner',
                        [
                            `${winnerMentions} won **${giveawayData.prize}**!`,
                            '',
                            `🆔 Giveaway ID: \`${giveawayData.id}\``,
                            '',
                            '💾 The winner was saved permanently.'
                        ].join('\n')
                    )
                ],

                allowedMentions: {
                    users:
                        giveawayData.winners
                }
            });
        } else {
            await giveawayMessage.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ No Giveaway Winner',
                        [
                            `The Giveaway for **${giveawayData.prize}** ended without any valid entries.`,
                            '',
                            `🆔 Giveaway ID: \`${giveawayData.id}\``
                        ].join('\n')
                    )
                ]
            });
        }
    }

    const timer =
        giveawayTimers.get(
            giveawayData.id
        );

    if (timer) {
        clearTimeout(timer);

        giveawayTimers.delete(
            giveawayData.id
        );
    }

    console.log(
        '======================================'
    );

    console.log(
        '🏁 Las Noches Giveaway Ended'
    );

    console.log(
        `🆔 Giveaway ID: ${giveawayData.id}`
    );

    console.log(
        `🎁 Prize: ${giveawayData.prize}`
    );

    console.log(
        `👥 Entries: ${giveawayData.participants.size}`
    );

    console.log(
        `🏆 Winners: ${giveawayData.winners.length}`
    );

    console.log(
        '💾 Giveaway saved in PostgreSQL'
    );

    console.log(
        '======================================'
    );
}/**
 * Schedule a Giveaway ending.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} giveawayData
 */
function scheduleGiveaway(
    client,
    giveawayData
) {
    const existingTimer =
        giveawayTimers.get(
            giveawayData.id
        );

    if (existingTimer) {
        clearTimeout(
            existingTimer
        );
    }

    const remainingTime =
        Math.max(
            giveawayData.endsAt -
            Date.now(),
            0
        );

    const timer =
        setTimeout(
            () => {
                endGiveaway(
                    client,
                    giveawayData.id,
                    giveawayData.guildId
                ).catch(
                    error => {
                        console.error(
                            '❌ Automatic Giveaway ending failed:'
                        );

                        console.error(
                            error
                        );
                    }
                );
            },
            remainingTime
        );

    giveawayTimers.set(
        giveawayData.id,
        timer
    );
}

/**
 * Handle Giveaway Modal submission.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleCreateModal(
    interaction
) {
    const customIdParts =
        interaction.customId.split(
            ':'
        );

    const creatorId =
        customIdParts[3];

    if (
        !creatorId ||
        creatorId !== interaction.user.id
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Giveaway Form',
                    'This Giveaway form does not belong to you.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (!interaction.inGuild()) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only Action',
                    'Giveaways can only be created inside a server.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const prize =
        interaction.fields
            .getTextInputValue(
                'giveaway-prize'
            )
            .trim();

    const rawDuration =
        interaction.fields
            .getTextInputValue(
                'giveaway-duration'
            )
            .trim();

    const rawWinnerCount =
        interaction.fields
            .getTextInputValue(
                'giveaway-winner-count'
            )
            .trim();

    const description =
        interaction.fields
            .getTextInputValue(
                'giveaway-description'
            )
            .trim();

    const requirement =
        interaction.fields
            .getTextInputValue(
                'giveaway-requirement'
            )
            .trim();

    const durationMs =
        parseDuration(
            rawDuration
        );

    if (!durationMs) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Giveaway Duration',
                    [
                        'Use one of these formats:',
                        '',
                        '• `10s` — 10 seconds',
                        '• `30m` — 30 minutes',
                        '• `2h` — 2 hours',
                        '• `1d` — 1 day',
                        '',
                        'The duration must be between 10 seconds and 14 days.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const winnerCount =
        parseWinnerCount(
            rawWinnerCount
        );

    if (!winnerCount) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Winner Count',
                    'The number of winners must be between `1` and `20`.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * Acknowledge the Modal immediately.
     */
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const giveawayChannel =
        await fetchGiveawayChannel(
            interaction.guild
        );

    if (!giveawayChannel) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Giveaway Channel Not Found',
                    [
                        'Umbra could not find the official Community Events channel.',
                        '',
                        `Configured Channel ID: \`${GIVEAWAY_CHANNEL_ID}\``
                    ].join('\n')
                )
            ]
        });

        return;
    }

    const botMember =
        interaction.guild.members.me;

    if (
        !botMember ||
        !hasGiveawayPermissions(
            giveawayChannel,
            botMember
        )
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Giveaway Permissions',
                    [
                        `Umbra cannot publish Giveaways in ${giveawayChannel}.`,
                        '',
                        'Required permissions:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links',
                        '• Read Message History'
                    ].join('\n')
                )
            ]
        });

        return;
    }

    const giveawayId =
        createGiveawayId();

    const giveawayData = {
        id:
            giveawayId,

        guildId:
            interaction.guild.id,

        channelId:
            giveawayChannel.id,

        messageId:
            null,

        hostId:
            interaction.user.id,

        prize,
        description,
        requirement,
        winnerCount,

        status:
            'Active',

        participants:
            new Set(),

        winners:
            [],

        createdAt:
            Date.now(),

        endsAt:
            Date.now() +
            durationMs,

        endedAt:
            null
    };

    const giveawayEmbed =
        buildGiveawayEmbed(
            giveawayData,
            interaction.user
        );

    const giveawayButtons =
        buildGiveawayButtons(
            giveawayData
        );

    let giveawayMessage =
        null;

    try {
        giveawayMessage =
            await giveawayChannel.send({
                embeds:
                    [giveawayEmbed],

                components:
                    [giveawayButtons]
            });

        giveawayData.messageId =
            giveawayMessage.id;

        await giveawayDatabase
            .createGiveaway(
                giveawayData
            );
    } catch (error) {
        if (giveawayMessage) {
            await giveawayMessage
                .delete()
                .catch(
                    () => null
                );
        }

        throw error;
    }

    scheduleGiveaway(
        interaction.client,
        giveawayData
    );

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Giveaway Published',
                [
                    `The Giveaway for **${prize}** was published successfully in ${giveawayChannel}.`,
                    '',
                    `⏳ Duration: \`${rawDuration}\``,
                    `🏆 Winners: \`${winnerCount}\``,
                    `🆔 Giveaway ID: \`${giveawayId}\``,
                    '',
                    '💾 The Giveaway was saved permanently in PostgreSQL.'
                ].join('\n')
            )
        ]
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎁 Las Noches Giveaway Created'
    );

    console.log(
        `🆔 Giveaway ID: ${giveawayData.id}`
    );

    console.log(
        `🎁 Prize: ${giveawayData.prize}`
    );

    console.log(
        `🏆 Winners: ${giveawayData.winnerCount}`
    );

    console.log(
        `👑 Host: ${interaction.user.tag}`
    );

    console.log(
        `📍 Channel: ${giveawayChannel.name}`
    );

    console.log(
        '💾 Saved to PostgreSQL'
    );

    console.log(
        '======================================'
    );
}/**
 * Handle Giveaway buttons.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleGiveawayButton(
    interaction
) {
    const customIdParts =
        interaction.customId.split(
            ':'
        );

    const action =
        customIdParts[2];

    const giveawayId =
        customIdParts[3]
            ?.trim()
            .toLowerCase();

    if (
        !action ||
        !giveawayId
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Giveaway Action',
                    'Umbra could not identify this Giveaway action.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (!interaction.inGuild()) {
        return;
    }

    let giveawayData =
        await giveawayDatabase
            .getGiveaway(
                giveawayId,
                interaction.guildId
            );

    if (!giveawayData) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Giveaway Data Unavailable',
                    [
                        `No Giveaway was found with ID \`${giveawayId}\`.`,
                        '',
                        'The Giveaway may have been deleted from PostgreSQL.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * VIEW ENTRIES
     */
    if (
        action ===
        'participants'
    ) {
        const thumbnail =
            interaction.guild.iconURL({
                extension:
                    'png',

                size:
                    256,

                forceStatic:
                    false
            }) ||
            interaction.client.user
                .displayAvatarURL({
                    extension:
                        'png',

                    size:
                        256,

                    forceStatic:
                        false
                });

        await interaction.reply({
            embeds: [
                buildParticipantsEmbed(
                    giveawayData,
                    thumbnail
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        giveawayData.status !==
        'Active'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Giveaway Ended',
                    'This Giveaway is no longer accepting entries.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * ENTER GIVEAWAY
     */
    if (action === 'join') {
        const participantAdded =
            await giveawayDatabase
                .addGiveawayParticipant(
                    giveawayData.id,
                    giveawayData.guildId,
                    interaction.user.id
                );

        if (!participantAdded) {
            await interaction.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ Already Entered',
                        `You have already entered the Giveaway for **${giveawayData.prize}**.`
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        giveawayData =
            await giveawayDatabase
                .getGiveaway(
                    giveawayData.id,
                    giveawayData.guildId
                );

        await interaction.deferUpdate();

        const host =
            await interaction.client.users
                .fetch(
                    giveawayData.hostId
                )
                .catch(
                    () => interaction.user
                );

        await interaction.message.edit({
            embeds: [
                buildGiveawayEmbed(
                    giveawayData,
                    host
                )
            ],

            components: [
                buildGiveawayButtons(
                    giveawayData
                )
            ]
        });

        await interaction.followUp({
            embeds: [
                createSuccessEmbed(
                    '🎉 Giveaway Entered',
                    [
                        `You entered the Giveaway for **${giveawayData.prize}**.`,
                        '',
                        `👥 Current Entries: \`${giveawayData.participants.size}\``,
                        '',
                        '💾 Your entry was saved permanently.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }    /*
     * LEAVE GIVEAWAY
     */
    if (action === 'leave') {
        const participantRemoved =
            await giveawayDatabase
                .removeGiveawayParticipant(
                    giveawayData.id,
                    giveawayData.guildId,
                    interaction.user.id
                );

        if (!participantRemoved) {
            await interaction.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ Not Entered',
                        `You have not entered the Giveaway for **${giveawayData.prize}**.`
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        giveawayData =
            await giveawayDatabase
                .getGiveaway(
                    giveawayData.id,
                    giveawayData.guildId
                );

        await interaction.deferUpdate();

        const host =
            await interaction.client.users
                .fetch(
                    giveawayData.hostId
                )
                .catch(
                    () => interaction.user
                );

        await interaction.message.edit({
            embeds: [
                buildGiveawayEmbed(
                    giveawayData,
                    host
                )
            ],

            components: [
                buildGiveawayButtons(
                    giveawayData
                )
            ]
        });

        await interaction.followUp({
            embeds: [
                createSuccessEmbed(
                    '✅ Giveaway Left',
                    [
                        `You left the Giveaway for **${giveawayData.prize}**.`,
                        '',
                        `👥 Current Entries: \`${giveawayData.participants.size}\``,
                        '',
                        '💾 The database was updated successfully.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createErrorEmbed(
                '❌ Unknown Giveaway Action',
                'Umbra does not recognize this Giveaway button.'
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Giveaway Modal and button interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const isGiveawayModal =
            interaction.isModalSubmit() &&
            interaction.customId.startsWith(
                'umbra:giveaway:create:'
            );

        const isGiveawayButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:giveaway:'
            );

        if (
            !isGiveawayModal &&
            !isGiveawayButton
        ) {
            return;
        }

        if (
            processingInteractions.has(
                interaction.id
            )
        ) {
            return;
        }

        processingInteractions.add(
            interaction.id
        );

        try {
            if (isGiveawayModal) {
                await handleCreateModal(
                    interaction
                );

                return;
            }

            await handleGiveawayButton(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Umbra Giveaway interaction error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Giveaway Action Failed',
                    [
                        'Umbra could not complete this Giveaway action.',
                        '',
                        'Please check the PostgreSQL connection and try again.'
                    ].join('\n')
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        } finally {
            setTimeout(
                () => {
                    processingInteractions.delete(
                        interaction.id
                    );
                },
                15_000
            );
        }
    },

    endGiveaway,
    scheduleGiveaway
};
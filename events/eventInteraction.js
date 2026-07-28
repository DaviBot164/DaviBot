const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    randomUUID
} = require('crypto');

const {
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const {
    getEventStorage,
    findGuildEvent,
    saveEvent
} = require('../utils/events/eventStorage');

const {
    buildEventEmbed,
    buildEventButtons,
    buildParticipantsEmbed
} = require('../utils/events/eventEmbed');

/**
 * Official Crimson Eclipse Events channel.
 */
const EVENT_CHANNEL_ID =
    '1531706846531031060';

/**
 * Interactions currently being processed.
 *
 * Prevents accidental duplicate handling
 * inside the same Umbra process.
 */
const processingInteractions =
    new Set();

/**
 * Generate a short readable Event ID.
 *
 * @returns {string}
 */
function createEventId() {
    return randomUUID()
        .replaceAll('-', '')
        .slice(0, 10)
        .toLowerCase();
}

/**
 * Parse and validate the maximum player count.
 *
 * @param {string} rawValue
 * @returns {number|null}
 */
function parseMaxPlayers(
    rawValue
) {
    const normalizedValue =
        rawValue?.trim();

    if (
        !normalizedValue ||
        !/^\d+$/.test(normalizedValue)
    ) {
        return null;
    }

    const maxPlayers =
        Number.parseInt(
            normalizedValue,
            10
        );

    if (
        !Number.isInteger(maxPlayers) ||
        maxPlayers < 1 ||
        maxPlayers > 9999
    ) {
        return null;
    }

    return maxPlayers;
}

/**
 * Fetch the configured Events channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function fetchEventChannel(
    guild
) {
    const channel =
        await guild.channels
            .fetch(EVENT_CHANNEL_ID)
            .catch(() => null);

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        return null;
    }

    return channel;
}

/**
 * Ensure Umbra can publish Events.
 *
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {import('discord.js').GuildMember} botMember
 * @returns {boolean}
 */
function hasEventChannelPermissions(
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
 * Update the original Event message.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {Object} eventData
 * @returns {Promise<void>}
 */
async function updateEventMessage(
    interaction,
    eventData
) {
    const host =
        await interaction.client.users
            .fetch(eventData.hostId)
            .catch(
                () => interaction.user
            );

    const updatedEmbed =
        buildEventEmbed(
            eventData,
            host
        );

    const updatedButtons =
        buildEventButtons(
            eventData
        );

    await interaction.message.edit({
        embeds:
            [updatedEmbed],

        components:
            [updatedButtons]
    });
}

/**
 * Handle Event creation Modal submission.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleCreateModal(
    interaction
) {
    const customIdParts =
        interaction.customId.split(':');

    const creatorId =
        customIdParts[3];

    if (
        !creatorId ||
        creatorId !== interaction.user.id
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Event Form',
                    'This Event form does not belong to you.'
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
                    'Crimson Eclipse Events can only be created inside a server.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * Read the Modal values immediately.
     */
    const title =
        interaction.fields
            .getTextInputValue(
                'event-title'
            )
            .trim();

    const description =
        interaction.fields
            .getTextInputValue(
                'event-description'
            )
            .trim();

    const time =
        interaction.fields
            .getTextInputValue(
                'event-time'
            )
            .trim();

    const reward =
        interaction.fields
            .getTextInputValue(
                'event-reward'
            )
            .trim();

    const rawMaxPlayers =
        interaction.fields
            .getTextInputValue(
                'event-max-players'
            )
            .trim();

    const maxPlayers =
        parseMaxPlayers(
            rawMaxPlayers
        );

    if (!maxPlayers) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Maximum Players',
                    [
                        'Maximum Players must contain numbers only.',
                        '',
                        'Please enter a value between `1` and `9999`.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * Acknowledge the Modal immediately.
     *
     * Discord requires Modal submissions to be
     * acknowledged within approximately 3 seconds.
     */
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    /*
     * Perform slower network requests only
     * after the interaction has been deferred.
     */
    const eventChannel =
        await fetchEventChannel(
            interaction.guild
        );

    if (!eventChannel) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Event Channel Not Found',
                    [
                        'Umbra could not find the official Events channel.',
                        '',
                        `Configured Channel ID: \`${EVENT_CHANNEL_ID}\``
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return;
    }

    const botMember =
        interaction.guild.members.me;

    if (
        !botMember ||
        !hasEventChannelPermissions(
            eventChannel,
            botMember
        )
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Event Permissions',
                    [
                        `Umbra cannot publish Events in ${eventChannel}.`,
                        '',
                        'Required permissions:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links',
                        '• Read Message History'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return;
    }

    const eventId =
        createEventId();

    const eventData = {
        id:
            eventId,

        guildId:
            interaction.guild.id,

        channelId:
            eventChannel.id,

        messageId:
            null,

        hostId:
            interaction.user.id,

        title,
        description,
        time,
        reward,
        maxPlayers,

        status:
            'Active',

        participants:
            new Set(),

        createdAt:
            Date.now()
    };

    const eventEmbed =
        buildEventEmbed(
            eventData,
            interaction.user
        );

    const eventButtons =
        buildEventButtons(
            eventData
        );

    const eventMessage =
        await eventChannel.send({
            embeds:
                [eventEmbed],

            components:
                [eventButtons]
        });

    eventData.messageId =
        eventMessage.id;

    const storage =
        getEventStorage(
            interaction.client
        );

    saveEvent(
        storage,
        eventData
    );

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Event Published',
                [
                    `The Event **${title}** was published successfully in ${eventChannel}.`,
                    '',
                    `👥 Maximum Players: \`${maxPlayers}\``,
                    `🆔 Event ID: \`${eventId}\``
                ].join('\n')
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎉 Crimson Eclipse Event Created'
    );

    console.log(
        `🆔 Event ID: ${eventId}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        `⚔️ Host: ${interaction.user.tag}`
    );

    console.log(
        `👥 Maximum Players: ${maxPlayers}`
    );

    console.log(
        `📍 Channel: ${eventChannel.name}`
    );

    console.log(
        '======================================'
    );
}

/**
 * Handle Event System buttons.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleEventButton(
    interaction
) {
    const customIdParts =
        interaction.customId.split(':');

    const action =
        customIdParts[2];

    const eventId =
        customIdParts[3]
            ?.trim()
            .toLowerCase();

    if (
        !action ||
        !eventId
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Invalid Event Action',
                    'Umbra could not identify this Event action.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    const storage =
        getEventStorage(
            interaction.client
        );

    const eventData =
        findGuildEvent(
            storage,
            eventId,
            interaction.guildId
        );

    if (!eventData) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Event Data Unavailable',
                    [
                        'Umbra no longer has this Event in temporary memory.',
                        '',
                        'This can happen after the bot restarts or redeploys.',
                        '',
                        'PostgreSQL Event storage will fix this in the next stage.'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * VIEW PARTICIPANTS
     */
    if (
        action ===
        'participants'
    ) {
        const thumbnail =
            interaction.guild
                ?.iconURL({
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

        const participantsEmbed =
            buildParticipantsEmbed(
                eventData,
                thumbnail
            );

        await interaction.reply({
            embeds:
                [participantsEmbed],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * CLOSED EVENT CHECK
     */
    if (
        eventData.status !==
        'Active'
    ) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Event Closed',
                    `This Event is already marked as **${eventData.status}**.`
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * JOIN EVENT
     */
    if (action === 'join') {
        if (
            eventData.participants.has(
                interaction.user.id
            )
        ) {
            await interaction.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ Already Joined',
                        `You are already participating in **${eventData.title}**.`
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        if (
            eventData.participants.size >=
            eventData.maxPlayers
        ) {
            await interaction.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ Event Full',
                        [
                            `The Event **${eventData.title}** has reached its player limit.`,
                            '',
                            `👥 Maximum Players: \`${eventData.maxPlayers}\``
                        ].join('\n')
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        eventData.participants.add(
            interaction.user.id
        );

        saveEvent(
            storage,
            eventData
        );

        await interaction.deferUpdate();

        await updateEventMessage(
            interaction,
            eventData
        );

        await interaction.followUp({
            embeds: [
                createSuccessEmbed(
                    '✅ Event Joined',
                    [
                        `You have joined **${eventData.title}**.`,
                        '',
                        `👥 Players: \`${eventData.participants.size} / ${eventData.maxPlayers}\``,
                        '',
                        '*Your name now stands among the Souls beneath the crimson moon.*'
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        console.log(
            '======================================'
        );

        console.log(
            '✅ Event Participant Joined'
        );

        console.log(
            `🆔 Event ID: ${eventData.id}`
        );

        console.log(
            `👤 User: ${interaction.user.tag}`
        );

        console.log(
            `👥 Players: ${eventData.participants.size}/${eventData.maxPlayers}`
        );

        console.log(
            '======================================'
        );

        return;
    }

    /*
     * LEAVE EVENT
     */
    if (action === 'leave') {
        if (
            !eventData.participants.has(
                interaction.user.id
            )
        ) {
            await interaction.reply({
                embeds: [
                    createWarningEmbed(
                        '⚠️ Not Participating',
                        `You have not joined **${eventData.title}**.`
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        eventData.participants.delete(
            interaction.user.id
        );

        saveEvent(
            storage,
            eventData
        );

        await interaction.deferUpdate();

        await updateEventMessage(
            interaction,
            eventData
        );

        await interaction.followUp({
            embeds: [
                createSuccessEmbed(
                    '✅ Event Left',
                    [
                        `You have left **${eventData.title}**.`,
                        '',
                        `👥 Players: \`${eventData.participants.size} / ${eventData.maxPlayers}\``
                    ].join('\n')
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        console.log(
            '======================================'
        );

        console.log(
            '❌ Event Participant Left'
        );

        console.log(
            `🆔 Event ID: ${eventData.id}`
        );

        console.log(
            `👤 User: ${interaction.user.tag}`
        );

        console.log(
            `👥 Players: ${eventData.participants.size}/${eventData.maxPlayers}`
        );

        console.log(
            '======================================'
        );

        return;
    }

    await interaction.reply({
        embeds: [
            createErrorEmbed(
                '❌ Unknown Event Action',
                'Umbra does not recognize this Event button.'
            )
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    /**
     * Handle Event buttons and Modal submissions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const isEventButton =
            interaction.isButton() &&
            interaction.customId.startsWith(
                'umbra:event:'
            );

        const isEventModal =
            interaction.isModalSubmit() &&
            interaction.customId.startsWith(
                'umbra:event:create:'
            );

        if (
            !isEventButton &&
            !isEventModal
        ) {
            return;
        }

        /*
         * Ignore duplicate handling of the exact
         * same Discord interaction.
         */
        if (
            processingInteractions.has(
                interaction.id
            )
        ) {
            console.warn(
                `⚠️ Duplicate Event interaction ignored: ${interaction.id}`
            );

            return;
        }

        processingInteractions.add(
            interaction.id
        );

        try {
            if (isEventModal) {
                await handleCreateModal(
                    interaction
                );

                return;
            }

            await handleEventButton(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Umbra Event interaction error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event Action Failed',
                    'Umbra could not complete this Event action. Please try again.'
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
    }
};
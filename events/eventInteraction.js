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
    buildEventEmbed,
    buildEventButtons,
    buildParticipantsEmbed
} = require('../utils/events/eventEmbed');

const {
    events: eventDatabase
} = require('../database');

/**
 * Official Las Noches Events channel.
 */
const EVENT_CHANNEL_ID =
    '1531706846531031060';

/**
 * Interactions currently being processed.
 *
 * Prevents accidental duplicate execution
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
 * Parse and validate Maximum Players.
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
        !/^\d+$/.test(
            normalizedValue
        )
    ) {
        return null;
    }

    const maxPlayers =
        Number.parseInt(
            normalizedValue,
            10
        );

    if (
        !Number.isInteger(
            maxPlayers
        ) ||
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
            .fetch(
                EVENT_CHANNEL_ID
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
 * Ensure Umbra can publish and update Events.
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
 * Fetch the Event host.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} eventData
 * @param {import('discord.js').User} fallbackUser
 * @returns {Promise<import('discord.js').User>}
 */
async function fetchEventHost(
    client,
    eventData,
    fallbackUser
) {
    return client.users
        .fetch(
            eventData.hostId
        )
        .catch(
            () => fallbackUser
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
        await fetchEventHost(
            interaction.client,
            eventData,
            interaction.user
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

    /*
     * Usually interaction.message is the original
     * Event message, so update it directly.
     */
    if (
        interaction.message?.id ===
        eventData.messageId
    ) {
        await interaction.message.edit({
            embeds:
                [updatedEmbed],

            components:
                [updatedButtons]
        });

        return;
    }

    /*
     * Fallback: fetch the original message
     * using its stored Channel and Message IDs.
     */
    const eventChannel =
        await interaction.guild.channels
            .fetch(
                eventData.channelId
            )
            .catch(
                () => null
            );

    if (
        !eventChannel ||
        !eventChannel.isTextBased()
    ) {
        return;
    }

    const eventMessage =
        await eventChannel.messages
            .fetch(
                eventData.messageId
            )
            .catch(
                () => null
            );

    if (!eventMessage) {
        return;
    }

    await eventMessage.edit({
        embeds:
            [updatedEmbed],

        components:
            [updatedButtons]
    });
}

/**
 * Handle the Event creation Modal.
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
                    'Las Noches Events can only be created inside a server.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

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
     */
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

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

        winnerId:
            null,

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

    let eventMessage = null;

    try {
        eventMessage =
            await eventChannel.send({
                embeds:
                    [eventEmbed],

                components:
                    [eventButtons]
            });

        eventData.messageId =
            eventMessage.id;

        /*
         * Store the Event permanently
         * inside PostgreSQL.
         */
        await eventDatabase.createEvent(
            eventData
        );
    } catch (error) {
        /*
         * If Discord published the message but the
         * database insert failed, remove the orphaned
         * Event message.
         */
        if (eventMessage) {
            await eventMessage
                .delete()
                .catch(
                    () => null
                );
        }

        throw error;
    }

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Event Published',
                [
                    `The Event **${title}** was published successfully in ${eventChannel}.`,
                    '',
                    `👥 Maximum Players: \`${maxPlayers}\``,
                    `🆔 Event ID: \`${eventId}\``,
                    '',
                    '💾 The Event was saved permanently in PostgreSQL.'
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
        '🎉 Las Noches Event Created'
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
        '💾 Saved to PostgreSQL'
    );

    console.log(
        '======================================'
    );
}/**
 * Handle Event buttons.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleEventButton(
    interaction
) {
    const customIdParts =
        interaction.customId.split(
            ':'
        );

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

    if (!interaction.inGuild()) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only Action',
                    'Las Noches Event buttons can only be used inside a server.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    /*
     * Load the Event and every participant
     * directly from PostgreSQL.
     */
    let eventData =
        await eventDatabase.getEvent(
            eventId,
            interaction.guildId
        );

    if (!eventData) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Event Data Unavailable',
                    [
                        `No Event was found with ID \`${eventId}\`.`,
                        '',
                        'The Event may have been deleted from the database.'
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
        const alreadyJoined =
            await eventDatabase
                .isEventParticipant(
                    eventData.id,
                    eventData.guildId,
                    interaction.user.id
                );

        if (alreadyJoined) {
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

        const participantCount =
            await eventDatabase
                .countEventParticipants(
                    eventData.id,
                    eventData.guildId
                );

        if (
            participantCount >=
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

        const participantAdded =
            await eventDatabase
                .addEventParticipant(
                    eventData.id,
                    eventData.guildId,
                    interaction.user.id
                );

        if (!participantAdded) {
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

        /*
         * Reload the Event so the participant Set
         * contains the newly joined Soul.
         */
        eventData =
            await eventDatabase.getEvent(
                eventData.id,
                eventData.guildId
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
                        '💾 Your participation was saved permanently.'
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
            '💾 Participant saved to PostgreSQL'
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
        const participantRemoved =
            await eventDatabase
                .removeEventParticipant(
                    eventData.id,
                    eventData.guildId,
                    interaction.user.id
                );

        if (!participantRemoved) {
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

        /*
         * Reload the Event so the participant Set
         * reflects the removal.
         */
        eventData =
            await eventDatabase.getEvent(
                eventData.id,
                eventData.guildId
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
                        `👥 Players: \`${eventData.participants.size} / ${eventData.maxPlayers}\``,
                        '',
                        '💾 The database was updated successfully.'
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
            '💾 Participant removed from PostgreSQL'
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

    once:
        false,

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
                    [
                        'Umbra could not complete this Event action.',
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
    }
};
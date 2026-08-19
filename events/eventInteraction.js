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

/*
 * Official Lunar Seireitei Events channel.
 *
 * Keep this ID stable unless the
 * Discord channel itself changes.
 */
const EVENT_CHANNEL_ID =
    '1535755486505476147';

/*
 * Prevent duplicate processing of the
 * same interaction inside this process.
 */
const processingInteractions =
    new Set();

/**
 * Generate a short Event ID.
 *
 * @returns {string}
 */
function createEventId() {
    return randomUUID()
        .replaceAll(
            '-',
            ''
        )
        .slice(
            0,
            10
        )
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
 * Check Evelynn's Event channel
 * permissions.
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
     * Usually the button belongs to the
     * original Event message.
     */
    if (
        interaction.message?.id ===
        eventData.messageId
    ) {
        await interaction.message.edit({
            embeds: [
                updatedEmbed
            ],

            components: [
                updatedButtons
            ]
        });

        return;
    }

    /*
     * Fallback to the stored Channel
     * and Message IDs.
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
        embeds: [
            updatedEmbed
        ],

        components: [
            updatedButtons
        ]
    });
}/**
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
        creatorId !==
            interaction.user.id
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

    if (
        !interaction.inGuild()
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only Action',
                    'Lunar Seireitei Events can only be created inside a server.'
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
                    'Enter a number between `1` and `9999`.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

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
                        'Evelynn could not find the configured Events channel.',
                        '',
                        `Channel ID: \`${EVENT_CHANNEL_ID}\``
                    ].join(
                        '\n'
                    )
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
                        `Evelynn cannot publish Events in ${eventChannel}.`,
                        '',
                        'Required:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links',
                        '• Read Message History'
                    ].join(
                        '\n'
                    )
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

    let eventMessage =
        null;

    try {
        eventMessage =
            await eventChannel.send({
                embeds: [
                    eventEmbed
                ],

                components: [
                    eventButtons
                ]
            });

        eventData.messageId =
            eventMessage.id;

        await eventDatabase.createEvent(
            eventData
        );
    } catch (error) {
        /*
         * Remove an orphaned Discord
         * message if database save fails.
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
                    `**${title}** was published in ${eventChannel}.`,
                    '',
                    `👥 Players: \`${maxPlayers}\``,
                    `🆔 ID: \`${eventId}\``
                ].join(
                    '\n'
                )
            )
        ],

        components:
            []
    });

    console.log(
        `🎉 Event created: ${eventId} by ${interaction.user.tag}`
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
                    'Evelynn could not identify this Event action.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    if (
        !interaction.inGuild()
    ) {
        await interaction.reply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only Action',
                    'Lunar Seireitei Event controls can only be used inside a server.'
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    let eventData =
        await eventDatabase.getEvent(
            eventId,
            interaction.guildId
        );

    if (!eventData) {
        await interaction.reply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Event Unavailable',
                    `No Event was found with ID \`${eventId}\`.`
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
            embeds: [
                participantsEmbed
            ],

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
    if (
        action ===
        'join'
    ) {
        const alreadyJoined =
            await eventDatabase
                .isEventParticipant(
                    eventData.id,
                    eventData.guildId,
                    interaction.user.id
                );

        if (
            alreadyJoined
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
                            `**${eventData.title}** has reached its player limit.`,
                            '',
                            `👥 Maximum Players: \`${eventData.maxPlayers}\``
                        ].join(
                            '\n'
                        )
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

        if (
            !participantAdded
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

        /*
         * Reload the Event so the
         * participant list is current.
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
                        `You joined **${eventData.title}**.`,
                        '',
                        `👥 Players: \`${eventData.participants.size} / ${eventData.maxPlayers}\``
                    ].join(
                        '\n'
                    )
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        console.log(
            `✅ Event joined: ${eventData.id} by ${interaction.user.tag}`
        );

        return;
    }

    /*
     * LEAVE EVENT
     */
    if (
        action ===
        'leave'
    ) {
        const participantRemoved =
            await eventDatabase
                .removeEventParticipant(
                    eventData.id,
                    eventData.guildId,
                    interaction.user.id
                );

        if (
            !participantRemoved
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

        /*
         * Reload the Event so the
         * participant list is current.
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
                        `You left **${eventData.title}**.`,
                        '',
                        `👥 Players: \`${eventData.participants.size} / ${eventData.maxPlayers}\``
                    ].join(
                        '\n'
                    )
                )
            ],

            flags:
                MessageFlags.Ephemeral
        });

        console.log(
            `↩️ Event left: ${eventData.id} by ${interaction.user.tag}`
        );

        return;
    }

    await interaction.reply({
        embeds: [
            createErrorEmbed(
                '❌ Unknown Event Action',
                'Evelynn does not recognize this Event button.'
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
     * Handle Event buttons and
     * Event creation Modal submissions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
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
            if (
                isEventModal
            ) {
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
                '❌ Evelynn Event interaction failed:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event Action Failed',
                    [
                        'Evelynn could not complete this Event action.',
                        '',
                        'Check the PostgreSQL connection and try again.'
                    ].join(
                        '\n'
                    )
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

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
                    embeds: [
                        errorEmbed
                    ],

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
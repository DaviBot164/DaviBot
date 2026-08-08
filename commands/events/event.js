const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    buildEventEmbed,
    buildEventButtons,
    buildParticipantsEmbed
} = require('../../utils/events/eventEmbed');

const {
    buildEventModal
} = require('../../utils/events/eventModal');

const {
    events: eventDatabase
} = require('../../database');

/**
 * Official Las Noches Community Events channel.
 *
 * Events and Giveaways are published
 * inside the same shared activity channel.
 */
const EVENT_CHANNEL_ID =
    '1535755486505476147';

/**
 * Discord error code returned when an interaction
 * was already acknowledged.
 */
const INTERACTION_ALREADY_ACKNOWLEDGED =
    40060;

/**
 * Prevent duplicate Modal openings inside
 * the same Umbra process.
 */
const openingModalInteractions =
    new Set();

/**
 * Fetch the original Discord message
 * belonging to an Event.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} eventData
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function fetchEventMessage(
    guild,
    eventData
) {
    const eventChannel =
        await guild.channels
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
        return null;
    }

    return eventChannel.messages
        .fetch(
            eventData.messageId
        )
        .catch(
            () => null
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
 * Safely open the Event creation Modal.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function safelyShowEventModal(
    interaction
) {
    if (
        interaction.replied ||
        interaction.deferred
    ) {
        return false;
    }

    if (
        openingModalInteractions.has(
            interaction.id
        )
    ) {
        return false;
    }

    openingModalInteractions.add(
        interaction.id
    );

    try {
        const modal =
            buildEventModal(
                interaction.user.id
            );

        await interaction.showModal(
            modal
        );

        return true;
    } catch (error) {
        if (
            error.code ===
            INTERACTION_ALREADY_ACKNOWLEDGED
        ) {
            console.warn(
                '⚠️ Duplicate Event Modal execution was ignored.'
            );

            return false;
        }

        throw error;
    } finally {
        setTimeout(
            () => {
                openingModalInteractions.delete(
                    interaction.id
                );
            },
            15_000
        );
    }
}

/**
 * Safely send an Event command error.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').EmbedBuilder} errorEmbed
 * @returns {Promise<void>}
 */
async function sendEventCommandError(
    interaction,
    errorEmbed
) {
    try {
        if (interaction.deferred) {
            await interaction.editReply({
                embeds:
                    [errorEmbed],

                components:
                    []
            });

            return;
        }

        if (interaction.replied) {
            await interaction.followUp({
                embeds:
                    [errorEmbed],

                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.reply({
            embeds:
                [errorEmbed],

            flags:
                MessageFlags.Ephemeral
        });
    } catch (error) {
        if (
            error.code ===
            INTERACTION_ALREADY_ACKNOWLEDGED
        ) {
            console.warn(
                '⚠️ Event command error response was already acknowledged.'
            );

            return;
        }

        console.error(
            '❌ Failed to send Event command error response:'
        );

        console.error(error);
    }
}module.exports = {
    category:
        'events',

    data:
        new SlashCommandBuilder()
            .setName('event')
            .setDescription(
                'Create and manage Las Noches events.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(false)

            .addSubcommand(subcommand =>
                subcommand
                    .setName('create')
                    .setDescription(
                        'Open the Las Noches Event creation form.'
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('end')
                    .setDescription(
                        'End an active Las Noches Event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the Event embed'
                            )
                            .setMaxLength(32)
                            .setRequired(true)
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('cancel')
                    .setDescription(
                        'Cancel an active Las Noches Event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the Event embed'
                            )
                            .setMaxLength(32)
                            .setRequired(true)
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('participants')
                    .setDescription(
                        'View the participants of an Event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the Event embed'
                            )
                            .setMaxLength(32)
                            .setRequired(true)
                    )
            ),

    /**
     * Execute the /event command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Event System can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const subcommand =
                interaction.options
                    .getSubcommand();

            /*
             * CREATE EVENT
             */
            if (subcommand === 'create') {
                if (
                    interaction.replied ||
                    interaction.deferred
                ) {
                    return;
                }

                const eventChannel =
                    await interaction.guild.channels
                        .fetch(
                            EVENT_CHANNEL_ID
                        )
                        .catch(
                            () => null
                        );

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {
                    return;
                }

                if (
                    !eventChannel ||
                    !eventChannel.isTextBased()
                ) {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Event Channel Not Found',
                                [
                                    'Umbra could not find the official Community Events channel.',
                                    '',
                                    `Configured Channel ID: \`${EVENT_CHANNEL_ID}\``
                                ].join('\n')
                            )
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                const botMember =
                    interaction.guild.members.me;

                const permissions =
                    botMember
                        ? eventChannel.permissionsFor(
                            botMember
                        )
                        : null;

                if (
                    !permissions?.has([
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.ReadMessageHistory
                    ])
                ) {
                    await interaction.reply({
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

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                await safelyShowEventModal(
                    interaction
                );

                return;
            }

            /*
             * Commands below require an Event ID.
             */
            const eventId =
                interaction.options
                    .getString(
                        'event_id',
                        true
                    )
                    .trim()
                    .toLowerCase();

            /*
             * Load the Event and participants
             * directly from PostgreSQL.
             */
            let eventData =
                await eventDatabase.getEvent(
                    eventId,
                    interaction.guild.id
                );

            if (!eventData) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Not Found',
                            [
                                `No Las Noches Event was found with ID \`${eventId}\`.`,
                                '',
                                'The Event may have been deleted from PostgreSQL.'
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
                subcommand ===
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
             * EVENT STATUS CHECK
             */
            if (
                eventData.status !==
                'Active'
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Already Closed',
                            `This Event is already marked as **${eventData.status}**.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }            /*
             * Acknowledge before database and Discord requests.
             */
            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const newStatus =
                subcommand === 'end'
                    ? 'Ended'
                    : 'Cancelled';

            /*
             * Save the new Event status permanently.
             */
            eventData =
                await eventDatabase.updateEventStatus(
                    eventData.id,
                    eventData.guildId,
                    newStatus
                );

            if (!eventData) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Update Failed',
                            'Umbra could not update this Event in PostgreSQL.'
                        )
                    ],

                    components:
                        []
                });

                return;
            }

            const eventMessage =
                await fetchEventMessage(
                    interaction.guild,
                    eventData
                );

            const host =
                await fetchEventHost(
                    interaction.client,
                    eventData,
                    interaction.user
                );

            if (eventMessage) {
                const updatedEmbed =
                    buildEventEmbed(
                        eventData,
                        host
                    );

                const updatedButtons =
                    buildEventButtons(
                        eventData
                    );

                await eventMessage.edit({
                    embeds:
                        [updatedEmbed],

                    components:
                        [updatedButtons]
                });
            }

            if (newStatus === 'Ended') {
                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🏁 Event Ended',
                            [
                                `The Event **${eventData.title}** has officially ended.`,
                                '',
                                `👥 Final Participants: \`${eventData.participants.size}\``,
                                `🆔 Event ID: \`${eventData.id}\``,
                                '',
                                '💾 The Event status was saved permanently.'
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });
            } else {
                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '🚫 Event Cancelled',
                            [
                                `The Event **${eventData.title}** has been cancelled.`,
                                '',
                                'Members can no longer join this Event.',
                                '',
                                `🆔 Event ID: \`${eventData.id}\``,
                                '',
                                '💾 The Event status was saved permanently.'
                            ].join('\n')
                        )
                    ],

                    components:
                        []
                });
            }

            console.log(
                '======================================'
            );

            console.log(
                newStatus === 'Ended'
                    ? '🏁 Las Noches Event Ended'
                    : '🚫 Las Noches Event Cancelled'
            );

            console.log(
                `🆔 Event ID: ${eventData.id}`
            );

            console.log(
                `🏰 Server: ${interaction.guild.name}`
            );

            console.log(
                `🛡️ Managed By: ${interaction.user.tag}`
            );

            console.log(
                `👥 Participants: ${eventData.participants.size}`
            );

            console.log(
                '💾 Event status saved to PostgreSQL'
            );

            console.log(
                '======================================'
            );        } catch (error) {
            if (
                error.code ===
                INTERACTION_ALREADY_ACKNOWLEDGED
            ) {
                console.warn(
                    '⚠️ Duplicate /event interaction was ignored.'
                );

                return;
            }

            console.error(
                '❌ Umbra Event command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event System Failed',
                    [
                        'Umbra could not complete this Event action.',
                        '',
                        'Please check the PostgreSQL connection and try again.'
                    ].join('\n')
                );

            await sendEventCommandError(
                interaction,
                errorEmbed
            );
        }
    }
};
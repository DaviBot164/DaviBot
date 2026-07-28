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
    getEventStorage,
    findGuildEvent
} = require('../../utils/events/eventStorage');

const {
    buildEventEmbed,
    buildEventButtons,
    buildParticipantsEmbed
} = require('../../utils/events/eventEmbed');

const {
    buildEventModal
} = require('../../utils/events/eventModal');

/**
 * Official Crimson Eclipse Events channel.
 */
const EVENT_CHANNEL_ID =
    '1531706846531031060';

/**
 * Fetch the original Discord message
 * belonging to an event.
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
 * Fetch the event host.
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

module.exports = {
    category:
        'events',

    data:
        new SlashCommandBuilder()
            .setName('event')
            .setDescription(
                'Create and manage Crimson Eclipse events.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(false)

            .addSubcommand(subcommand =>
                subcommand
                    .setName('create')
                    .setDescription(
                        'Open the Crimson Eclipse Event creation form.'
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('end')
                    .setDescription(
                        'End an active Crimson Eclipse event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the event embed'
                            )
                            .setMaxLength(20)
                            .setRequired(true)
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('cancel')
                    .setDescription(
                        'Cancel an active Crimson Eclipse event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the event embed'
                            )
                            .setMaxLength(20)
                            .setRequired(true)
                    )
            )

            .addSubcommand(subcommand =>
                subcommand
                    .setName('participants')
                    .setDescription(
                        'View the participants of an event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('event_id')
                            .setDescription(
                                'The ID shown inside the event embed'
                            )
                            .setMaxLength(20)
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
                const eventChannel =
                    await interaction.guild.channels
                        .fetch(
                            EVENT_CHANNEL_ID
                        )
                        .catch(
                            () => null
                        );

                if (
                    !eventChannel ||
                    !eventChannel.isTextBased()
                ) {
                    await interaction.reply({
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

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                const botMember =
                    interaction.guild.members.me;

                const permissions =
                    eventChannel.permissionsFor(
                        botMember
                    );

                if (
                    !permissions?.has([
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.EmbedLinks
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
                                    '• Embed Links'
                                ].join('\n')
                            )
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                const modal =
                    buildEventModal(
                        interaction.user.id
                    );

                await interaction.showModal(
                    modal
                );

                return;
            }

            const storage =
                getEventStorage(
                    interaction.client
                );

            const eventId =
                interaction.options
                    .getString(
                        'event_id',
                        true
                    )
                    .trim()
                    .toLowerCase();

            const eventData =
                findGuildEvent(
                    storage,
                    eventId,
                    interaction.guild.id
                );

            if (!eventData) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Not Found',
                            [
                                `No Crimson Eclipse event was found with ID \`${eventId}\`.`,
                                '',
                                'The event may have been removed, or Umbra may have restarted.'
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
                            `This event is already marked as **${eventData.status}**.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            /*
             * END OR CANCEL EVENT
             */
            const newStatus =
                subcommand === 'end'
                    ? 'Ended'
                    : 'Cancelled';

            eventData.status =
                newStatus;

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
                await interaction.reply({
                    embeds: [
                        createSuccessEmbed(
                            '🏁 Event Ended',
                            [
                                `The event **${eventData.title}** has officially ended.`,
                                '',
                                `👥 Final Participants: \`${eventData.participants.size}\``,
                                `🆔 Event ID: \`${eventData.id}\``
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    embeds: [
                        createSuccessEmbed(
                            '🚫 Event Cancelled',
                            [
                                `The event **${eventData.title}** has been cancelled.`,
                                '',
                                'Members can no longer join this event.',
                                '',
                                `🆔 Event ID: \`${eventData.id}\``
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });
            }

            console.log(
                '======================================'
            );

            console.log(
                newStatus === 'Ended'
                    ? '🏁 Crimson Eclipse Event Ended'
                    : '🚫 Crimson Eclipse Event Cancelled'
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
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra Event command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event System Failed',
                    'Umbra could not complete this event action. Please try again.'
                );

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
        }
    }
};
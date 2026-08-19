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

const EVENT_CHANNEL_ID =
    '1535755486505476147';

const INTERACTION_ALREADY_ACKNOWLEDGED =
    40060;

const openingModalInteractions =
    new Set();

async function fetchEventMessage(
    guild,
    eventData
) {
    const channel =
        await guild.channels
            .fetch(
                eventData.channelId
            )
            .catch(() => null);

    if (!channel?.isTextBased()) {
        return null;
    }

    return channel.messages
        .fetch(
            eventData.messageId
        )
        .catch(() => null);
}

function fetchEventHost(
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

async function showEventModal(
    interaction
) {
    if (
        interaction.replied ||
        interaction.deferred ||
        openingModalInteractions.has(
            interaction.id
        )
    ) {
        return;
    }

    openingModalInteractions.add(
        interaction.id
    );

    try {
        await interaction.showModal(
            buildEventModal(
                interaction.user.id
            )
        );
    } catch (error) {
        if (
            error.code !==
            INTERACTION_ALREADY_ACKNOWLEDGED
        ) {
            throw error;
        }
    } finally {
        setTimeout(
            () =>
                openingModalInteractions.delete(
                    interaction.id
                ),
            15_000
        );
    }
}

async function sendError(
    interaction,
    title,
    description
) {
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        return interaction
            .editReply({
                embeds: [embed],
                components: []
            })
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                embeds: [embed],
                flags:
                    MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            embeds: [embed],
            flags:
                MessageFlags.Ephemeral
        })
        .catch(() => null);
}

function addEventIdOption(
    subcommand
) {
    return subcommand
        .addStringOption(option =>
            option
                .setName('event_id')
                .setDescription(
                    'Event ID shown in the event embed'
                )
                .setMaxLength(32)
                .setRequired(true)
        );
}

async function getEventChannel(
    interaction
) {
    return interaction.guild.channels
        .fetch(
            EVENT_CHANNEL_ID
        )
        .catch(() => null);
}

function hasEventPermissions(
    interaction,
    channel
) {
    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        return false;
    }

    return channel.permissionsFor(
        botMember
    )?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
    ]) ?? false;
}module.exports = {
    category: 'events',

    data:
        new SlashCommandBuilder()
            .setName('event')
            .setDescription(
                'Create and manage Lunar Seireitei events.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(false)

            .addSubcommand(subcommand =>
                subcommand
                    .setName('create')
                    .setDescription(
                        'Open the Event creation form.'
                    )
            )

            .addSubcommand(subcommand =>
                addEventIdOption(
                    subcommand
                        .setName('end')
                        .setDescription(
                            'End an active Event.'
                        )
                )
            )

            .addSubcommand(subcommand =>
                addEventIdOption(
                    subcommand
                        .setName('cancel')
                        .setDescription(
                            'Cancel an active Event.'
                        )
                )
            )

            .addSubcommand(subcommand =>
                addEventIdOption(
                    subcommand
                        .setName('participants')
                        .setDescription(
                            'View Event participants.'
                        )
                )
            ),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                return sendError(
                    interaction,
                    '❌ Server Only Command',
                    'The Event System can only be used inside LUNAR SEIREITEI.'
                );
            }

            const subcommand =
                interaction.options
                    .getSubcommand();

            if (subcommand === 'create') {
                const channel =
                    await getEventChannel(
                        interaction
                    );

                if (!channel?.isTextBased()) {
                    return sendError(
                        interaction,
                        '❌ Event Channel Not Found',
                        [
                            'Evelynn could not find the configured Events channel.',
                            `ID: \`${EVENT_CHANNEL_ID}\``
                        ].join('\n')
                    );
                }

                if (
                    !hasEventPermissions(
                        interaction,
                        channel
                    )
                ) {
                    return sendError(
                        interaction,
                        '❌ Missing Event Permissions',
                        [
                            `Evelynn cannot publish Events in ${channel}.`,
                            '',
                            'Required:',
                            '• View Channel',
                            '• Send Messages',
                            '• Embed Links',
                            '• Read Message History'
                        ].join('\n')
                    );
                }

                await showEventModal(
                    interaction
                );

                return;
            }

            const eventId =
                interaction.options
                    .getString(
                        'event_id',
                        true
                    )
                    .trim()
                    .toLowerCase();

            let eventData =
                await eventDatabase.getEvent(
                    eventId,
                    interaction.guild.id
                );

            if (!eventData) {
                return sendError(
                    interaction,
                    '❌ Event Not Found',
                    `No Event was found with ID \`${eventId}\`.`
                );
            }

            if (
                subcommand ===
                'participants'
            ) {
                const thumbnail =
                    interaction.guild.iconURL({
                        extension: 'png',
                        size: 256,
                        forceStatic: false
                    }) ||
                    interaction.client.user
                        .displayAvatarURL({
                            extension: 'png',
                            size: 256,
                            forceStatic: false
                        });

                await interaction.reply({
                    embeds: [
                        buildParticipantsEmbed(
                            eventData,
                            thumbnail
                        )
                    ],
                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                eventData.status !==
                'Active'
            ) {
                return sendError(
                    interaction,
                    '❌ Event Already Closed',
                    `This Event is already marked as **${eventData.status}**.`
                );
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const newStatus =
                subcommand === 'end'
                    ? 'Ended'
                    : 'Cancelled';

            eventData =
                await eventDatabase
                    .updateEventStatus(
                        eventData.id,
                        eventData.guildId,
                        newStatus
                    );

            if (!eventData) {
                return sendError(
                    interaction,
                    '❌ Event Update Failed',
                    'Evelynn could not update this Event.'
                );
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
                await eventMessage.edit({
                    embeds: [
                        buildEventEmbed(
                            eventData,
                            host
                        )
                    ],
                    components: [
                        buildEventButtons(
                            eventData
                        )
                    ]
                });
            }

            const ended =
                newStatus === 'Ended';

            await interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        ended
                            ? '🏁 Event Ended'
                            : '🚫 Event Cancelled',
                        ended
                            ? [
                                `**${eventData.title}** has ended.`,
                                `👥 Participants: \`${eventData.participants.size}\``,
                                `🆔 ID: \`${eventData.id}\``
                            ].join('\n')
                            : [
                                `**${eventData.title}** has been cancelled.`,
                                `🆔 ID: \`${eventData.id}\``
                            ].join('\n')
                    )
                ],
                components: []
            });
        } catch (error) {
            if (
                error.code ===
                INTERACTION_ALREADY_ACKNOWLEDGED
            ) {
                return;
            }

            console.error(
                '❌ Evelynn /event failed:',
                error
            );

            await sendEventCommandError(
                interaction,
                createErrorEmbed(
                    '❌ Event System Failed',
                    'Evelynn could not complete this Event action.'
                )
            );
        }
    }
};
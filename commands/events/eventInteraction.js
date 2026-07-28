const {
    Events,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

/**
 * Return the Event System storage.
 *
 * @param {import('discord.js').Client} client
 * @returns {Map<string, Object>|null}
 */
function getEventStorage(client) {
    if (
        !client.umbraEvents ||
        !(client.umbraEvents instanceof Map)
    ) {
        return null;
    }

    return client.umbraEvents;
}

/**
 * Build the main event embed again after
 * the participant count changes.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildUpdatedEventEmbed({
    eventData,
    host
}) {
    const statusIcon =
        eventData.status === 'Active'
            ? '🟢'
            : eventData.status === 'Ended'
                ? '🏁'
                : '🔴';

    return createEmbed({
        title:
            `🎉 ${eventData.title}`,

        description:
            [
                eventData.description,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `🕒 **Time:** ${eventData.time}`,
                `🎁 **Reward:** ${eventData.reward}`,
                `⚔️ **Host:** ${host}`,
                `👥 **Participants:** \`${eventData.participants.size}\``,
                `${statusIcon} **Status:** ${eventData.status}`,
                '',
                `🆔 **Event ID:** \`${eventData.id}\``,
                '',
                '*Stand together beneath the crimson moon.*'
            ].join('\n'),

        thumbnail:
            host.displayAvatarURL({
                extension: 'png',
                size: 512,
                forceStatic: false
            })
    });
}

/**
 * Create a readable participant list.
 *
 * Discord embed descriptions are limited,
 * so only the first 50 participants are shown.
 *
 * @param {Set<string>} participants
 * @returns {string}
 */
function createParticipantList(
    participants
) {
    const participantIds =
        Array.from(participants);

    if (
        participantIds.length === 0
    ) {
        return 'No Souls have joined this event yet.';
    }

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

    return participantLines.join('\n');
}

/**
 * Update the participant count displayed
 * inside the original event message.
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
            .fetch(
                eventData.hostId
            )
            .catch(
                () => interaction.user
            );

    const updatedEmbed =
        buildUpdatedEventEmbed({
            eventData,
            host
        });

    await interaction.message.edit({
        embeds:
            [updatedEmbed]
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    /**
     * Handle Umbra Event System buttons.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (
            !interaction.isButton()
        ) {
            return;
        }

        if (
            !interaction.customId.startsWith(
                'umbra:event:'
            )
        ) {
            return;
        }

        try {
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
                            'Umbra could not identify this event action.'
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

            if (!storage) {
                await interaction.reply({
                    embeds: [
                        createWarningEmbed(
                            '⚠️ Event Data Unavailable',
                            [
                                'Umbra no longer has this event in temporary memory.',
                                '',
                                'This can happen after the bot restarts or redeploys.',
                                '',
                                'A Shadow Warden must create the event again.'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const eventData =
                storage.get(eventId);

            if (
                !eventData ||
                eventData.guildId !==
                    interaction.guildId
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Event Not Found',
                            `No Crimson Eclipse event was found with ID \`${eventId}\`.`
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
                const participantList =
                    createParticipantList(
                        eventData.participants
                    );

                const participantsEmbed =
                    createEmbed({
                        title:
                            `👥 Participants • ${eventData.title}`,

                        description:
                            [
                                `🆔 **Event ID:** \`${eventData.id}\``,
                                `📜 **Total Participants:** \`${eventData.participants.size}\``,
                                `📍 **Status:** ${eventData.status}`,
                                '',
                                '━━━━━━━━━━━━━━━━━━━━',
                                '',
                                participantList
                            ].join('\n'),

                        thumbnail:
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
                                })
                    });

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
                            `This event is already marked as **${eventData.status}**.`
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
                action === 'join'
            ) {
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

                eventData.participants.add(
                    interaction.user.id
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
                                `👥 Current Participants: \`${eventData.participants.size}\``,
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
                    `👥 Participants: ${eventData.participants.size}`
                );

                console.log(
                    '======================================'
                );

                return;
            }

            /*
             * LEAVE EVENT
             */
            if (
                action === 'leave'
            ) {
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
                                `👥 Current Participants: \`${eventData.participants.size}\``
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
                    `👥 Participants: ${eventData.participants.size}`
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
                        'Umbra does not recognize this event button.'
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Umbra event interaction error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event Action Failed',
                    'Umbra could not complete this event action. Please try again.'
                );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
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
        }
    }
};
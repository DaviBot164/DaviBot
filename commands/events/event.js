const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
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
    createErrorEmbed
} = require('../../utils/embeds');

/**
 * Ensure the Event System storage exists.
 *
 * Events are temporarily stored in memory.
 * PostgreSQL persistence will be added later.
 *
 * @param {import('discord.js').Client} client
 * @returns {Map<string, Object>}
 */
function getEventStorage(client) {
    if (
        !client.umbraEvents ||
        !(client.umbraEvents instanceof Map)
    ) {
        client.umbraEvents =
            new Map();
    }

    return client.umbraEvents;
}

/**
 * Generate a short readable event ID.
 *
 * @returns {string}
 */
function createEventId() {
    return randomUUID()
        .replaceAll('-', '')
        .slice(0, 10);
}

/**
 * Find an event by ID inside the current guild.
 *
 * @param {Map<string, Object>} storage
 * @param {string} eventId
 * @param {string} guildId
 * @returns {Object|null}
 */
function findGuildEvent(
    storage,
    eventId,
    guildId
) {
    const eventData =
        storage.get(eventId);

    if (
        !eventData ||
        eventData.guildId !== guildId
    ) {
        return null;
    }

    return eventData;
}

/**
 * Create the buttons used beneath an event.
 *
 * @param {string} eventId
 * @param {boolean} disabled
 * @returns {ActionRowBuilder}
 */
function createEventButtons(
    eventId,
    disabled = false
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:join:${eventId}`
                )
                .setLabel(
                    'Join Event'
                )
                .setEmoji('✅')
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:leave:${eventId}`
                )
                .setLabel(
                    'Leave Event'
                )
                .setEmoji('❌')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:participants:${eventId}`
                )
                .setLabel(
                    'Participants'
                )
                .setEmoji('👥')
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

/**
 * Build the main Event embed.
 *
 * @param {Object} options
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEventEmbed({
    eventId,
    title,
    description,
    time,
    reward,
    host,
    participantCount = 0,
    status = 'Active'
}) {
    const statusIcon =
        status === 'Active'
            ? '🟢'
            : status === 'Ended'
                ? '🏁'
                : '🔴';

    return createEmbed({
        title:
            `🎉 ${title}`,

        description:
            [
                description,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `🕒 **Time:** ${time}`,
                `🎁 **Reward:** ${reward}`,
                `⚔️ **Host:** ${host}`,
                `👥 **Participants:** \`${participantCount}\``,
                `${statusIcon} **Status:** ${status}`,
                '',
                `🆔 **Event ID:** \`${eventId}\``,
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
                        'Create a new Crimson Eclipse event.'
                    )

                    .addStringOption(option =>
                        option
                            .setName('title')
                            .setDescription(
                                'The title of the event'
                            )
                            .setMaxLength(100)
                            .setRequired(true)
                    )

                    .addStringOption(option =>
                        option
                            .setName('description')
                            .setDescription(
                                'Explain what will happen during the event'
                            )
                            .setMaxLength(1000)
                            .setRequired(true)
                    )

                    .addStringOption(option =>
                        option
                            .setName('time')
                            .setDescription(
                                'When the event will begin'
                            )
                            .setMaxLength(100)
                            .setRequired(true)
                    )

                    .addStringOption(option =>
                        option
                            .setName('reward')
                            .setDescription(
                                'The reward for the event'
                            )
                            .setMaxLength(200)
                            .setRequired(true)
                    )

                    .addChannelOption(option =>
                        option
                            .setName('channel')
                            .setDescription(
                                'The channel where the event will be published'
                            )
                            .addChannelTypes(
                                ChannelType.GuildText,
                                ChannelType.GuildAnnouncement
                            )
                            .setRequired(false)
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

            const storage =
                getEventStorage(
                    interaction.client
                );

            const subcommand =
                interaction.options
                    .getSubcommand();

            /*
             * CREATE EVENT
             */
            if (subcommand === 'create') {
                const title =
                    interaction.options
                        .getString(
                            'title',
                            true
                        );

                const description =
                    interaction.options
                        .getString(
                            'description',
                            true
                        );

                const time =
                    interaction.options
                        .getString(
                            'time',
                            true
                        );

                const reward =
                    interaction.options
                        .getString(
                            'reward',
                            true
                        );

                const targetChannel =
                    interaction.options
                        .getChannel(
                            'channel'
                        ) ||
                    interaction.channel;

                if (
                    !targetChannel ||
                    !targetChannel.isTextBased()
                ) {
                    await interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Invalid Event Channel',
                                'Umbra could not publish the event in that channel.'
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
                    targetChannel.permissionsFor(
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
                                '❌ Missing Permissions',
                                `Umbra needs **View Channel**, **Send Messages**, and **Embed Links** permissions in ${targetChannel}.`
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

                const eventId =
                    createEventId();

                const eventEmbed =
                    buildEventEmbed({
                        eventId,
                        title,
                        description,
                        time,
                        reward,
                        host:
                            interaction.user,
                        participantCount:
                            0,
                        status:
                            'Active'
                    });

                const eventMessage =
                    await targetChannel.send({
                        embeds:
                            [eventEmbed],

                        components: [
                            createEventButtons(
                                eventId
                            )
                        ]
                    });

                storage.set(
                    eventId,
                    {
                        id:
                            eventId,

                        guildId:
                            interaction.guild.id,

                        channelId:
                            targetChannel.id,

                        messageId:
                            eventMessage.id,

                        hostId:
                            interaction.user.id,

                        title,
                        description,
                        time,
                        reward,

                        status:
                            'Active',

                        participants:
                            new Set(),

                        createdAt:
                            Date.now()
                    }
                );

                await interaction.editReply({
                    embeds: [
                        createSuccessEmbed(
                            '✅ Event Published',
                            [
                                `The event **${title}** was published successfully in ${targetChannel}.`,
                                '',
                                `🆔 Event ID: \`${eventId}\``
                            ].join('\n')
                        )
                    ]
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
                    `📍 Channel: ${targetChannel.name}`
                );

                console.log(
                    '======================================'
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
                subcommand ===
                'participants'
            ) {
                const participantIds =
                    Array.from(
                        eventData.participants
                    );

                const participantList =
                    participantIds.length > 0
                        ? participantIds
                            .map(
                                (
                                    userId,
                                    index
                                ) =>
                                    `${index + 1}. <@${userId}>`
                            )
                            .join('\n')
                        : 'No Souls have joined this event yet.';

                const participantsEmbed =
                    createEmbed({
                        title:
                            `👥 Participants • ${eventData.title}`,

                        description:
                            [
                                `🆔 **Event ID:** \`${eventData.id}\``,
                                `📜 **Total Participants:** \`${participantIds.length}\``,
                                '',
                                participantList
                            ].join('\n')
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
             * END OR CANCEL EVENT
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

            const newStatus =
                subcommand === 'end'
                    ? 'Ended'
                    : 'Cancelled';

            eventData.status =
                newStatus;

            const eventChannel =
                await interaction.guild.channels
                    .fetch(
                        eventData.channelId
                    )
                    .catch(
                        () => null
                    );

            const eventMessage =
                eventChannel?.isTextBased()
                    ? await eventChannel.messages
                        .fetch(
                            eventData.messageId
                        )
                        .catch(
                            () => null
                        )
                    : null;

            const host =
                await interaction.client.users
                    .fetch(
                        eventData.hostId
                    )
                    .catch(
                        () =>
                            interaction.user
                    );

            if (eventMessage) {
                const updatedEmbed =
                    buildEventEmbed({
                        eventId:
                            eventData.id,

                        title:
                            eventData.title,

                        description:
                            eventData.description,

                        time:
                            eventData.time,

                        reward:
                            eventData.reward,

                        host,

                        participantCount:
                            eventData
                                .participants
                                .size,

                        status:
                            newStatus
                    });

                await eventMessage.edit({
                    embeds:
                        [updatedEmbed],

                    components: [
                        createEventButtons(
                            eventData.id,
                            true
                        )
                    ]
                });
            }

            const resultTitle =
                newStatus === 'Ended'
                    ? '🏁 Event Ended'
                    : '🚫 Event Cancelled';

            const resultDescription =
                newStatus === 'Ended'
                    ? [
                        `The event **${eventData.title}** has officially ended.`,
                        '',
                        `👥 Final Participants: \`${eventData.participants.size}\``
                    ].join('\n')
                    : [
                        `The event **${eventData.title}** has been cancelled.`,
                        '',
                        'Members can no longer join this event.'
                    ].join('\n');

            await interaction.reply({
                embeds: [
                    createSuccessEmbed(
                        resultTitle,
                        resultDescription
                    )
                ],

                flags:
                    MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Umbra Event System error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Event System Failed',
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
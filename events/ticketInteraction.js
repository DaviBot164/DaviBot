const {
    Events,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const {
    createTicketChannelName,
    createClosedTicketChannelName,
    createReopenedTicketChannelName,
    createTicketTopic,
    findOpenTicket,
    createOpenTicketButtons,
    createCloseConfirmationButtons,
    createClosedTicketButtons,
    createDeleteConfirmationButtons,
    createTicketPermissionOverwrites,
    parseTicketTopic,
    isTicketStaff
} = require('../utils/tickets');

const ticketConfig =
    require('../config/tickets');

/**
 * Send a safe ephemeral ticket error response.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} title
 * @param {string} description
 * @returns {Promise<void>}
 */
async function sendTicketError(
    interaction,
    title,
    description
) {
    const errorEmbed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [errorEmbed],
            components: []
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            flags: MessageFlags.Ephemeral,
            embeds: [errorEmbed]
        });

        return;
    }

    await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [errorEmbed]
    });
}

/**
 * Validate the current ticket channel.
 *
 * Ticket topic parsing is handled by utils/tickets.js.
 * This keeps support for both Umbra and older DaviBot tickets.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} expectedOwnerId
 * @returns {{ownerId: string, status: 'open'|'closed'}|null}
 */
function validateTicketChannel(
    interaction,
    expectedOwnerId
) {
    if (
        !interaction.channel ||
        interaction.channel.type !==
            ChannelType.GuildText
    ) {
        return null;
    }

    const ticketData =
        parseTicketTopic(
            interaction.channel.topic
        );

    if (
        !ticketData ||
        ticketData.ownerId !== expectedOwnerId
    ) {
        return null;
    }

    return ticketData;
}

/**
 * Handle the Create Ticket button.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} categoryId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
 */
async function handleCreateTicket(
    interaction,
    categoryId,
    staffRoleId
) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    if (!interaction.inGuild()) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only Action',
                    'Tickets can only be created inside a server.'
                )
            ]
        });

        return;
    }

    const category =
        interaction.guild.channels.cache.get(
            categoryId
        );

    const staffRole =
        interaction.guild.roles.cache.get(
            staffRoleId
        );

    if (
        !category ||
        category.type !==
            ChannelType.GuildCategory
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Category Missing',
                    'The configured ticket category no longer exists. Please ask an administrator to create a new ticket panel.'
                )
            ]
        });

        return;
    }

    if (!staffRole) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Shadow Warden Role Missing',
                    'The configured Shadow Wardens role no longer exists. Please ask an administrator to create a new ticket panel.'
                )
            ]
        });

        return;
    }

    const existingTicket =
        findOpenTicket(
            interaction.guild,
            interaction.user.id
        );

    if (existingTicket) {
        await interaction.editReply({
            embeds: [
                createWarningEmbed(
                    '⚠️ Ticket Already Open',
                    `You already have an open ticket: ${existingTicket}`
                )
            ]
        });

        return;
    }

    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Umbra Unavailable',
                    'Umbra could not access its server member information.'
                )
            ]
        });

        return;
    }

    if (
        !botMember.permissions.has(
            PermissionFlagsBits.ManageChannels
        )
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Umbra Permission',
                    'Umbra requires the **Manage Channels** permission to create tickets.'
                )
            ]
        });

        return;
    }

    try {
        const ticketChannel =
            await interaction.guild.channels.create({
                name:
                    createTicketChannelName(
                        interaction.user
                    ),

                type:
                    ChannelType.GuildText,

                parent:
                    category.id,

                topic:
                    createTicketTopic(
                        interaction.user.id,
                        'open'
                    ),

                permissionOverwrites:
                    createTicketPermissionOverwrites(
                        interaction.guild,
                        interaction.user.id,
                        staffRole.id,
                        botMember.id
                    ),

                reason:
                    `Ticket created by ${interaction.user.tag} (${interaction.user.id})`
            });

        const openedAt =
            Math.floor(
                Date.now() / 1_000
            );

        const ticketEmbed =
            createEmbed({
                title:
                    ticketConfig.ticket.title,

                description:
                    `${interaction.user}, your ticket has been created successfully.\n\n` +
                    ticketConfig.ticket.description,

                thumbnail:
                    interaction.user.displayAvatarURL({
                        size: 256,
                        forceStatic: false
                    }),

                fields: [
                    {
                        name:
                            '🌑 Soul',

                        value:
                            `${interaction.user.tag}\n` +
                            `\`${interaction.user.id}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🛡️ Shadow Wardens',

                        value:
                            `${staffRole}`,

                        inline:
                            true
                    },
                    {
                        name:
                            '🟢 Status',

                        value:
                            'Open',

                        inline:
                            true
                    },
                    {
                        name:
                            '🕒 Opened At',

                        value:
                            `<t:${openedAt}:F>`,

                        inline:
                            false
                    }
                ]
            });

        const controlButtons =
            createOpenTicketButtons(
                interaction.user.id,
                staffRole.id
            );

        await ticketChannel.send({
            content:
                `${interaction.user} ${staffRole}`,

            embeds:
                [ticketEmbed],

            components:
                [controlButtons],

            allowedMentions: {
                users:
                    [interaction.user.id],

                roles:
                    [staffRole.id]
            }
        });

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Created',
                    `Your private Las Noches support ticket has been created: ${ticketChannel}`
                )
            ]
        });

        console.log(
            '======================================'
        );

        console.log(
            `🎫 Ticket Created: ${ticketChannel.name}`
        );

        console.log(
            `🌑 Soul: ${interaction.user.tag}`
        );

        console.log(
            `🏰 Server: ${interaction.guild.name}`
        );

        console.log(
            '======================================'
        );
    } catch (error) {
        console.error(
            '❌ Failed to create ticket:'
        );

        console.error(error);

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Creation Failed',
                    'Your ticket could not be created. Please contact a Shadow Warden or server administrator.'
                )
            ]
        });
    }
}/**
 * Show Close Ticket confirmation.
 *
 * The ticket owner or Shadow Wardens may request closure.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
 */
async function handleCloseTicket(
    interaction,
    ownerId,
    staffRoleId
) {
    const ticketData =
        validateTicketChannel(
            interaction,
            ownerId
        );

    if (
        !ticketData ||
        ticketData.status !== 'open'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This channel is not recognized as an open Umbra ticket.'
        );

        return;
    }

    const member =
        interaction.member;

    const canClose =
        interaction.user.id === ownerId ||
        isTicketStaff(
            member,
            staffRoleId
        );

    if (!canClose) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only the ticket owner or Shadow Wardens can close this ticket.'
        );

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            createWarningEmbed(
                '🔒 Close Ticket?',
                'Are you sure you want to close this ticket?\n\n' +
                'The ticket owner will no longer be able to send messages until the ticket is reopened.'
            )
        ],

        components: [
            createCloseConfirmationButtons(
                ownerId,
                staffRoleId
            )
        ]
    });
}

/**
 * Cancel Close Ticket confirmation.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleCancelClose(
    interaction
) {
    await interaction.update({
        embeds: [
            createSuccessEmbed(
                '✅ Closure Cancelled',
                'The ticket will remain open.'
            )
        ],

        components: []
    });
}

/**
 * Confirm and close the ticket.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
 */
async function handleConfirmClose(
    interaction,
    ownerId,
    staffRoleId
) {
    const ticketData =
        validateTicketChannel(
            interaction,
            ownerId
        );

    if (
        !ticketData ||
        ticketData.status !== 'open'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This ticket is already closed or is no longer valid.'
        );

        return;
    }

    const member =
        interaction.member;

    const canClose =
        interaction.user.id === ownerId ||
        isTicketStaff(
            member,
            staffRoleId
        );

    if (!canClose) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only the ticket owner or Shadow Wardens can close this ticket.'
        );

        return;
    }

    await interaction.deferUpdate();

    const channel =
        interaction.channel;

    try {
        await channel.permissionOverwrites.edit(
            ownerId,
            {
                ViewChannel: true,
                SendMessages: false,
                AddReactions: false,
                AttachFiles: false
            },
            {
                reason:
                    `Ticket closed by ${interaction.user.tag}`
            }
        );

        await channel.edit({
            name:
                createClosedTicketChannelName(
                    channel.name
                ),

            topic:
                createTicketTopic(
                    ownerId,
                    'closed'
                ),

            reason:
                `Ticket closed by ${interaction.user.tag}`
        });

        const closedAt =
            Math.floor(
                Date.now() / 1_000
            );

        const closedEmbed =
            createWarningEmbed(
                '🔒 Ticket Closed',
                `This ticket was closed by ${interaction.user}.\n\n` +
                `**Closed at:** <t:${closedAt}:F>\n` +
                'Shadow Wardens can reopen or delete this ticket.'
            );

        await channel.send({
            embeds:
                [closedEmbed],

            components: [
                createClosedTicketButtons(
                    ownerId,
                    staffRoleId
                )
            ]
        });

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Closed',
                    'The ticket was closed successfully.'
                )
            ],

            components: []
        });

        console.log(
            '======================================'
        );

        console.log(
            `🔒 Ticket Closed: ${channel.name}`
        );

        console.log(
            `🛡️ Closed By: ${interaction.user.tag}`
        );

        console.log(
            '======================================'
        );
    } catch (error) {
        console.error(
            '❌ Failed to close ticket:'
        );

        console.error(error);

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Close Failed',
                    'The ticket could not be closed. Please check Umbra permissions.'
                )
            ],

            components: []
        });
    }
}/**
 * Reopen a closed ticket.
 *
 * Only Shadow Wardens may reopen tickets.
 */
async function handleReopenTicket(
    interaction,
    ownerId,
    staffRoleId
) {
    const ticketData =
        validateTicketChannel(
            interaction,
            ownerId
        );

    if (
        !ticketData ||
        ticketData.status !== 'closed'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This channel is not recognized as a closed Umbra ticket.'
        );

        return;
    }

    if (
        !isTicketStaff(
            interaction.member,
            staffRoleId
        )
    ) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only Shadow Wardens can reopen tickets.'
        );

        return;
    }

    await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
            createWarningEmbed(
                '⏳ Reopening Ticket',
                'Please wait while Umbra restores this ticket.'
            )
        ]
    });

    try {

        const channel =
            await interaction.guild.channels.fetch(
                interaction.channelId
            );

        const reopenedName =
            createReopenedTicketChannelName(
                channel.name
            );

        await channel.permissionOverwrites.edit(
            ownerId,
            {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true,
                AddReactions: true
            }
        );

        await channel.edit({

            name: reopenedName,

            topic:
                createTicketTopic(
                    ownerId,
                    'open'
                )
        });

        const reopenedAt =
            Math.floor(Date.now() / 1000);

        await channel.send({

            content: `<@${ownerId}>`,

            embeds: [
                createSuccessEmbed(
                    '🔓 Ticket Reopened',
                    `This ticket was reopened by ${interaction.user}.\n\n**Reopened at:** <t:${reopenedAt}:F>`
                )
            ],

            components: [
                createOpenTicketButtons(
                    ownerId,
                    staffRoleId
                )
            ],

            allowedMentions: {
                users: [ownerId]
            }

        });

        await interaction.editReply({

            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Reopened',
                    'The ticket was reopened successfully.'
                )
            ],

            components: []

        });

    } catch (error) {

        console.error(
            '❌ Failed to reopen ticket:'
        );

        console.error(error);

        await interaction.editReply({

            embeds: [
                createErrorEmbed(
                    '❌ Reopen Failed',
                    'The ticket could not be reopened.'
                )
            ],

            components: []

        });

    }

}

/**
 * Show Delete Ticket confirmation.
 *
 * Only Shadow Wardens may delete tickets.
 */
async function handleDeleteTicket(
    interaction,
    ownerId,
    staffRoleId
) {

    const ticketData =
        validateTicketChannel(
            interaction,
            ownerId
        );

    if (
        !ticketData ||
        ticketData.status !== 'closed'
    ) {

        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'Only closed tickets can be deleted.'
        );

        return;

    }

    if (
        !isTicketStaff(
            interaction.member,
            staffRoleId
        )
    ) {

        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only Shadow Wardens can delete tickets.'
        );

        return;

    }

    await interaction.reply({

        flags: MessageFlags.Ephemeral,

        embeds: [

            createWarningEmbed(
                '🗑️ Delete Ticket?',
                'Are you sure you want to permanently delete this ticket?\n\n**This action cannot be undone.**'
            )

        ],

        components: [

            createDeleteConfirmationButtons(
                ownerId,
                staffRoleId
            )

        ]

    });

}/**
 * Cancel Delete Ticket confirmation.
 */
async function handleCancelDelete(
    interaction
) {
    await interaction.update({
        embeds: [
            createSuccessEmbed(
                '✅ Deletion Cancelled',
                'The ticket was not deleted.'
            )
        ],

        components: []
    });
}

/**
 * Permanently delete a closed ticket.
 *
 * Only Shadow Wardens may confirm deletion.
 */
async function handleConfirmDelete(
    interaction,
    ownerId,
    staffRoleId
) {
    const ticketData =
        validateTicketChannel(
            interaction,
            ownerId
        );

    if (
        !ticketData ||
        ticketData.status !== 'closed'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'Only closed tickets can be deleted.'
        );

        return;
    }

    if (
        !isTicketStaff(
            interaction.member,
            staffRoleId
        )
    ) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only Shadow Wardens can delete tickets.'
        );

        return;
    }

    await interaction.update({
        embeds: [
            createWarningEmbed(
                '🗑️ Deleting Ticket',
                'This ticket will be permanently deleted in 5 seconds.'
            )
        ],

        components: []
    });

    const channel =
        interaction.channel;

    const channelName =
        channel.name;

    const deletedBy =
        interaction.user.tag;

    const deleteTimer =
        setTimeout(
            async () => {
                try {
                    await channel.delete(
                        `Ticket deleted by ${deletedBy}`
                    );

                    console.log(
                        '======================================'
                    );

                    console.log(
                        `🗑️ Ticket Deleted: ${channelName}`
                    );

                    console.log(
                        `🛡️ Deleted By: ${deletedBy}`
                    );

                    console.log(
                        '======================================'
                    );
                } catch (error) {
                    console.error(
                        '❌ Failed to delete ticket:'
                    );

                    console.error(error);
                }
            },

            5_000
        );

    if (
        typeof deleteTimer.unref ===
        'function'
    ) {
        deleteTimer.unref();
    }
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra ticket button interactions.
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
                'ticket:'
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
                customIdParts[1];

            const ownerId =
                customIdParts[2];

            const staffRoleId =
                customIdParts[3];

            switch (action) {
                case 'create': {
                    const categoryId =
                        customIdParts[2];

                    const createStaffRoleId =
                        customIdParts[3];

                    await handleCreateTicket(
                        interaction,
                        categoryId,
                        createStaffRoleId
                    );

                    break;
                }

                case 'close':
                    await handleCloseTicket(
                        interaction,
                        ownerId,
                        staffRoleId
                    );
                    break;

                case 'confirm-close':
                    await handleConfirmClose(
                        interaction,
                        ownerId,
                        staffRoleId
                    );
                    break;

                case 'cancel-close':
                    await handleCancelClose(
                        interaction
                    );
                    break;

                case 'reopen':
                    await handleReopenTicket(
                        interaction,
                        ownerId,
                        staffRoleId
                    );
                    break;

                case 'delete':
                    await handleDeleteTicket(
                        interaction,
                        ownerId,
                        staffRoleId
                    );
                    break;

                case 'confirm-delete':
                    await handleConfirmDelete(
                        interaction,
                        ownerId,
                        staffRoleId
                    );
                    break;

                case 'cancel-delete':
                    await handleCancelDelete(
                        interaction
                    );
                    break;

                default:
                    await sendTicketError(
                        interaction,
                        '❌ Unknown Ticket Action',
                        'This ticket button is no longer supported.'
                    );
            }
        } catch (error) {
            console.error(
                '❌ Umbra ticket interaction error:'
            );

            console.error(error);

            try {
                await sendTicketError(
                    interaction,
                    '❌ Ticket System Error',
                    'An unexpected error occurred while processing this ticket action.'
                );
            } catch (responseError) {
                console.error(
                    '❌ Failed to send ticket interaction error response:'
                );

                console.error(
                    responseError
                );
            }
        }
    }
};
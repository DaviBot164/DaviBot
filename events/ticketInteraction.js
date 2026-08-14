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
 * Send a safe ticket error.
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
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (
        interaction.deferred
    ) {
        await interaction.editReply({
            embeds: [
                embed
            ],

            components:
                []
        });

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction.followUp({
            embeds: [
                embed
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            embed
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

/**
 * Validate a ticket channel.
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
        ticketData.ownerId !==
            expectedOwnerId
    ) {
        return null;
    }

    return ticketData;
}

/**
 * Create a new support ticket.
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
        flags:
            MessageFlags.Ephemeral
    });

    if (
        !interaction.inGuild()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Server Only',
                    'Tickets can only be created inside the server.'
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
                    '❌ Category Missing',
                    'The configured ticket category is unavailable.'
                )
            ]
        });

        return;
    }

    if (
        !staffRole
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Staff Role Missing',
                    'The configured ticket staff role is unavailable.'
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

    if (
        existingTicket
    ) {
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

    if (
        !botMember
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Evelynn Unavailable',
                    'Evelynn could not access the server.'
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
                    '❌ Missing Permission',
                    'Evelynn requires **Manage Channels** to create tickets.'
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
                    `Ticket created by ${interaction.user.tag}`
            });

        const ticketEmbed =
            createEmbed({
                title:
                    ticketConfig.ticket.title,

                description:
                    [
                        `${interaction.user}, your private ticket is ready.`,
                        '',
                        ticketConfig.ticket.description
                    ].join('\n'),

                thumbnail:
                    interaction.user
                        .displayAvatarURL({
                            size:
                                256,

                            forceStatic:
                                false
                        }),

                fields: [
                    {
                        name:
                            '✦・MEMBER',

                        value:
                            `${interaction.user}`,

                        inline:
                            true
                    },

                    {
                        name:
                            '🛡️・STAFF',

                        value:
                            `${staffRole}`,

                        inline:
                            true
                    },

                    {
                        name:
                            '●・STATUS',

                        value:
                            'Open',

                        inline:
                            true
                    }
                ]
            });

        await ticketChannel.send({
            content:
                `${interaction.user} ${staffRole}`,

            embeds: [
                ticketEmbed
            ],

            components: [
                createOpenTicketButtons(
                    interaction.user.id,
                    staffRole.id
                )
            ],

            allowedMentions: {
                users: [
                    interaction.user.id
                ],

                roles: [
                    staffRole.id
                ]
            }
        });

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Created',
                    `Your ticket is ready: ${ticketChannel}`
                )
            ]
        });

        console.log(
            `🎫 Ticket created: ${ticketChannel.name} • ${interaction.user.tag}`
        );
    } catch (error) {
        console.error(
            '❌ Ticket creation failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Creation Failed',
                    'The ticket could not be created.'
                )
            ]
        });
    }
}/**
 * Ask for ticket close confirmation.
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
        ticketData.status !==
            'open'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This channel is not recognized as an open ticket.'
        );

        return;
    }

    const canClose =
        interaction.user.id ===
            ownerId ||
        isTicketStaff(
            interaction.member,
            staffRoleId
        );

    if (
        !canClose
    ) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only the ticket owner or Staff can close this ticket.'
        );

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            createWarningEmbed(
                '🔒 Close Ticket?',
                'Are you sure you want to close this ticket?'
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
 * Cancel ticket closure.
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

        components:
            []
    });
}

/**
 * Close an open ticket.
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
        ticketData.status !==
            'open'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This ticket is already closed or no longer valid.'
        );

        return;
    }

    const canClose =
        interaction.user.id ===
            ownerId ||
        isTicketStaff(
            interaction.member,
            staffRoleId
        );

    if (
        !canClose
    ) {
        await sendTicketError(
            interaction,
            '❌ Permission Denied',
            'Only the ticket owner or Staff can close this ticket.'
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
                ViewChannel:
                    true,

                SendMessages:
                    false,

                AddReactions:
                    false,

                AttachFiles:
                    false
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

        await channel.send({
            embeds: [
                createWarningEmbed(
                    '🔒 Ticket Closed',
                    `Closed by ${interaction.user}.`
                )
            ],

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

            components:
                []
        });

        console.log(
            `🔒 Ticket closed: ${channel.name} • ${interaction.user.tag}`
        );
    } catch (error) {
        console.error(
            '❌ Ticket close failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Close Failed',
                    'Evelynn could not close this ticket.'
                )
            ],

            components:
                []
        });
    }
}

/**
 * Reopen a closed ticket.
 *
 * Staff only.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
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
        ticketData.status !==
            'closed'
    ) {
        await sendTicketError(
            interaction,
            '❌ Invalid Ticket',
            'This channel is not recognized as a closed ticket.'
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
            'Only Staff can reopen tickets.'
        );

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            createWarningEmbed(
                '⏳ Reopening Ticket',
                'Evelynn is reopening this ticket.'
            )
        ]
    });

    try {
        const channel =
            await interaction.guild.channels.fetch(
                interaction.channelId
            );

        await channel.permissionOverwrites.edit(
            ownerId,
            {
                ViewChannel:
                    true,

                SendMessages:
                    true,

                ReadMessageHistory:
                    true,

                AttachFiles:
                    true,

                EmbedLinks:
                    true,

                AddReactions:
                    true
            }
        );

        await channel.edit({
            name:
                createReopenedTicketChannelName(
                    channel.name
                ),

            topic:
                createTicketTopic(
                    ownerId,
                    'open'
                )
        });

        await channel.send({
            content:
                `<@${ownerId}>`,

            embeds: [
                createSuccessEmbed(
                    '🔓 Ticket Reopened',
                    `Reopened by ${interaction.user}.`
                )
            ],

            components: [
                createOpenTicketButtons(
                    ownerId,
                    staffRoleId
                )
            ],

            allowedMentions: {
                users: [
                    ownerId
                ]
            }
        });

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Reopened',
                    'The ticket was reopened successfully.'
                )
            ],

            components:
                []
        });

        console.log(
            `🔓 Ticket reopened: ${channel.name} • ${interaction.user.tag}`
        );
    } catch (error) {
        console.error(
            '❌ Ticket reopen failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Reopen Failed',
                    'Evelynn could not reopen this ticket.'
                )
            ],

            components:
                []
        });
    }
}/**
 * Ask for ticket delete confirmation.
 *
 * Staff only.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
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
        ticketData.status !==
            'closed'
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
            'Only Staff can delete tickets.'
        );

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            createWarningEmbed(
                '🗑️ Delete Ticket?',
                'This ticket will be permanently deleted.'
            )
        ],

        components: [
            createDeleteConfirmationButtons(
                ownerId,
                staffRoleId
            )
        ]
    });
}

/**
 * Cancel ticket deletion.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
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

        components:
            []
    });
}

/**
 * Permanently delete a closed ticket.
 *
 * Staff only.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @param {string} staffRoleId
 * @returns {Promise<void>}
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
        ticketData.status !==
            'closed'
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
            'Only Staff can delete tickets.'
        );

        return;
    }

    await interaction.update({
        embeds: [
            createWarningEmbed(
                '🗑️ Deleting Ticket',
                'This ticket will be deleted in 5 seconds.'
            )
        ],

        components:
            []
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
                        `🗑️ Ticket deleted: ${channelName} • ${deletedBy}`
                    );
                } catch (error) {
                    console.error(
                        '❌ Ticket deletion failed:',
                        error
                    );
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
     * Handle ticket button interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        if (
            !interaction.isButton() ||
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

            switch (
                action
            ) {
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
                        'This ticket action is no longer supported.'
                    );
            }
        } catch (error) {
            console.error(
                '❌ Evelynn ticket interaction error:',
                error
            );

            try {
                await sendTicketError(
                    interaction,
                    '❌ Ticket System Error',
                    'Evelynn could not complete this ticket action.'
                );
            } catch (responseError) {
                console.error(
                    '❌ Ticket error response failed:',
                    responseError
                );
            }
        }
    }
};
const {
    MessageFlags
} = require('discord.js');

const {
    TICKET_COMPONENT_IDS,
    buildTicketCategoryComponents,
    buildOpenTicketComponents,
    buildClosedTicketComponents
} = require('../utils/ticketComponents');

const {
    createMemberTicket,
    closeMemberTicket,
    reopenMemberTicket,
    prepareTicketDeletion,
    isTicketStaff
} = require('./ticketService');

const {
    createEmbed,
    successEmbed,
    errorEmbed
} = require('../utils/embeds');

const {
    sendTicketLog
} = require('../utils/ticketLogs');

async function handleOpenButton(
    interaction
) {
    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            createEmbed(
                'Open a Ticket',
                'Choose the category that best matches your request.'
            )
        ],

        components:
            buildTicketCategoryComponents()
    });
}

async function handleCategorySelect(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const categoryId =
        interaction.values[0];

    let result;

    try {
        result =
            await createMemberTicket(
                interaction.member,
                categoryId
            );
    } catch (error) {
        console.error(
            'Ticket creation failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Ticket Failed',
                    'Akane could not create your ticket.'
                )
            ],
            components: []
        });

        return;
    }

    if (result.status === 'exists') {
        const channel =
            result.ticket?.channelId
                ? interaction.guild.channels.cache.get(
                    result.ticket.channelId
                )
                : null;

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Ticket Already Open',
                    channel
                        ? `You already have an open ticket: ${channel}`
                        : 'You already have an open ticket.'
                )
            ],
            components: []
        });

        return;
    }

    const {
        ticket,
        channel,
        category
    } = result;

    await channel.send({
        content:
            `${interaction.user}`,

        embeds: [
            createEmbed(
                `${category.emoji} ${category.name} Ticket`,
                [
                    `${interaction.user}, your ticket is now open.`,
                    '',
                    `**Ticket:** #${ticket.id}`,
                    `**Category:** ${category.name}`,
                    '',
                    'Describe your request clearly and a staff member will assist you.',
                    '',
                    'Use the button below when the ticket is resolved.'
                ].join('\n')
            )
        ],

        components:
            buildOpenTicketComponents()
    });

    await sendTicketLog(
        interaction.guild,
        {
            title:
                'Ticket Created',

            ticket,

            actor:
                interaction.user,

            description:
                `${interaction.user} opened ${channel}.`
        }
    ).catch(error => {
        console.error(
            'Ticket log failed:',
            error
        );
    });

    await interaction.editReply({
        embeds: [
            successEmbed(
                'Ticket Created',
                `Your private ticket is ready: ${channel}`
            )
        ],
        components: []
    });
}

async function handleCloseButton(
    interaction
) {
    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    let ticket;

    try {
        ticket =
            await closeMemberTicket(
                interaction.channel,
                interaction.member
            );
    } catch (error) {
        console.error(
            'Ticket close failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Close Failed',
                    'Akane could not close this ticket.'
                )
            ]
        });

        return;
    }

    if (!ticket) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Ticket Unavailable',
                    'This ticket is already closed or no longer exists.'
                )
            ]
        });

        return;
    }

    await interaction.message.edit({
        components:
            buildClosedTicketComponents()
    }).catch(() => null);

    await interaction.channel.send({
        embeds: [
            createEmbed(
                'Ticket Closed',
                [
                    `Closed by ${interaction.user}.`,
                    '',
                    'Staff may reopen or delete this ticket.'
                ].join('\n')
            )
        ]
    });

    await sendTicketLog(
        interaction.guild,
        {
            title:
                'Ticket Closed',

            ticket,

            actor:
                interaction.user,

            description:
                `${interaction.user} closed <#${interaction.channel.id}>.`
        }
    ).catch(error => {
        console.error(
            'Ticket log failed:',
            error
        );
    });

    await interaction.editReply({
        embeds: [
            successEmbed(
                'Ticket Closed',
                'The ticket has been closed.'
            )
        ]
    });
}

async function handleReopenButton(
    interaction
) {
    if (
        !isTicketStaff(
            interaction.member
        )
    ) {
        await interaction.reply({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                errorEmbed(
                    'Staff Only',
                    'Only Blood Moon staff can reopen tickets.'
                )
            ]
        });

        return;
    }

    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    let result;

    try {
        result =
            await reopenMemberTicket(
                interaction.channel,
                interaction.member
            );
    } catch (error) {
        console.error(
            'Ticket reopen failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Reopen Failed',
                    'Akane could not reopen this ticket.'
                )
            ]
        });

        return;
    }

    if (!result) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Ticket Unavailable',
                    'This ticket cannot be reopened.'
                )
            ]
        });

        return;
    }

    if (result.conflict) {
        const channel =
            result.ticket?.channelId
                ? interaction.guild.channels.cache.get(
                    result.ticket.channelId
                )
                : null;

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Open Ticket Exists',
                    channel
                        ? `This member already has another open ticket: ${channel}`
                        : 'This member already has another open ticket.'
                )
            ]
        });

        return;
    }

    const ticket =
        result.ticket;

    await interaction.message.edit({
        components:
            buildOpenTicketComponents()
    }).catch(() => null);

    await interaction.channel.send({
        embeds: [
            createEmbed(
                'Ticket Reopened',
                `Reopened by ${interaction.user}.`
            )
        ]
    });

    await sendTicketLog(
        interaction.guild,
        {
            title:
                'Ticket Reopened',

            ticket,

            actor:
                interaction.user,

            description:
                `${interaction.user} reopened <#${interaction.channel.id}>.`
        }
    ).catch(error => {
        console.error(
            'Ticket log failed:',
            error
        );
    });

    await interaction.editReply({
        embeds: [
            successEmbed(
                'Ticket Reopened',
                'The ticket is open again.'
            )
        ]
    });
}

async function handleDeleteButton(
    interaction
) {
    if (
        !isTicketStaff(
            interaction.member
        )
    ) {
        await interaction.reply({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                errorEmbed(
                    'Staff Only',
                    'Only Blood Moon staff can delete tickets.'
                )
            ]
        });

        return;
    }

    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const channel =
        interaction.channel;

    let ticket;

    try {
        ticket =
            await prepareTicketDeletion(
                channel,
                interaction.member
            );

        if (!ticket) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Ticket Unavailable',
                        'This ticket no longer exists.'
                    )
                ]
            });

            return;
        }

        await sendTicketLog(
            interaction.guild,
            {
                title:
                    'Ticket Deleted',

                ticket,

                actor:
                    interaction.user,

                description:
                    `${interaction.user} deleted ticket #${ticket.id}.`
            }
        );

        await interaction.editReply({
            embeds: [
                successEmbed(
                    'Ticket Deleted',
                    'The ticket channel is being deleted.'
                )
            ]
        });

        await channel.delete(
            `Ticket #${ticket.id} deleted by ${interaction.user.tag}`
        );
    } catch (error) {
        console.error(
            'Ticket deletion failed:',
            error
        );

        if (!channel?.deleted) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Delete Failed',
                        'Akane could not delete this ticket.'
                    )
                ]
            }).catch(() => null);
        }
    }
}

async function handleTicketInteraction(
    interaction
) {
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case TICKET_COMPONENT_IDS.open:
                await handleOpenButton(
                    interaction
                );

                return true;

            case TICKET_COMPONENT_IDS.close:
                await handleCloseButton(
                    interaction
                );

                return true;

            case TICKET_COMPONENT_IDS.reopen:
                await handleReopenButton(
                    interaction
                );

                return true;

            case TICKET_COMPONENT_IDS.delete:
                await handleDeleteButton(
                    interaction
                );

                return true;

            default:
                return false;
        }
    }

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
            TICKET_COMPONENT_IDS.category
    ) {
        await handleCategorySelect(
            interaction
        );

        return true;
    }

    return false;
}

module.exports = {
    handleTicketInteraction
};
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
    createTicketTopic,
    findOpenTicket,
    createTicketControlButtons,
    createTicketPermissionOverwrites,
    parseTicketTopic
} = require('../utils/tickets');

const ticketConfig =
    require('../config/tickets');

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
        category.type !== ChannelType.GuildCategory
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
                    '❌ Staff Role Missing',
                    'The configured ticket staff role no longer exists. Please ask an administrator to create a new ticket panel.'
                )
            ]
        });

        return;
    }

    const existingTicket = findOpenTicket(
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
                    '❌ Bot Member Not Found',
                    'DaviBot could not access its server member information.'
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
                    '❌ Missing Bot Permission',
                    'DaviBot requires the **Manage Channels** permission to create tickets.'
                )
            ]
        });

        return;
    }

    try {
        const ticketChannel =
            await interaction.guild.channels.create({
                name: createTicketChannelName(
                    interaction.user
                ),

                type: ChannelType.GuildText,

                parent: category.id,

                topic: createTicketTopic(
                    interaction.user.id
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
            Math.floor(Date.now() / 1000);

        const ticketEmbed = createEmbed({
            title: ticketConfig.ticket.title,

            description:
                `${interaction.user}, your ticket has been created successfully.\n\n` +
                ticketConfig.ticket.description,

            thumbnail:
                interaction.user.displayAvatarURL({
                    size: 256
                }),

            fields: [
                {
                    name: '👤 Ticket Owner',
                    value:
                        `${interaction.user.tag}\n` +
                        `\`${interaction.user.id}\``,
                    inline: true
                },
                {
                    name: '🛡️ Staff Role',
                    value: `${staffRole}`,
                    inline: true
                },
                {
                    name: '🕒 Opened At',
                    value: `<t:${openedAt}:F>`,
                    inline: false
                }
            ]
        });

        const controlButtons =
            createTicketControlButtons(
                interaction.user.id
            );

        await ticketChannel.send({
            content:
                `${interaction.user} ${staffRole}`,

            embeds: [ticketEmbed],

            components: [controlButtons],

            allowedMentions: {
                users: [interaction.user.id],
                roles: [staffRole.id]
            }
        });

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Ticket Created',
                    `Your private support ticket has been created: ${ticketChannel}`
                )
            ]
        });

        console.log('======================================');
        console.log(
            `🎫 Ticket Created: ${ticketChannel.name}`
        );
        console.log(
            `👤 Owner: ${interaction.user.tag}`
        );
        console.log(
            `🏰 Server: ${interaction.guild.name}`
        );
        console.log('======================================');
    } catch (error) {
        console.error(
            '❌ Failed to create ticket:'
        );
        console.error(error);

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Ticket Creation Failed',
                    'Your ticket could not be created. Please contact a server administrator.'
                )
            ]
        });
    }
}

/**
 * Handle the Close Ticket button.
 *
 * Full closing functionality will be added
 * in the next Ticket System stage.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {string} ownerId
 * @returns {Promise<void>}
 */
async function handleCloseTicket(
    interaction,
    ownerId
) {
    const ticketData =
        parseTicketTopic(interaction.channel?.topic);

    if (
        !ticketData ||
        ticketData.ownerId !== ownerId
    ) {
        await interaction.reply({
            flags: MessageFlags.Ephemeral,

            embeds: [
                createErrorEmbed(
                    '❌ Invalid Ticket',
                    'This channel is not recognized as a valid DaviBot ticket.'
                )
            ]
        });

        return;
    }

    await interaction.reply({
        flags: MessageFlags.Ephemeral,

        embeds: [
            createWarningEmbed(
                '🔒 Close Ticket',
                'The Close Ticket button is ready. Its full closing and confirmation system will be added in the next stage.'
            )
        ]
    });
}

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * Handle DaviBot ticket button interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (!interaction.isButton()) {
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
                interaction.customId.split(':');

            const action = customIdParts[1];

            if (action === 'create') {
                const categoryId =
                    customIdParts[2];

                const staffRoleId =
                    customIdParts[3];

                await handleCreateTicket(
                    interaction,
                    categoryId,
                    staffRoleId
                );

                return;
            }

            if (action === 'close') {
                const ownerId =
                    customIdParts[2];

                await handleCloseTicket(
                    interaction,
                    ownerId
                );
            }
        } catch (error) {
            console.error(
                '❌ Ticket interaction error:'
            );
            console.error(error);

            try {
                const errorEmbed =
                    createErrorEmbed(
                        '❌ Ticket System Error',
                        'An unexpected error occurred while processing this ticket action.'
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
                        flags:
                            MessageFlags.Ephemeral,

                        embeds: [errorEmbed]
                    });

                    return;
                }

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [errorEmbed]
                });
            } catch (responseError) {
                console.error(
                    '❌ Failed to send ticket interaction error response:'
                );
                console.error(responseError);
            }
        }
    }
};
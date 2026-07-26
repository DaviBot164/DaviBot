const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    createTicketPanelButtons
} = require('../../utils/tickets');

const ticketConfig =
    require('../../config/tickets');

module.exports = {
    category: 'tickets',

    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription(
            'Create the Umbra support panel in a selected channel.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )
        .setDMPermission(false)

        .addChannelOption(option =>
            option
                .setName('panel_channel')
                .setDescription(
                    'Channel where the ticket panel will be sent'
                )
                .addChannelTypes(
                    ChannelType.GuildText
                )
                .setRequired(true)
        )

        .addChannelOption(option =>
            option
                .setName('ticket_category')
                .setDescription(
                    'Category where ticket channels will be created'
                )
                .addChannelTypes(
                    ChannelType.GuildCategory
                )
                .setRequired(true)
        )

        .addRoleOption(option =>
            option
                .setName('staff_role')
                .setDescription(
                    'Shadow Warden role that can manage tickets'
                )
                .setRequired(true)
        ),

    /**
     * Execute the /ticketpanel command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        if (!interaction.inGuild()) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Order Only Command',
                        'This command can only be used inside a server.'
                    )
                ]
            });

            return;
        }

        const panelChannel =
            interaction.options.getChannel(
                'panel_channel',
                true
            );

        const ticketCategory =
            interaction.options.getChannel(
                'ticket_category',
                true
            );

        const staffRole =
            interaction.options.getRole(
                'staff_role',
                true
            );

        if (
            panelChannel.type !==
            ChannelType.GuildText
        ) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Invalid Panel Channel',
                        'The selected panel channel must be a text channel.'
                    )
                ]
            });

            return;
        }

        if (
            ticketCategory.type !==
            ChannelType.GuildCategory
        ) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Invalid Ticket Category',
                        'The selected ticket category is not valid.'
                    )
                ]
            });

            return;
        }

        if (
            staffRole.id ===
            interaction.guild.roles.everyone.id
        ) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Invalid Staff Role',
                        'The `@everyone` role cannot be used as the ticket staff role.'
                    )
                ]
            });

            return;
        }

        if (staffRole.managed) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Invalid Staff Role',
                        'Discord integration roles cannot be used as the ticket staff role.'
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
                        '❌ Umbra Member Not Found',
                        'Umbra could not access its server member information.'
                    )
                ]
            });

            return;
        }

        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageChannels
        ];

        if (
            !botMember.permissions.has(
                requiredPermissions
            )
        ) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Missing Umbra Permissions',
                        [
                            'Umbra requires the following permissions:',
                            '',
                            '• View Channels',
                            '• Send Messages',
                            '• Embed Links',
                            '• Manage Channels'
                        ].join('\n')
                    )
                ]
            });

            return;
        }

        const channelPermissions =
            panelChannel.permissionsFor(
                botMember
            );

        if (
            !channelPermissions?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ])
        ) {
            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Panel Channel Permission Error',
                        `Umbra cannot send embeds inside ${panelChannel}.`
                    )
                ]
            });

            return;
        }

        const panelEmbed =
            createEmbed({
                title:
                    ticketConfig.panel.title,

                description:
                    ticketConfig.panel.description,

                thumbnail:
                    interaction.guild.iconURL({
                        size: 256,
                        forceStatic: false
                    })
            });

        panelEmbed.setAuthor({
            name:
                'Umbra • Order Support',

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
        });

        const panelButtons =
            createTicketPanelButtons(
                ticketCategory.id,
                staffRole.id
            );

        try {
            await panelChannel.send({
                embeds: [
                    panelEmbed
                ],

                components: [
                    panelButtons
                ]
            });

            await interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        '✅ Umbra Support Panel Created',

                        [
                            `The support panel was successfully sent to ${panelChannel}.`,
                            '',
                            `**Ticket Category:** ${ticketCategory.name}`,
                            `**Shadow Warden Role:** ${staffRole}`,
                            '',
                            'Umbra is now ready to guide Souls who require assistance.'
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Failed to create Umbra ticket panel:'
            );

            console.error(error);

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Support Panel Failed',

                        'The support panel could not be created. Check Umbra’s permissions and try again.'
                    )
                ]
            });
        }
    }
};
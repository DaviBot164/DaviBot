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
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription(
            'Create a ticket panel in a selected channel.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

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
                    'Role that can view and manage tickets'
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
                        '❌ Server Only Command',
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
                        '❌ Bot Member Not Found',
                        'DaviBot could not access its server member information.'
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
                        '❌ Missing Bot Permissions',
                        'DaviBot requires the following permissions:\n\n' +
                        '• View Channels\n' +
                        '• Send Messages\n' +
                        '• Embed Links\n' +
                        '• Manage Channels'
                    )
                ]
            });

            return;
        }

        const channelPermissions =
            panelChannel.permissionsFor(botMember);

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
                        `DaviBot cannot send embeds inside ${panelChannel}.`
                    )
                ]
            });

            return;
        }

        const panelEmbed = createEmbed({
            title: ticketConfig.panel.title,

            description:
                ticketConfig.panel.description,

            thumbnail:
                interaction.guild.iconURL({
                    size: 256
                })
        });

        const panelButtons =
            createTicketPanelButtons(
                ticketCategory.id,
                staffRole.id
            );

        try {
            await panelChannel.send({
                embeds: [panelEmbed],
                components: [panelButtons]
            });

            await interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        '✅ Ticket Panel Created',
                        `The ticket panel was successfully sent to ${panelChannel}.\n\n` +
                        `**Ticket category:** ${ticketCategory.name}\n` +
                        `**Staff role:** ${staffRole}`
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Failed to create ticket panel:'
            );
            console.error(error);

            await interaction.editReply({
                embeds: [
                    createErrorEmbed(
                        '❌ Ticket Panel Failed',
                        'The ticket panel could not be created. Please check DaviBot permissions and try again.'
                    )
                ]
            });
        }
    }
};
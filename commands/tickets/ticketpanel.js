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

const REQUIRED_BOT_PERMISSIONS = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.ManageChannels
];

function errorReply(
    interaction,
    title,
    description
) {
    return interaction.editReply({
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ]
    });
}

module.exports = {
    category: 'tickets',

    data:
        new SlashCommandBuilder()
            .setName('ticketpanel')
            .setDescription(
                'Create the Evelynn support panel.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(false)

            .addChannelOption(option =>
                option
                    .setName('panel_channel')
                    .setDescription(
                        'Channel where the support panel will be sent'
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
                        'High Command role that can manage tickets'
                    )
                    .setRequired(true)
            ),

    async execute(interaction) {
        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        if (!interaction.inGuild()) {
            return errorReply(
                interaction,
                '❌ Server Only Command',
                'This command can only be used inside LUNAR SEIREITEI.'
            );
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
            return errorReply(
                interaction,
                '❌ Invalid Panel Channel',
                'Select a text channel.'
            );
        }

        if (
            ticketCategory.type !==
            ChannelType.GuildCategory
        ) {
            return errorReply(
                interaction,
                '❌ Invalid Ticket Category',
                'Select a valid category.'
            );
        }

        if (
            staffRole.id ===
                interaction.guild.roles.everyone.id ||
            staffRole.managed
        ) {
            return errorReply(
                interaction,
                '❌ Invalid Staff Role',
                'Select a normal server role for High Command.'
            );
        }

        const botMember =
            interaction.guild.members.me;

        if (!botMember) {
            return errorReply(
                interaction,
                '❌ Evelynn Unavailable',
                'Evelynn could not access its server member information.'
            );
        }

        if (
            !botMember.permissions.has(
                REQUIRED_BOT_PERMISSIONS
            )
        ) {
            return errorReply(
                interaction,
                '❌ Missing Evelynn Permissions',
                [
                    'Required permissions:',
                    '• View Channels',
                    '• Send Messages',
                    '• Embed Links',
                    '• Manage Channels'
                ].join('\n')
            );
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
            return errorReply(
                interaction,
                '❌ Panel Channel Permission Error',
                `Evelynn cannot send embeds in ${panelChannel}.`
            );
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
            })
                .setAuthor({
                    name:
                        'Evelynn • Seireitei Support',

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size: 128,
                                forceStatic: false
                            })
                });

        try {
            await panelChannel.send({
                embeds: [
                    panelEmbed
                ],

                components: [
                    createTicketPanelButtons(
                        ticketCategory.id,
                        staffRole.id
                    )
                ]
            });

            await interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        '✅ Support Panel Created',
                        [
                            `Panel sent to ${panelChannel}.`,
                            `**Ticket Category:** ${ticketCategory.name}`,
                            `**High Command Role:** ${staffRole}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn ticket panel failed:',
                error
            );

            await errorReply(
                interaction,
                '❌ Support Panel Failed',
                'The support panel could not be created.'
            );
        }
    }
};
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const channels =
    require('../../config/channels');

const {
    createEmbed,
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    buildTicketPanelComponents
} = require('../../utils/ticketComponents');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('ticketpanel')
            .setDescription(
                'Publish the Blood Moon ticket panel.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            ),

    async execute(interaction) {
        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        const channel =
            interaction.guild.channels.cache.get(
                channels.openTicket
            );

        if (!channel?.isTextBased()) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Channel Unavailable',
                        'The configured ticket channel could not be found.'
                    )
                ]
            });

            return;
        }

        const embed =
            createEmbed(
                '🎫 Blood Moon Support',
                [
                    'Need help beneath the Blood Moon?',
                    '',
                    'Open a private ticket and choose the category that best matches your request.',
                    '',
                    '🛟 **Support** — General help',
                    '🚨 **Report** — Report a member or problem',
                    '⚖️ **Appeal** — Appeal a moderation action',
                    '📜 **Other** — Anything else',
                    '',
                    'Please open a ticket only when needed.'
                ].join('\n')
            );

        try {
            await channel.send({
                embeds: [embed],
                components:
                    buildTicketPanelComponents()
            });

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Ticket Panel Published',
                        `The ticket panel was published in ${channel}.`
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Ticket panel publish failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Publish Failed',
                        'Akane could not publish the ticket panel.'
                    )
                ]
            });
        }
    }
};
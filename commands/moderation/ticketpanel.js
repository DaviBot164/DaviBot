const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    publishTicketPanel
} = require('../../utils/setup/publishTicketPanel');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

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

        try {
            const message =
                await publishTicketPanel(
                    interaction.guild
                );

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Ticket Panel Published',
                        `The ticket panel was published in ${message.channel}.`
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
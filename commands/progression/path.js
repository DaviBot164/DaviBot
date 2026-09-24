const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    publishPathSelection
} = require('../../utils/setup/publishPathSelection');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('path')
            .setDescription(
                'Publish the Blood Moon path selection panel.'
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
                await publishPathSelection(
                    interaction.guild
                );

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Path Panel Published',
                        `The path selection panel was published in ${message.channel}.`
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Path panel publish failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Publish Failed',
                        'Akane could not publish the path selection panel.'
                    )
                ]
            });
        }
    }
};

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const { createEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete multiple messages.')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {

        const amount = interaction.options.getInteger('amount');

        // Check bot permissions
        const me = await interaction.guild.members.fetchMe();

        if (!me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '❌ I need the **Manage Messages** permission.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Check user permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {

            const deletedMessages = await interaction.channel.bulkDelete(amount, true);

            const embed = createEmbed(interaction)
                .setAuthor({
                    name: '🧹 Messages Cleared',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setDescription(
                    `Successfully deleted **${deletedMessages.size}** message${deletedMessages.size === 1 ? '' : 's'}.`
                );

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {

            console.error(error);

            await interaction.reply({
                content: '❌ Failed to delete messages.',
                flags: MessageFlags.Ephemeral
            });

        }

    }
};
const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

const {
    createWelcomeEmbed
} = require("../../utils/welcomeEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("testwelcome")
        .setDescription("Preview the DaviBot welcome message.")
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    async execute(interaction) {
        try {

            const welcomeEmbed = createWelcomeEmbed(interaction.member);

            await interaction.reply({
                content: `👋 Welcome ${interaction.user}!`,
                embeds: [welcomeEmbed]
            });

        } catch (error) {

            console.error("Error executing /testwelcome:", error);

            const errorMessage = {
                content: "❌ The test welcome message could not be sent.",
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
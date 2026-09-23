const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const channels =
    require('../../config/channels');

const {
    createWelcomeBanner,
    createWelcomeEmbed
} = require('../../utils/welcomeEmbed');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName(
                'testwelcome'
            )
            .setDescription(
                'Preview the Blood Moon welcome message.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            ),

    async execute(
        interaction
    ) {
        const welcomeChannel =
            interaction.guild.channels.cache.get(
                channels.welcome
            );

        if (
            !welcomeChannel?.isTextBased()
        ) {
            await interaction.reply({
                content:
                    'The Welcome channel is unavailable.',
                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const banner =
                createWelcomeBanner();

            const embed =
                createWelcomeEmbed(
                    interaction.member
                );

            await welcomeChannel.send({
                embeds: [
                    embed
                ],
                files: [
                    banner
                ]
            });

            await interaction.editReply({
                content:
                    `Welcome preview sent to ${welcomeChannel}.`
            });
        } catch (error) {
            console.error(
                'Welcome preview failed:',
                error
            );

            await interaction.editReply({
                content:
                    'Akane could not send the Welcome preview.'
            });
        }
    }
};
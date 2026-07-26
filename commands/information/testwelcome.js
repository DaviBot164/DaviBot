const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createWelcomeEmbed
} = require('../../utils/welcomeEmbed');

module.exports = {
    category: 'general',

    data: new SlashCommandBuilder()
        .setName('testwelcome')
        .setDescription(
            'Preview the Umbra welcome message.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )
        .setDMPermission(false),

    /**
     * Execute the /testwelcome command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            const welcomeEmbed =
                createWelcomeEmbed(
                    interaction.member
                );

            await interaction.reply({
                content: [
                    '━━━━━━━━━━━━━━━━━━━━━━',
                    '🌑 **Umbra Welcome Preview**',
                    '',
                    `Welcome ${interaction.user}!`,
                    '',
                    'This is a preview of the Crimson Eclipse welcome message.',
                    '━━━━━━━━━━━━━━━━━━━━━━'
                ].join('\n'),

                embeds: [welcomeEmbed]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /testwelcome:',
                error
            );

            const errorMessage = {
                content:
                    '❌ Umbra could not generate the welcome preview.',
                flags:
                    MessageFlags.Ephemeral
            };

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp(
                    errorMessage
                );

                return;
            }

            await interaction.reply(
                errorMessage
            );
        }
    }
};
const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription(
            'Remove all warnings from a server member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Member whose warnings will be removed'
                )
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser(
                'user',
                true
            );

            await interaction.deferReply();

            const warningCount =
                await warningDatabase.countWarnings(
                    interaction.guild.id,
                    user.id
                );

            if (warningCount === 0) {
                const embed = createErrorEmbed(
                    '❌ No Warnings Found',
                    `${user.tag} does not have any warnings in this server.`
                );

                return interaction.editReply({
                    embeds: [embed]
                });
            }

            const deletedCount =
                await warningDatabase.deleteAllWarnings(
                    interaction.guild.id,
                    user.id
                );

            const embed = createModerationEmbed({
                action: '🧹 Warnings Cleared',
                user,
                moderator: interaction.user,
                reason:
                    `All warnings were removed from this member.`
            });

            embed.addFields(
                {
                    name: '🗑️ Removed Warnings',
                    value: String(deletedCount),
                    inline: true
                },
                {
                    name: '📚 Remaining Warnings',
                    value: '0',
                    inline: true
                }
            );

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Clearwarnings command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Warning Removal Failed',
                'The warnings could not be removed. Please check the database connection.'
            );

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                return interaction.editReply({
                    embeds: [embed]
                });
            }

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }
};
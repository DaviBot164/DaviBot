const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const {
    getModerationError
} = require('../../utils/moderation');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Give a warning to a server member.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Member to warn')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the warning')
                .setMinLength(2)
                .setMaxLength(500)
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const member =
                interaction.options.getMember('user');

            const reason =
                interaction.options.getString(
                    'reason',
                    true
                );

            const botMember =
                interaction.guild.members.me;

            if (!member) {
                const embed = createErrorEmbed(
                    '❌ Member Not Found',
                    'This user is not currently a member of the server.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const moderationError =
                getModerationError({
                    interaction,
                    target: member,
                    botMember
                });

            if (moderationError) {
                const embed = createErrorEmbed(
                    '❌ Warning Failed',
                    moderationError
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const warning =
                await warningDatabase.addWarning({
                    guildId: interaction.guild.id,
                    userId: member.id,
                    moderatorId: interaction.user.id,
                    reason
                });

            const totalWarnings =
                await warningDatabase.countWarnings(
                    interaction.guild.id,
                    member.id
                );

            const embed = createModerationEmbed({
                action: '⚠️ Member Warned',
                user: member.user,
                moderator: interaction.user,
                reason
            });

            embed.addFields(
                {
                    name: '🆔 Warning ID',
                    value: `#${warning.id}`,
                    inline: true
                },
                {
                    name: '📚 Total Warnings',
                    value: String(totalWarnings),
                    inline: true
                }
            );

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Warn command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Warning Failed',
                'The warning could not be saved. Please check the database connection.'
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
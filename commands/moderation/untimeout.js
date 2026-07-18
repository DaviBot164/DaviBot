const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const {
    hasBotPermission,
    getModerationError
} = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove an active timeout from a member.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Member to remove timeout from')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for removing the timeout')
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const member = interaction.options.getMember('user');

            const reason =
                interaction.options.getString('reason') ||
                'No reason provided.';

            const botMember = interaction.guild.members.me;

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

            if (
                !hasBotPermission(
                    botMember,
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'I need the **Moderate Members** permission to use this command.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const moderationError = getModerationError({
                interaction,
                target: member,
                botMember
            });

            if (moderationError) {
                const embed = createErrorEmbed(
                    '❌ Untimeout Failed',
                    moderationError
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (!member.isCommunicationDisabled()) {
                const embed = createErrorEmbed(
                    '❌ No Active Timeout',
                    'This member does not currently have an active timeout.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            await member.timeout(
                null,
                `${reason} | Moderator: ${interaction.user.tag}`
            );

            const embed = createModerationEmbed({
                action: '✅ Timeout Removed',
                user: member.user,
                moderator: interaction.user,
                reason
            });

            return interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Untimeout command error:', error);

            const embed = createErrorEmbed(
                '❌ Unexpected Error',
                'An unexpected error occurred while trying to remove this timeout.'
            );

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }
};
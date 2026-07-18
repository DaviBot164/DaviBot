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
    canModerate,
    getModerationError
} = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Temporarily timeout a member.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Member to timeout')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Timeout duration')
                .setRequired(true)
                .addChoices(
                    {
                        name: '1 minute',
                        value: 1
                    },
                    {
                        name: '5 minutes',
                        value: 5
                    },
                    {
                        name: '10 minutes',
                        value: 10
                    },
                    {
                        name: '30 minutes',
                        value: 30
                    },
                    {
                        name: '1 hour',
                        value: 60
                    },
                    {
                        name: '6 hours',
                        value: 360
                    },
                    {
                        name: '12 hours',
                        value: 720
                    },
                    {
                        name: '1 day',
                        value: 1440
                    },
                    {
                        name: '3 days',
                        value: 4320
                    },
                    {
                        name: '7 days',
                        value: 10080
                    },
                    {
                        name: '28 days',
                        value: 40320
                    }
                )
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the timeout')
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const member = interaction.options.getMember('user');

            const durationMinutes =
                interaction.options.getInteger('duration');

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
                    '❌ Timeout Failed',
                    moderationError
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (!canModerate(member)) {
                const embed = createErrorEmbed(
                    '❌ Timeout Failed',
                    'I cannot timeout this member. Check my permissions and role position.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (member.isCommunicationDisabled()) {
                const embed = createErrorEmbed(
                    '❌ Member Already Timed Out',
                    'This member already has an active timeout. Use `/untimeout` before applying a new timeout.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const durationMilliseconds =
                durationMinutes * 60 * 1000;

            await member.timeout(
                durationMilliseconds,
                `${reason} | Moderator: ${interaction.user.tag}`
            );

            const durationText = formatDuration(durationMinutes);

            const embed = createModerationEmbed({
                action: '⏳ Member Timed Out',
                user: member.user,
                moderator: interaction.user,
                reason,
                duration: durationText
            });

            return interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error('Timeout command error:', error);

            const embed = createErrorEmbed(
                '❌ Unexpected Error',
                'An unexpected error occurred while trying to timeout this member.'
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

/**
 * Convert minutes into a readable duration.
 *
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }

    if (minutes < 1440) {
        const hours = minutes / 60;

        return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    const days = minutes / 1440;

    return `${days} day${days === 1 ? '' : 's'}`;
}
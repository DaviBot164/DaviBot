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

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the ban')
                .setMaxLength(500)
                .setRequired(false)
        )

        .addIntegerOption(option =>
            option
                .setName('delete_messages')
                .setDescription(
                    'Delete messages sent during the selected number of days'
                )
                .addChoices(
                    {
                        name: 'Do not delete messages',
                        value: 0
                    },
                    {
                        name: 'Delete messages from the last day',
                        value: 1
                    },
                    {
                        name: 'Delete messages from the last 7 days',
                        value: 7
                    }
                )
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');

            const member = interaction.options.getMember('user');

            const reason =
                interaction.options.getString('reason') ||
                'No reason provided.';

            const deleteMessageDays =
                interaction.options.getInteger('delete_messages') || 0;

            const botMember = interaction.guild.members.me;

            if (
                !hasBotPermission(
                    botMember,
                    PermissionFlagsBits.BanMembers
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'I need the **Ban Members** permission to use this command.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (user.id === interaction.user.id) {
                const embed = createErrorEmbed(
                    '❌ Ban Failed',
                    'You cannot ban yourself.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (user.id === interaction.client.user.id) {
                const embed = createErrorEmbed(
                    '❌ Ban Failed',
                    'You cannot ban DaviBot.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (user.id === interaction.guild.ownerId) {
                const embed = createErrorEmbed(
                    '❌ Ban Failed',
                    'The server owner cannot be banned.'
                );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            if (member) {
                const moderationError = getModerationError({
                    interaction,
                    target: member,
                    botMember
                });

                if (moderationError) {
                    const embed = createErrorEmbed(
                        '❌ Ban Failed',
                        moderationError
                    );

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }

                if (!member.bannable) {
                    const embed = createErrorEmbed(
                        '❌ Ban Failed',
                        'I cannot ban this member. Check my permissions and role position.'
                    );

                    return interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    });
                }
            }

            await interaction.guild.members.ban(user.id, {
                deleteMessageSeconds:
                    deleteMessageDays * 24 * 60 * 60,

                reason:
                    `${reason} | Moderator: ${interaction.user.tag}`
            });

            const embed = createModerationEmbed({
                action: '🔨 User Banned',
                user,
                moderator: interaction.user,
                reason
            });

            await interaction.reply({
                embeds: [embed]
            });

            await sendModLog({
                guild: interaction.guild,
                action: '🔨 User Banned',
                user,
                moderator: interaction.user,
                reason,
                fields: [
                    {
                        name: '🗑️ Deleted Messages',
                        value:
                            deleteMessageDays === 0
                                ? 'No messages deleted'
                                : `Messages from the last ${deleteMessageDays} day${
                                    deleteMessageDays === 1 ? '' : 's'
                                }`,
                        inline: false
                    }
                ]
            });

            return;
        } catch (error) {
            console.error('Ban command error:', error);

            const embed = createErrorEmbed(
                '❌ Unexpected Error',
                'An unexpected error occurred while trying to ban this user.'
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
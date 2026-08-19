const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const {
    hasBotPermission,
    getModerationError,
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription(
            'Remove a Soul from the Order.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul you want to remove'
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for the removal'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /kick command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Order Only Command',
                            'This command can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const member =
                interaction.options.getMember(
                    'user'
                );

            const reason =
                interaction.options.getString(
                    'reason'
                ) ||
                'No reason was provided.';

            const botMember =
                interaction.guild.members.me;

            if (!member) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'This Soul is not currently a member of the Order.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !botMember ||
                !hasBotPermission(
                    botMember,
                    PermissionFlagsBits.KickMembers
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Kick Members** permission to carry out this action.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const moderationError =
                getModerationError({
                    interaction,
                    target:
                        member,
                    botMember
                });

            if (moderationError) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Removal Failed',
                            moderationError
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (!member.kickable) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Removal Failed',
                            'Evelynn cannot remove this Soul. Check its permissions and role position.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const targetUser =
                member.user;

            await member.kick(
                `${reason} | Shadow Warden: ${interaction.user.tag}`
            );

            const embed =
                createModerationEmbed({
                    action:
                        '👢 Soul Removed',

                    user:
                        targetUser,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields({
                name:
                    '🌑 Order Status',

                value:
                    'The Soul has been removed from LUNAR SEIREITEI.',

                inline:
                    false
            });

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action:
                    '👢 Soul Removed',

                user:
                    targetUser,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '🌑 Order Status',

                        value:
                            'The Soul was removed from LUNAR SEIREITEI.',

                        inline:
                            false
                    }
                ]
            });
        } catch (error) {
            await handleModerationCommandError({
                interaction,
                error,

                commandName:
                    'kick',

                title:
                    '❌ Removal Failed',

                description:
                    'Evelynn encountered an unexpected error while trying to remove this Soul.'
            });
        }
    }
};
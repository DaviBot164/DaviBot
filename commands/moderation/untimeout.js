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
        .setName('untimeout')
        .setDescription(
            'Remove an active timeout from a Soul.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul whose timeout should be removed'
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for removing the timeout'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /untimeout command.
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
                            '❌ THE Ⅹ SINS Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
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
                            'This Soul is not currently a member of THE Ⅹ SINS.'
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
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Moderate Members** permission to remove a timeout.'
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
                            '❌ Timeout Removal Failed',
                            moderationError
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !member.isCommunicationDisabled()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Active Timeout',
                            'This Soul does not currently have an active timeout.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            await member.timeout(
                null,
                `${reason} | Shadow Warden: ${interaction.user.tag}`
            );

            const embed =
                createModerationEmbed({
                    action:
                        '✅ Silence Lifted',

                    user:
                        member.user,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields({
                name:
                    '🌙 THE Ⅹ SINS Status',

                value:
                    'This Soul may communicate within THE Ⅹ SINS again.',

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
                    '✅ Silence Lifted',

                user:
                    member.user,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '🌙 THE Ⅹ SINS Status',

                        value:
                            'This Soul may communicate within THE Ⅹ SINS again.',

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
                    'untimeout',

                title:
                    '❌ Timeout Removal Failed',

                description:
                    'Evelynn encountered an unexpected error while trying to remove this timeout.'
            });
        }
    }
};
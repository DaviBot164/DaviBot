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
    getModerationError
} = require('../../utils/moderation');

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
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Umbra Permission',
                            'Umbra requires the **Moderate Members** permission to remove a timeout.'
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
                    target: member,
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
                    '🌑 Order Status',

                value:
                    'This Soul may communicate within Crimson Eclipse again.',

                inline:
                    false
            });

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /untimeout command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Timeout Removal Failed',
                    'Umbra encountered an unexpected error while trying to remove this timeout.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};
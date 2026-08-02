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
    getModerationError,
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription(
            'Record a warning against a Soul.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul you want to warn'
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for the warning'
                )
                .setMinLength(2)
                .setMaxLength(500)
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /warn command.
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
                            '❌ Las Noches Only Command',
                            'This command can only be used inside Las Noches.'
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
                    'reason',
                    true
                );

            const botMember =
                interaction.guild.members.me;

            if (!member) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'This Soul is not currently a member of Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (!botMember) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Umbra Unavailable',
                            'Umbra could not access its Las Noches member information.'
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
                            '❌ Warning Failed',
                            moderationError
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            const warning =
                await warningDatabase.addWarning({
                    guildId:
                        interaction.guild.id,

                    userId:
                        member.id,

                    moderatorId:
                        interaction.user.id,

                    reason
                });

            const totalWarnings =
                await warningDatabase.countWarnings(
                    interaction.guild.id,
                    member.id
                );

            const orderStatus =
                totalWarnings >= 3
                    ? '🔴 Repeated violations recorded'
                    : '🟡 Warning placed on record';

            const embed =
                createModerationEmbed({
                    action:
                        '⚠️ Sacred Warning Recorded',

                    user:
                        member.user,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields(
                {
                    name:
                        '🆔 Warning Record',

                    value:
                        `\`#${warning.id}\``,

                    inline:
                        true
                },
                {
                    name:
                        '📚 Total Warnings',

                    value:
                        `\`${totalWarnings}\``,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 Las Noches Status',

                    value:
                        orderStatus,

                    inline:
                        false
                }
            );

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action:
                    '⚠️ Sacred Warning Recorded',

                user:
                    member.user,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '🆔 Warning Record',

                        value:
                            `\`#${warning.id}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '📚 Total Warnings',

                        value:
                            `\`${totalWarnings}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 Las Noches Status',

                        value:
                            orderStatus,

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
                    'warn',

                title:
                    '❌ Warning Record Failed',

                description:
                    'Umbra could not save this warning. Please check the database connection and try again.'
            });
        }
    }
};
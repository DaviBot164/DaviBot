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
        )

        .setDMPermission(false),

    /**
     * Execute the /clearwarnings command.
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
                            '❌ LUNAR SEIREITEI Only Command',
                            'This command can only be used inside LUNAR SEIREITEI.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const user =
                interaction.options.getUser(
                    'user',
                    true
                );

            await interaction.deferReply();

            const warningCount =
                await warningDatabase.countWarnings(
                    interaction.guild.id,
                    user.id
                );

            if (
                warningCount ===
                0
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Warnings Found',
                            `${user.tag} does not have any warnings within LUNAR SEIREITEI.`
                        )
                    ]
                });

                return;
            }

            const deletedCount =
                await warningDatabase.deleteAllWarnings(
                    interaction.guild.id,
                    user.id
                );

            const embed =
                createModerationEmbed({
                    action:
                        '🧹 Warnings Cleared',

                    user,

                    moderator:
                        interaction.user,

                    reason:
                        'All warnings were removed from this member.'
                });

            embed.addFields(
                {
                    name:
                        '🗑️ Removed Warnings',

                    value:
                        `\`${deletedCount}\``,

                    inline:
                        true
                },
                {
                    name:
                        '📚 Remaining Warnings',

                    value:
                        '`0`',

                    inline:
                        true
                },
                {
                    name:
                        '🌙 LUNAR SEIREITEI Status',

                    value:
                        '🟢 Warning record cleared',

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
                    '🧹 Warnings Cleared',

                user,

                moderator:
                    interaction.user,

                reason:
                    'All warnings were removed from this member.',

                fields: [
                    {
                        name:
                            '🗑️ Removed Warnings',

                        value:
                            `\`${deletedCount}\``,

                        inline:
                            true
                    },
                    {
                        name:
                            '📚 Remaining Warnings',

                        value:
                            '`0`',

                        inline:
                            true
                    },
                    {
                        name:
                            '🌙 LUNAR SEIREITEI Status',

                        value:
                            '🟢 Warning record cleared',

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
                    'clearwarnings',

                title:
                    '❌ Warning Removal Failed',

                description:
                    'The warnings could not be removed. Please check the database connection.'
            });
        }
    }
};
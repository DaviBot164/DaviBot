const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete multiple messages.')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription(
                    'Number of messages to delete (1-100)'
                )
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    async execute(interaction) {
        try {
            const amount =
                interaction.options.getInteger('amount');

            const botMember =
                await interaction.guild.members.fetchMe();

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                const errorEmbed = createErrorEmbed(
                    '❌ Missing Permission',
                    'I need the **Manage Messages** permission.'
                );

                return interaction.reply({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {
                const errorEmbed = createErrorEmbed(
                    '❌ Permission Denied',
                    'You do not have permission to use this command.'
                );

                return interaction.reply({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const deletedMessages =
                await interaction.channel.bulkDelete(
                    amount,
                    true
                );

            const embed = createEmbed({
                title: '🧹 Messages Cleared',
                description:
                    `Successfully deleted ` +
                    `**${deletedMessages.size}** ` +
                    `message${
                        deletedMessages.size === 1
                            ? ''
                            : 's'
                    }.`,
                fields: [
                    {
                        name: '📺 Channel',
                        value: `${interaction.channel}`,
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: '🗑️ Deleted',
                        value:
                            `\`${deletedMessages.size}\` messages`,
                        inline: false
                    }
                ]
            });

            embed.setAuthor({
                name: 'Seraphiel • Moderation',
                iconURL:
                    interaction.client.user.displayAvatarURL({
                        size: 128
                    })
            });

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Error executing /clear:',
                error
            );

            const errorEmbed = createErrorEmbed(
                '❌ Clear Command Error',
                'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.'
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return interaction.followUp({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
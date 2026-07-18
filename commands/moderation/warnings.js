const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription(
            'View the warnings of a server member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Member whose warnings you want to view'
                )
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        try {
            const user =
                interaction.options.getUser(
                    'user',
                    true
                );

            await interaction.deferReply();

            const memberWarnings =
                await warningDatabase.getWarnings(
                    interaction.guild.id,
                    user.id
                );

            if (memberWarnings.length === 0) {
                const embed = createEmbed({
                    title: '✅ No Warnings Found',

                    description:
                        `${user.tag} does not have any warnings in this server.`,

                    thumbnail:
                        user.displayAvatarURL({
                            size: 256
                        }),

                    fields: [
                        {
                            name: '👤 User',
                            value:
                                `${user}\n\`${user.id}\``,
                            inline: true
                        },
                        {
                            name: '📚 Total Warnings',
                            value: '0',
                            inline: true
                        }
                    ]
                });

                return interaction.editReply({
                    embeds: [embed]
                });
            }

            const warningsToDisplay =
                memberWarnings.slice(0, 10);

            const warningList =
                warningsToDisplay
                    .map((warning, index) => {
                        const timestamp =
                            Math.floor(
                                new Date(
                                    warning.created_at
                                ).getTime() / 1000
                            );

                        return [
                            `### ${index + 1}. Warning #${warning.id}`,
                            `**Reason:** ${warning.reason}`,
                            `**Moderator:** <@${warning.moderator_id}>`,
                            `**Date:** <t:${timestamp}:F>`
                        ].join('\n');
                    })
                    .join('\n\n');

            let description = warningList;

            if (memberWarnings.length > 10) {
                description +=
                    `\n\n*Showing 10 of ${memberWarnings.length} warnings.*`;
            }

            const embed = createEmbed({
                title:
                    `⚠️ Warnings for ${user.tag}`,

                description,

                thumbnail:
                    user.displayAvatarURL({
                        size: 256
                    }),

                fields: [
                    {
                        name: '👤 User',
                        value:
                            `${user}\n\`${user.id}\``,
                        inline: true
                    },
                    {
                        name: '📚 Total Warnings',
                        value:
                            String(
                                memberWarnings.length
                            ),
                        inline: true
                    }
                ]
            });

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Warnings command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Warnings Failed',
                'The warnings could not be loaded. Please check the database connection.'
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
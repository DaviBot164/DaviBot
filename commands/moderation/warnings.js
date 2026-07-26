const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const warningDatabase =
    require('../../database/warnings');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription(
            'View the warning records of a Soul.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul whose warnings you want to view'
                )
                .setRequired(true)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /warnings command.
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

            const avatarURL =
                user.displayAvatarURL({
                    size: 256,
                    forceStatic: false
                });

            if (
                memberWarnings.length === 0
            ) {
                const embed =
                    createEmbed({
                        title:
                            '✅ No Sacred Warnings Found',

                        description:
                            [
                                `${user} has no warning records within this Order.`,
                                '',
                                '*This Soul currently stands without recorded violations.*'
                            ].join('\n'),

                        thumbnail:
                            avatarURL,

                        fields: [
                            {
                                name:
                                    '🌑 Soul',

                                value:
                                    `${user.tag}\n` +
                                    `\`${user.id}\``,

                                inline:
                                    true
                            },
                            {
                                name:
                                    '📚 Total Warnings',

                                value:
                                    '`0`',

                                inline:
                                    true
                            },
                            {
                                name:
                                    '🛡️ Guardian Status',

                                value:
                                    '🟢 Clear record',

                                inline:
                                    false
                            }
                        ]
                    });

                embed.setAuthor({
                    name:
                        `${user.username} • Warning Records`,

                    iconURL:
                        avatarURL
                });

                await interaction.editReply({
                    embeds: [embed]
                });

                return;
            }

            const warningsToDisplay =
                memberWarnings.slice(
                    0,
                    10
                );

            const warningList =
                warningsToDisplay
                    .map(
                        (
                            warning,
                            index
                        ) => {
                            const createdTime =
                                new Date(
                                    warning.created_at
                                ).getTime();

                            const timestamp =
                                Number.isFinite(
                                    createdTime
                                )
                                    ? Math.floor(
                                        createdTime /
                                        1_000
                                    )
                                    : null;

                            const warningDate =
                                timestamp
                                    ? `<t:${timestamp}:F>\n-# <t:${timestamp}:R>`
                                    : 'Unknown';

                            return [
                                `### ${index + 1}. Sacred Warning #${warning.id}`,
                                `**Reason:** ${warning.reason}`,
                                `**Shadow Warden:** <@${warning.moderator_id}>`,
                                `**Recorded:** ${warningDate}`
                            ].join('\n');
                        }
                    )
                    .join('\n\n');

            let description =
                warningList;

            if (
                memberWarnings.length > 10
            ) {
                description +=
                    `\n\n*Showing the newest 10 of ${memberWarnings.length} warning records.*`;
            }

            const embed =
                createEmbed({
                    title:
                        `⚠️ Sacred Warnings — ${user.username}`,

                    description,

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '🌑 Soul',

                            value:
                                `${user}\n` +
                                `\`${user.id}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '📚 Total Warnings',

                            value:
                                `\`${memberWarnings.length}\``,

                            inline:
                                true
                        },
                        {
                            name:
                                '🛡️ Order Status',

                            value:
                                memberWarnings.length >= 3
                                    ? '🔴 Repeated violations recorded'
                                    : '🟡 Warning record active',

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${user.username} • Guardian Records`,

                iconURL:
                    avatarURL
            });

            embed.setFooter({
                text:
                    `🌑 Umbra Warning Records • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size: 128,
                            forceStatic: false
                        })
            });

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /warnings command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Warning Records Unavailable',
                    'Umbra could not load the warning records. Please check the database connection.'
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
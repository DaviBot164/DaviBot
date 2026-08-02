/**
 * Umbra
 * Command: /userinfo
 * Version: 3.0.0
 */

const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription(
            'View the Las Noches record of a member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the member whose record you want to view'
                )
                .setRequired(false)
        )

        .setDMPermission(false),

    /**
     * Execute the /userinfo command.
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

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ||
                interaction.user;

            const [
                member,
                user
            ] = await Promise.all([
                interaction.guild.members
                    .fetch(
                        selectedUser.id
                    )
                    .catch(
                        () => null
                    ),

                selectedUser.fetch(
                    true
                )
            ]);

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Member Not Found',
                            'This user is not currently a member of Las Noches.'
                        )
                    ]
                });

                return;
            }

            const avatarURL =
                user.displayAvatarURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const bannerURL =
                user.bannerURL({
                    size:
                        4096,

                    forceStatic:
                        false
                });

            const accountCreatedTimestamp =
                Math.floor(
                    user.createdTimestamp /
                    1_000
                );

            const joinedServerTimestamp =
                member.joinedTimestamp
                    ? Math.floor(
                        member.joinedTimestamp /
                        1_000
                    )
                    : null;

            const highestRole =
                member.roles.highest.id ===
                interaction.guild.id
                    ? 'None'
                    : member.roles.highest;

            const roleCount =
                Math.max(
                    member.roles.cache.size -
                    1,
                    0
                );

            const accountType =
                user.bot
                    ? '🤖 Bot'
                    : user.system
                        ? '⚙️ System'
                        : '🌙 Member';

            const joinedText =
                joinedServerTimestamp
                    ? (
                        `<t:${joinedServerTimestamp}:F>\n` +
                        `<t:${joinedServerTimestamp}:R>`
                    )
                    : 'Unknown';

            const embed =
                createEmbed({
                    title:
                        '🌙 Las Noches Member Record',

                    description:
                        `Official information for ${user}.`,

                    color:
                        '#6F42C1',

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '👤 Identity',

                            value:
                                [
                                    `**Username:** ${user.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Type:** ${accountType}`,
                                    `**User ID:** \`${user.id}\``
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Account Created',

                            value:
                                [
                                    `<t:${accountCreatedTimestamp}:F>`,
                                    `<t:${accountCreatedTimestamp}:R>`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                true
                        },
                        {
                            name:
                                '🏰 Entered Las Noches',

                            value:
                                joinedText,

                            inline:
                                true
                        },
                        {
                            name:
                                '🎭 Standing',

                            value:
                                [
                                    `**Highest Role:** ${highestRole}`,
                                    `**Total Roles:** \`${roleCount}\``,
                                    `**Nickname:** ${member.nickname ?? 'None'}`
                                ].join(
                                    '\n'
                                ),

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${user.username} • Member Archive`,

                iconURL:
                    avatarURL
            });

            embed.setFooter({
                text:
                    `Umbra • Guardian of Las Noches • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            if (bannerURL) {
                embed.setImage(
                    bannerURL
                );
            }

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(
                                'Open Avatar'
                            )
                            .setEmoji(
                                '🖼️'
                            )
                            .setStyle(
                                ButtonStyle.Link
                            )
                            .setURL(
                                avatarURL
                            )
                    );

            if (bannerURL) {
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            'Open Banner'
                        )
                        .setEmoji(
                            '🌌'
                        )
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            bannerURL
                        )
                );
            }

            await interaction.editReply({
                embeds: [
                    embed
                ],

                components: [
                    row
                ]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /userinfo:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Member Record Unavailable',
                    'Umbra could not retrieve this Las Noches member record.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components: []
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
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
        .setName('avatar')
        .setDescription(
            'View the avatar of a THE Ⅹ SINS member.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the member whose avatar you want to view'
                )
                .setRequired(false)
        )

        .setDMPermission(false),

    /**
     * Execute the /avatar command.
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

            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ||
                interaction.user;

            const [
                user,
                member
            ] = await Promise.all([
                selectedUser.fetch(
                    true
                ),

                interaction.guild.members
                    .fetch(
                        selectedUser.id
                    )
                    .catch(
                        () => null
                    )
            ]);

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Member Not Found',
                            'This user is not currently a member of THE Ⅹ SINS.'
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

            const accountType =
                user.bot
                    ? '🤖 Bot'
                    : user.system
                        ? '⚙️ System'
                        : '🌙 Member';

            const embed =
                createEmbed({
                    title:
                        '🖼️ THE Ⅹ SINS Avatar',

                    description:
                        `Avatar record for ${user}.`,

                    color:
                        '#6F42C1',

                    thumbnail:
                        avatarURL,

                    image:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '👤 Member',

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
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${user.username} • Avatar Archive`,

                iconURL:
                    avatarURL
            });

            embed.setFooter({
                text:
                    `Evelynn • Guardian of THE Ⅹ SINS • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                128,

                            forceStatic:
                                false
                        })
            });

            const buttons = [
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
            ];

            if (bannerURL) {
                buttons.push(
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

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        buttons
                    );

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
                '❌ Error executing Evelynn /avatar:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Avatar Unavailable',
                    'Evelynn could not retrieve this THE Ⅹ SINS avatar.'
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
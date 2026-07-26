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
            'View the avatar of a Soul.'
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul whose avatar you want to view'
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
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ||
                interaction.user;

            const [user, member] =
                await Promise.all([
                    selectedUser.fetch(true),

                    interaction.guild.members.fetch(
                        selectedUser.id
                    )
                ]);

            const avatarURL =
                user.displayAvatarURL({
                    size: 4096,
                    forceStatic: false
                });

            const bannerURL =
                user.bannerURL({
                    size: 4096,
                    forceStatic: false
                });

            const createdTimestamp =
                Math.floor(
                    user.createdTimestamp /
                    1_000
                );

            const avatarAnimated =
                avatarURL.includes('.gif')
                    ? 'Yes'
                    : 'No';

            const bannerStatus =
                bannerURL
                    ? 'Available'
                    : 'Not Available';

            const accountType =
                user.bot
                    ? '🤖 Order Guardian'
                    : user.system
                        ? '⚙️ System Account'
                        : '🌑 Soul';

            const embed =
                createEmbed({
                    title:
                        '🖼️ Soul Avatar',

                    description:
                        [
                            `Umbra has revealed the avatar of ${user}.`,
                            '',
                            '*Every Soul bears a face beneath the crimson moon.*'
                        ].join('\n'),

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '🌑 Soul Information',

                            value:
                                `**Username:** ${user.username}\n` +
                                `**Display Name:** ${member.displayName}\n` +
                                `**Account Type:** ${accountType}\n` +
                                `**Soul ID:** \`${user.id}\``,

                            inline:
                                false
                        },
                        {
                            name:
                                '🖼️ Avatar Record',

                            value:
                                `**Animated:** \`${avatarAnimated}\`\n` +
                                `**Banner:** \`${bannerStatus}\`\n` +
                                `**Account Created:** <t:${createdTimestamp}:F>\n` +
                                `**Account Age:** <t:${createdTimestamp}:R>`,

                            inline:
                                false
                        }
                    ]
                });

            embed
                .setAuthor({
                    name:
                        `${user.username} • Soul Avatar`,

                    iconURL:
                        avatarURL
                })
                .setImage(
                    avatarURL
                )
                .setFooter({
                    text:
                        `🌑 Umbra Avatar Records • Requested by ${interaction.user.username}`,

                    iconURL:
                        interaction.client.user
                            .displayAvatarURL({
                                size: 128,
                                forceStatic: false
                            })
                });

            const buttons = [
                new ButtonBuilder()
                    .setLabel(
                        'Open Avatar'
                    )
                    .setEmoji('🖼️')
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
                        .setEmoji('🌌')
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
                embeds: [embed],
                components: [row]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /avatar:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Avatar Unavailable',
                    'Umbra could not retrieve this Soul’s avatar.'
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
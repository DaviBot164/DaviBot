/**
 * Umbra
 * Command: /userinfo
 * Version: 2.1.0
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
            'View information about a Soul.'
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul whose information you want to view'
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
            await interaction.deferReply();

            const selectedUser =
                interaction.options.getUser(
                    'user'
                ) ||
                interaction.user;

            const [member, user] =
                await Promise.all([
                    interaction.guild.members.fetch(
                        selectedUser.id
                    ),

                    selectedUser.fetch(true)
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
                    ? '🤖 Order Guardian'
                    : user.system
                        ? '⚙️ System Account'
                        : '🌑 Soul';

            const embed =
                createEmbed({
                    title:
                        '🌑 Soul Information',

                    description:
                        [
                            `Umbra has opened the record of ${user}.`,
                            '',
                            '*Every Soul is known beneath the crimson moon.*'
                        ].join('\n'),

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '🌑 Soul Record',

                            value:
                                `**Username:** ${user.username}\n` +
                                `**Display Name:** ${member.displayName}\n` +
                                `**Mention:** ${user}\n` +
                                `**Account Type:** ${accountType}\n` +
                                `**Soul ID:** \`${user.id}\``,

                            inline:
                                false
                        },
                        {
                            name:
                                '📅 Soul History',

                            value:
                                `**Account Created:** <t:${accountCreatedTimestamp}:F>\n` +
                                `**Account Age:** <t:${accountCreatedTimestamp}:R>\n` +
                                (
                                    joinedServerTimestamp
                                        ? `**Entered the Order:** <t:${joinedServerTimestamp}:F>\n` +
                                          `**Time in the Order:** <t:${joinedServerTimestamp}:R>`
                                        : '**Entered the Order:** Unknown'
                                ),

                            inline:
                                false
                        },
                        {
                            name:
                                '🎭 Order Standing',

                            value:
                                `**Highest Role:** ${highestRole}\n` +
                                `**Total Roles:** \`${roleCount}\`\n` +
                                `**Nickname:** ${member.nickname ?? 'None'}`,

                            inline:
                                false
                        }
                    ]
                });

            embed.setAuthor({
                name:
                    `${user.username} • Soul Record`,

                iconURL:
                    avatarURL
            });

            embed.setFooter({
                text:
                    `🌑 Umbra Soul Records • Requested by ${interaction.user.username}`,

                iconURL:
                    interaction.client.user
                        .displayAvatarURL({
                            size: 128,
                            forceStatic: false
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
                            .setEmoji('🖼️')
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
                        .setEmoji('🌌')
                        .setStyle(
                            ButtonStyle.Link
                        )
                        .setURL(
                            bannerURL
                        )
                );
            }

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        } catch (error) {
            console.error(
                '❌ Error executing Umbra /userinfo:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Soul Information Unavailable',

                    'Umbra could not retrieve information about this Soul.'
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
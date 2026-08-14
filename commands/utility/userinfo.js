/**
 * Evelynn
 * Command: /userinfo
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
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'userinfo'
            )
            .setDescription(
                'View information about a server member.'
            )
            .addUserOption(option =>
                option
                    .setName(
                        'user'
                    )
                    .setDescription(
                        'Select a member'
                    )
                    .setRequired(
                        false
                    )
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /userinfo command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
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

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            256,

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
                        : '✦ Member';

            const joinedText =
                joinedServerTimestamp
                    ? [
                        `<t:${joinedServerTimestamp}:F>`,
                        `-# <t:${joinedServerTimestamp}:R>`
                    ].join('\n')
                    : 'Unknown';

            const embed =
                createEmbed({
                    title:
                        'Ⅹ・MEMBER INFORMATION',

                    description:
                        `Information for ${user}.`,

                    color:
                        '#5B3A78',

                    thumbnail:
                        avatarURL,

                    fields: [
                        {
                            name:
                                '✦・IDENTITY',

                            value:
                                [
                                    `**Username:** ${user.username}`,
                                    `**Display Name:** ${member.displayName}`,
                                    `**Type:** ${accountType}`,
                                    `**User ID:** \`${user.id}\``
                                ].join('\n'),

                            inline:
                                false
                        },

                        {
                            name:
                                '📅・ACCOUNT CREATED',

                            value:
                                [
                                    `<t:${accountCreatedTimestamp}:F>`,
                                    `-# <t:${accountCreatedTimestamp}:R>`
                                ].join('\n'),

                            inline:
                                true
                        },

                        {
                            name:
                                'Ⅹ・JOINED SERVER',

                            value:
                                joinedText,

                            inline:
                                true
                        },

                        {
                            name:
                                '◆・STANDING',

                            value:
                                [
                                    `**Highest Role:** ${highestRole}`,
                                    `**Roles:** \`${roleCount}\``,
                                    `**Nickname:** ${member.nickname ?? 'None'}`
                                ].join('\n'),

                            inline:
                                false
                        }
                    ]
                });            embed.setAuthor({
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            });

            embed.setFooter({
                text:
                    `TTS • Requested by ${interaction.user.username}`,

                iconURL:
                    botAvatar
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
                '❌ Evelynn /userinfo command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Member Information Unavailable',
                    'Evelynn could not retrieve this member information.'
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ],

                        components:
                            []
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
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
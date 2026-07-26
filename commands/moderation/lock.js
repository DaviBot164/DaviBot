const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');

const {
    createErrorEmbed,
    createChannelModerationEmbed
} = require('../../utils/embeds');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription(
            'Lock the current channel for the Order.'
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for locking the channel'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        )

        .setDMPermission(false),

    /**
     * Execute the /lock command.
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

            const channel =
                interaction.channel;

            const everyoneRole =
                interaction.guild.roles.everyone;

            const reason =
                interaction.options.getString(
                    'reason'
                ) ||
                'No reason was provided.';

            const supportedChannelTypes = [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ];

            if (
                !channel ||
                !supportedChannelTypes.includes(
                    channel.type
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Unsupported Channel',
                            'This command can only be used in a text or announcement channel.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Umbra Unavailable',
                            'Umbra could not access its server member information.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botPermissions =
                channel.permissionsFor(
                    botMember
                );

            if (
                !botPermissions?.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Umbra Permission',
                            'Umbra requires the **Manage Roles** permission in this channel.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const everyoneOverride =
                channel.permissionOverwrites.cache.get(
                    everyoneRole.id
                );

            if (
                everyoneOverride?.deny.has(
                    PermissionFlagsBits.SendMessages
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '🔒 Channel Already Sealed',
                            `${channel} is already locked for @everyone.`
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            await channel.permissionOverwrites.edit(
                everyoneRole,
                {
                    SendMessages: false
                },
                {
                    reason:
                        `Channel sealed by ${interaction.user.tag}: ${reason}`
                }
            );

            const embed =
                createChannelModerationEmbed({
                    action:
                        '🔒 Channel Sealed',

                    channel,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields({
                name:
                    '🌑 Order Status',

                value:
                    'Members of the Order can no longer send messages in this channel until it is unlocked.',

                inline:
                    false
            });

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /lock command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Channel Seal Failed',
                    'Umbra could not lock this channel. Check its permissions and Northflank logs.'
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
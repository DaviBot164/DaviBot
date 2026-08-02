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

const {
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription(
            'Lock the current channel for Las Noches.'
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
                            '❌ Las Noches Only Command',
                            'This command can only be used inside Las Noches.'
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
                            'Umbra could not access its Las Noches member information.'
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

            const orderStatus =
                'Souls can no longer send messages in this channel until it is unlocked.';

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
                    '🌙 Las Noches Status',

                value:
                    orderStatus,

                inline:
                    false
            });

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action:
                    '🔒 Channel Sealed',

                channel,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '🌙 Las Noches Status',

                        value:
                            orderStatus,

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
                    'lock',

                title:
                    '❌ Channel Seal Failed',

                description:
                    'Umbra could not lock this channel. Check its permissions and Northflank logs.'
            });
        }
    }
};
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
        .setName('unlock')
        .setDescription(
            'Unlock the current channel for THE Ⅹ SINS.'
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for unlocking the channel'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        )

        .setDMPermission(false),

    /**
     * Execute the /unlock command.
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
                            '❌ Evelynn Unavailable',
                            'Evelynn could not access its THE Ⅹ SINS member information.'
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
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Manage Roles** permission in this channel.'
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

            const isLocked =
                everyoneOverride?.deny.has(
                    PermissionFlagsBits.SendMessages
                );

            if (!isLocked) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '🔓 Channel Already Open',
                            `${channel} is already unlocked for @everyone.`
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
                    SendMessages: null
                },
                {
                    reason:
                        `Channel unsealed by ${interaction.user.tag}: ${reason}`
                }
            );

            const orderStatus =
                'Souls may send messages in this channel again.';

            const embed =
                createChannelModerationEmbed({
                    action:
                        '🔓 Channel Unsealed',

                    channel,

                    moderator:
                        interaction.user,

                    reason
                });

            embed.addFields({
                name:
                    '🌙 THE Ⅹ SINS Status',

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
                    '🔓 Channel Unsealed',

                channel,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '🌙 THE Ⅹ SINS Status',

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
                    'unlock',

                title:
                    '❌ Channel Unseal Failed',

                description:
                    'Evelynn could not unlock this channel. Check its permissions and Northflank logs.'
            });
        }
    }
};
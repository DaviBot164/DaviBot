const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock the current channel.')

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for locking the channel')
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageChannels
        ),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                const embed = createErrorEmbed(
                    '❌ Lock Failed',
                    'This command can only be used inside a server.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const channel = interaction.channel;
            const everyoneRole =
                interaction.guild.roles.everyone;

            const reason =
                interaction.options.getString('reason') ||
                'No reason provided.';

            const supportedChannelTypes = [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ];

            if (
                !channel ||
                !supportedChannelTypes.includes(channel.type)
            ) {
                const embed = createErrorEmbed(
                    '❌ Unsupported Channel',
                    'This command can only be used in a text or announcement channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const botMember =
                interaction.guild.members.me;

            const botPermissions =
                channel.permissionsFor(botMember);

            if (
                !botPermissions?.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'DaviBot needs the **Manage Roles** permission in this channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
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
                const embed = createErrorEmbed(
                    '🔒 Channel Already Locked',
                    `${channel} is already locked for @everyone.`
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

            await channel.permissionOverwrites.edit(
                everyoneRole,
                {
                    SendMessages: false
                },
                {
                    reason:
                        `Locked by ${interaction.user.tag}: ${reason}`
                }
            );

            const embed = createEmbed({
                title: '🔒 Channel Locked',
                description:
                    `${channel} has been locked successfully.`,
                fields: [
                    {
                        name: '📺 Channel',
                        value:
                            `${channel}\n\`${channel.id}\``,
                        inline: true
                    },
                    {
                        name: '👮 Moderator',
                        value:
                            `${interaction.user}\n` +
                            `\`${interaction.user.id}\``,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason,
                        inline: false
                    }
                ]
            });

            return interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                'Lock command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Lock Failed',
                'The channel could not be locked. Check DaviBot’s permissions and Northflank logs.'
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
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
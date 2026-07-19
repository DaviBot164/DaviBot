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
            const channel = interaction.channel;

            const reason =
                interaction.options.getString('reason') ||
                'No reason provided.';

            if (!interaction.guild || !channel) {
                const embed = createErrorEmbed(
                    '❌ Lock Failed',
                    'This command can only be used inside a server.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const supportedChannelTypes = [
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildForum
            ];

            if (!supportedChannelTypes.includes(channel.type)) {
                const embed = createErrorEmbed(
                    '❌ Unsupported Channel',
                    'This channel cannot be locked with this command.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const botMember = interaction.guild.members.me;

            if (
                !botMember.permissions.has(
                    PermissionFlagsBits.ManageChannels
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'DaviBot needs the **Manage Channels** permission to lock channels.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const everyoneRole =
                interaction.guild.roles.everyone;

            const currentOverride =
                channel.permissionOverwrites.cache.get(
                    everyoneRole.id
                );

            if (
                currentOverride &&
                currentOverride.deny.has(
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
                        `Channel locked by ${interaction.user.tag}: ${reason}`
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

            await interaction.editReply({
                embeds: [embed]
            });

            const publicEmbed = createEmbed({
                title: '🔒 Channel Locked',

                description:
                    'This channel has been temporarily locked.',

                fields: [
                    {
                        name: '👮 Moderator',
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: '📝 Reason',
                        value: reason,
                        inline: false
                    }
                ]
            });

            await channel.send({
                embeds: [publicEmbed]
            });
        } catch (error) {
            console.error(
                'Lock command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Lock Failed',
                'The channel could not be locked. Please check DaviBot’s permissions.'
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
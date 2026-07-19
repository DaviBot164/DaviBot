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
        .setName('unlock')
        .setDescription('Unlock the current channel.')

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for unlocking the channel')
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
                    '❌ Unlock Failed',
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

            const isLocked =
                everyoneOverride?.deny.has(
                    PermissionFlagsBits.SendMessages
                );

            if (!isLocked) {
                const embed = createErrorEmbed(
                    '🔓 Channel Already Unlocked',
                    `${channel} is already unlocked for @everyone.`
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
                    SendMessages: null
                },
                {
                    reason:
                        `Unlocked by ${interaction.user.tag}: ${reason}`
                }
            );

            const embed = createEmbed({
                title: '🔓 Channel Unlocked',

                description:
                    `${channel} has been unlocked successfully.`,

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
                'Unlock command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Unlock Failed',
                'The channel could not be unlocked. Check DaviBot’s permissions and Northflank logs.'
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
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
            const guild = interaction.guild;
            const botMember = guild.members.me;

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

            const botPermissions =
                channel.permissionsFor(botMember);

            if (
                !botPermissions ||
                !botPermissions.has(
                    PermissionFlagsBits.ManageRoles
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Permission',
                    'DaviBot needs **Manage Roles** permission in this channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (
                !botPermissions.has(
                    PermissionFlagsBits.SendMessages
                ) ||
                !botPermissions.has(
                    PermissionFlagsBits.EmbedLinks
                )
            ) {
                const embed = createErrorEmbed(
                    '❌ Missing Channel Permission',
                    'DaviBot needs **Send Messages** and **Embed Links** permissions in this channel.'
                );

                return interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
            }

            const everyoneRole = guild.roles.everyone;

            const currentOverride =
                channel.permissionOverwrites.cache.get(
                    everyoneRole.id
                );

            if (
                currentOverride?.deny.has(
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

            // Send the public message before removing Send Messages.
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

            // Lock the channel after the announcement is sent.
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

            const confirmationEmbed = createEmbed({
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
                embeds: [confirmationEmbed]
            });
        } catch (error) {
            console.error(
                'Lock command error:',
                error
            );

            const embed = createErrorEmbed(
                '❌ Lock Failed',
                'The channel could not be locked. Check the Northflank logs for the exact error.'
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
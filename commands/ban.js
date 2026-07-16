const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { createEmbed } = require('../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Member to ban')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    async execute(interaction) {

        const member = interaction.options.getMember('user');
        const reason =
            interaction.options.getString('reason') || 'No reason provided.';

        // Member exists
        if (!member) {
            return interaction.reply({
                content: '❌ Member not found.',
                ephemeral: true
            });
        }

        // Self Ban Protection
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban yourself.',
                ephemeral: true
            });
        }

        // Bot hierarchy check
        if (!member.bannable) {
            return interaction.reply({
                content: '❌ I cannot ban this member. Check my role position and permissions.',
                ephemeral: true
            });
        }

        // Ban member
        await member.ban({
            reason
        });

        const embed = createEmbed(interaction)
            .setAuthor({
                name: '🔨 Member Banned',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                {
                    name: '👤 User',
                    value: `${member.user.tag}`,
                    inline: true
                },
                {
                    name: '📝 Reason',
                    value: reason,
                    inline: true
                },
                {
                    name: '👮 Moderator',
                    value: interaction.user.tag,
                    inline: true
                }
            );

        await interaction.reply({
            embeds: [embed]
        });

    }
};
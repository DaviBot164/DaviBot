const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

const {
    isSelf,
    isBot,
    isOwner,
    hasHigherRole,
    canBotModerate
} = require('../../utils/moderation/permissions');

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

        if (!member) {
            return interaction.reply({
                content: '❌ Member not found.',
                ephemeral: true
            });
        }

        if (isSelf(interaction.member, member)) {
            return interaction.reply({
                content: '❌ You cannot ban yourself.',
                ephemeral: true
            });
        }

        if (isBot(interaction.client, member)) {
            return interaction.reply({
                content: '❌ You cannot ban the bot.',
                ephemeral: true
            });
        }

        if (isOwner(member)) {
            return interaction.reply({
                content: '❌ You cannot ban the server owner.',
                ephemeral: true
            });
        }

        if (hasHigherRole(interaction.member, member)) {
            return interaction.reply({
                content: '❌ This member has an equal or higher role than you.',
                ephemeral: true
            });
        }

        const botMember = interaction.guild.members.me;

        if (!canBotModerate(botMember, member)) {
            return interaction.reply({
                content: '❌ I cannot ban this member. My role must be higher than the target member.',
                ephemeral: true
            });
        }

        await member.ban({ reason });

        const embed = createEmbed(interaction)
            .setAuthor({
                name: '🔨 Member Banned',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                {
                    name: '👤 User',
                    value: member.user.tag,
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
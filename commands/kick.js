const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Member to kick')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        ),

    async execute(interaction) {

        const member = interaction.options.getMember('user');
        const reason =
            interaction.options.getString('reason') || 'No reason provided.';

        // Member exists?
        if (!member) {
            return interaction.reply({
                content: '❌ Member not found.',
                ephemeral: true
            });
        }

        // Can't kick yourself
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick yourself.',
                ephemeral: true
            });
        }

        // Can the bot kick this member?
        if (!member.kickable) {
            return interaction.reply({
                content: '❌ I cannot kick this member. Check my role position and permissions.',
                ephemeral: true
            });
        }

        // Kick the member
        await member.kick(reason);

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('👢 Member Kicked')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
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
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

    }
};
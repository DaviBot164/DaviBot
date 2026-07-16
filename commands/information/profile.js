const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View information about a user.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select a user')
                .setRequired(false)
        ),

    async execute(interaction) {

        const user = interaction.options.getUser('user') || interaction.user;
        const fullUser = await user.fetch();
        const member = await interaction.guild.members.fetch(user.id);

        const avatarURL = fullUser.displayAvatarURL({
            size: 4096,
            forceStatic: false
        });

        const bannerURL = fullUser.bannerURL({
            size: 4096,
            forceStatic: false
        });

        const embed = createEmbed(interaction)
            .setAuthor({
                name: `${user.username}'s Profile`,
                iconURL: avatarURL
            })
            .setThumbnail(avatarURL)

            .addFields(
                {
                    name: '👤 USER INFORMATION',
                    value:
                        `**Username:** ${user.username}\n` +
                        `**Display Name:** ${member.displayName}\n` +
                        `**Account Type:** ${user.bot ? 'Bot' : 'Human'}\n` +
                        `**User ID:** \`${user.id}\``
                },
                {
                    name: '🏰 SERVER INFORMATION',
                    value:
                        `**Nickname:** ${member.nickname ?? 'None'}\n` +
                        `**Highest Role:** ${member.roles.highest}\n` +
                        `**Roles:** ${member.roles.cache.filter(role => role.id !== interaction.guild.id).size}`
                },
                {
                    name: '📅 ACCOUNT INFORMATION',
                    value:
                        `**Account Created:**\n<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n\n` +
                        `**Joined Server:**\n<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Open Avatar')
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatarURL)
            );

        if (bannerURL) {

            embed.setImage(bannerURL);

            buttons.addComponents(
                new ButtonBuilder()
                    .setLabel('Open Banner')
                    .setStyle(ButtonStyle.Link)
                    .setURL(bannerURL)
            );

        }

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });

    }
};
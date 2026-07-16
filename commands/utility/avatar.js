const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('View a user avatar.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select a user')
                .setRequired(false)
        ),

    async execute(interaction) {

        const selectedUser = interaction.options.getUser('user') || interaction.user;

        const user = await selectedUser.fetch(true);
        const member = await interaction.guild.members.fetch(user.id);

        const avatarURL = user.displayAvatarURL({
            size: 4096,
            forceStatic: false
        });

        const bannerURL = user.bannerURL({
            size: 4096,
            forceStatic: false
        });

        const embed = createEmbed(interaction)
            .setAuthor({
                name: `${user.username}'s Avatar`,
                iconURL: avatarURL
            })
            .setThumbnail(avatarURL)
            .setImage(avatarURL)
            .addFields(
                {
                    name: '👤 USER INFORMATION',
                    value:
                        `**Username:** ${user.username}\n` +
                        `**Display Name:** ${member.displayName}\n` +
                        `**User ID:** \`${user.id}\``
                },
                {
                    name: '🖼️ AVATAR INFORMATION',
                    value:
                        `**Animated:** ${avatarURL.includes('.gif') ? 'Yes' : 'No'}\n` +
                        `**Banner:** ${bannerURL ? 'Available' : 'Not Available'}\n` +
                        `**Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
                }
            );

        const buttons = [];

        buttons.push(
            new ButtonBuilder()
                .setLabel('Open Avatar')
                .setEmoji('🖼️')
                .setStyle(ButtonStyle.Link)
                .setURL(avatarURL)
        );

        if (bannerURL) {

            buttons.push(
                new ButtonBuilder()
                    .setLabel('Open Banner')
                    .setEmoji('🌄')
                    .setStyle(ButtonStyle.Link)
                    .setURL(bannerURL)
            );

        }

        const row = new ActionRowBuilder()
            .addComponents(buttons);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

    }
};
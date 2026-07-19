const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

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
        try {
            const selectedUser =
                interaction.options.getUser('user') ||
                interaction.user;

            const user = await selectedUser.fetch(true);

            const member = await interaction.guild.members.fetch(
                user.id
            );

            const avatarURL = user.displayAvatarURL({
                size: 4096,
                forceStatic: false
            });

            const bannerURL = user.bannerURL({
                size: 4096,
                forceStatic: false
            });

            const createdTimestamp = Math.floor(
                user.createdTimestamp / 1000
            );

            const embed = createEmbed({
                title: '🖼️ User Avatar',
                description:
                    `Avatar information for ${user}.`,
                thumbnail: avatarURL,
                fields: [
                    {
                        name: '👤 User Information',
                        value:
                            `**Username:** ${user.username}\n` +
                            `**Display Name:** ${member.displayName}\n` +
                            `**User ID:** \`${user.id}\``,
                        inline: false
                    },
                    {
                        name: '🖼️ Avatar Information',
                        value:
                            `**Animated:** ${
                                avatarURL.includes('.gif')
                                    ? 'Yes'
                                    : 'No'
                            }\n` +
                            `**Banner:** ${
                                bannerURL
                                    ? 'Available'
                                    : 'Not Available'
                            }\n` +
                            `**Account Created:** <t:${createdTimestamp}:F>`,
                        inline: false
                    }
                ]
            });

            embed
                .setAuthor({
                    name: `${user.username}'s Avatar`,
                    iconURL: avatarURL
                })
                .setImage(avatarURL);

            const buttons = [
                new ButtonBuilder()
                    .setLabel('Open Avatar')
                    .setEmoji('🖼️')
                    .setStyle(ButtonStyle.Link)
                    .setURL(avatarURL)
            ];

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
        } catch (error) {
            console.error(
                '❌ Error executing /avatar:',
                error
            );

            const errorEmbed = createErrorEmbed(
                '❌ Avatar Error',
                'I could not retrieve this user’s avatar.'
            );

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                embeds: [errorEmbed],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
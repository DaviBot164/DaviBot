const {
    SlashCommandBuilder,
    AttachmentBuilder
} = require('discord.js');

const {
    ensureUser
} = require('../../database/users');

const {
    getAchievements
} = require('../../database/achievements');

const {
    getEquippedTitle
} = require('../../database/titles');

const {
    getTitle
} = require('../../config/achievements');

const {
    createProfileCard
} = require('../../utils/cards/profileCard');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription(
            'View a Blood Moon soul profile.'
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription(
                    'Member whose profile you want to view.'
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const selected =
            interaction.options.getUser(
                'member'
            ) ??
            interaction.user;

        const member =
            await interaction.guild.members
                .fetch(selected.id)
                .catch(() => null);

        if (!member) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Soul Not Found',
                        'That member could not be found in this server.'
                    )
                ]
            });

            return;
        }

        if (member.user.bot) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'No Soul Profile',
                        'Bots do not have Blood Moon progression profiles.'
                    )
                ]
            });

            return;
        }

        const user = await ensureUser(
            interaction.guild.id,
            member.id,
            member.joinedAt
        );

        const [
            achievements,
            equippedTitle
        ] = await Promise.all([
            getAchievements(
                interaction.guild.id,
                member.id
            ),

            getEquippedTitle(
                interaction.guild.id,
                member.id
            )
        ]);

        const title =
            equippedTitle
                ? getTitle(
                    equippedTitle.titleId
                )
                : null;

        const image =
            await createProfileCard(
                member,
                user,
                {
                    title,
                    achievementCount:
                        achievements.length
                }
            );

        const attachment =
            new AttachmentBuilder(
                image,
                {
                    name: 'soul-profile.png'
                }
            );

        const embed = createEmbed(
            'Soul Profile',
            `${member}'s journey beneath the Blood Moon.`
        )
            .setImage(
                'attachment://soul-profile.png'
            )
            .setFooter({
                text: 'AKANE • BLOOD MOON'
            });

        await interaction.editReply({
            embeds: [embed],
            files: [attachment]
        });
    }
};
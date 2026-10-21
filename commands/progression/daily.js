const { dailyEmbed } = require('../../utils/dailyPresentation');
const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    ensureUser
} = require('../../database/users');

const {
    claimDaily
} = require('../../database/dailyRewards');

const {
    checkAutoPromotion
} = require('../../handlers/autoPromotion');

const {
    refreshProgressionUnlocks
} = require('../../handlers/progressionUnlocks');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription(
            'Claim your daily Blood Moon XP reward.'
        ),

    async execute(interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const member = await interaction.guild.members
            .fetch(interaction.user.id)
            .catch(() => null);

        if (!member) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Soul Not Found',
                        'Your server membership could not be verified.'
                    )
                ]
            });
        }

        if (member.user.bot) {
            return interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Unavailable',
                        'Bots cannot claim daily rewards.'
                    )
                ]
            });
        }

        const guildId = interaction.guild.id;
        const userId = member.id;

        await ensureUser(
            guildId,
            userId,
            member.joinedAt
        );

        const result = await claimDaily(
            guildId,
            userId
        );

        await interaction.editReply({ embeds: [dailyEmbed(result)] });
        if (!result.claimed) return;

        if (result.levelsGained) {
            try {
                const user = await ensureUser(
                    guildId,
                    userId,
                    member.joinedAt
                );

                await checkAutoPromotion(member, user);
            } catch (error) {
                console.error(
                    'Daily auto promotion failed:',
                    error
                );
            }
        }

        try {
            await refreshProgressionUnlocks(member);
        } catch (error) {
            console.error(
                'Daily progression refresh failed:',
                error
            );
        }
    }
};

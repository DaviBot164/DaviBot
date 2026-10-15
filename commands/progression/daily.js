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

const DAY = 24 * 60 * 60 * 1000;

function formatDuration(milliseconds) {
    const totalMinutes = Math.ceil(
        Math.max(0, milliseconds) / 60000
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (!hours) {
        return `${minutes}m`;
    }

    return minutes
        ? `${hours}h ${minutes}m`
        : `${hours}h`;
}

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

        if (!result.claimed) {
            const embed = createEmbed(
                '🌙 Daily Reward Unavailable',
                [
                    'You have already claimed your daily reward.',
                    '',
                    `**Current Streak:** ${result.streak} days`,
                    `**Next Reward:** ${formatDuration(result.remainingMs)}`
                ].join('\n')
            );

            return interaction.editReply({
                embeds: [embed]
            });
        }

        const embed = createEmbed(
            '🩸 Daily Reward Claimed',
            [
                `**Reward:** +${result.reward} XP`,
                `**Daily Streak:** ${result.streak} days`,
                `**Current Level:** ${result.level}`,
                '',
                result.levelsGained
                    ? `⚔️ **Level Up!** +${result.levelsGained} level(s)`
                    : 'Your soul grows stronger beneath the Blood Moon.',
                '',
                'Return in 24 hours to continue your journey.'
            ].join('\n')
        );

        await interaction.editReply({
            embeds: [embed]
        });

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
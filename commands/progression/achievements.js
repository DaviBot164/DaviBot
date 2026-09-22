const {
    SlashCommandBuilder
} = require('discord.js');

const {
    ensureUser
} = require('../../database/users');

const {
    getAchievements: getUnlockedAchievements
} = require('../../database/achievements');

const {
    getAchievements,
    getAchievementRank,
    ACHIEVEMENT_RANKS
} = require('../../config/achievements');

const {
    calculateAchievementPoints
} = require('../../handlers/achievementHandler');

const {
    createEmbed,
    errorEmbed
} = require('../../utils/embeds');

function getRequirementProgress(
    achievement,
    user
) {
    const requirement =
        achievement.requirement;

    switch (requirement.type) {
        case 'messages':
            return {
                current: user.messages,
                required: requirement.value
            };

        case 'level':
            return {
                current: user.level,
                required: requirement.value
            };

        case 'faction':
            return {
                complete: Boolean(
                    user.faction
                ),
                label: 'Choose a path'
            };

        case 'prestige_rank':
            return {
                complete:
                    user.rank === 'hashira' ||
                    user.rank === 'upper_moon',
                label: 'Complete a prestige Trial'
            };

        default:
            return null;
    }
}

function formatLockedAchievement(
    achievement,
    user
) {
    const progress =
        getRequirementProgress(
            achievement,
            user
        );

    let requirement = '';

    if (
        progress &&
        'current' in progress
    ) {
        requirement =
            `${Math.min(
                progress.current,
                progress.required
            ).toLocaleString('en-US')} / ` +
            progress.required.toLocaleString(
                'en-US'
            );
    } else if (progress) {
        requirement =
            progress.complete
                ? 'Ready to unlock'
                : progress.label;
    }

    return [
        `🔒 **${achievement.name}**`,
        `${achievement.description}`,
        `**+${achievement.points} AP**` +
            (
                requirement
                    ? ` • ${requirement}`
                    : ''
            )
    ].join('\n');
}

function formatUnlockedAchievement(
    achievement
) {
    return [
        `🏆 **${achievement.name}**`,
        `${achievement.description}`,
        `**+${achievement.points} AP**`
    ].join('\n');
}

function getNextRank(points) {
    return ACHIEVEMENT_RANKS.find(
        rank => points < rank.points
    ) ?? null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription(
            'View Blood Moon achievement progress.'
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription(
                    'Member whose achievements you want to view.'
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
                        'No Achievements',
                        'Bots do not have Blood Moon achievements.'
                    )
                ]
            });

            return;
        }

        const [
            user,
            unlockedEntries
        ] = await Promise.all([
            ensureUser(
                interaction.guild.id,
                member.id,
                member.joinedAt
            ),

            getUnlockedAchievements(
                interaction.guild.id,
                member.id
            )
        ]);

        const unlockedIds =
            new Set(
                unlockedEntries.map(
                    entry =>
                        entry.achievementId
                )
            );

        const points =
            calculateAchievementPoints(
                unlockedEntries
            );

        const currentRank =
            getAchievementRank(
                points
            );

        const nextRank =
            getNextRank(
                points
            );

        const achievements =
            getAchievements();

        const unlocked = [];
        const locked = [];

        for (const achievement of achievements) {
            if (
                unlockedIds.has(
                    achievement.id
                )
            ) {
                unlocked.push(
                    formatUnlockedAchievement(
                        achievement
                    )
                );

                continue;
            }

            locked.push(
                formatLockedAchievement(
                    achievement,
                    user
                )
            );
        }

        const rankText =
            currentRank
                ? `**${currentRank.name}**`
                : 'Unranked';

        const nextRankText =
            nextRank
                ? `**${nextRank.name}** — ` +
                  `${nextRank.points - points} AP remaining`
                : '**Maximum Rank Reached**';

        const summary = [
            `${member}`,
            '',
            `**Achievement Rank:** ${rankText}`,
            `**Achievement Points:** ${points} AP`,
            `**Achievements:** ${unlocked.length}/${achievements.length}`,
            `**Next Rank:** ${nextRankText}`
        ].join('\n');

        const embed =
            createEmbed(
                'Blood Moon Achievements',
                summary
            )
                .setThumbnail(
                    member.user
                        .displayAvatarURL({
                            size: 256
                        })
                )
                .addFields(
                    {
                        name: '🏆 Unlocked',
                        value:
                            unlocked.length
                                ? unlocked.join(
                                    '\n\n'
                                )
                                : 'No achievements unlocked yet.'
                    },
                    {
                        name: '🔒 Locked',
                        value:
                            locked.length
                                ? locked.join(
                                    '\n\n'
                                )
                                : 'Every achievement has been unlocked.'
                    }
                )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                });

        await interaction.editReply({
            embeds: [embed]
        });
    }
};
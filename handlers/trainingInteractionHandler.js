const { dailyEmbed } = require('../utils/dailyPresentation');
const {
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');

const {
    TRAINING_IDS
} = require('../utils/setup/publishTrainingGrounds');

const {
    ensureUser
} = require('../database/users');

const {
    ensurePlayerStats
} = require('../database/playerStats');

const {
    claimDaily
} = require('../database/dailyRewards');

const {
    getDailyQuests
} = require('../database/dailyQuests');

const {
    getAchievements: getUnlockedAchievements
} = require('../database/achievements');

const {
    getEquippedTitle
} = require('../database/titles');

const {
    getTitle
} = require('../config/titles');

const {
    getAchievements,
    getAchievementRank,
    ACHIEVEMENT_RANKS
} = require('../config/achievements');

const {
    calculateAchievementPoints
} = require('./achievementHandler');

const {
    checkAutoPromotion
} = require('./autoPromotion');

const {
    refreshProgressionUnlocks
} = require('./progressionUnlocks');

const {
    createProfileCard
} = require('../utils/cards/profileCard');

const {
    buildQuestPanel
} = require('../utils/quests/questPanel');

const {
    createEmbed,
    errorEmbed
} = require('../utils/embeds');

function formatDuration(milliseconds) {
    const total = Math.ceil(
        Math.max(0, milliseconds) / 60000
    );

    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    return hours
        ? `${hours}h${minutes ? ` ${minutes}m` : ''}`
        : `${minutes}m`;
}

async function handleDaily(interaction, member) {
    const result = await claimDaily(
        member.guild.id,
        member.id
    );

    await interaction.editReply({ embeds: [dailyEmbed(result)] });
    if (!result.claimed) return;

    if (result.levelsGained) {
        try {
            const user = await ensureUser(
                member.guild.id,
                member.id,
                member.joinedAt
            );

            await checkAutoPromotion(member, user);
        } catch (error) {
            console.error(
                'Training promotion failed:',
                error
            );
        }
    }

    try {
        await refreshProgressionUnlocks(member);
    } catch (error) {
        console.error(
            'Training unlock refresh failed:',
            error
        );
    }
}

async function handleProfile(interaction, member) {
    const guildId = member.guild.id;
    const userId = member.id;

    const user = await ensureUser(
        guildId,
        userId,
        member.joinedAt
    );

    const [
        stats,
        achievements,
        equippedTitle
    ] = await Promise.all([
        ensurePlayerStats(guildId, userId),
        getUnlockedAchievements(guildId, userId),
        getEquippedTitle(guildId, userId)
    ]);

    const title = equippedTitle
        ? getTitle(equippedTitle.titleId)
        : null;

    const image = await createProfileCard(
        member,
        user,
        {
            title,
            achievementCount: achievements.length,
            stats
        }
    );

    const attachment = new AttachmentBuilder(
        image,
        { name: 'training-profile.png' }
    );

    await interaction.editReply({
        embeds: [
            createEmbed(
                '🎴 Soul Profile',
                `${member}'s journey beneath the Blood Moon.`
            ).setImage(
                'attachment://training-profile.png'
            )
        ],
        files: [attachment]
    });
}

function requirementText(achievement, user) {
    const requirement = achievement.requirement;

    switch (requirement.type) {
        case 'messages':
        case 'level': {
            const current = requirement.type === 'messages'
                ? user.messages
                : user.level;

            return `${Math.min(current, requirement.value).toLocaleString('en-US')}/${requirement.value.toLocaleString('en-US')}`;
        }

        case 'faction':
            return user.faction
                ? 'Ready to unlock'
                : 'Choose a path';

        case 'prestige_rank':
            return ['hashira', 'upper_moon'].includes(user.rank)
                ? 'Ready to unlock'
                : 'Complete a prestige Trial';

        default:
            return '';
    }
}

function formatAchievement(achievement, user, unlocked) {
    const progress = unlocked
        ? ''
        : requirementText(achievement, user);

    return [
        `${unlocked ? '🏆' : '🔒'} **${achievement.name}**`,
        achievement.description,
        `**+${achievement.points} AP**${progress ? ` • ${progress}` : ''}`
    ].join('\n');
}

function addAchievementSections(
    embed,
    entries,
    user,
    unlockedIds
) {
    for (const [label, unlocked] of [
        ['🏆 Unlocked', true],
        ['🔒 Locked', false]
    ]) {
        const filtered = entries.filter(
            achievement =>
                unlockedIds.has(achievement.id) === unlocked
        );

        const sections = [];
        let current = '';

        for (const achievement of filtered) {
            const entry = formatAchievement(
                achievement,
                user,
                unlocked
            );

            if (
                current &&
                current.length + entry.length + 2 > 1000
            ) {
                sections.push(current);
                current = '';
            }

            if (entry.length > 1000) {
                continue;
            }

            current += `${current ? '\n\n' : ''}${entry}`;
        }

        if (current) {
            sections.push(current);
        }

        if (!sections.length) {
            sections.push(
                unlocked
                    ? 'No achievements unlocked yet.'
                    : 'Every achievement has been unlocked.'
            );
        }

        for (
            let index = 0;
            index < sections.length;
            index++
        ) {
            embed.addFields({
                name: index
                    ? `${label} • Continued`
                    : label,
                value: sections[index]
            });
        }
    }
}

async function handleAchievements(interaction, member) {
    const guildId = member.guild.id;
    const userId = member.id;

    const [user, unlockedEntries] = await Promise.all([
        ensureUser(
            guildId,
            userId,
            member.joinedAt
        ),
        getUnlockedAchievements(guildId, userId)
    ]);

    const unlockedIds = new Set(
        unlockedEntries.map(
            entry => entry.achievementId
        )
    );

    const points = calculateAchievementPoints(
        unlockedEntries
    );

    const rank = getAchievementRank(points);

    const nextRank = ACHIEVEMENT_RANKS.find(
        entry => points < entry.points
    );

    const achievements = getAchievements();

    const embed = createEmbed(
        '🏆 Blood Moon Achievements',
        [
            `${member}`,
            '',
            `**Achievement Rank:** ${rank?.name || 'Unranked'}`,
            `**Achievement Points:** ${points} AP`,
            `**Achievements:** ${unlockedIds.size}/${achievements.length}`,
            '**Next Rank:** ' + (
                nextRank
                    ? `${nextRank.name} — ${nextRank.points - points} AP remaining`
                    : 'Maximum Rank Reached'
            )
        ].join('\n')
    ).setThumbnail(
        member.user.displayAvatarURL({ size: 256 })
    );

    addAchievementSections(
        embed,
        achievements,
        user,
        unlockedIds
    );

    await interaction.editReply({
        embeds: [embed]
    });
}

async function handleQuests(interaction, member) {
    const data = await getDailyQuests(
        member.guild.id,
        member.id
    );

    await interaction.editReply(
        buildQuestPanel(data)
    );
}

async function handleTrainingButton(interaction) {
    if (
        !interaction.isButton() ||
        !Object.values(TRAINING_IDS).includes(
            interaction.customId
        )
    ) {
        return false;
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

    if (!member || member.user.bot) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Soul Not Found',
                    'Your Blood Moon profile is unavailable.'
                )
            ]
        });

        return true;
    }

    await ensureUser(
        member.guild.id,
        member.id,
        member.joinedAt
    );

    switch (interaction.customId) {
        case TRAINING_IDS.daily:
            await handleDaily(interaction, member);
            break;

        case TRAINING_IDS.profile:
            await handleProfile(interaction, member);
            break;

        case TRAINING_IDS.achievements:
            await handleAchievements(interaction, member);
            break;

        case TRAINING_IDS.quests:
            await handleQuests(interaction, member);
            break;
    }

    return true;
}

module.exports = {
    handleTrainingButton
};

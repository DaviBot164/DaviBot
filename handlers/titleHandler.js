const {
    getTitles: getUnlockedTitles,
    unlockTitle,
    equipTitle,
    clearEquippedTitle
} = require('../database/titles');

const {
    getTitle,
    getTitles
} = require('../config/titles');

const {
    getAchievements: getUnlockedAchievements
} = require('../database/achievements');

const {
    getAchievementRank,
    getAchievements
} = require('../config/achievements');

const {
    calculateAchievementPoints
} = require('./achievementHandler');

const {
    createEmbed,
    errorEmbed
} = require('../utils/embeds');

function meetsTitleRequirement(
    title,
    {
        user,
        achievementCount,
        achievementRank,
        totalAchievements
    }
) {
    const requirement =
        title.requirement;

    switch (requirement.type) {
        case 'achievement_rank':
            return Boolean(
                achievementRank
            );

        case 'achievement_count':
            return achievementCount >=
                requirement.value;

        case 'prestige_rank':
            return (
                user.rank === 'hashira' ||
                user.rank === 'upper_moon'
            );

        case 'all_achievements':
            return (
                achievementCount >=
                totalAchievements
            );

        default:
            return false;
    }
}

async function checkMemberTitles(
    member,
    user
) {
    if (!member || !user) {
        return [];
    }

    const guildId =
        member.guild.id;

    const userId =
        member.id;

    const [
        unlockedTitles,
        unlockedAchievements
    ] = await Promise.all([
        getUnlockedTitles(
            guildId,
            userId
        ),

        getUnlockedAchievements(
            guildId,
            userId
        )
    ]);

    const unlockedIds =
        new Set(
            unlockedTitles.map(
                entry =>
                    entry.titleId
            )
        );

    const points =
        calculateAchievementPoints(
            unlockedAchievements
        );

    const achievementRank =
        getAchievementRank(
            points
        );

    const context = {
        user,
        achievementCount:
            unlockedAchievements.length,
        achievementRank,
        totalAchievements:
            getAchievements().length
    };

    const newlyUnlocked = [];

    for (const title of getTitles()) {
        if (
            unlockedIds.has(title.id) ||
            !meetsTitleRequirement(
                title,
                context
            )
        ) {
            continue;
        }

        const unlocked =
            await unlockTitle(
                guildId,
                userId,
                title.id
            );

        if (!unlocked) {
            continue;
        }

        newlyUnlocked.push(
            title
        );

        unlockedIds.add(
            title.id
        );
    }

    return newlyUnlocked;
}

async function handleTitleSelect(
    interaction
) {
    if (
        !interaction.isStringSelectMenu() ||
        interaction.customId !==
            'akane:title:select'
    ) {
        return false;
    }

    await interaction.deferUpdate();

    const titleId =
        interaction.values[0];

    if (titleId === 'none') {
        await clearEquippedTitle(
            interaction.guild.id,
            interaction.user.id
        );

        await interaction.editReply({
            embeds: [
                createEmbed(
                    'Title Removed',
                    'Your active title has been removed.'
                )
                    .setFooter({
                        text: 'AKANE • BLOOD MOON'
                    })
            ],
            components: []
        });

        return true;
    }

    const unlocked =
        await getUnlockedTitles(
            interaction.guild.id,
            interaction.user.id
        );

    const title =
        getTitle(titleId);

    const ownsTitle =
        unlocked.some(
            entry =>
                entry.titleId ===
                titleId
        );

    if (
        !title ||
        !ownsTitle
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Title Unavailable',
                    'You have not unlocked this title.'
                )
            ],
            components: []
        });

        return true;
    }

    const equipped =
        await equipTitle(
            interaction.guild.id,
            interaction.user.id,
            titleId
        );

    if (!equipped) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Title Unavailable',
                    'Akane could not equip this title.'
                )
            ],
            components: []
        });

        return true;
    }

    await interaction.editReply({
        embeds: [
            createEmbed(
                'Title Equipped',
                `Your active title is now **${title.name}**.`
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                })
        ],
        components: []
    });

    return true;
}

module.exports = {
    checkMemberTitles,
    handleTitleSelect
};
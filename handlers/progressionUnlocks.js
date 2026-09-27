const {
    getUser
} = require('../database/users');

const {
    checkMemberAchievements
} = require('./achievementHandler');

const {
    checkMemberTitles
} = require('./titleHandler');

const {
    sendAchievementUnlock
} = require('../utils/achievementNotifications');

const {
    sendTitleUnlock
} = require('../utils/titleNotifications');

async function refreshProgressionUnlocks(member) {
    if (!member) {
        return;
    }

    const user =
        await getUser(
            member.guild.id,
            member.id
        );

    if (!user) {
        return;
    }

    const achievementResult =
        await checkMemberAchievements(
            member,
            user
        );

    for (
        const achievement
        of achievementResult.unlocked
    ) {
        try {
            await sendAchievementUnlock(
                member,
                achievement
            );
        } catch (error) {
            console.error(
                'Achievement announcement failed:',
                error
            );
        }
    }

    const unlockedTitles =
        await checkMemberTitles(
            member,
            user
        );

    for (const title of unlockedTitles) {
        try {
            await sendTitleUnlock(
                member,
                title
            );
        } catch (error) {
            console.error(
                'Title announcement failed:',
                error
            );
        }
    }
}

module.exports = {
    refreshProgressionUnlocks
};
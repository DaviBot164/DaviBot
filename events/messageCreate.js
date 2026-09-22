const { Events } = require('discord.js');

const {
    ensureUser,
    addActivity,
    setProgress
} = require('../database/users');

const {
    randomXP,
    calculateLevel
} = require('../utils/leveling');

const {
    canEarnXP
} = require('../handlers/xpCooldown');

const {
    checkAutoPromotion
} = require('../handlers/autoPromotion');

const {
    checkMemberAchievements
} = require('../handlers/achievementHandler');

const {
    checkMemberTitles
} = require('../handlers/titleHandler');

const {
    sendLevelUp
} = require('../utils/levelNotifications');

const {
    sendAchievementUnlock
} = require('../utils/achievementNotifications');

const {
    sendTitleUnlock
} = require('../utils/titleNotifications');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (
            !message.inGuild() ||
            message.author.bot ||
            !canEarnXP(
                message.guild.id,
                message.author.id
            )
        ) {
            return;
        }

        const member =
            message.member;

        await ensureUser(
            message.guild.id,
            message.author.id,
            member?.joinedAt ?? null
        );

        let user =
            await addActivity(
                message.guild.id,
                message.author.id,
                randomXP()
            );

        const progress =
            calculateLevel(
                user.level,
                user.xp
            );

        if (progress.levelsGained) {
            user =
                await setProgress(
                    message.guild.id,
                    message.author.id,
                    progress.level,
                    progress.xp
                );

            try {
                await sendLevelUp(
                    message,
                    progress.level
                );
            } catch (error) {
                console.error(
                    'Level announcement failed:',
                    error
                );
            }

            if (member) {
                await checkAutoPromotion(
                    member,
                    user
                );
            }
        }

        if (!member) {
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
};
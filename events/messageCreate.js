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
    runGuardian
} = require('../handlers/guardian');

const {
    checkAutoPromotion
} = require('../handlers/autoPromotion');

const {
    refreshProgressionUnlocks
} = require('../handlers/progressionUnlocks');

const {
    sendLevelUp
} = require('../utils/levelNotifications');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (
            !message.inGuild() ||
            message.author.bot
        ) {
            return;
        }

        const guardianResult =
            await runGuardian(
                message
            );

        if (guardianResult.blocked) {
            return;
        }

        if (
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

        await refreshProgressionUnlocks(
            member
        );
    }
};
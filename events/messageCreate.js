const { Events } = require('discord.js');

const {
    ensureUser
} = require('../database/users');

const {
    awardXP
} = require('../database/xpRewards');

const {
    randomXP
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
        if (!message.inGuild() || message.author.bot) {
            return;
        }

        const guardianResult = await runGuardian(message);

        if (guardianResult.blocked) {
            return;
        }

        if (!canEarnXP(message.guild.id, message.author.id)) {
            return;
        }

        const member = message.member;

        await ensureUser(
            message.guild.id,
            message.author.id,
            member?.joinedAt ?? null
        );

        const result = await awardXP(
            message.guild.id,
            message.author.id,
            randomXP(),
            { message: true }
        );

        if (result.levelsGained) {
            try {
                await sendLevelUp(
                    message,
                    result.user.level
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
                    result.user
                );
            }
        }

        if (member) {
            await refreshProgressionUnlocks(member);
        }
    }
};
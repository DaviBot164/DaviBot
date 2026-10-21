const {
    ensureUser
} = require('../database/users');

const {
    QUESTS,
    getDailyQuests,
    claimQuestReward
} = require('../database/dailyQuests');

const {
    BUTTON_PREFIX,
    buildQuestPanel
} = require('../utils/quests/questPanel');

const {
    checkAutoPromotion
} = require('./autoPromotion');

const {
    refreshProgressionUnlocks
} = require('./progressionUnlocks');

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseQuestButton(customId) {
    if (!customId.startsWith(BUTTON_PREFIX)) {
        return null;
    }

    const value = customId.slice(
        BUTTON_PREFIX.length
    );

    const separator = value.lastIndexOf(':');

    if (separator === -1) {
        return null;
    }

    const questId = value.slice(0, separator);
    const cycleId = value.slice(separator + 1);

    if (
        !Object.hasOwn(QUESTS, questId) ||
        !UUID_PATTERN.test(cycleId)
    ) {
        return null;
    }

    return {
        questId,
        cycleId
    };
}

function claimMessage(result, questId) {
    if (result.claimed) {
        return [
            `🎁 **${result.questName ?? QUESTS[questId].name} Completed!**`,
            `You received **+${result.reward} XP**.`,
            result.boardBonus ? `🦊 **Board cleared! +${result.boardBonus} XP bonus included.**` : '',
            result.levelsGained
                ? `⚔️ Level Up! You reached **Level ${result.level}**.`
                : ''
        ].filter(Boolean).join('\n');
    }

    const messages = {
        already_claimed:
            '✅ You have already claimed this reward.',
        incomplete:
            '⏳ Complete this quest before claiming its reward.',
        expired:
            '⌛ This quest cycle has expired. Your missions have been refreshed.',
        invalid_cycle:
            '⚠️ This quest panel is no longer valid.'
    };

    return messages[result.reason] ||
        'This quest reward is unavailable.';
}

async function updateProgression(member, result) {
    if (!result.claimed) {
        return;
    }

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
                'Quest promotion failed:',
                error
            );
        }
    }

    try {
        await refreshProgressionUnlocks(member);
    } catch (error) {
        console.error(
            'Quest unlock refresh failed:',
            error
        );
    }
}

async function handleQuestInteraction(interaction) {
    if (
        !interaction.isButton() ||
        !interaction.customId.startsWith(BUTTON_PREFIX)
    ) {
        return false;
    }

    await interaction.deferUpdate();

    const button = parseQuestButton(
        interaction.customId
    );

    if (!button || !interaction.inGuild()) {
        await interaction.editReply({
            content: 'This quest button is invalid.',
            embeds: [],
            components: []
        });

        return true;
    }

    const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

    if (!member || member.user.bot) {
        await interaction.editReply({
            content: 'Your Blood Moon profile is unavailable.',
            embeds: [],
            components: []
        });

        return true;
    }

    const guildId = member.guild.id;
    const userId = member.id;

    await ensureUser(
        guildId,
        userId,
        member.joinedAt
    );

    const result = await claimQuestReward(
        guildId,
        userId,
        button.questId,
        button.cycleId
    );

    const data = await getDailyQuests(
        guildId,
        userId
    );

    const panel = buildQuestPanel(data);

    panel.content = claimMessage(
        result,
        button.questId
    );

    await interaction.editReply(panel);

    await updateProgression(member, result);

    return true;
}

module.exports = {
    handleQuestInteraction
};

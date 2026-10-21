const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    QUESTS
} = require('../../database/dailyQuests');

const {
    createEmbed
} = require('../embeds');

const BUTTON_PREFIX = 'akane:quest:claim:';

const ICONS = Object.freeze({
    active_soul: '💬',
    dedicated_warrior: '⚔️',
    blood_moon_devotion: '🌙'
});

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function progressBar(current, required) {
    const ratio = Math.max(
        0,
        Math.min(1, current / required)
    );

    const filled = Math.floor(ratio * 10);

    return '▰'.repeat(filled) +
        '▱'.repeat(10 - filled);
}

function formatQuest(quest) {
    const status = quest.claimed
        ? '✅ Reward Claimed'
        : quest.completed
            ? '🎁 Ready to Claim'
            : '⏳ In Progress';

    return [
        `${ICONS[quest.id] || '📜'} **${quest.name}**`,
        `\`${progressBar(quest.current, quest.required)}\``,
        `**Progress:** ${quest.current}/${quest.required}`,
        `**Reward:** +${quest.reward} XP`,
        `**Status:** ${status}`
    ].join('\n');
}

function buildQuestPanel(data) {
    if (
        typeof data.cycleId !== 'string' ||
        !UUID_PATTERN.test(data.cycleId)
    ) {
        throw new Error('Invalid quest cycle ID.');
    }

    const resetTimestamp = Math.floor(
        data.nextResetAt.getTime() / 1000
    );

    const embed = createEmbed(
        '📜 BLOOD MOON • DAILY QUESTS',
        [
            'Complete your personal missions to earn XP.',
            '',
            ...data.quests.map(formatQuest),
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            `**Next Reset:** <t:${resetTimestamp}:R>`,
            '',
            '*The Blood Moon rewards your dedication.*'
        ].join('\n\n')
    );

    const row = new ActionRowBuilder();

    for (const quest of data.quests) {
        const config = QUESTS[quest.id];

        if (!config) {
            continue;
        }

        const available =
            quest.completed && !quest.claimed;

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `${BUTTON_PREFIX}${quest.id}:${data.cycleId}`
                )
                .setLabel(
                    quest.claimed
                        ? 'Claimed'
                        : available
                            ? `Claim ${quest.reward} XP`
                            : config.name
                )
                .setEmoji(ICONS[quest.id] || '📜')
                .setStyle(
                    available
                        ? ButtonStyle.Success
                        : ButtonStyle.Secondary
                )
                .setDisabled(!available)
        );
    }

    return {
        embeds: [embed],
        components: row.components.length ? [row] : []
    };
}

module.exports = {
    BUTTON_PREFIX,
    buildQuestPanel
};
// Akane mission presentation v1: preserve original button and cycle IDs.
const originalMissionPanel = module.exports.buildQuestPanel;
const { decorateQuestPanel } = require('./missionView');
module.exports.buildQuestPanel = function(data) {
    return decorateQuestPanel(originalMissionPanel(data), data);
};

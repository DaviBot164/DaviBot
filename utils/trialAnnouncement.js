const {
    createEmbed
} = require('./embeds');

const {
    buildTrialComponents
} = require('./trialComponents');

function formatRank(rankId) {
    return rankId
        .split('_')
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(' ');
}

function buildTrialAnnouncement(
    trial,
    definition
) {
    const closesAt =
        trial.closesAt
            ? Math.floor(
                new Date(
                    trial.closesAt
                ).getTime() / 1000
            )
            : null;

    const details = [
        `${definition.emoji} **${definition.name}** is now open.`,
        '',
        `Path: **${
            definition.faction === 'slayer'
                ? 'Slayer'
                : 'Demon'
        }**`,
        `Required Level: **${definition.requiredLevel}+**`,
        `Required Rank: **${formatRank(definition.requiredRank)}**`,
        `Reward: **${formatRank(definition.rewardRank)}**`
    ];

    if (closesAt) {
        details.push(
            '',
            `Registration closes <t:${closesAt}:R>.`
        );
    }

    details.push(
        '',
        'Register below if you are ready to face the trial.'
    );

    const embed = createEmbed(
        definition.name,
        details.join('\n')
    )
        .setFooter({
            text: `AKANE • BLOOD MOON • TRIAL #${trial.id}`
        });

    return {
        embeds: [embed],
        components: [
            buildTrialComponents(
                trial.id
            )
        ]
    };
}

module.exports = {
    buildTrialAnnouncement
};
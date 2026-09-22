const {
    FACTIONS
} = require('./progression');

const TRIAL_STATUS = Object.freeze({
    OPEN: 'open',
    CLOSED: 'closed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
});

const PARTICIPANT_STATUS = Object.freeze({
    REGISTERED: 'registered',
    PASSED: 'passed',
    FAILED: 'failed',
    WITHDRAWN: 'withdrawn'
});

const TRIALS = Object.freeze({
    hashira: {
        id: 'hashira',
        name: 'Hashira Trial',
        faction: FACTIONS.SLAYER,
        requiredLevel: 50,
        requiredRank: 'kinoe',
        rewardRank: 'hashira',
        emoji: '🔥'
    },

    upper_moon: {
        id: 'upper_moon',
        name: 'Upper Moon Trial',
        faction: FACTIONS.DEMON,
        requiredLevel: 50,
        requiredRank: 'lower_moon',
        rewardRank: 'upper_moon',
        emoji: '🌙'
    }
});

function getTrial(id) {
    return TRIALS[id] ?? null;
}

function getTrialForFaction(faction) {
    return Object.values(TRIALS)
        .find(
            trial =>
                trial.faction === faction
        ) ?? null;
}

module.exports = {
    TRIAL_STATUS,
    PARTICIPANT_STATUS,
    TRIALS,
    getTrial,
    getTrialForFaction
};
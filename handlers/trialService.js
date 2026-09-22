const {
    getUser
} = require('../database/users');

const {
    getTrial: getTrialRecord,
    getActiveTrial,
    getParticipant,
    registerParticipant,
    withdrawParticipant,
    reviewParticipant,
    resetParticipantReview
} = require('../database/trials');

const {
    TRIAL_STATUS,
    PARTICIPANT_STATUS,
    getTrial
} = require('../config/trials');

const {
    changeRank
} = require('./rankService');

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

function checkEligibility(
    user,
    trial
) {
    if (!user?.faction) {
        return {
            eligible: false,
            reason:
                'You have not chosen a progression path.'
        };
    }

    if (user.faction !== trial.faction) {
        return {
            eligible: false,
            reason:
                `This trial is only available to the ${trial.faction} path.`
        };
    }

    if (user.level < trial.requiredLevel) {
        return {
            eligible: false,
            reason:
                `Level ${trial.requiredLevel} is required for this trial.`
        };
    }

    if (user.rank !== trial.requiredRank) {
        return {
            eligible: false,
            reason:
                `You must hold the ${formatRank(trial.requiredRank)} rank before entering this trial.`
        };
    }

    return {
        eligible: true,
        reason: null
    };
}

async function registerForTrial(
    member,
    trialType
) {
    const definition =
        getTrial(trialType);

    if (!definition) {
        throw new Error(
            'Invalid trial type.'
        );
    }

    const trial =
        await getActiveTrial(
            member.guild.id,
            trialType
        );

    if (!trial) {
        return {
            success: false,
            reason:
                'There is no active trial of this type.'
        };
    }

    const user =
        await getUser(
            member.guild.id,
            member.id
        );

    const eligibility =
        checkEligibility(
            user,
            definition
        );

    if (!eligibility.eligible) {
        return {
            success: false,
            reason: eligibility.reason
        };
    }

    const existing =
        await getParticipant(
            trial.id,
            member.id
        );

    if (
        existing?.status ===
        PARTICIPANT_STATUS.REGISTERED
    ) {
        return {
            success: false,
            reason:
                'You are already registered for this trial.'
        };
    }

    if (
        existing &&
        existing.status !==
            PARTICIPANT_STATUS.WITHDRAWN
    ) {
        return {
            success: false,
            reason:
                'Your result for this trial has already been recorded.'
        };
    }

    const participant =
        await registerParticipant(
            trial.id,
            member.guild.id,
            member.id
        );

    return {
        success: true,
        trial,
        definition,
        participant
    };
}

async function withdrawFromTrial(
    member,
    trialType
) {
    const definition =
        getTrial(trialType);

    if (!definition) {
        throw new Error(
            'Invalid trial type.'
        );
    }

    const trial =
        await getActiveTrial(
            member.guild.id,
            trialType
        );

    if (!trial) {
        return {
            success: false,
            reason:
                'There is no active trial of this type.'
        };
    }

    const participant =
        await withdrawParticipant(
            trial.id,
            member.id
        );

    if (!participant) {
        return {
            success: false,
            reason:
                'You are not registered for this trial.'
        };
    }

    return {
        success: true,
        trial,
        definition,
        participant
    };
}

async function reviewTrialMember(
    member,
    trialId,
    passed,
    reviewedBy,
    reason = null
) {
    const trial =
        await getTrialRecord(
            trialId
        );

    if (!trial) {
        return {
            success: false,
            reason:
                'Trial could not be found.'
        };
    }

    if (trial.guildId !== member.guild.id) {
        return {
            success: false,
            reason:
                'Trial does not belong to this server.'
        };
    }

    if (trial.status !== TRIAL_STATUS.CLOSED) {
        return {
            success: false,
            reason:
                trial.status === TRIAL_STATUS.OPEN
                    ? 'Close registration before reviewing participants.'
                    : 'This trial can no longer be reviewed.'
        };
    }

    const definition =
        getTrial(
            trial.trialType
        );

    if (!definition) {
        throw new Error(
            'Trial definition could not be found.'
        );
    }

    const participant =
        await getParticipant(
            trial.id,
            member.id
        );

    if (
        !participant ||
        participant.status !==
            PARTICIPANT_STATUS.REGISTERED
    ) {
        return {
            success: false,
            reason:
                'This member is not awaiting review.'
        };
    }

    const user =
        await getUser(
            member.guild.id,
            member.id
        );

    if (
        !user ||
        user.faction !== definition.faction
    ) {
        return {
            success: false,
            reason:
                'The member no longer belongs to the required path.'
        };
    }

    const status =
        passed
            ? PARTICIPANT_STATUS.PASSED
            : PARTICIPANT_STATUS.FAILED;

    const result =
        await reviewParticipant(
            trial.id,
            member.id,
            status,
            reviewedBy,
            reason
        );

    if (!result) {
        return {
            success: false,
            reason:
                'The participant result could not be recorded.'
        };
    }

    if (passed) {
        try {
            const promotion =
                await changeRank(
                    member,
                    definition.rewardRank,
                    {
                        changedBy: reviewedBy,
                        reason:
                            reason ??
                            `Passed ${definition.name}`
                    }
                );

            if (!promotion.changed) {
                await resetParticipantReview(
                    trial.id,
                    member.id
                );

                return {
                    success: false,
                    reason:
                        'The prestige rank could not be awarded.'
                };
            }
        } catch (error) {
            await resetParticipantReview(
                trial.id,
                member.id
            );

            throw error;
        }
    }

    return {
        success: true,
        trial,
        definition,
        participant: result,
        passed
    };
}

module.exports = {
    checkEligibility,
    registerForTrial,
    withdrawFromTrial,
    reviewTrialMember
};
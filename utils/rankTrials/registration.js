const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrialParticipants:
        participantDatabase
} = require('../../database');

const {
    getRelevantRankTrialSchedule
} = require('./calendar');

/**
 * Return one publication entry from a
 * monthly Rank Trial schedule.
 *
 * @param {Object} schedule
 * @param {string} publicationKey
 * @returns {Object|null}
 */
function getSchedulePublication(
    schedule,
    publicationKey
) {
    if (
        !schedule ||
        !Array.isArray(
            schedule.publications
        )
    ) {
        return null;
    }

    return (
        schedule.publications.find(
            publication =>
                publication.key ===
                publicationKey
        ) ??
        null
    );
}

/**
 * Build the registration window for one
 * monthly Rank Trial schedule.
 *
 * Registration opens with the Opening
 * Announcement and closes with the
 * Final Reminder.
 *
 * @param {Object} schedule
 * @returns {{
 *     opensAt: Date,
 *     closesAt: Date
 * }}
 */
function getRegistrationWindow(
    schedule
) {
    const openingPublication =
        getSchedulePublication(
            schedule,
            'opening'
        );

    const finalReminderPublication =
        getSchedulePublication(
            schedule,
            'finalReminder'
        );

    if (
        !openingPublication?.scheduledFor
    ) {
        throw new Error(
            'Rank Trial Opening Announcement schedule is unavailable.'
        );
    }

    if (
        !finalReminderPublication?.scheduledFor
    ) {
        throw new Error(
            'Rank Trial Final Reminder schedule is unavailable.'
        );
    }

    const opensAt =
        new Date(
            openingPublication.scheduledFor
        );

    const closesAt =
        new Date(
            finalReminderPublication.scheduledFor
        );

    if (
        Number.isNaN(
            opensAt.getTime()
        ) ||
        Number.isNaN(
            closesAt.getTime()
        )
    ) {
        throw new Error(
            'Rank Trial registration window contains an invalid date.'
        );
    }

    if (
        closesAt.getTime() <=
        opensAt.getTime()
    ) {
        throw new Error(
            'Rank Trial registration close time must occur after registration opens.'
        );
    }

    return {
        opensAt,
        closesAt
    };
}

/**
 * Return the current registration state.
 *
 * @param {Object} schedule
 * @param {Date} now
 * @returns {{
 *     state: 'UPCOMING'|'OPEN'|'CLOSED',
 *     opensAt: Date,
 *     closesAt: Date
 * }}
 */
function getRegistrationState(
    schedule,
    now =
        new Date()
) {
    const {
        opensAt,
        closesAt
    } =
        getRegistrationWindow(
            schedule
        );

    const currentTime =
        now.getTime();

    if (
        currentTime <
        opensAt.getTime()
    ) {
        return {
            state:
                'UPCOMING',

            opensAt,
            closesAt
        };
    }

    if (
        currentTime >=
        closesAt.getTime()
    ) {
        return {
            state:
                'CLOSED',

            opensAt,
            closesAt
        };
    }

    return {
        state:
            'OPEN',

        opensAt,
        closesAt
    };
}

/**
 * Check whether registration is currently
 * open for one Rank Trial schedule.
 *
 * @param {Object} schedule
 * @param {Date} now
 * @returns {boolean}
 */
function isRegistrationOpen(
    schedule,
    now =
        new Date()
) {
    return (
        getRegistrationState(
            schedule,
            now
        ).state ===
        'OPEN'
    );
}

/**
 * Return the currently relevant Rank Trial
 * schedule and its registration state.
 *
 * @param {Date} now
 * @returns {{
 *     schedule: Object,
 *     registration: {
 *         state: 'UPCOMING'|'OPEN'|'CLOSED',
 *         opensAt: Date,
 *         closesAt: Date
 *     }
 * }}
 */
function getCurrentRegistrationContext(
    now =
        new Date()
) {
    const schedule =
        getRelevantRankTrialSchedule(
            now
        );

    return {
        schedule,

        registration:
            getRegistrationState(
                schedule,
                now
            )
    };
}/**
 * Register one Soul for the currently
 * relevant monthly Rank Trial.
 *
 * Registration is accepted only while the
 * registration window is OPEN.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {string|null} [options.previousRank]
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     status:
 *         'registered'|
 *         'restored'|
 *         'existing'|
 *         'upcoming'|
 *         'closed',
 *     schedule: Object,
 *     registration: Object,
 *     participant: Object|null
 * }>}
 */
async function registerForCurrentRankTrial({
    guildId,
    userId,
    previousRank =
        null,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    if (
        registration.state ===
        'UPCOMING'
    ) {
        return {
            status:
                'upcoming',

            schedule,
            registration,

            participant:
                null
        };
    }

    if (
        registration.state ===
        'CLOSED'
    ) {
        return {
            status:
                'closed',

            schedule,
            registration,

            participant:
                null
        };
    }

    const result =
        await participantDatabase
            .registerParticipant({
                guildId,
                trialKey:
                    schedule.trialKey,
                userId,
                previousRank
            });

    return {
        status:
            result.status,

        schedule,
        registration,

        participant:
            result.participant
    };
}

/**
 * Withdraw one Soul from the currently
 * relevant monthly Rank Trial.
 *
 * Withdrawal is allowed only while the
 * registration window is OPEN.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     status:
 *         'withdrawn'|
 *         'not_registered'|
 *         'upcoming'|
 *         'closed',
 *     schedule: Object,
 *     registration: Object,
 *     participant: Object|null
 * }>}
 */
async function withdrawFromCurrentRankTrial({
    guildId,
    userId,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    if (
        registration.state ===
        'UPCOMING'
    ) {
        return {
            status:
                'upcoming',

            schedule,
            registration,

            participant:
                null
        };
    }

    if (
        registration.state ===
        'CLOSED'
    ) {
        return {
            status:
                'closed',

            schedule,
            registration,

            participant:
                null
        };
    }

    const participant =
        await participantDatabase
            .withdrawParticipant(
                guildId,
                schedule.trialKey,
                userId
            );

    if (!participant) {
        return {
            status:
                'not_registered',

            schedule,
            registration,

            participant:
                null
        };
    }

    return {
        status:
            'withdrawn',

        schedule,
        registration,

        participant
    };
}

/**
 * Get the currently relevant participant
 * row for one Soul.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {string} options.userId
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     schedule: Object,
 *     registration: Object,
 *     participant: Object|null
 * }>}
 */
async function getCurrentParticipant({
    guildId,
    userId,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    const participant =
        await participantDatabase
            .getParticipant(
                guildId,
                schedule.trialKey,
                userId
            );

    return {
        schedule,
        registration,
        participant
    };
}

/**
 * Get the full participant roster for
 * the currently relevant Rank Trial.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     schedule: Object,
 *     registration: Object,
 *     participants: Object[]
 * }>}
 */
async function getCurrentTrialRoster({
    guildId,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    const participants =
        await participantDatabase
            .getTrialParticipants(
                guildId,
                schedule.trialKey
            );

    return {
        schedule,
        registration,
        participants
    };
}/**
 * Close registration for one selected
 * monthly Rank Trial.
 *
 * Every currently REGISTERED participant
 * is moved into UNDER_REVIEW.
 *
 * This helper is idempotent:
 * running it again will not modify already
 * reviewed or withdrawn participants.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {Object} options.schedule
 * @returns {Promise<{
 *     trialKey: string,
 *     movedParticipants: Object[],
 *     statistics: Object
 * }>}
 */
async function closeRegistrationForSchedule({
    guildId,
    schedule
}) {
    if (
        !schedule ||
        !schedule.trialKey
    ) {
        throw new TypeError(
            'A valid Rank Trial schedule is required.'
        );
    }

    const movedParticipants =
        await participantDatabase
            .moveRegisteredToReview(
                guildId,
                schedule.trialKey
            );

    const statistics =
        await participantDatabase
            .getTrialParticipantStatistics(
                guildId,
                schedule.trialKey
            );

    return {
        trialKey:
            schedule.trialKey,

        movedParticipants,

        statistics
    };
}

/**
 * Close registration for the currently
 * relevant Rank Trial only when its
 * configured registration window has ended.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     status:
 *         'not_due'|
 *         'closed',
 *     schedule: Object,
 *     registration: Object,
 *     movedParticipants: Object[],
 *     statistics: Object|null
 * }>}
 */
async function closeCurrentRegistrationIfDue({
    guildId,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    if (
        registration.state !==
        'CLOSED'
    ) {
        return {
            status:
                'not_due',

            schedule,
            registration,

            movedParticipants:
                [],

            statistics:
                null
        };
    }

    const result =
        await closeRegistrationForSchedule({
            guildId,
            schedule
        });

    return {
        status:
            'closed',

        schedule,
        registration,

        movedParticipants:
            result.movedParticipants,

        statistics:
            result.statistics
    };
}

/**
 * Return compact registration statistics
 * for the currently relevant Rank Trial.
 *
 * @param {Object} options
 * @param {string} options.guildId
 * @param {Date} [options.now]
 * @returns {Promise<{
 *     schedule: Object,
 *     registration: Object,
 *     statistics: Object
 * }>}
 */
async function getCurrentRegistrationStatistics({
    guildId,
    now =
        new Date()
}) {
    const {
        schedule,
        registration
    } =
        getCurrentRegistrationContext(
            now
        );

    const statistics =
        await participantDatabase
            .getTrialParticipantStatistics(
                guildId,
                schedule.trialKey
            );

    return {
        schedule,
        registration,
        statistics
    };
}

/**
 * Return whether Rank Trials registration
 * is enabled at the configuration level.
 *
 * Rank Trials 2.0 currently follows the
 * main Rank Trials system switch.
 *
 * @returns {boolean}
 */
function isRankTrialRegistrationEnabled() {
    return (
        rankTrialConfig.enabled ===
        true
    );
}

module.exports = {
    getSchedulePublication,
    getRegistrationWindow,
    getRegistrationState,
    isRegistrationOpen,
    getCurrentRegistrationContext,

    registerForCurrentRankTrial,
    withdrawFromCurrentRankTrial,
    getCurrentParticipant,
    getCurrentTrialRoster,

    closeRegistrationForSchedule,
    closeCurrentRegistrationIfDue,
    getCurrentRegistrationStatistics,

    isRankTrialRegistrationEnabled
};
const brand =
    require('./brand');

/**
 * Evelynn Automatic Captain Trials.
 *
 * Controls monthly announcements and
 * the Discord Scheduled Event.
 *
 * Publication and Event history are
 * stored permanently inside PostgreSQL.
 */

module.exports = {
    /**
     * Main Captain Trials system switch.
     */
    enabled:
        true,

    /**
     * Official channel:
     * 🗡️・captain-trials
     */
    channelId:
        '1531706846531031060',

    /**
     * Timezone used for every Trial date.
     */
    timezone:
        'Asia/Tbilisi',

    /**
     * Captain Trials occur on the final
     * Saturday of every month.
     *
     * 0 = Sunday
     * 1 = Monday
     * 2 = Tuesday
     * 3 = Wednesday
     * 4 = Thursday
     * 5 = Friday
     * 6 = Saturday
     */
    trialWeekday:
        6,

    /**
     * Battle start:
     * 20:00 Georgia time.
     */
    battleStartHour:
        20,

    battleStartMinute:
        0,

    /**
     * Scheduler checks every five minutes.
     */
    schedulerIntervalMs:
        5 * 60 * 1000,

    /**
     * Recently missed announcements may
     * be recovered for up to 24 hours.
     */
    recoveryWindowMs:
        24 * 60 * 60 * 1000,

    /**
     * Discord Scheduled Event.
     */
    scheduledEvent: {
        enabled:
            true,

        /**
         * Create the Event with the
         * Opening Announcement.
         */
        createWithOpeningAnnouncement:
            true,

        /**
         * Three-hour Event duration.
         */
        durationMinutes:
            180,

        location:
            'Lunar Arena • Combat Grounds',

        /**
         * Month and year are appended
         * automatically.
         */
        namePrefix:
            `⚔️ Monthly ${brand.trialSystemName}`,

        descriptionMaxLength:
            900,

        /**
         * Recreate an Event that was
         * deleted manually.
         */
        recreateIfDeleted:
            true,

        /**
         * Synchronize changed Event details.
         */
        updateExistingEvent:
            true
    },

    /**
     * Announcement schedule.
     *
     * All times are relative to battle start.
     */
    announcements: {
        /**
         * Registration opens two weeks before.
         */
        opening: {
            enabled:
                true,

            daysBefore:
                14,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Registration reminder one week before.
         */
        registrationReminder: {
            enabled:
                true,

            daysBefore:
                7,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                false
        },

        /**
         * Final reminder one day before.
         */
        finalReminder: {
            enabled:
                true,

            daysBefore:
                1,

            hour:
                20,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Published when the Trials begin.
         */
        battleStart: {
            enabled:
                true,

            daysBefore:
                0,

            hour:
                20,

            minute:
                0,

            mentionEveryone:
                true
        },

        /**
         * Published one day after the Trials.
         */
        closing: {
            enabled:
                true,

            daysAfter:
                1,

            hour:
                18,

            minute:
                0,

            mentionEveryone:
                false
        }
    },

    /**
     * Promotion evaluation principles.
     */
    evaluationCriteria: [
        'Combat performance',
        `Loyalty to ${brand.serverName}`,
        'Behavior and discipline',
        'Server activity',
        'Contribution to the community',
        'High Command trust'
    ],

    /**
     * Public branding.
     */
    branding: {
        authorName:
            `${brand.botName} • ${brand.serverName}`,

        authorityName:
            `♔ ${brand.serverName} High Command`,

        footerText:
            `${brand.botName} • ${brand.trialSystemName}`,

        defaultEmoji:
            '⚔️'
    },

    /**
     * PostgreSQL publication identifiers.
     *
     * These values are permanent.
     */
    publicationTypes: {
        opening:
            'OPENING',

        registrationReminder:
            'REGISTRATION_REMINDER',

        finalReminder:
            'FINAL_REMINDER',

        battleStart:
            'BATTLE_START',

        closing:
            'CLOSING'
    },

    /**
     * PostgreSQL Scheduled Event states.
     *
     * These values are permanent.
     */
    eventStatuses: {
        scheduled:
            'SCHEDULED',

        active:
            'ACTIVE',

        completed:
            'COMPLETED',

        cancelled:
            'CANCELLED',

        deleted:
            'DELETED'
    }
};
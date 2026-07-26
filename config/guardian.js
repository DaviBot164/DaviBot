/**
 * Umbra Guardian configuration.
 *
 * Protection levels:
 *
 * LOW
 * - Delete violating messages
 * - Notify the Soul
 *
 * MEDIUM
 * - Delete violating messages
 * - Notify the Soul
 * - Save a database warning
 *
 * HIGH
 * - Delete violating messages
 * - Notify the Soul
 * - Save a database warning
 * - Timeout repeat offenders
 */
module.exports = {
    /**
     * Main Umbra Guardian switch.
     *
     * false disables profanity and spam
     * protection completely.
     */
    enabled: true,

    /**
     * Available levels:
     * LOW
     * MEDIUM
     * HIGH
     */
    protectionLevel: 'HIGH',

    /**
     * Umbra Guardian log channel.
     *
     * This must match the Discord channel
     * name exactly.
     */
    logChannelName: '📄・umbra-logs',

    /*
     * Umbra will not inspect these channels.
     *
     * Add Discord channel IDs inside
     * this array.
     */
    ignoredChannelIds: [],

    /*
     * Umbra will not inspect members
     * with these roles.
     *
     * Add Staff role IDs inside
     * this array.
     *
     * Members with Administrator or
     * Manage Messages are already ignored
     * automatically.
     */
    ignoredRoleIds: [],

    /**
     * Profanity and insulting-language
     * protection.
     */
    profanity: {
        enabled: true,

        /*
         * Additional blocked words.
         *
         * Built-in severe, medium and mild
         * profanity lists are stored inside:
         *
         * guardian/profanityFilter.js
         *
         * Words added here are treated as
         * medium severity unless they already
         * exist in a built-in list.
         */
        blockedWords: [
            // English
            'idiot',
            'stupid',
            'moron',
            'loser',
            'dumbass',
            'bastard',
            'asshole',
            'fuck',
            'fucker',
            'motherfucker',
            'bitch',

            // Georgian
            'დებილი',
            'იდიოტი',
            'სულელი',
            'ნაბიჭვარი',
            'ყლე',
            'შენი დედა',
            'დედამოტყნული'
        ],

        /*
         * Delete the violating message.
         */
        deleteMessage: true,

        /*
         * Send a temporary Umbra warning
         * to the Soul.
         */
        notifyUser: true,

        /*
         * Delete Umbra's temporary warning
         * after seven seconds.
         */
        notificationDeleteAfterMs: 7_000,

        /*
         * Timeout the member after this
         * number of Guardian violations.
         *
         * Spam and profanity share the same
         * violation counter.
         */
        timeoutAfterViolations: 3,

        /*
         * Ten-minute timeout.
         */
        timeoutDurationMs:
            10 * 60 * 1_000
    },

    /**
     * Rapid-message and repeated-message
     * spam protection.
     */
    spam: {
        enabled: true,

        /*
         * Number of messages allowed inside
         * the configured time window.
         *
         * The sixth message inside seven
         * seconds will trigger protection.
         */
        maxMessages: 5,

        /*
         * Seven-second message window.
         */
        intervalMs: 7_000,

        /*
         * Number of matching messages
         * required to trigger repeated-message
         * spam protection.
         */
        repeatedMessageLimit: 3,

        /*
         * Repeated-message record lifetime.
         */
        repeatedMessageWindowMs:
            15_000,

        /*
         * Timeout after this number of
         * Guardian violations.
         */
        timeoutAfterViolations: 3,

        /*
         * Ten-minute timeout.
         */
        timeoutDurationMs:
            10 * 60 * 1_000,

        /*
         * Delete the detected spam message.
         */
        deleteMessage: true,

        /*
         * Send a temporary Umbra warning
         * to the Soul.
         */
        notifyUser: true,

        /*
         * Delete Umbra's temporary warning
         * after seven seconds.
         */
        notificationDeleteAfterMs: 7_000
    }
};
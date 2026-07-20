/**
 * Seraphiel Guardian configuration.
 *
 * Protection levels:
 *
 * LOW
 * - Delete violating messages
 * - Notify the user
 *
 * MEDIUM
 * - Delete violating messages
 * - Notify the user
 * - Save a database warning
 *
 * HIGH
 * - Delete violating messages
 * - Notify the user
 * - Save a database warning
 * - Timeout repeat offenders
 */
module.exports = {
    enabled: true,

    protectionLevel: 'HIGH',

    logChannelName: '🤖・guardian-log',

    /*
     * Guardian will not inspect these channels.
     * Add Discord channel IDs inside this array.
     */
    ignoredChannelIds: [],

    /*
     * Guardian will not inspect members with these roles.
     * Add Staff role IDs inside this array.
     */
    ignoredRoleIds: [],

    profanity: {
        enabled: true,

        /*
         * Add or remove blocked words here.
         *
         * Keep each word inside quotation marks
         * and separate entries using commas.
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
         * Delete the insulting message.
         */
        deleteMessage: true,

        /*
         * Send a temporary warning to the user.
         */
        notifyUser: true,

        /*
         * Delete Guardian's temporary warning
         * after 7 seconds.
         */
        notificationDeleteAfterMs: 7000,

        /*
         * Timeout the member after this many
         * Guardian violations.
         *
         * Spam and profanity currently share the
         * same violation counter.
         */
        timeoutAfterViolations: 3,

        /*
         * 10-minute timeout.
         */
        timeoutDurationMs: 10 * 60 * 1000
    },

    spam: {
        enabled: true,

        /*
         * Number of messages allowed inside
         * the configured time window.
         */
        maxMessages: 5,

        /*
         * Seven-second message window.
         */
        intervalMs: 7000,

        /*
         * Matching messages required to count
         * as repeated-message spam.
         */
        repeatedMessageLimit: 3,

        /*
         * Repeated-message record lifetime.
         */
        repeatedMessageWindowMs: 15000,

        /*
         * Timeout after this many violations.
         */
        timeoutAfterViolations: 3,

        /*
         * 10-minute timeout.
         */
        timeoutDurationMs: 10 * 60 * 1000,

        /*
         * Delete spam messages.
         */
        deleteMessage: true,

        /*
         * Send a temporary warning.
         */
        notifyUser: true,

        /*
         * Delete the temporary warning
         * after 7 seconds.
         */
        notificationDeleteAfterMs: 7000
    }
};
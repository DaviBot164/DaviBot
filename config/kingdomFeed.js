module.exports = {
    /**
     * Main Kingdom Feed switch.
     *
     * false = disable every Feed notification.
     */
    enabled:
        true,

    /**
     * Preferred Kingdom Feed channel ID.
     *
     * Leave this empty temporarily if the
     * channel has not been created yet.
     *
     * Umbra will then search by channel name.
     */
    channelId:
        '',

    /**
     * Fallback channel name.
     */
    channelName:
        '📜・kingdom-feed',

    /**
     * Individual Feed event switches.
     */
    events: {
        achievements:
            true,

        titles:
            true,

        ranks:
            true,

        levels:
            true
    },

    /**
     * Level milestones that should appear
     * in the public Kingdom Feed.
     *
     * Normal Level increases will not create
     * Feed messages unless they reach one
     * of these milestones.
     */
    levelMilestones: [
        5,
        10,
        25,
        50,
        75,
        100,
        125,
        150
    ],

    /**
     * Kingdom Feed visual colors.
     */
    colors: {
        achievement:
            '#D4AF37',

        title:
            '#8A2BE2',

        promotion:
            '#E8E8E8',

        revocation:
            '#5B0E2D',

        level:
            '#7CFC98'
    },

    /**
     * Shared Feed footer.
     */
    footer: {
        text:
            '🌙 Umbra • Chronicles of Las Noches'
    }
};
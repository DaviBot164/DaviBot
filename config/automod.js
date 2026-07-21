module.exports = {
    /**
     * მთავარი AutoMod ჩამრთველი.
     *
     * false-ის შემთხვევაში მთელი AutoMod გაითიშება.
     */
    enabled: true,

    /**
     * AutoMod-ისა და Raid Shield-ის ლოგების არხი.
     */
    logChannelId: '1527768422535004360',

    /**
     * გამოიყენება მხოლოდ მაშინ,
     * თუ logChannelId ცარიელია.
     */
    logChannelName: '📄・moderation-logs',

    /**
     * ამ უფლებების მქონე წევრებს
     * შეტყობინებების AutoMod არ შეამოწმებს.
     */
    bypassPermissions: [
        'Administrator',
        'ManageMessages'
    ],

    /**
     * Discord invite-ების დაცვა.
     */
    inviteProtection: {
        enabled: true
    },

    /**
     * აკრძალული სიტყვების ფილტრი.
     */
    badWords: {
        enabled: true,
        words: []
    },

    /**
     * სწრაფი შეტყობინებების სპამი.
     */
    spam: {
        enabled: true,
        messageLimit: 5,
        intervalMilliseconds: 7_000,
        timeoutMilliseconds: 5 * 60 * 1_000
    },

    /**
     * ერთი და იმავე შეტყობინების გამეორება.
     */
    duplicateMessages: {
        enabled: true,
        messageLimit: 3,
        intervalMilliseconds: 15_000,
        timeoutMilliseconds: 5 * 60 * 1_000
    },

    /**
     * Mention spam.
     */
    mentionSpam: {
        enabled: true,
        mentionLimit: 5,
        timeoutMilliseconds: 10 * 60 * 1_000
    },

    /**
     * Seraphiel Raid Shield.
     *
     * 10 წამში 5 წევრის შემოსვლა
     * Raid Mode-ს 10 წუთით ჩართავს.
     */
    antiRaid: {
        enabled: true,

        joinLimit: 5,

        joinIntervalMilliseconds:
            10 * 1_000,

        raidModeDurationMilliseconds:
            10 * 60 * 1_000
    },

    /**
     * დროებითი AutoMod გაფრთხილების
     * წაშლის დრო.
     */
    warningDeleteDelayMilliseconds: 5_000
};
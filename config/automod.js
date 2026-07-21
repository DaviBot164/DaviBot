module.exports = {
    /**
     * მთავარი AutoMod ჩამრთველი.
     *
     * false-ის შემთხვევაში მთელი AutoMod გაითიშება.
     */
    enabled: true,

    /**
     * AutoMod-ის, Scam Shield-ისა და
     * Raid Shield-ის ლოგების არხი.
     */
    logChannelId: '1527768422535004360',

    /**
     * გამოიყენება მხოლოდ მაშინ,
     * თუ logChannelId ცარიელია ან არხი ვერ მოიძებნა.
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
     *
     * სია ჯერ ცარიელია.
     * სიტყვებს მოგვიანებით დავამატებთ.
     */
    badWords: {
        enabled: true,

        words: []
    },

    /**
     * სწრაფი შეტყობინებების სპამი.
     *
     * 7 წამში 5 შეტყობინება გამოიწვევს
     * შეტყობინების წაშლასა და 5-წუთიან timeout-ს.
     */
    spam: {
        enabled: true,

        messageLimit: 5,

        intervalMilliseconds:
            7 * 1_000,

        timeoutMilliseconds:
            5 * 60 * 1_000
    },

    /**
     * ერთი და იმავე შეტყობინების გამეორება.
     *
     * 15 წამში 3 ერთნაირი შეტყობინება
     * გამოიწვევს 5-წუთიან timeout-ს.
     */
    duplicateMessages: {
        enabled: true,

        messageLimit: 3,

        intervalMilliseconds:
            15 * 1_000,

        timeoutMilliseconds:
            5 * 60 * 1_000
    },

    /**
     * Mention Spam Protection.
     *
     * ერთ შეტყობინებაში 5 ან მეტი
     * მომხმარებლის ან როლის mention გამოიწვევს
     * 10-წუთიან timeout-ს.
     */
    mentionSpam: {
        enabled: true,

        mentionLimit: 5,

        timeoutMilliseconds:
            10 * 60 * 1_000
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
     * Seraphiel Scam Shield.
     *
     * ამოიცნობს გავრცელებულ Scam და
     * Phishing შეტყობინებებსა და ბმულებს.
     *
     * აღმოჩენისას შეტყობინება წაიშლება
     * და წევრს 30-წუთიანი timeout მიენიჭება.
     */
    scamProtection: {
        enabled: true,

        timeoutMilliseconds:
            30 * 60 * 1_000
    },

    /**
     * რამდენ ხანში წაიშალოს არხში
     * გამოტანილი დროებითი გაფრთხილება.
     */
    warningDeleteDelayMilliseconds:
        5 * 1_000
};
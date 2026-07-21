module.exports = {
    /**
     * მთავარი ჩამრთველი.
     *
     * false-ის შემთხვევაში მთელი AutoMod გაითიშება.
     */
    enabled: true,

    /**
     * AutoMod-ის ლოგების არხი.
     */
    logChannelId: '1527768422535004360',

    /**
     * გამოიყენება მხოლოდ მაშინ,
     * თუ logChannelId ცარიელია.
     */
    logChannelName: '📄・moderation-logs',

    /**
     * ამ უფლებების მქონე წევრებს
     * AutoMod არ შეამოწმებს.
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
     * ჯერ სია ცარიელია.
     * სიტყვებს შემდეგ დავამატებთ.
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
        intervalMilliseconds: 7_000,
        timeoutMilliseconds: 5 * 60 * 1_000
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
        intervalMilliseconds: 15_000,
        timeoutMilliseconds: 5 * 60 * 1_000
    },

    /**
     * Mention spam.
     *
     * ერთ შეტყობინებაში 5 ან მეტი
     * მომხმარებლის/როლის mention გამოიწვევს
     * 10-წუთიან timeout-ს.
     */
    mentionSpam: {
        enabled: true,
        mentionLimit: 5,
        timeoutMilliseconds: 10 * 60 * 1_000
    },

    /**
     * რამდენ ხანში წაიშალოს არხში
     * გამოტანილი დროებითი გაფრთხილება.
     */
    warningDeleteDelayMilliseconds: 5_000
};
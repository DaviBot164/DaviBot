module.exports = {
    /**
     * მთავარი AutoMod ჩამრთველი.
     */
    enabled: true,

    /**
     * AutoMod-ის ლოგების არხი.
     */
    logChannelId: '1530901922855256104',

    logChannelName: '📄・umbra-logs',

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
     * Evelynn Profanity Shield.
     */
    badWords: {
        enabled: true,

        /**
         * მსუბუქი შეურაცხყოფა.
         *
         * შეტყობინება წაიშლება,
         * მაგრამ წევრს Timeout არ დაედება.
         */
        warningWords: [
            // English
            'idiot',
            'stupid',
            'dumb',
            'moron',
            'imbecile',
            'loser',
            'trash',
            'clown',
            'noob',
            'bozo',
            'pathetic',
            'useless',
            'shut up',

            // Georgian
            'დებილი',
            'იდიოტი',
            'სულელი',
            'ტვინნაკლული',
            'ჩლუნგი',
            'გონებაჩლუნგი',
            'ნაგავი',
            'უსარგებლო',
            'მატყუარა',
            'გაჩუმდი'
        ],

        /**
         * მძიმე გინება და შეურაცხყოფა.
         *
         * შეტყობინება წაიშლება და წევრს
         * Timeout მიენიჭება.
         */
        timeoutWords: [
            // English profanity
            'fuck',
            'fck',
            'fuk',
            'fuq',
            'fvck',
            'fucking',
            'fcking',
            'motherfucker',
            'motherfucking',
            'shit',
            'bullshit',
            'bitch',
            'son of a bitch',
            'bastard',
            'asshole',
            'dickhead',
            'dick',
            'cock',
            'prick',
            'cunt',
            'slut',
            'whore',
            'hoe',
            'retard',
            'retarded',

            // Hate speech and slurs
            'faggot',
            'fag',
            'nigger',
            'nigga',
            'tranny',

            // Abuse accusations used as insults
            'pedo',
            'pedophile',
            'paedophile',
            'rapist',

            // Georgian profanity
            'ყლე',
            'ყლეო',
            'ყლეობა',
            'ყლეური',
            'ბოზი',
            'ბოზიშვილი',
            'ნაბოზარი',
            'ნაბიჭვარი',
            'მუტელი',
            'მუტლის',
            'ტრაკი',
            'ტრაკში',
            'შევეცი',
            'მოგიტყნავ',
            'გიტყნავ',
            'მოტყნული',
            'მტყვნელი',
            'დედის მტყვნელი',
            'დედას შევეცი',
            'დედას მოგიტყნავ',
            'დედას გიტყნავ',
            'შენს დედას',
            'დედისტრაკი'
        ],

        /**
         * მძიმე სიტყვის აღმოჩენისას Timeout.
         */
        timeoutMilliseconds:
            10 * 60 * 1_000
    },

    /**
     * სწრაფი შეტყობინებების სპამი.
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
     */
    mentionSpam: {
        enabled: true,

        mentionLimit: 5,

        timeoutMilliseconds:
            10 * 60 * 1_000
    },

    /**
     * Evelynn Raid Shield.
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
     * Evelynn Scam Shield.
     */
    scamProtection: {
        enabled: true,

        timeoutMilliseconds:
            30 * 60 * 1_000
    },

    /**
     * დროებითი გაფრთხილების წაშლის დრო.
     */
    warningDeleteDelayMilliseconds:
        5 * 1_000
};
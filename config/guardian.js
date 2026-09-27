module.exports = Object.freeze({
    enabled: true,

    protections: Object.freeze({
        invites: true,
        spam: true,
        scams: true,
        severeWords: true
    }),

    spam: Object.freeze({
        windowMs: 10_000,

        // Normal rapid chatting is allowed.
        maxMessages: 8,

        // Repeated messages require several copies
        // before Guardian considers them spam.
        duplicateLimit: 5,
        duplicateMinLength: 12,

        // Large repeated messages are detected sooner.
        longMessageLength: 120,
        longMessageLimit: 3,

        // First spam incident warns.
        // Repeated spam can trigger a timeout.
        strikesForTimeout: 2,
        strikeWindowMs: 5 * 60_000,
        timeoutMs: 5 * 60_000
    }),

    severeWords: Object.freeze([
        // Georgian — severe mother-directed insults.
        'შენი დედა',
        'დედაშენი',
        'დედას გიტყნავ',
        'დედას მოგიტყნავ',
        'დედას შეგეცი',

        // Zero-tolerance.
        'პედო',
        'პედოფილი',
        'pedo',
        'pedophile'
    ]),

    allowedInviteGuilds: Object.freeze([
        // Add allowed Discord server IDs here.
    ])
});
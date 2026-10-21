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

        // Up to eight messages within the window.
        maxMessages: 8,

        // Five matching messages of at least 12 characters.
        duplicateLimit: 5,
        duplicateMinLength: 12,

        // Three matching messages of at least 120 characters.
        longMessageLength: 120,
        longMessageLimit: 3,

        strikesForTimeout: 2,
        strikeWindowMs: 5 * 60_000,
        timeoutMs: 5 * 60_000
    }),

    severeWords: Object.freeze([
        // Explicit insults; neutral references to family are allowed.
        'დედას გიტყნავ',
        'დედას მოგიტყნავ',
        'დედას შეგეცი',

        // Existing zero-tolerance terms.
        'პედო',
        'პედოფილი',
        'pedo',
        'pedophile'
    ]),

    allowedInviteGuilds: Object.freeze([
        // Reserved for invite allowlist support.
    ])
});
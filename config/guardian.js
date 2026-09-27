module.exports = Object.freeze({
    enabled: true,

    protections: Object.freeze({
        invites: true,
        spam: true,
        scams: true,
        badWords: true
    }),

    spam: Object.freeze({
        windowMs: 10_000,

        // Normal rapid chatting is allowed.
        maxMessages: 8,

        // Short duplicate messages such as "hi"
        // should not trigger punishment easily.
        duplicateLimit: 5,
        duplicateMinLength: 12,

        // Large repeated messages are treated
        // more seriously.
        longMessageLength: 120,
        longMessageLimit: 3,

        // First spam incident warns the member.
        // Repeated incidents can trigger timeout.
        strikesForTimeout: 2,
        strikeWindowMs: 5 * 60_000,
        timeoutMs: 5 * 60_000
    }),

    badWords: Object.freeze([
        // Add blocked words here.
    ]),

    allowedInviteGuilds: Object.freeze([
        // Add allowed Discord server IDs here.
    ])
});
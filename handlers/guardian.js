const {
    PermissionFlagsBits
} = require('discord.js');

const guardian =
    require('../config/guardian');

const {
    sendGuardianLog
} = require('../utils/guardianLogs');

const spamHistory = new Map();
const spamStrikes = new Map();

const INVITE_PATTERN =
    /(?:discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;

const SCAM_PATTERNS = [
    /free\s+nitro/i,
    /claim\s+(?:your\s+)?nitro/i,
    /steam\s+gift/i,
    /free\s+robux/i,
    /claim\s+(?:your\s+)?robux/i,
    /discord\s+gift/i
];

const SEVERE_PATTERNS = [
    // Georgian mother-directed severe insults.
    /დედას\s+(?:გიტყნავ|მოგიტყნავ|შეგეცი)/iu,
    /შენს?\s+დედას\s+(?:გიტყნავ|მოგიტყნავ|შეგეცი)/iu,

    // English mother-directed severe insults.
    /fuck\s+(?:your|ur)\s+(?:mom|mum|mother)/iu,
    /mother\s*fucker/iu
];

function isStaff(member) {
    return Boolean(
        member?.permissions.has(
            PermissionFlagsBits.ManageMessages
        )
    );
}

function normalizeContent(content) {
    return content
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function containsConfiguredSevereWord(
    content
) {
    const normalized =
        ` ${normalizeContent(content)} `;

    return guardian.severeWords.some(
        entry => {
            const blocked =
                normalizeContent(entry);

            return (
                blocked &&
                normalized.includes(
                    ` ${blocked} `
                )
            );
        }
    );
}

function containsSevereWord(content) {
    if (
        !guardian.protections.severeWords
    ) {
        return false;
    }

    if (
        containsConfiguredSevereWord(
            content
        )
    ) {
        return true;
    }

    const normalized =
        normalizeContent(content);

    return SEVERE_PATTERNS.some(
        pattern =>
            pattern.test(normalized)
    );
}

function containsScam(content) {
    if (!guardian.protections.scams) {
        return false;
    }

    return SCAM_PATTERNS.some(
        pattern =>
            pattern.test(content)
    );
}

function containsInvite(content) {
    return (
        guardian.protections.invites &&
        INVITE_PATTERN.test(content)
    );
}

function getSpamKey(message) {
    return `${message.guild.id}:${message.author.id}`;
}

function cleanHistory(entries, now) {
    return entries.filter(
        entry =>
            now - entry.time <=
            guardian.spam.windowMs
    );
}

function detectSpam(message) {
    if (!guardian.protections.spam) {
        return false;
    }

    const key =
        getSpamKey(message);

    const now =
        Date.now();

    const content =
        normalizeContent(
            message.content
        );

    const previous =
        spamHistory.get(key) ?? [];

    const history =
        cleanHistory(
            previous,
            now
        );

    history.push({
        time: now,
        content,
        length: content.length
    });

    spamHistory.set(
        key,
        history
    );

    if (
        history.length >
        guardian.spam.maxMessages
    ) {
        return true;
    }

    if (
        content.length >=
        guardian.spam.duplicateMinLength
    ) {
        const duplicates =
            history.filter(
                entry =>
                    entry.content === content
            ).length;

        if (
            duplicates >=
            guardian.spam.duplicateLimit
        ) {
            return true;
        }
    }

    if (
        content.length >=
        guardian.spam.longMessageLength
    ) {
        const repeatedLongMessages =
            history.filter(
                entry =>
                    entry.content === content &&
                    entry.length >=
                        guardian.spam
                            .longMessageLength
            ).length;

        if (
            repeatedLongMessages >=
            guardian.spam.longMessageLimit
        ) {
            return true;
        }
    }

    return false;
}

function registerSpamStrike(message) {
    const key =
        getSpamKey(message);

    const now =
        Date.now();

    const previous =
        spamStrikes.get(key);

    if (
        !previous ||
        now - previous.lastStrike >
            guardian.spam.strikeWindowMs
    ) {
        const strike = {
            count: 1,
            lastStrike: now
        };

        spamStrikes.set(
            key,
            strike
        );

        return strike.count;
    }

    previous.count += 1;
    previous.lastStrike = now;

    spamStrikes.set(
        key,
        previous
    );

    return previous.count;
}

function clearSpamHistory(message) {
    spamHistory.delete(
        getSpamKey(message)
    );
}

async function logGuardianAction(
    message,
    result
) {
    try {
        await sendGuardianLog(
            message,
            result
        );
    } catch (error) {
        console.error(
            'Guardian log failed:',
            error
        );
    }
}

async function handleSpam(message) {
    const strikes =
        registerSpamStrike(
            message
        );

    clearSpamHistory(
        message
    );

    await message.delete()
        .catch(() => null);

    let result;

    if (
        strikes >=
            guardian.spam.strikesForTimeout &&
        message.member?.moderatable
    ) {
        await message.member.timeout(
            guardian.spam.timeoutMs,
            'Akane Guardian: repeated spam'
        );

        result = {
            blocked: true,
            type: 'spam',
            action: 'timeout',
            strikes
        };
    } else {
        result = {
            blocked: true,
            type: 'spam',
            action: 'warning',
            strikes
        };
    }

    await logGuardianAction(
        message,
        result
    );

    return result;
}

async function deleteBlockedMessage(
    message,
    type
) {
    await message.delete()
        .catch(() => null);

    const result = {
        blocked: true,
        type,
        action: 'delete'
    };

    await logGuardianAction(
        message,
        result
    );

    return result;
}

async function runGuardian(message) {
    if (
        !guardian.enabled ||
        !message.inGuild() ||
        message.author.bot ||
        isStaff(message.member)
    ) {
        return {
            blocked: false
        };
    }

    const content =
        message.content ?? '';

    if (containsScam(content)) {
        return deleteBlockedMessage(
            message,
            'scam'
        );
    }

    if (containsInvite(content)) {
        return deleteBlockedMessage(
            message,
            'invite'
        );
    }

    if (containsSevereWord(content)) {
        return deleteBlockedMessage(
            message,
            'severe_word'
        );
    }

    if (detectSpam(message)) {
        return handleSpam(
            message
        );
    }

    return {
        blocked: false
    };
}

module.exports = {
    runGuardian
};
/**
 * Evelynn Scam Shield
 *
 * Detects common phishing and scam patterns
 * inside Discord messages.
 */

const URL_PATTERN =
    /https?:\/\/[^\s<>()]+/gi;

const IP_ADDRESS_HOST_PATTERN =
    /^(?:\d{1,3}\.){3}\d{1,3}$/;

/**
 * Known legitimate domains.
 *
 * Subdomains are also accepted.
 */
const TRUSTED_DOMAINS = [
    'discord.com',
    'discord.gg',
    'discordapp.com',
    'discord.gift',

    'steamcommunity.com',
    'steampowered.com',

    'roblox.com',

    'epicgames.com',

    'microsoft.com',

    'google.com'
];

/**
 * URL shortening services.
 *
 * Shortened links are not always malicious,
 * but they can hide phishing destinations.
 */
const SHORTENER_DOMAINS = [
    'bit.ly',
    'tinyurl.com',
    't.co',
    'cutt.ly',
    'rb.gy',
    'is.gd',
    'rebrand.ly',
    'shorturl.at',
    'tiny.cc'
];

/**
 * Domains commonly impersonated
 * by scam links.
 */
const IMPERSONATED_BRANDS = [
    'discord',
    'nitro',
    'steam',
    'roblox',
    'epicgames',
    'microsoft',
    'paypal'
];

/**
 * High-risk scam phrases.
 */
const SCAM_PHRASES = [
    'free nitro',
    'nitro giveaway',
    'claim your nitro',
    'claim free nitro',
    'discord nitro free',
    'free discord nitro',

    'free steam gift',
    'steam gift',
    'steam giveaway',
    'free steam card',

    'free robux',
    'robux generator',
    'claim free robux',
    'free limited',

    'verify your account',
    'account will be deleted',
    'account will be banned',
    'account suspended',
    'urgent verification',

    'scan this qr code',
    'scan qr code',
    'login to claim',
    'sign in to claim',

    'crypto giveaway',
    'double your crypto',
    'send crypto receive',
    'guaranteed profit',

    'you won a giveaway',
    'you have won',
    'claim your prize'
];

/**
 * Remove punctuation from the end
 * of a detected URL.
 *
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(
    url
) {
    if (
        typeof url !==
        'string'
    ) {
        return '';
    }

    return url
        .trim()
        .replace(
            /[.,!?;:'")\]}]+$/g,
            ''
        );
}

/**
 * Normalize a hostname.
 *
 * Examples:
 *
 * WWW.ROBLOX.COM
 * -> roblox.com
 *
 * discord.com.
 * -> discord.com
 *
 * @param {string} hostname
 * @returns {string}
 */
function normalizeHostname(
    hostname
) {
    if (
        typeof hostname !==
        'string'
    ) {
        return '';
    }

    return hostname
        .trim()
        .toLowerCase()
        .replace(
            /\.$/,
            ''
        )
        .replace(
            /^www\./,
            ''
        );
}

/**
 * Check whether a hostname matches a
 * domain or one of its subdomains.
 *
 * @param {string} hostname
 * @param {string} domain
 * @returns {boolean}
 */
function hostnameMatchesDomain(
    hostname,
    domain
) {
    const normalizedHostname =
        normalizeHostname(
            hostname
        );

    const normalizedDomain =
        normalizeHostname(
            domain
        );

    if (
        !normalizedHostname ||
        !normalizedDomain
    ) {
        return false;
    }

    return (
        normalizedHostname ===
            normalizedDomain ||
        normalizedHostname.endsWith(
            `.${normalizedDomain}`
        )
    );
}

/**
 * Check whether a hostname belongs
 * to a trusted domain.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isTrustedDomain(
    hostname
) {
    return TRUSTED_DOMAINS.some(
        domain =>
            hostnameMatchesDomain(
                hostname,
                domain
            )
    );
}

/**
 * Check whether a hostname uses a
 * URL shortening service.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isShortenedUrl(
    hostname
) {
    return SHORTENER_DOMAINS.some(
        domain =>
            hostnameMatchesDomain(
                hostname,
                domain
            )
    );
}

/**
 * Check whether a hostname is an
 * IPv4 address.
 *
 * Values above 255 are rejected.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isIpAddressHostname(
    hostname
) {
    const normalizedHostname =
        normalizeHostname(
            hostname
        );

    if (
        !IP_ADDRESS_HOST_PATTERN.test(
            normalizedHostname
        )
    ) {
        return false;
    }

    const octets =
        normalizedHostname
            .split('.')
            .map(
                Number
            );

    return octets.every(
        octet =>
            Number.isInteger(
                octet
            ) &&
            octet >= 0 &&
            octet <= 255
    );
}

/**
 * Detect suspicious brand impersonation.
 *
 * Example:
 *
 * discord-free-nitro.example.com
 *
 * @param {string} hostname
 * @returns {string|null}
 */
function findImpersonatedBrand(
    hostname
) {
    const normalizedHostname =
        normalizeHostname(
            hostname
        );

    if (
        !normalizedHostname ||
        isTrustedDomain(
            normalizedHostname
        )
    ) {
        return null;
    }

    for (
        const brand
        of IMPERSONATED_BRANDS
    ) {
        if (
            normalizedHostname.includes(
                brand
            )
        ) {
            return brand;
        }
    }

    return null;
}

/**
 * Detect suspicious URL formatting.
 *
 * @param {string} rawUrl
 * @returns {{
 *     detected: boolean,
 *     type?: string,
 *     detail?: string
 * }}
 */
function inspectUrl(
    rawUrl
) {
    const cleanedUrl =
        cleanUrl(
            rawUrl
        );

    if (!cleanedUrl) {
        return {
            detected:
                false
        };
    }

    let parsedUrl;

    try {
        parsedUrl =
            new URL(
                cleanedUrl
            );
    } catch {
        return {
            detected:
                false
        };
    }

    const hostname =
        normalizeHostname(
            parsedUrl.hostname
        );

    if (!hostname) {
        return {
            detected:
                false
        };
    }

    /*
     * Raw IP-address links are considered
     * suspicious because phishing pages
     * commonly avoid recognizable domains.
     */
    if (
        isIpAddressHostname(
            hostname
        )
    ) {
        return {
            detected:
                true,

            type:
                'IP address link',

            detail:
                cleanedUrl
        };
    }

    /*
     * URL shorteners hide the final
     * destination from Discord members.
     */
    if (
        isShortenedUrl(
            hostname
        )
    ) {
        return {
            detected:
                true,

            type:
                'Shortened URL',

            detail:
                hostname
        };
    }

    /*
     * Detect domains attempting to resemble
     * high-value services such as Discord,
     * Roblox or Steam.
     */
    const impersonatedBrand =
        findImpersonatedBrand(
            hostname
        );

    if (impersonatedBrand) {
        return {
            detected:
                true,

            type:
                'Possible brand impersonation',

            detail:
                `${hostname} resembles ${impersonatedBrand}`
        };
    }

    return {
        detected:
            false
    };
}

/**
 * Find suspicious scam wording.
 *
 * @param {string} content
 * @returns {string|null}
 */
function findScamPhrase(
    content
) {
    if (
        typeof content !==
        'string'
    ) {
        return null;
    }

    const normalizedContent =
        content
            .toLowerCase()
            .replace(
                /\s+/g,
                ' '
            )
            .trim();

    for (
        const phrase
        of SCAM_PHRASES
    ) {
        if (
            normalizedContent.includes(
                phrase
            )
        ) {
            return phrase;
        }
    }

    return null;
}

/**
 * Determine whether suspicious scam wording
 * appears with sufficiently strong context.
 *
 * This reduces false positives from normal
 * conversations discussing scams.
 *
 * @param {string} content
 * @param {number} urlCount
 * @returns {boolean}
 */
function hasStrongScamContext(
    content,
    urlCount
) {
    const normalizedContent =
        content
            .toLowerCase()
            .replace(
                /\s+/g,
                ' '
            );

    if (
        urlCount >
        0
    ) {
        return true;
    }

    const contextWords = [
        'click',
        'claim',
        'login',
        'log in',
        'sign in',
        'verify',
        'scan',
        'open link',
        'visit'
    ];

    return contextWords.some(
        contextWord =>
            normalizedContent.includes(
                contextWord
            )
    );
}

/**
 * Detect scam or phishing content.
 *
 * @param {string} content
 * @param {{
 *     timeoutMilliseconds?: number
 * }} options
 * @returns {{
 *     detected: boolean,
 *     reason?: string,
 *     warning?: string,
 *     timeoutDuration?: number,
 *     scamType?: string,
 *     evidence?: string
 * }}
 */
function detectScam(
    content,
    options = {}
) {
    if (
        typeof content !==
            'string' ||
        !content.trim()
    ) {
        return {
            detected:
                false
        };
    }

    const timeoutMilliseconds =
        Number.isFinite(
            options.timeoutMilliseconds
        )
            ? Math.max(
                0,
                options.timeoutMilliseconds
            )
            : 30 *
                60 *
                1_000;

    const urls =
        content.match(
            URL_PATTERN
        ) ??
        [];

    /*
     * URL inspection takes priority because
     * a malicious destination is stronger
     * evidence than suspicious wording alone.
     */
    for (
        const url
        of urls
    ) {
        const urlResult =
            inspectUrl(
                url
            );

        if (
            urlResult.detected
        ) {
            return {
                detected:
                    true,

                reason:
                    `Scam or phishing link detected: ${urlResult.type}`,

                warning:
                    'Suspicious or potentially dangerous links are not allowed.',

                timeoutDuration:
                    timeoutMilliseconds,

                scamType:
                    urlResult.type,

                evidence:
                    urlResult.detail
            };
        }
    }

    const scamPhrase =
        findScamPhrase(
            content
        );

    /*
     * Scam wording without a suspicious URL
     * is blocked only when accompanied by
     * strong action-oriented context.
     *
     * Example:
     * "claim free nitro here"
     */
    if (
        scamPhrase &&
        hasStrongScamContext(
            content,
            urls.length
        )
    ) {
        return {
            detected:
                true,

            reason:
                `Scam or phishing message detected: "${scamPhrase}"`,

            warning:
                'Scam and phishing messages are not allowed.',

            timeoutDuration:
                timeoutMilliseconds,

            scamType:
                'Suspicious scam wording',

            evidence:
                scamPhrase
        };
    }

    return {
        detected:
            false
    };
}

module.exports = {
    URL_PATTERN,
    IP_ADDRESS_HOST_PATTERN,

    TRUSTED_DOMAINS,
    SHORTENER_DOMAINS,
    IMPERSONATED_BRANDS,
    SCAM_PHRASES,

    cleanUrl,
    normalizeHostname,
    hostnameMatchesDomain,

    isTrustedDomain,
    isShortenedUrl,
    isIpAddressHostname,
    findImpersonatedBrand,

    inspectUrl,
    findScamPhrase,
    hasStrongScamContext,

    detectScam
};
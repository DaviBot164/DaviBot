/**
 * Umbra Scam Shield
 *
 * Detects common phishing and scam patterns
 * inside Discord messages.
 */

const URL_PATTERN =
    /https?:\/\/[^\s<>()]+/gi;

const IP_ADDRESS_URL_PATTERN =
    /^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/i;

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
    'www.roblox.com',

    'epicgames.com',
    'store.epicgames.com',

    'microsoft.com',
    'account.microsoft.com',

    'google.com',
    'accounts.google.com'
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
 * Domains commonly impersonated by scam links.
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
 * Remove punctuation from the end of URLs.
 *
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(url) {
    return url.replace(
        /[.,!?;:'")\]}]+$/g,
        ''
    );
}

/**
 * Normalize a hostname.
 *
 * @param {string} hostname
 * @returns {string}
 */
function normalizeHostname(hostname) {
    return hostname
        .toLowerCase()
        .replace(/\.$/, '')
        .replace(/^www\./, '');
}

/**
 * Check whether a hostname matches a domain
 * or one of its subdomains.
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
        normalizeHostname(hostname);

    const normalizedDomain =
        normalizeHostname(domain);

    return (
        normalizedHostname ===
            normalizedDomain ||
        normalizedHostname.endsWith(
            `.${normalizedDomain}`
        )
    );
}

/**
 * Check whether a URL belongs to a trusted domain.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isTrustedDomain(hostname) {
    return TRUSTED_DOMAINS.some(
        domain =>
            hostnameMatchesDomain(
                hostname,
                domain
            )
    );
}

/**
 * Check whether a URL uses a shortening service.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
function isShortenedUrl(hostname) {
    return SHORTENER_DOMAINS.some(
        domain =>
            hostnameMatchesDomain(
                hostname,
                domain
            )
    );
}

/**
 * Detect suspicious brand impersonation.
 *
 * Example:
 * discord-free-nitro.example.com
 *
 * @param {string} hostname
 * @returns {string|null}
 */
function findImpersonatedBrand(hostname) {
    const normalizedHostname =
        normalizeHostname(hostname);

    if (isTrustedDomain(normalizedHostname)) {
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
 *   detected: boolean,
 *   type?: string,
 *   detail?: string
 * }}
 */
function inspectUrl(rawUrl) {
    const cleanedUrl =
        cleanUrl(rawUrl);

    if (
        IP_ADDRESS_URL_PATTERN.test(
            cleanedUrl
        )
    ) {
        return {
            detected: true,
            type: 'IP address link',
            detail: cleanedUrl
        };
    }

    let parsedUrl;

    try {
        parsedUrl =
            new URL(cleanedUrl);
    } catch {
        return {
            detected: false
        };
    }

    const hostname =
        normalizeHostname(
            parsedUrl.hostname
        );

    if (!hostname) {
        return {
            detected: false
        };
    }

    if (isShortenedUrl(hostname)) {
        return {
            detected: true,
            type: 'Shortened URL',
            detail: hostname
        };
    }

    const impersonatedBrand =
        findImpersonatedBrand(hostname);

    if (impersonatedBrand) {
        return {
            detected: true,
            type:
                'Possible brand impersonation',

            detail:
                `${hostname} resembles ${impersonatedBrand}`
        };
    }

    return {
        detected: false
    };
}

/**
 * Find suspicious scam wording.
 *
 * @param {string} content
 * @returns {string|null}
 */
function findScamPhrase(content) {
    const normalizedContent =
        content
            .toLowerCase()
            .replace(/\s+/g, ' ')
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
 * Detect scam or phishing content.
 *
 * @param {string} content
 * @param {{
 *   timeoutMilliseconds?: number
 * }} options
 * @returns {{
 *   detected: boolean,
 *   reason?: string,
 *   warning?: string,
 *   timeoutDuration?: number,
 *   scamType?: string,
 *   evidence?: string
 * }}
 */
function detectScam(
    content,
    options = {}
) {
    if (
        typeof content !== 'string' ||
        !content.trim()
    ) {
        return {
            detected: false
        };
    }

    const timeoutMilliseconds =
        options.timeoutMilliseconds ??
        30 * 60 * 1_000;

    const urls =
        content.match(URL_PATTERN) ?? [];

    for (const url of urls) {
        const urlResult =
            inspectUrl(url);

        if (urlResult.detected) {
            return {
                detected: true,

                reason:
                    `Scam or phishing link detected: ${urlResult.type}`,

                warning:
                    'suspicious or potentially dangerous links are not allowed.',

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
        findScamPhrase(content);

    /*
     * Scam wording without a URL is logged as
     * suspicious only when the message includes
     * strong urgency or reward language.
     */
    if (scamPhrase) {
        const normalizedContent =
            content.toLowerCase();

        const strongContext =
            urls.length > 0 ||
            normalizedContent.includes(
                'click'
            ) ||
            normalizedContent.includes(
                'claim'
            ) ||
            normalizedContent.includes(
                'login'
            ) ||
            normalizedContent.includes(
                'sign in'
            ) ||
            normalizedContent.includes(
                'verify'
            ) ||
            normalizedContent.includes(
                'scan'
            );

        if (strongContext) {
            return {
                detected: true,

                reason:
                    `Scam or phishing message detected: "${scamPhrase}"`,

                warning:
                    'scam and phishing messages are not allowed.',

                timeoutDuration:
                    timeoutMilliseconds,

                scamType:
                    'Suspicious scam wording',

                evidence:
                    scamPhrase
            };
        }
    }

    return {
        detected: false
    };
}

module.exports = {
    detectScam
};
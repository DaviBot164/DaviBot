const UNITS = Object.freeze({
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
});

const MAX_TIMEOUT_MS =
    28 * 24 * 60 * 60 * 1000;

function parseDuration(value) {
    if (!value) {
        return null;
    }

    const match =
        value
            .trim()
            .toLowerCase()
            .match(/^(\d+)\s*([smhdw])$/);

    if (!match) {
        return null;
    }

    const amount =
        Number(match[1]);

    const unit =
        UNITS[match[2]];

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        return null;
    }

    const duration =
        amount * unit;

    if (
        duration <= 0 ||
        duration > MAX_TIMEOUT_MS
    ) {
        return null;
    }

    return duration;
}

module.exports = {
    MAX_TIMEOUT_MS,
    parseDuration
};
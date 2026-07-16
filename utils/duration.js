const ms = require("ms");

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;

function parseDuration(duration) {
    if (!duration) {
        return {
            success: false,
            error: "Please provide a duration."
        };
    }

    const milliseconds = ms(duration);

    if (!milliseconds) {
        return {
            success: false,
            error: "Invalid duration format."
        };
    }

    if (milliseconds < 1000) {
        return {
            success: false,
            error: "Duration must be at least 1 second."
        };
    }

    if (milliseconds > MAX_TIMEOUT) {
        return {
            success: false,
            error: "Duration cannot exceed 28 days."
        };
    }

    return {
        success: true,
        milliseconds,
        formatted: ms(milliseconds, {
            long: true
        })
    };
}

module.exports = {
    parseDuration,
    MAX_TIMEOUT
};
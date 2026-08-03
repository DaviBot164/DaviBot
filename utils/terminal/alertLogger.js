const {
    logTerminal
} = require('./terminalLogger');

/**
 * Publish a critical Umbra alert.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
async function logAlert(
    client,
    {
        title,
        message,
        severity = 'critical',
        fields = []
    }
) {
    const level =
        severity === 'warning'
            ? 'warning'
            : 'error';

    return logTerminal(
        client,
        {
            level,
            title,
            message,
            fields
        }
    );
}

module.exports = {
    logAlert
};
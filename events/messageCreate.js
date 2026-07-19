const {
    Events
} = require('discord.js');

const {
    handleGuardianMessage
} = require('../guardian');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    /**
     * Run DaviBot Guardian for every new server message.
     *
     * @param {import('discord.js').Message} message
     * @returns {Promise<void>}
     */
    async execute(message) {
        await handleGuardianMessage(message);
    }
};
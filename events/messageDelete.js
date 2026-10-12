const { Events } = require('discord.js');
const { logMessageDelete } = require('../utils/staffLogs');

module.exports = {
    name: Events.MessageDelete,

    async execute(message) {
        try {
            await logMessageDelete(message);
        } catch (error) {
            console.error('Message deletion log failed:', error);
        }
    }
};
const { Events } = require('discord.js');
const { logMessageUpdate } = require('../utils/staffLogs');

module.exports = {
    name: Events.MessageUpdate,

    async execute(before, after) {
        try {
            await logMessageUpdate(before, after);
        } catch (error) {
            console.error('Message edit log failed:', error);
        }
    }
};
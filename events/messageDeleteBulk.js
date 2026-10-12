const { Events } = require('discord.js');
const { logBulkDelete } = require('../utils/staffLogs');

module.exports = {
    name: Events.MessageBulkDelete,

    async execute(messages, channel) {
        try {
            await logBulkDelete(messages, channel);
        } catch (error) {
            console.error('Bulk deletion log failed:', error);
        }
    }
};
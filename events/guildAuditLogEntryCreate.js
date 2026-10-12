const { Events } = require('discord.js');
const { logAuditEntry } = require('../utils/staffLogs');

module.exports = {
    name: Events.GuildAuditLogEntryCreate,

    async execute(entry, guild) {
        try {
            await logAuditEntry(entry, guild);
        } catch (error) {
            console.error('Audit action log failed:', error);
        }
    }
};
const { Events } = require('discord.js');
const { logAvatarChange } = require('../utils/staffLogs');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(before, after) {
        if (before.partial || before.avatar === undefined || before.avatar === after.avatar) return;
        try {
            await logAvatarChange(
                after.guild, after.user,
                before.displayAvatarURL({ extension: 'png', size: 512 }),
                after.displayAvatarURL({ extension: 'png', size: 512 }),
                true
            );
        } catch (error) {
            console.error('Server avatar log failed:', error);
        }
    }
};

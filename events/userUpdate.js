const { Events } = require('discord.js');
const { logAvatarChange } = require('../utils/staffLogs');
const channels = require('../config/channels');

module.exports = {
    name: Events.UserUpdate,
    async execute(before, after, client) {
        if (before.partial || before.avatar === undefined || before.avatar === after.avatar) return;
        try {
            const activeClient = client ?? after.client;
            const channel = await activeClient.channels.fetch(channels.staffLogs);
            const guild = channel?.guild;
            if (!guild) return;
            const member = guild.members.cache.get(after.id) ??
                await guild.members.fetch(after.id).catch(() => null);
            if (!member) return;
            await logAvatarChange(
                guild, after,
                before.displayAvatarURL({ extension: 'png', size: 512 }),
                after.displayAvatarURL({ extension: 'png', size: 512 })
            );
        } catch (error) {
            console.error('Account avatar log failed:', error);
        }
    }
};

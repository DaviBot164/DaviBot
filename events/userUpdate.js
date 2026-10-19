const { Events } = require('discord.js');
const { logAvatarChange } = require('../utils/staffLogs');
const channels = require('../config/channels');

module.exports = {
    name: Events.UserUpdate,

    async execute(before, after, client) {
        if (
            before.partial ||
            before.avatar === undefined ||
            before.avatar === after.avatar
        ) {
            return;
        }

        const oldURL = before.displayAvatarURL({ size: 1024 });
        const newURL = after.displayAvatarURL({ size: 1024 });

        for (const guild of client.guilds.cache.values()) {
            if (!guild.channels.cache.has(channels.staffLogs)) continue;

            try {
                const member = guild.members.cache.get(after.id)
                    ?? await guild.members.fetch(after.id).catch(() => null);

                if (!member) continue;

                await logAvatarChange(guild, after, oldURL, newURL);
            } catch (error) {
                console.error('Account avatar log failed:', error);
            }
        }
    }
};
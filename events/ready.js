const { Events } = require('discord.js');
const brand = require('../config/brand');

const {
    startMatchExpiryScheduler
} = require('../handlers/matchExpiryScheduler');

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {
        console.log(`${brand.name} • ${brand.server}`);
        console.log(`Online as ${client.user.tag}`);
        console.log(`Commands: ${client.commands.size}`);
        if (client.user.username !== brand.name) {
            client.user.setUsername(brand.name).catch(error => {
                console.error('Bot name sync failed:', error.code ?? error.message);
            });
        }

        if (process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI) {
            startMatchExpiryScheduler(client);
        }
    }
};

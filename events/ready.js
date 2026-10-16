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

        if (process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI) {
            startMatchExpiryScheduler(client);
        }
    }
};
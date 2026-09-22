const { Events } = require('discord.js');
const brand = require('../config/brand');

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {
        console.log(`${brand.name} • ${brand.server}`);
        console.log(`Online as ${client.user.tag}`);
        console.log(`Commands: ${client.commands.size}`);
    }
};
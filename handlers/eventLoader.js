const fs = require('fs');
const path = require('path');

function loadEvents(client) {
    const root = path.join(__dirname, '..', 'events');

    const files = fs.readdirSync(root)
        .filter(file => file.endsWith('.js'));

    for (const file of files) {
        const event = require(path.join(root, file));

        const handler = (...args) => {
            const guild=args.map(arg=>arg?.guild??arg?.first?.()?.guild??(arg?.channels&&arg?.members&&arg?.id?arg:null)??(arg?.guildId?client.guilds?.cache?.get(arg.guildId)??arg.guildId:null)).find(Boolean);
            const action=()=>event.execute(...args,client);
            const task=guild?require('../utils/guildContext').withGuild(guild,action):Promise.resolve().then(action);
            return Promise.resolve(task).catch(error=>console.error('Event could not complete:',event.name,error?.code??'operation failed'));
        };

        if (event.once) {
            client.once(event.name, handler);
        } else {
            client.on(event.name, handler);
        }
    }
}

module.exports = { loadEvents };

const fs = require('fs');
const path = require('path');

function loadEvents(client) {
    const root = path.join(__dirname, '..', 'events');

    const files = fs.readdirSync(root)
        .filter(file => file.endsWith('.js'));

    for (const file of files) {
        const event = require(path.join(root, file));

        const handler = (...args) =>
            event.execute(...args, client);

        if (event.once) {
            client.once(event.name, handler);
        } else {
            client.on(event.name, handler);
        }
    }
}

module.exports = { loadEvents };
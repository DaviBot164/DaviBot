const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    client.commands = new Map();

    const root = path.join(__dirname, '..', 'commands');

    for (const folder of fs.readdirSync(root)) {
        const folderPath = path.join(root, folder);

        if (!fs.statSync(folderPath).isDirectory()) {
            continue;
        }

        const files = fs.readdirSync(folderPath)
            .filter(file => file.endsWith('.js'));

        for (const file of files) {
            const command = require(path.join(folderPath, file));

            if (command.data && command.execute) {
                client.commands.set(
                    command.data.name,
                    command
                );
            }
        }
    }

    return client.commands.size;
}

module.exports = { loadCommands };
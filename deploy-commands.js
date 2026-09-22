require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const root = path.join(__dirname, 'commands');

for (const folder of fs.readdirSync(root)) {
    const folderPath = path.join(root, folder);

    if (!fs.statSync(folderPath).isDirectory()) {
        continue;
    }

    for (const file of fs.readdirSync(folderPath)) {
        if (!file.endsWith('.js')) {
            continue;
        }

        const command = require(path.join(folderPath, file));

        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(process.env.TOKEN);

async function deploy() {
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands }
    );

    console.log(`Deployed ${commands.length} command(s).`);
}

deploy().catch(console.error);
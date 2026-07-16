const fs = require('fs');
const path = require('path');

module.exports = (client) => {

    client.commands = new Map();

    const commandsPath = path.join(__dirname, '..', 'commands');

    console.log("======================================");
    console.log("📂 Loading Commands...");
    console.log("======================================");

    const folders = fs.readdirSync(commandsPath);

    for (const folder of folders) {

        const folderPath = path.join(commandsPath, folder);

        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs
            .readdirSync(folderPath)
            .filter(file => file.endsWith('.js'));

        console.log(`📁 Category: ${folder}`);

        for (const file of commandFiles) {

            console.log(`📄 Loading file: ${file}`);

            try {

                const command = require(path.join(folderPath, file));

                if (!command.data || !command.execute) {
                    console.log(`❌ ${file} is missing data or execute.`);
                    continue;
                }

                console.log(`📌 Command Name : ${command.data.name}`);
                console.log(`📝 Description  : ${command.data.description}`);

                client.commands.set(command.data.name, command);

                console.log(`✅ Successfully Loaded: ${command.data.name}`);
                console.log("--------------------------------------");

            } catch (error) {

                console.error(`❌ Failed to load: ${file}`);
                console.error(error);

            }

        }

    }

    console.log("======================================");
    console.log(`📦 Total Commands Loaded: ${client.commands.size}`);
    console.log("📜 Commands List:");

    for (const command of client.commands.keys()) {
        console.log(`➡ ${command}`);
    }

    console.log("======================================");

};
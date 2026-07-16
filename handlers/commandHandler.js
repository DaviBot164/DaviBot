const fs = require('fs');
const path = require('path');

module.exports = (client) => {

    client.commands = new Map();

    const commandsPath = path.join(__dirname, '..', 'commands');

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));

    console.log("======================================");
    console.log("📂 Loading Commands...");
    console.log("======================================");

    for (const file of commandFiles) {

        console.log(`📄 Loading file: ${file}`);

        const command = require(path.join(commandsPath, file));

        if (!command.data || !command.execute) {
            console.log(`❌ ${file} is missing data or execute.`);
            continue;
        }

        console.log(`📌 Command Name : ${command.data.name}`);
        console.log(`📝 Description  : ${command.data.description}`);

        client.commands.set(command.data.name, command);

        console.log(`✅ Successfully Loaded: ${command.data.name}`);
        console.log("--------------------------------------");
    }

    console.log("======================================");
    console.log(`📦 Total Commands Loaded: ${client.commands.size}`);
    console.log("📜 Commands List:");

    for (const command of client.commands.keys()) {
        console.log(`➡ ${command}`);
    }

    console.log("======================================");
};
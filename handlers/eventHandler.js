const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const eventsPath = path.join(__dirname, "..", "events");

    console.log("======================================");
    console.log("⚡ Loading Events...");
    console.log("======================================");

    if (!fs.existsSync(eventsPath)) {
        fs.mkdirSync(eventsPath);

        console.log("📁 Events folder created.");
        console.log("======================================");

        return;
    }

    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        console.log(`📄 Loading event file: ${file}`);

        try {
            const event = require(filePath);

            if (!event.name || !event.execute) {
                console.log(`❌ ${file} is missing name or execute.`);
                console.log("--------------------------------------");
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) =>
                    event.execute(...args, client)
                );
            } else {
                client.on(event.name, (...args) =>
                    event.execute(...args, client)
                );
            }

            console.log(`✅ Successfully Loaded: ${event.name}`);
            console.log("--------------------------------------");
        } catch (error) {
            console.error(`❌ Failed to load event: ${file}`);
            console.error(error);
            console.log("--------------------------------------");
        }
    }

    console.log("======================================");
    console.log(`⚡ Total Events Loaded: ${eventFiles.length}`);
    console.log("======================================");
};
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Events,
    REST,
    Routes,
} = require('discord.js');

const commandHandler = require('./handlers/commandHandler');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Load Commands
commandHandler(client);

// Ready Event
client.once(Events.ClientReady, async (readyClient) => {

    console.log(`✅ ${readyClient.user.tag} is online!`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {

        console.log("📤 Registering Guild Commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                readyClient.user.id,
                process.env.GUILD_ID
            ),
            {
                body: [...client.commands.values()].map(cmd => cmd.data.toJSON()),
            }
        );

        console.log("✅ Guild Slash Commands Registered!");

    } catch (err) {

        console.error(err);

    }

});

// Slash Commands
client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isChatInputCommand()) return;

    console.log(`📥 ${interaction.commandName}`);

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {

        await command.execute(interaction);

    } catch (error) {

        console.error(error);

        if (interaction.replied || interaction.deferred) {

            await interaction.followUp({
                content: "❌ Something went wrong!",
                ephemeral: true,
            });

        } else {

            await interaction.reply({
                content: "❌ Something went wrong!",
                ephemeral: true,
            });

        }

    }

});

client.login(process.env.TOKEN);
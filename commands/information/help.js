const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed
} = require('../../utils/embeds');

/*
 * ბრძანებების კატეგორიები.
 *
 * ახალი ბრძანება თუ ამ სიებში არ იქნება,
 * ავტომატურად გამოჩნდება "Other" კატეგორიაში.
 */
const commandCategories = {
    general: {
        title: '📜 General',
        commands: [
            'help',
            'ping',
            'testwelcome'
        ]
    },

    information: {
        title: '👤 Information',
        commands: [
            'avatar',
            'profile',
            'serverinfo',
            'userinfo'
        ]
    },

    moderation: {
        title: '🛡️ Moderation',
        commands: [
            'ban',
            'clear',
            'kick',
            'lock',
            'slowmode',
            'timeout',
            'unlock',
            'untimeout',
            'unwarn',
            'warn',
            'warnings'
        ]
    },

    tickets: {
        title: '🎫 Tickets',
        commands: [
            'ticket',
            'ticketpanel',
            'tickets'
        ]
    }
};

/**
 * აბრუნებს command-ის კატეგორიას.
 *
 * თუ command-ს მომავალში ექნება:
 * category: 'moderation'
 *
 * მაშინ პირველ რიგში ის იქნება გამოყენებული.
 */
function getCommandCategory(command) {
    if (
        command.category &&
        commandCategories[command.category]
    ) {
        return command.category;
    }

    const commandName = command.data.name;

    for (const [categoryName, category] of Object.entries(
        commandCategories
    )) {
        if (category.commands.includes(commandName)) {
            return categoryName;
        }
    }

    return 'other';
}

/**
 * Discord embed field-ის მაქსიმალური ზომაა 1024 სიმბოლო.
 * ეს ფუნქცია დიდ სიას რამდენიმე ნაწილად ჰყოფს.
 */
function splitFieldValue(lines, maxLength = 1024) {
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
        const nextValue = currentChunk
            ? `${currentChunk}\n${line}`
            : line;

        if (nextValue.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            currentChunk = line;
        } else {
            currentChunk = nextValue;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),

    async execute(interaction) {
        try {
            const clientCommands = interaction.client.commands;

            if (!clientCommands || clientCommands.size === 0) {
                return await interaction.reply({
                    content:
                        '❌ No commands are currently available.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const groupedCommands = {
                general: [],
                information: [],
                moderation: [],
                tickets: [],
                other: []
            };

            /*
             * client.commands-დან ყველა რეალურად
             * ჩატვირთული command-ის მიღება.
             */
            for (const command of clientCommands.values()) {
                if (!command?.data?.name) {
                    continue;
                }

                const commandName = command.data.name;
                const commandDescription =
                    command.data.description ||
                    'No description available.';

                const category = getCommandCategory(command);

                groupedCommands[category].push({
                    name: commandName,
                    description: commandDescription
                });
            }

            /*
             * თითოეული კატეგორიის ანბანური დალაგება.
             */
            for (const commands of Object.values(groupedCommands)) {
                commands.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
            }

            const fields = [];

            const categoryOrder = [
                'general',
                'information',
                'moderation',
                'tickets',
                'other'
            ];

            for (const categoryName of categoryOrder) {
                const commands = groupedCommands[categoryName];

                if (!commands || commands.length === 0) {
                    continue;
                }

                const categoryTitle =
                    commandCategories[categoryName]?.title ||
                    '⚙️ Other';

                const commandLines = commands.map(command =>
                    `• \`/${command.name}\` — ${command.description}`
                );

                const fieldParts =
                    splitFieldValue(commandLines);

                fieldParts.forEach((fieldValue, index) => {
                    fields.push({
                        name:
                            index === 0
                                ? categoryTitle
                                : `${categoryTitle} — Continued`,
                        value: fieldValue,
                        inline: false
                    });
                });
            }

            const commandCount = Array.from(
                clientCommands.values()
            ).filter(command => command?.data?.name).length;

            const embed = createEmbed({
                title: '📖 DaviBot Help',
                description:
                    'Welcome to **DaviBot**!\n\n' +
                    'Below are all currently loaded Slash Commands.\n' +
                    `**Total Commands:** ${commandCount}`,
                fields
            });

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Error while executing /help:',
                error
            );

            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({
                    content:
                        '❌ An error occurred while loading the command list.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                content:
                    '❌ An error occurred while loading the command list.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
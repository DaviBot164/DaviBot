const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed
} = require('../../utils/embeds');

/**
 * Command categories displayed by /help.
 *
 * Commands are automatically collected from
 * interaction.client.commands.
 */
const commandCategories = {
    general: {
        title: '🌑 General',
        commands: [
            'help',
            'ping',
            'testwelcome'
        ]
    },

    information: {
        title: '📜 Soul Records',
        commands: [
            'avatar',
            'profile',
            'serverinfo',
            'userinfo'
        ]
    },

    moderation: {
        title: '🛡️ Shadow Wardens',
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
        title: '🎫 Order Support',
        commands: [
            'ticket',
            'ticketpanel',
            'tickets'
        ]
    }
};

/**
 * Determine which category a command belongs to.
 *
 * If the command exports a valid category property,
 * that category is used first.
 *
 * Otherwise, the command name is compared with the
 * command lists above.
 *
 * @param {Object} command
 * @returns {string}
 */
function getCommandCategory(command) {
    if (
        command.category &&
        commandCategories[command.category]
    ) {
        return command.category;
    }

    const commandName =
        command.data.name;

    for (
        const [categoryName, category]
        of Object.entries(commandCategories)
    ) {
        if (
            category.commands.includes(
                commandName
            )
        ) {
            return categoryName;
        }
    }

    return 'other';
}

/**
 * Split long field content so it remains inside
 * Discord's 1024-character field limit.
 *
 * @param {string[]} lines
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitFieldValue(
    lines,
    maxLength = 1024
) {
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
        const nextValue =
            currentChunk
                ? `${currentChunk}\n${line}`
                : line;

        if (
            nextValue.length >
            maxLength
        ) {
            if (currentChunk) {
                chunks.push(
                    currentChunk
                );
            }

            currentChunk = line;
        } else {
            currentChunk =
                nextValue;
        }
    }

    if (currentChunk) {
        chunks.push(
            currentChunk
        );
    }

    return chunks;
}

module.exports = {
    category: 'general',

    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(
            'Displays all available Umbra commands.'
        ),

    /**
     * Execute the /help command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            const clientCommands =
                interaction.client.commands;

            if (
                !clientCommands ||
                clientCommands.size === 0
            ) {
                await interaction.reply({
                    content:
                        '❌ No Umbra commands are currently available.',

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const groupedCommands = {
                general: [],
                information: [],
                moderation: [],
                tickets: [],
                other: []
            };

            for (
                const command
                of clientCommands.values()
            ) {
                if (
                    !command?.data?.name
                ) {
                    continue;
                }

                const commandName =
                    command.data.name;

                const commandDescription =
                    command.data.description ||
                    'No description available.';

                const category =
                    getCommandCategory(
                        command
                    );

                groupedCommands[
                    category
                ].push({
                    name: commandName,
                    description:
                        commandDescription
                });
            }

            /*
             * Sort every category alphabetically.
             */
            for (
                const commands
                of Object.values(
                    groupedCommands
                )
            ) {
                commands.sort(
                    (firstCommand, secondCommand) =>
                        firstCommand.name.localeCompare(
                            secondCommand.name
                        )
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

            for (
                const categoryName
                of categoryOrder
            ) {
                const commands =
                    groupedCommands[
                        categoryName
                    ];

                if (
                    !commands ||
                    commands.length === 0
                ) {
                    continue;
                }

                const categoryTitle =
                    commandCategories[
                        categoryName
                    ]?.title ||
                    '⚙️ Other Commands';

                const commandLines =
                    commands.map(
                        command =>
                            `• \`/${command.name}\` — ${command.description}`
                    );

                const fieldParts =
                    splitFieldValue(
                        commandLines
                    );

                fieldParts.forEach(
                    (
                        fieldValue,
                        index
                    ) => {
                        fields.push({
                            name:
                                index === 0
                                    ? categoryTitle
                                    : `${categoryTitle} — Continued`,

                            value:
                                fieldValue,

                            inline:
                                false
                        });
                    }
                );
            }

            const commandCount =
                Array.from(
                    clientCommands.values()
                ).filter(
                    command =>
                        command?.data?.name
                ).length;

            const embed =
                createEmbed({
                    title:
                        '🌑 Umbra Command Codex',

                    description:
                        [
                            '**Guardian of Crimson Eclipse**',
                            '',
                            'Welcome, Soul.',
                            'Below are the commands currently available within the Order.',
                            '',
                            `📜 **Total Commands:** \`${commandCount}\``,
                            '',
                            '*Use each command responsibly beneath the crimson moon.*'
                        ].join('\n'),

                    fields
                });

            await interaction.reply({
                embeds: [embed],

                flags:
                    MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Error while executing Umbra /help:',
                error
            );

            const errorMessage =
                '❌ Umbra could not load the command codex. Please try again.';

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp({
                    content:
                        errorMessage,

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.reply({
                content:
                    errorMessage,

                flags:
                    MessageFlags.Ephemeral
            });
        }
    }
};
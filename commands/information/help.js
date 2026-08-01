const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

/**
 * Umbra Quick Codex category order.
 *
 * Commands that are not currently loaded
 * are automatically hidden.
 */
const COMMAND_CATEGORIES = [
    {
        id:
            'core',

        title:
            '🌙 Core Navigation',

        description:
            'Main Umbra panels and system navigation.',

        commands: [
            'guide',
            'help',
            'lasnoches',
            'soul'
        ]
    },
    {
        id:
            'information',

        title:
            '📚 Information',

        description:
            'General Discord and member information.',

        commands: [
            'avatar',
            'ping',
            'profile',
            'serverinfo',
            'userinfo'
        ]
    },
    {
        id:
            'progression',

        title:
            '👤 Soul Progression',

        description:
            'Soul Records, Titles and progression systems.',

        commands: [
            'soul',
            'titles',
            'settitle',
            'removetitle'
        ]
    },
    {
        id:
            'ranks',

        title:
            '⚔️ Arrancar Hierarchy',

        description:
            'Espada records and manually assigned Ranks.',

        commands: [
            'espada',
            'rankhistory',
            'setrank',
            'removerank'
        ]
    },
    {
        id:
            'titleManagement',

        title:
            '🏷️ Chronicle Management',

        description:
            'High Command Title administration.',

        commands: [
            'granttitle',
            'revoketitle'
        ]
    },
    {
        id:
            'moderation',

        title:
            '🛡️ Moderation',

        description:
            'Warnings, punishments and channel control.',

        commands: [
            'ban',
            'cases',
            'clear',
            'clearwarnings',
            'history',
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
    {
        id:
            'support',

        title:
            '🎫 Support',

        description:
            'Ticket creation and support management.',

        commands: [
            'ticket',
            'ticketpanel',
            'tickets'
        ]
    },
    {
        id:
            'community',

        title:
            '🎉 Events & Community',

        description:
            'Official events, giveaways and announcements.',

        commands: [
            'announce',
            'event',
            'giveaway'
        ]
    },
    {
        id:
            'administration',

        title:
            '⚙️ Administration',

        description:
            'Server setup and Umbra configuration.',

        commands: [
            'setup',
            'setuprules',
            'testwelcome'
        ]
    }
];

/**
 * Create a Set containing every command
 * name already assigned to a category.
 *
 * @returns {Set<string>}
 */
function createCategorizedCommandSet() {
    return new Set(
        COMMAND_CATEGORIES.flatMap(
            category =>
                category.commands
        )
    );
}

/**
 * Get one loaded command safely.
 *
 * @param {import('discord.js').Client} client
 * @param {string} commandName
 * @returns {Object|null}
 */
function getLoadedCommand(
    client,
    commandName
) {
    return (
        client.commands?.get(
            commandName
        ) ||
        null
    );
}

/**
 * Get every loaded command belonging
 * to one configured category.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} category
 * @returns {Array<{
 *     name: string,
 *     description: string
 * }>}
 */
function getCategoryCommands(
    client,
    category
) {
    return category.commands
        .map(commandName => {
            const command =
                getLoadedCommand(
                    client,
                    commandName
                );

            if (
                !command?.data?.name
            ) {
                return null;
            }

            return {
                name:
                    command.data.name,

                description:
                    command.data.description ||
                    'No description is currently available.'
            };
        })
        .filter(
            Boolean
        );
}

/**
 * Find every loaded command that has
 * not yet been assigned to a category.
 *
 * @param {import('discord.js').Client} client
 * @returns {Array<{
 *     name: string,
 *     description: string
 * }>}
 */
function getUncategorizedCommands(
    client
) {
    const categorizedCommands =
        createCategorizedCommandSet();

    return Array.from(
        client.commands?.values() ||
        []
    )
        .filter(
            command =>
                command?.data?.name &&
                !categorizedCommands.has(
                    command.data.name
                )
        )
        .map(
            command => ({
                name:
                    command.data.name,

                description:
                    command.data.description ||
                    'No description is currently available.'
            })
        )
        .sort(
            (
                firstCommand,
                secondCommand
            ) =>
                firstCommand.name.localeCompare(
                    secondCommand.name
                )
        );
}

/**
 * Format one command line.
 *
 * @param {Object} command
 * @returns {string}
 */
function formatCommandLine(
    command
) {
    return (
        `• \`/${command.name}\` — ` +
        `${command.description}`
    );
}

/**
 * Split command lines into safe Discord
 * Embed field values.
 *
 * @param {string[]} lines
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitFieldValue(
    lines,
    maxLength = 1_000
) {
    const chunks = [];

    let currentChunk =
        '';

    for (
        const line
        of lines
    ) {
        const nextChunk =
            currentChunk
                ? `${currentChunk}\n${line}`
                : line;

        if (
            nextChunk.length >
            maxLength
        ) {
            if (currentChunk) {
                chunks.push(
                    currentChunk
                );
            }

            currentChunk =
                line;
        } else {
            currentChunk =
                nextChunk;
        }
    }

    if (currentChunk) {
        chunks.push(
            currentChunk
        );
    }

    return chunks;
}

/**
 * Add one command category to an Embed.
 *
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string} title
 * @param {string} description
 * @param {Object[]} commands
 * @returns {void}
 */
function addCommandCategoryFields(
    embed,
    title,
    description,
    commands
) {
    if (
        !Array.isArray(
            commands
        ) ||
        commands.length === 0
    ) {
        return;
    }

    const lines =
        commands.map(
            formatCommandLine
        );

    const chunks =
        splitFieldValue(
            lines
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? title
                        : `${title} — Continued`,

                value:
                    [
                        index === 0
                            ? `-# ${description}`
                            : null,

                        chunk
                    ]
                        .filter(
                            Boolean
                        )
                        .join('\n'),

                inline:
                    false
            });
        }
    );
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'help'
            )
            .setDescription(
                'Open Umbra’s quick command codex.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /help command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Las Noches Only Command',
                            'Umbra’s Command Codex can only be opened inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const clientCommands =
                interaction.client.commands;

            if (
                !clientCommands ||
                clientCommands.size === 0
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Command Archive Empty',
                            'No Umbra commands are currently loaded.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        extension:
                            'png',

                        size:
                            1024,

                        forceStatic:
                            false
                    });

            const guildIcon =
                interaction.guild.iconURL({
                    extension:
                        'png',

                    size:
                        1024,

                    forceStatic:
                        false
                });

            const totalCommandCount =
                Array.from(
                    clientCommands.values()
                ).filter(
                    command =>
                        command?.data?.name
                ).length;

            const embed =
                createEmbed({
                    title:
                        '🌙 Umbra Quick Command Codex',

                    description:
                        [
                            `Welcome, ${interaction.user}.`,
                            '',
                            'This codex provides a fast overview of every command currently loaded by Umbra.',
                            '',
                            embedConfig
                                .branding
                                .divider,
                            '',
                            `📚 **Loaded Commands:** \`${totalCommandCount}\``,
                            '',
                            'For detailed syntax, access levels and explanations, use `/guide`.'
                        ].join('\n'),

                    color:
                        embedConfig
                            .colors
                            .accent,

                    thumbnail:
                        guildIcon ||
                        botAvatar,

                    author: {
                        name:
                            'Umbra • Quick Command Archive',

                        iconURL:
                            botAvatar
                    },

                    footer: {
                        text:
                            `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

                        iconURL:
                            botAvatar
                    }
                });

            for (
                const category
                of COMMAND_CATEGORIES
            ) {
                const commands =
                    getCategoryCommands(
                        interaction.client,
                        category
                    );

                addCommandCategoryFields(
                    embed,
                    category.title,
                    category.description,
                    commands
                );
            }

            const uncategorizedCommands =
                getUncategorizedCommands(
                    interaction.client
                );

            addCommandCategoryFields(
                embed,
                '⚙️ Additional Commands',
                'Loaded commands that have not yet been assigned to a dedicated codex category.',
                uncategorizedCommands
            );

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /help command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Command Codex Unavailable',
                    [
                        'Umbra could not open the Quick Command Codex.',
                        '',
                        'Please inspect the Northflank logs and try again.'
                    ].join('\n')
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};
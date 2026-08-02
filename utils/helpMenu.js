const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const {
    createEmbed
} = require('./embeds');

const embedConfig =
    require('../config/embed');

/**
 * Umbra Help Menu categories.
 *
 * Commands that are not currently loaded
 * are automatically hidden.
 */
const HELP_CATEGORIES = [
    {
        id:
            'core',

        label:
            'Core Navigation',

        emoji:
            '🌙',

        description:
            'Main Umbra systems and navigation.',

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

        label:
            'Information',

        emoji:
            '📚',

        description:
            'Member and server information commands.',

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

        label:
            'Soul Progression',

        emoji:
            '⭐',

        description:
            'Levels, Soul Records and progression.',

        commands: [
            'level',
            'rank',
            'leaderboard',
            'soul'
        ]
    },
    {
        id:
            'titles',

        label:
            'Chronicle Titles',

        emoji:
            '🏷️',

        description:
            'Title collection and management.',

        commands: [
            'titles',
            'settitle',
            'removetitle',
            'granttitle',
            'revoketitle'
        ]
    },
    {
        id:
            'ranks',

        label:
            'Arrancar Hierarchy',

        emoji:
            '⚔️',

        description:
            'Espada and Arrancar Rank systems.',

        commands: [
            'espada',
            'rankhistory',
            'setrank',
            'removerank'
        ]
    },
    {
        id:
            'moderation',

        label:
            'Moderation',

        emoji:
            '🛡️',

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

        label:
            'Support',

        emoji:
            '🎫',

        description:
            'Ticket and support systems.',

        commands: [
            'ticketpanel'
        ]
    },
    {
        id:
            'community',

        label:
            'Events & Community',

        emoji:
            '🎉',

        description:
            'Announcements, events and giveaways.',

        commands: [
            'announce',
            'event',
            'giveaway'
        ]
    },
    {
        id:
            'administration',

        label:
            'Administration',

        emoji:
            '⚙️',

        description:
            'Las Noches setup and configuration.',

        commands: [
            'setup',
            'setuprules',
            'testwelcome'
        ]
    }
];

/**
 * Get one loaded command.
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
 * Return every loaded command belonging
 * to one Help category.
 *
 * @param {import('discord.js').Client} client
 * @param {Object} category
 * @returns {Object[]}
 */
function getCategoryCommands(
    client,
    category
) {
    return category.commands
        .map(commandName =>
            getLoadedCommand(
                client,
                commandName
            )
        )
        .filter(command =>
            Boolean(
                command?.data?.name
            )
        );
}

/**
 * Count every loaded Slash Command.
 *
 * @param {import('discord.js').Client} client
 * @returns {number}
 */
function getLoadedCommandCount(
    client
) {
    return Array.from(
        client.commands?.values() ||
        []
    ).filter(command =>
        Boolean(
            command?.data?.name
        )
    ).length;
}

/**
 * Format one Slash Command.
 *
 * @param {Object} command
 * @returns {string}
 */
function formatCommand(
    command
) {
    const name =
        command.data.name;

    const description =
        command.data.description ||
        'No description is available.';

    return (
        `\`/${name}\`\n` +
        `-# ${description}`
    );
}

/**
 * Create the main Help Menu Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function createHelpHomeEmbed(
    interaction
) {
    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                1024,

            forceStatic:
                false
        });

    const categoryLines =
        HELP_CATEGORIES.map(category =>
            `${category.emoji} **${category.label}** — ${category.description}`
        );

    return createEmbed({
        title:
            '🌙 Umbra Command Codex',

        description:
            [
                `Welcome, ${interaction.user}.`,
                '',
                'Select a category below to view its available commands.',
                '',
                categoryLines.join(
                    '\n'
                ),
                '',
                embedConfig
                    .branding
                    .divider,
                '',
                `📚 **Loaded Commands:** \`${getLoadedCommandCount(
                    interaction.client
                )}\``
            ].join(
                '\n'
            ),

        color:
            '#6F42C1',

        thumbnail:
            guildIcon ||
            botAvatar,

        author: {
            name:
                'Umbra • Las Noches Command Archive',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

/**
 * Create one category Embed.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} categoryId
 * @returns {import('discord.js').EmbedBuilder|null}
 */
function createHelpCategoryEmbed(
    interaction,
    categoryId
) {
    const category =
        HELP_CATEGORIES.find(
            configuredCategory =>
                configuredCategory.id ===
                categoryId
        );

    if (!category) {
        return null;
    }

    const commands =
        getCategoryCommands(
            interaction.client,
            category
        );

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const commandText =
        commands.length > 0
            ? commands
                .map(
                    formatCommand
                )
                .join(
                    '\n\n'
                )
            : '*No commands from this category are currently loaded.*';

    return createEmbed({
        title:
            `${category.emoji} ${category.label}`,

        description:
            [
                category.description,
                '',
                embedConfig
                    .branding
                    .divider,
                '',
                commandText
            ].join(
                '\n'
            ),

        color:
            '#6F42C1',

        author: {
            name:
                'Umbra • Command Codex',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `Select another category below • Requested by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

/**
 * Create the Help category Select Menu.
 *
 * @param {string|null} selectedCategoryId
 * @returns {ActionRowBuilder}
 */
function createHelpSelectMenu(
    selectedCategoryId = null
) {
    const selectMenu =
        new StringSelectMenuBuilder()
            .setCustomId(
                'umbra_help_category'
            )
            .setPlaceholder(
                'Choose a command category...'
            )
            .setMinValues(
                1
            )
            .setMaxValues(
                1
            );

    selectMenu.addOptions(
        HELP_CATEGORIES.map(category =>
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    category.label
                )
                .setDescription(
                    category.description
                        .slice(
                            0,
                            100
                        )
                )
                .setValue(
                    category.id
                )
                .setEmoji(
                    category.emoji
                )
                .setDefault(
                    category.id ===
                    selectedCategoryId
                )
        )
    );

    return new ActionRowBuilder()
        .addComponents(
            selectMenu
        );
}

module.exports = {
    HELP_CATEGORIES,

    createHelpHomeEmbed,
    createHelpCategoryEmbed,
    createHelpSelectMenu
};
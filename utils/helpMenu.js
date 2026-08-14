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
 * Evelynn Help Menu categories.
 *
 * Commands that are not currently loaded
 * are automatically hidden.
 */
const HELP_CATEGORIES = [
    {
        id:
            'core',

        label:
            'Core',

        emoji:
            'Ⅹ',

        description:
            'Main navigation and essential commands.',

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
            '📖',

        description:
            'Member and server information.',

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
            'Progression',

        emoji:
            '◆',

        description:
            'Levels, ranks and member progression.',

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
            'Titles',

        emoji:
            '♜',

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
            'Sin Ranks',

        emoji:
            '⚔️',

        description:
            'The Ten Sins ranking system.',

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
            'Tickets and member support.',

        commands: [
            'ticketpanel'
        ]
    },

    {
        id:
            'community',

        label:
            'Community',

        emoji:
            '♠️',

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
            '♛',

        description:
            'THE Ⅹ SINS setup and configuration.',

        commands: [
            'setup',
            'setuprules',
            'testwelcome'
        ]
    }
];/**
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
 * Return every loaded command
 * from one Help category.
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
        'No description available.';

    return (
        `\`/${name}\`\n` +
        `-# ${description}`
    );
}

/**
 * Create the main
 * Evelynn Help Menu Embed.
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
            'Ⅹ・COMMAND MENU',

        description:
            [
                `Welcome, ${interaction.user}.`,
                '',
                'Choose a category below.',
                '',
                categoryLines.join(
                    '\n'
                ),
                '',
                embedConfig
                    .branding
                    .divider,
                '',
                `**Loaded Commands:** \`${getLoadedCommandCount(
                    interaction.client
                )}\``
            ].join(
                '\n'
            ),

        color:
            '#5B3A78',

        thumbnail:
            guildIcon ||
            botAvatar,

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `TTS • Opened by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}/**
 * Create one Help category Embed.
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
            `${category.emoji}・${category.label.toUpperCase()}`,

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
            '#5B3A78',

        author: {
            name:
                'Evelynn • Command Menu',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `TTS • Requested by ${interaction.user.username}`,

            iconURL:
                botAvatar
        }
    });
}

/**
 * Create the Help category Select Menu.
 *
 * Keep the existing custom ID because
 * interaction routing may depend on it.
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
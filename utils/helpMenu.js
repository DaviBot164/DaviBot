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

const HELP_MENU_ID =
    'umbra_help_category';

const HELP_COLOR =
    '#B026FF';

const HELP_CATEGORIES = [
    {
        id: 'core',
        label: 'Core',
        emoji: '✨',
        description:
            'Main navigation and essential commands.',

        commands: [
            'guide',
            'help',
            'dashboard',
            'soul'
        ]
    },

    {
        id: 'information',
        label: 'Information',
        emoji: '📖',
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
        id: 'progression',
        label: 'Progression',
        emoji: '📈',
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
        id: 'titles',
        label: 'Titles',
        emoji: '🏷️',
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
        id: 'ranks',
        label: 'Sin Ranks',
        emoji: '⚔️',
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
        id: 'moderation',
        label: 'Moderation',
        emoji: '🛡️',
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
        id: 'support',
        label: 'Support',
        emoji: '🎫',
        description:
            'Tickets and member support.',

        commands: [
            'ticketpanel'
        ]
    },

    {
        id: 'community',
        label: 'Community',
        emoji: '♠️',
        description:
            'Announcements, events and giveaways.',

        commands: [
            'announce',
            'event',
            'giveaway'
        ]
    },

    {
        id: 'administration',
        label: 'Administration',
        emoji: '⚙️',
        description:
            'THE Ⅹ SINS setup and configuration.',

        commands: [
            'setup',
            'setuprules',
            'testwelcome'
        ]
    }
];

function getBotAvatar(
    interaction
) {
    return interaction.client.user
        .displayAvatarURL({
            size: 256,
            forceStatic: false
        });
}

function getGuildIcon(
    interaction
) {
    return (
        interaction.guild.iconURL({
            size: 512,
            forceStatic: false
        }) ??
        getBotAvatar(
            interaction
        )
    );
}

function getLoadedCommands(
    client,
    names
) {
    return names
        .map(
            name =>
                client.commands?.get(
                    name
                )
        )
        .filter(
            command =>
                command?.data?.name
        );
}

function getLoadedCommandCount(
    client
) {
    return (
        client.commands?.size ??
        0
    );
}

function formatCommand(
    command
) {
    return [
        `\`/${command.data.name}\``,
        `-# ${
            command.data.description ||
            'No description available.'
        }`
    ].join('\n');
}function createHelpHomeEmbed(
    interaction
) {
    const categories =
        HELP_CATEGORIES
            .map(
                category =>
                    `${category.emoji} **${category.label}** — ${category.description}`
            )
            .join('\n');

    return createEmbed({
        title:
            'Ⅹ・COMMAND MENU',

        description: [
            `Welcome, ${interaction.user}.`,
            '',
            'Choose a category below.',
            '',
            categories,
            '',
            embedConfig.branding.divider,
            '',
            `**Loaded Commands:** \`${getLoadedCommandCount(
                interaction.client
            )}\``
        ].join('\n'),

        color:
            HELP_COLOR,

        thumbnail:
            getGuildIcon(
                interaction
            ),

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                getBotAvatar(
                    interaction
                )
        },

        footer: {
            text:
                `TTS • Opened by ${interaction.user.username}`,

            iconURL:
                getBotAvatar(
                    interaction
                )
        }
    });
}

function createHelpCategoryEmbed(
    interaction,
    categoryId
) {
    const category =
        HELP_CATEGORIES.find(
            item =>
                item.id ===
                categoryId
        );

    if (!category) {
        return null;
    }

    const commands =
        getLoadedCommands(
            interaction.client,
            category.commands
        );

    const commandText =
        commands.length
            ? commands
                .map(
                    formatCommand
                )
                .join('\n\n')
            : '*No commands from this category are currently loaded.*';

    return createEmbed({
        title:
            `${category.emoji}・${category.label.toUpperCase()}`,

        description: [
            category.description,
            '',
            embedConfig.branding.divider,
            '',
            commandText
        ].join('\n'),

        color:
            HELP_COLOR,

        author: {
            name:
                'Evelynn • Command Menu',

            iconURL:
                getBotAvatar(
                    interaction
                )
        },

        footer: {
            text:
                `TTS • Requested by ${interaction.user.username}`,

            iconURL:
                getBotAvatar(
                    interaction
                )
        }
    });
}

function createHelpSelectMenu(
    selectedCategoryId = null
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                HELP_MENU_ID
            )
            .setPlaceholder(
                'Choose a command category...'
            )
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                HELP_CATEGORIES.map(
                    category =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                category.label
                            )
                            .setDescription(
                                category.description
                                    .slice(0, 100)
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
            menu
        );
}

module.exports = {
    HELP_CATEGORIES,
    createHelpHomeEmbed,
    createHelpCategoryEmbed,
    createHelpSelectMenu
};
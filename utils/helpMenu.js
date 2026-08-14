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
            'lasnoches',
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

function getCategoryCommands(
    client,
    category
) {
    return category.commands
        .map(name =>
            client.commands?.get(name)
        )
        .filter(command =>
            Boolean(
                command?.data?.name
            )
        );
}

function getLoadedCommandCount(client) {
    return Array.from(
        client.commands?.values() ?? []
    ).filter(command =>
        Boolean(
            command?.data?.name
        )
    ).length;
}

function formatCommand(command) {
    return [
        `\`/${command.data.name}\``,
        `-# ${
            command.data.description ||
            'No description available.'
        }`
    ].join('\n');
}

function getBotAvatar(interaction) {
    return interaction.client.user
        .displayAvatarURL({
            size: 256,
            forceStatic: false
        });
}function createHelpHomeEmbed(interaction) {
    const botAvatar =
        getBotAvatar(interaction);

    const guildIcon =
        interaction.guild.iconURL({
            size: 1024,
            forceStatic: false
        }) ?? botAvatar;

    const categories =
        HELP_CATEGORIES.map(
            category =>
                `${category.emoji} **${category.label}** — ${category.description}`
        ).join('\n');

    return createEmbed({
        title:
            'Ⅹ・COMMAND MENU',

        description:
            [
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
            guildIcon,

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
}

function createHelpCategoryEmbed(
    interaction,
    categoryId
) {
    const category =
        HELP_CATEGORIES.find(
            item =>
                item.id === categoryId
        );

    if (!category) {
        return null;
    }

    const commands =
        getCategoryCommands(
            interaction.client,
            category
        );

    const commandText =
        commands.length
            ? commands
                .map(formatCommand)
                .join('\n\n')
            : '*No commands from this category are currently loaded.*';

    const botAvatar =
        getBotAvatar(interaction);

    return createEmbed({
        title:
            `${category.emoji}・${category.label.toUpperCase()}`,

        description:
            [
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

function createHelpSelectMenu(
    selectedCategoryId = null
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                'umbra_help_category'
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
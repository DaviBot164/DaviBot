const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ComponentType
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const embedConfig =
    require('../../config/embed');

/**
 * Control Center Select Menu ID.
 */
const GUIDE_MENU_ID =
    'umbra_guide_category_menu';

/**
 * Guide page identifiers.
 */
const GUIDE_PAGES = {
    overview:
        'guide_overview',

    moderation:
        'guide_moderation',

    ranks:
        'guide_ranks',

    titles:
        'guide_titles',

    souls:
        'guide_souls',

    kingdom:
        'guide_kingdom',

    support:
        'guide_support',

    events:
        'guide_events',

    setup:
        'guide_setup',

    information:
        'guide_information'
};

/**
 * Category menu order.
 */
const GUIDE_PAGE_ORDER = [
    GUIDE_PAGES.overview,
    GUIDE_PAGES.moderation,
    GUIDE_PAGES.ranks,
    GUIDE_PAGES.titles,
    GUIDE_PAGES.souls,
    GUIDE_PAGES.kingdom,
    GUIDE_PAGES.support,
    GUIDE_PAGES.events,
    GUIDE_PAGES.setup,
    GUIDE_PAGES.information
];

/**
 * Category display configuration.
 */
const GUIDE_PAGE_DETAILS = {
    [GUIDE_PAGES.overview]: {
        emoji:
            '🌙',

        label:
            'Overview',

        description:
            'Open the central Umbra Control Center'
    },

    [GUIDE_PAGES.moderation]: {
        emoji:
            '🛡️',

        label:
            'Moderation',

        description:
            'Warnings, punishments and channel control'
    },

    [GUIDE_PAGES.ranks]: {
        emoji:
            '⚔️',

        label:
            'Arrancar Ranks',

        description:
            'Promotions, Rank history and Espada records'
    },

    [GUIDE_PAGES.titles]: {
        emoji:
            '🏷️',

        label:
            'Chronicle Titles',

        description:
            'View, activate, grant and revoke Titles'
    },

    [GUIDE_PAGES.souls]: {
        emoji:
            '👤',

        label:
            'Soul Archives',

        description:
            'Progression, identity and Soul Records'
    },

    [GUIDE_PAGES.kingdom]: {
        emoji:
            '🏰',

        label:
            'Las Noches',

        description:
            'Kingdom statistics and central records'
    },

    [GUIDE_PAGES.support]: {
        emoji:
            '🎫',

        label:
            'Support',

        description:
            'Ticket creation and support management'
    },

    [GUIDE_PAGES.events]: {
        emoji:
            '🎉',

        label:
            'Events',

        description:
            'Events, giveaways and community activity'
    },

    [GUIDE_PAGES.setup]: {
        emoji:
            '⚙️',

        label:
            'Administration',

        description:
            'Setup, announcements and server tools'
    },

    [GUIDE_PAGES.information]: {
        emoji:
            '📚',

        label:
            'Information',

        description:
            'General utilities and Discord information'
    }
};

/**
 * Command access labels.
 */
const ACCESS_LEVELS = {
    everyone:
        '👥 Everyone',

    self:
        '👤 Personal Use',

    moderator:
        '⚔️ Lieutenant or Higher',

    administrator:
        '🛡️ Captain or Higher',

    highCommand:
        '👑 High Command',

    owner:
        '👑 Ruler Only'
};

/**
 * Complete command documentation used
 * by the Umbra Control Center.
 *
 * Commands that are not currently loaded
 * by the bot are automatically hidden.
 */
const GUIDE_COMMANDS = {
    /*
     * ======================================================
     * Moderation
     * ======================================================
     */
    ban: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/ban user [reason] [delete_messages]',

        summary:
            'Ban a Soul from Las Noches.',

        access:
            ACCESS_LEVELS.administrator
    },

    kick: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/kick user [reason]',

        summary:
            'Remove a Soul without permanently banning them.',

        access:
            ACCESS_LEVELS.moderator
    },

    timeout: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/timeout user duration [reason]',

        summary:
            'Temporarily restrict a Soul from interacting.',

        access:
            ACCESS_LEVELS.moderator
    },

    untimeout: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/untimeout user [reason]',

        summary:
            'Remove an active timeout from a Soul.',

        access:
            ACCESS_LEVELS.moderator
    },

    warn: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/warn user reason',

        summary:
            'Record an official warning in PostgreSQL.',

        access:
            ACCESS_LEVELS.moderator
    },

    warnings: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/warnings user',

        summary:
            'View all warnings recorded against a Soul.',

        access:
            ACCESS_LEVELS.moderator
    },

    unwarn: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/unwarn warning_id [reason]',

        summary:
            'Remove one specific warning record.',

        access:
            ACCESS_LEVELS.moderator
    },

    clearwarnings: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/clearwarnings user [reason]',

        summary:
            'Remove every warning belonging to one Soul.',

        access:
            ACCESS_LEVELS.administrator
    },

    cases: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/cases [user] [limit]',

        summary:
            'View Guardian and AutoMod case records.',

        access:
            ACCESS_LEVELS.moderator
    },

    history: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/history user [limit]',

        summary:
            'Open a Soul’s complete moderation history.',

        access:
            ACCESS_LEVELS.moderator
    },

    clear: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/clear amount [user]',

        summary:
            'Delete multiple messages from a channel.',

        access:
            ACCESS_LEVELS.moderator
    },

    lock: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/lock [channel] [reason]',

        summary:
            'Prevent regular members from sending messages.',

        access:
            ACCESS_LEVELS.moderator
    },

    unlock: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/unlock [channel] [reason]',

        summary:
            'Restore message access in a locked channel.',

        access:
            ACCESS_LEVELS.moderator
    },

    slowmode: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/slowmode seconds [channel] [reason]',

        summary:
            'Set or remove a channel’s slowmode delay.',

        access:
            ACCESS_LEVELS.moderator
    },

    /*
     * ======================================================
     * Arrancar Rank System
     * ======================================================
     */
    setrank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/setrank user rank reason',

        summary:
            'Assign or replace a manually managed Arrancar Rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    removerank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/removerank user reason',

        summary:
            'Remove a Soul’s current manual Arrancar Rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    rankhistory: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/rankhistory [user] [limit]',

        summary:
            'View promotion, replacement and removal history.',

        access:
            ACCESS_LEVELS.everyone
    },

    espada: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/espada',

        summary:
            'Open the current Espada throne hierarchy.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * Chronicle Title System
     * ======================================================
     */
    titles: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/titles [user]',

        summary:
            'View unlocked, active and locked Chronicle Titles.',

        access:
            ACCESS_LEVELS.everyone
    },

    settitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/settitle category',

        summary:
            'Select one of your unlocked Titles as active.',

        access:
            ACCESS_LEVELS.self
    },

    removetitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/removetitle',

        summary:
            'Restore the default Nameless Soul Title.',

        access:
            ACCESS_LEVELS.self
    },

    granttitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/granttitle user title reason [activate]',

        summary:
            'Grant a Manual or Event Title to a Soul.',

        access:
            ACCESS_LEVELS.highCommand
    },

    revoketitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/revoketitle user title reason',

        summary:
            'Revoke a manually granted Chronicle Title.',

        access:
            ACCESS_LEVELS.highCommand
    },

    /*
     * ======================================================
     * Soul Archives
     * ======================================================
     */
    soul: {
        page:
            GUIDE_PAGES.souls,

        syntax:
            '/soul [user]',

        summary:
            'Open a complete Soul Record with progression, Rank, Title and Achievements.',

        access:
            ACCESS_LEVELS.everyone
    },

    profile: {
        page:
            GUIDE_PAGES.souls,

        syntax:
            '/profile [user]',

        summary:
            'View a compact Discord member profile.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * Las Noches Kingdom
     * ======================================================
     */
    lasnoches: {
        page:
            GUIDE_PAGES.kingdom,

        syntax:
            '/lasnoches',

        summary:
            'Open the interactive central kingdom records.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * Support
     * ======================================================
     */
    ticketpanel: {
        page:
            GUIDE_PAGES.support,

        syntax:
            '/ticketpanel',

        summary:
            'Publish the interactive support ticket panel.',

        access:
            ACCESS_LEVELS.administrator
    },

    ticket: {
        page:
            GUIDE_PAGES.support,

        syntax:
            '/ticket',

        summary:
            'Create or manage a personal support ticket.',

        access:
            ACCESS_LEVELS.everyone
    },

    tickets: {
        page:
            GUIDE_PAGES.support,

        syntax:
            '/tickets',

        summary:
            'View support ticket information and management options.',

        access:
            ACCESS_LEVELS.moderator
    },

    /*
     * ======================================================
     * Events and Community
     * ======================================================
     */
    event: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/event',

        summary:
            'Create and manage an official Las Noches event.',

        access:
            ACCESS_LEVELS.administrator
    },

    giveaway: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/giveaway',

        summary:
            'Create and manage a community giveaway.',

        access:
            ACCESS_LEVELS.administrator
    },

    /*
     * ======================================================
     * Setup and Administration
     * ======================================================
     */
    setup: {
        page:
            GUIDE_PAGES.setup,

        syntax:
            '/setup',

        summary:
            'Open Umbra’s interactive server setup wizard.',

        access:
            ACCESS_LEVELS.administrator
    },

    setuprules: {
        page:
            GUIDE_PAGES.setup,

        syntax:
            '/setuprules',

        summary:
            'Publish or refresh the official server rules.',

        access:
            ACCESS_LEVELS.administrator
    },

    testwelcome: {
        page:
            GUIDE_PAGES.setup,

        syntax:
            '/testwelcome',

        summary:
            'Preview Umbra’s current welcome design.',

        access:
            ACCESS_LEVELS.administrator
    },

    announce: {
        page:
            GUIDE_PAGES.setup,

        syntax:
            '/announce',

        summary:
            'Publish an official server announcement.',

        access:
            ACCESS_LEVELS.administrator
    },

    /*
     * ======================================================
     * General Information
     * ======================================================
     */
    help: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/help',

        summary:
            'Open Umbra’s compact Quick Command Codex.',

        access:
            ACCESS_LEVELS.everyone
    },

    guide: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/guide',

        summary:
            'Open this interactive Umbra Control Center.',

        access:
            ACCESS_LEVELS.everyone
    },

    ping: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/ping',

        summary:
            'Check Umbra’s current latency and connection status.',

        access:
            ACCESS_LEVELS.everyone
    },

    avatar: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/avatar [user]',

        summary:
            'View a user’s Discord avatar.',

        access:
            ACCESS_LEVELS.everyone
    },

    userinfo: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/userinfo [user]',

        summary:
            'View detailed Discord member information.',

        access:
            ACCESS_LEVELS.everyone
    },

    serverinfo: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/serverinfo',

        summary:
            'View detailed information about Las Noches.',

        access:
            ACCESS_LEVELS.everyone
    }
};

/**
 * Quick workflows shown on selected pages.
 */
const PAGE_WORKFLOWS = {
    [GUIDE_PAGES.ranks]: [
        '`/setrank` — assign a Rank',
        '`/rankhistory` — verify the archive',
        '`/espada` — view the hierarchy'
    ],

    [GUIDE_PAGES.titles]: [
        '`/titles` — inspect unlocked Titles',
        '`/settitle` — activate one Title',
        '`/soul` — confirm the active designation'
    ],

    [GUIDE_PAGES.souls]: [
        '`/soul` — open the complete record',
        '`/titles` — inspect Chronicle Titles',
        '`/rankhistory` — review hierarchy history'
    ],

    [GUIDE_PAGES.support]: [
        '`/ticketpanel` — publish the panel',
        '`/ticket` — open a support request',
        '`/tickets` — manage active tickets'
    ]
};

/**
 * Create the interactive category menu.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createGuideMenu(
    selectedPage,
    disabled = false
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                GUIDE_MENU_ID
            )
            .setPlaceholder(
                'Select an Umbra command category'
            )
            .setMinValues(
                1
            )
            .setMaxValues(
                1
            )
            .setDisabled(
                disabled
            );

    for (
        const pageId
        of GUIDE_PAGE_ORDER
    ) {
        const details =
            GUIDE_PAGE_DETAILS[
                pageId
            ];

        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    details.label
                )
                .setDescription(
                    details.description
                )
                .setEmoji(
                    details.emoji
                )
                .setValue(
                    pageId
                )
                .setDefault(
                    selectedPage ===
                    pageId
                )
        );
    }

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}/**
 * Check whether one command is currently
 * loaded by Umbra.
 *
 * @param {import('discord.js').Client} client
 * @param {string} commandName
 * @returns {boolean}
 */
function isCommandAvailable(
    client,
    commandName
) {
    return Boolean(
        client.commands?.has(
            commandName
        )
    );
}

/**
 * Get every available documented command
 * belonging to one Control Center page.
 *
 * Commands not currently loaded by Umbra
 * are automatically excluded.
 *
 * @param {import('discord.js').Client} client
 * @param {string} pageId
 * @returns {Array<{
 *     name: string,
 *     syntax: string,
 *     summary: string,
 *     access: string
 * }>}
 */
function getAvailablePageCommands(
    client,
    pageId
) {
    return Object.entries(
        GUIDE_COMMANDS
    )
        .filter(
            (
                [
                    commandName,
                    command
                ]
            ) =>
                command.page ===
                    pageId &&
                isCommandAvailable(
                    client,
                    commandName
                )
        )
        .map(
            (
                [
                    commandName,
                    command
                ]
            ) => ({
                name:
                    commandName,

                syntax:
                    command.syntax,

                summary:
                    command.summary,

                access:
                    command.access
            })
        )
        .sort(
            (
                firstCommand,
                secondCommand
            ) =>
                firstCommand.name
                    .localeCompare(
                        secondCommand.name
                    )
        );
}

/**
 * Count every documented command that
 * is currently loaded by Umbra.
 *
 * @param {import('discord.js').Client} client
 * @returns {number}
 */
function countAvailableGuideCommands(
    client
) {
    return Object.keys(
        GUIDE_COMMANDS
    ).filter(
        commandName =>
            isCommandAvailable(
                client,
                commandName
            )
    ).length;
}

/**
 * Count available commands belonging
 * to one page.
 *
 * @param {import('discord.js').Client} client
 * @param {string} pageId
 * @returns {number}
 */
function countPageCommands(
    client,
    pageId
) {
    return getAvailablePageCommands(
        client,
        pageId
    ).length;
}

/**
 * Format one documented command.
 *
 * @param {Object} command
 * @returns {string}
 */
function formatGuideCommand(
    command
) {
    return [
        `### \`${command.syntax}\``,
        command.summary,
        `-# Access: ${command.access}`
    ].join('\n');
}

/**
 * Split command entries into safe
 * Discord Embed field values.
 *
 * Discord limits each field value
 * to 1,024 characters.
 *
 * @param {string[]} entries
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitCommandEntries(
    entries,
    maxLength = 1_000
) {
    const chunks = [];

    let currentChunk =
        '';

    for (
        const entry
        of entries
    ) {
        const separator =
            currentChunk
                ? '\n\n'
                : '';

        const nextChunk =
            `${currentChunk}${separator}${entry}`;

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
                entry;
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
 * Create the shared Umbra Control Center
 * Embed foundation.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title
 * @param {string} description
 * @param {string} color
 * @returns {import('discord.js').EmbedBuilder}
 */
function createGuideEmbed(
    interaction,
    title,
    description,
    color =
        embedConfig.colors.primary
) {
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
        interaction.guild?.iconURL({
            extension:
                'png',

            size:
                1024,

            forceStatic:
                false
        });

    const embed =
        createEmbed({
            title,

            description:
                [
                    description,
                    '',
                    embedConfig
                        .branding
                        .divider,
                    '',
                    '*Select another archive from the menu below to continue navigating Umbra.*'
                ].join('\n'),

            color,

            thumbnail:
                guildIcon ||
                botAvatar,

            author: {
                name:
                    `${interaction.guild?.name || embedConfig.branding.serverName} • Umbra Control Center`,

                iconURL:
                    guildIcon ||
                    botAvatar
            },

            footer: {
                text:
                    `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

                iconURL:
                    botAvatar
            }
        });

    return embed;
}

/**
 * Add a quick workflow field when one
 * is configured for the selected page.
 *
 * @param {import('discord.js').EmbedBuilder} embed
 * @param {string} pageId
 * @returns {void}
 */
function addWorkflowField(
    embed,
    pageId
) {
    const workflow =
        PAGE_WORKFLOWS[
            pageId
        ];

    if (
        !Array.isArray(
            workflow
        ) ||
        workflow.length === 0
    ) {
        return;
    }

    embed.addFields({
        name:
            '🧭 Recommended Workflow',

        value:
            [
                ...workflow,
                '',
                '-# This order is recommended, but commands may also be used independently.'
            ].join('\n'),

        inline:
            false
    });
}

/**
 * Build the central Control Center overview.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    interaction
) {
    const availableCommandCount =
        countAvailableGuideCommands(
            interaction.client
        );

    const totalLoadedCommands =
        interaction.client.commands
            ?.size ||
        0;

    const documentedPercentage =
        totalLoadedCommands > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        availableCommandCount /
                        totalLoadedCommands
                    ) *
                    100
                )
            )
            : 0;

    const embed =
        createGuideEmbed(
            interaction,
            '🌙 Umbra Control Center',
            [
                `Welcome, ${interaction.user}.`,
                '',
                'This panel organizes Umbra’s commands, systems and administrative tools into clearly documented archives.',
                '',
                'Use `/help` for a fast command list or continue through this menu for full syntax, access levels and recommended workflows.'
            ].join('\n'),

            embedConfig
                .colors
                .accent
        );

    embed.addFields(
        {
            name:
                '📚 Command Archive',

            value:
                [
                    `**Loaded Slash Commands:** \`${totalLoadedCommands}\``,
                    `**Documented Commands:** \`${availableCommandCount}\``,
                    `**Documentation Coverage:** \`${documentedPercentage}%\``,
                    `**Control Categories:** \`${GUIDE_PAGE_ORDER.length - 1}\``,
                    '',
                    '-# Commands not currently loaded by Umbra are hidden automatically.'
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🛡️ Moderation',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.moderation)}\` available`,
                    '-# Warnings, punishments, cases and channel control.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Arrancar Ranks',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.ranks)}\` available`,
                    '-# Promotions, Rank history and Espada hierarchy.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏷️ Chronicle Titles',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.titles)}\` available`,
                    '-# Title archives, activation and High Command management.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '👤 Soul Archives',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.souls)}\` available`,
                    '-# Progression, identity and complete Soul Records.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏰 Las Noches',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.kingdom)}\` available`,
                    '-# Kingdom statistics and central records.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎫 Support',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.support)}\` available`,
                    '-# Ticket creation and support management.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🎉 Events',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.events)}\` available`,
                    '-# Events, giveaways and community activity.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚙️ Administration',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.setup)}\` available`,
                    '-# Setup Wizard, rules, announcements and previews.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '📚 Information',

            value:
                [
                    `\`${countPageCommands(interaction.client, GUIDE_PAGES.information)}\` available`,
                    '-# General utility and Discord information.'
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🧭 Quick Navigation',

            value:
                [
                    '`/help` — fast command overview',
                    '`/guide` — detailed command documentation',
                    '`/soul` — personal progression record',
                    '`/lasnoches` — kingdom overview'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build one documented command category.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} pageId
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildCategoryPage(
    interaction,
    pageId
) {
    const pageDetails =
        GUIDE_PAGE_DETAILS[
            pageId
        ];

    if (!pageDetails) {
        return buildOverviewPage(
            interaction
        );
    }

    const commands =
        getAvailablePageCommands(
            interaction.client,
            pageId
        );

    const embed =
        createGuideEmbed(
            interaction,
            `${pageDetails.emoji} ${pageDetails.label} Command Guide`,
            [
                pageDetails.description,
                '',
                'Every command below is currently loaded by Umbra and available within this category.'
            ].join('\n'),

            pageId ===
                GUIDE_PAGES.moderation
                ? embedConfig
                    .colors
                    .moderation
                : pageId ===
                    GUIDE_PAGES.ranks
                    ? embedConfig
                        .colors
                        .rank
                    : pageId ===
                        GUIDE_PAGES.titles
                        ? embedConfig
                            .colors
                            .title
                        : pageId ===
                            GUIDE_PAGES.events
                            ? embedConfig
                                .colors
                                .event
                            : pageId ===
                                GUIDE_PAGES.support
                                ? embedConfig
                                    .colors
                                    .support
                                : embedConfig
                                    .colors
                                    .primary
        );

    embed.addFields({
        name:
            '📊 Category Status',

        value:
            [
                `**Available Commands:** \`${commands.length}\``,
                '',
                '-# Required access and complete syntax are displayed below.'
            ].join('\n'),

        inline:
            false
    });

    addWorkflowField(
        embed,
        pageId
    );

    if (
        commands.length ===
        0
    ) {
        embed.addFields({
            name:
                '🌑 No Commands Available',

            value:
                [
                    'No currently loaded Umbra commands belong to this archive.',
                    '',
                    '-# This page updates automatically whenever matching commands are added.'
                ].join('\n'),

            inline:
                false
        });

        return embed;
    }

    const commandEntries =
        commands.map(
            formatGuideCommand
        );

    const commandChunks =
        splitCommandEntries(
            commandEntries
        );

    commandChunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? `${pageDetails.emoji} Available Commands`
                        : `${pageDetails.emoji} Available Commands — Continued`,

                value:
                    chunk,

                inline:
                    false
            });
        }
    );

    return embed;
}

/**
 * Build the requested Control Center page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} pageId
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildGuidePage(
    interaction,
    pageId
) {
    if (
        pageId ===
        GUIDE_PAGES.overview
    ) {
        return buildOverviewPage(
            interaction
        );
    }

    if (
        GUIDE_PAGE_ORDER.includes(
            pageId
        )
    ) {
        return buildCategoryPage(
            interaction,
            pageId
        );
    }

    return buildOverviewPage(
        interaction
    );
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'guide'
            )
            .setDescription(
                'Open Umbra’s interactive command and system Control Center.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /guide command.
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
                            'The Umbra Control Center can only be opened inside Las Noches.'
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

            let selectedPage =
                GUIDE_PAGES.overview;

            const initialEmbed =
                buildGuidePage(
                    interaction,
                    selectedPage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createGuideMenu(
                            selectedPage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                replyMessage
                    .createMessageComponentCollector({
                        componentType:
                            ComponentType.StringSelect,

                        time:
                            10 * 60 * 1000
                    });

            collector.on(
                'collect',
                async menuInteraction => {
                    try {
                        if (
                            menuInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Control Center',
                                        'Only the Soul who opened this Umbra Control Center may use its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            menuInteraction.customId !==
                            GUIDE_MENU_ID
                        ) {
                            return;
                        }

                        const requestedPage =
                            menuInteraction.values[0];

                        if (
                            !GUIDE_PAGE_ORDER.includes(
                                requestedPage
                            )
                        ) {
                            await menuInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Unknown Guide Page',
                                        'Umbra could not recognize the selected command archive.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        const updatedEmbed =
                            buildGuidePage(
                                interaction,
                                selectedPage
                            );

                        await menuInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createGuideMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (menuError) {
                        console.error(
                            '❌ Umbra /guide navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Control Center Navigation Failed',
                                [
                                    'Umbra could not open the selected command archive.',
                                    '',
                                    'Please try opening `/guide` again.'
                                ].join('\n')
                            );

                        if (
                            menuInteraction.deferred ||
                            menuInteraction.replied
                        ) {
                            await menuInteraction
                                .followUp({
                                    embeds: [
                                        navigationErrorEmbed
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        await menuInteraction
                            .reply({
                                embeds: [
                                    navigationErrorEmbed
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            })
                            .catch(
                                () => null
                            );
                    }
                }
            );

            collector.on(
                'end',
                async (
                    collected,
                    reason
                ) => {
                    if (
                        reason ===
                        'messageDelete' ||
                        reason ===
                        'channelDelete' ||
                        reason ===
                        'guildDelete'
                    ) {
                        return;
                    }

                    await interaction
                        .editReply({
                            components: [
                                createGuideMenu(
                                    selectedPage,
                                    true
                                )
                            ]
                        })
                        .catch(
                            () => null
                        );
                }
            );
        } catch (error) {
            console.error(
                '❌ Umbra /guide command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Umbra Control Center Unavailable',
                    [
                        'Umbra could not open the interactive command guide.',
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
                        ],

                        components:
                            []
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
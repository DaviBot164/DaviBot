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

/**
 * Internal Guide menu ID.
 *
 * Keep stable because interaction
 * routing may depend on it.
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

    progression:
        'guide_progression',

    server:
        'guide_server',

    support:
        'guide_support',

    events:
        'guide_events',

    administration:
        'guide_administration',

    information:
        'guide_information'
};

/**
 * Guide category order.
 */
const GUIDE_PAGE_ORDER = [
    GUIDE_PAGES.overview,
    GUIDE_PAGES.moderation,
    GUIDE_PAGES.ranks,
    GUIDE_PAGES.titles,
    GUIDE_PAGES.progression,
    GUIDE_PAGES.server,
    GUIDE_PAGES.support,
    GUIDE_PAGES.events,
    GUIDE_PAGES.administration,
    GUIDE_PAGES.information
];

/**
 * Guide category display.
 */
const GUIDE_PAGE_DETAILS = {
    [GUIDE_PAGES.overview]: {
        emoji:
            'Ⅹ',

        label:
            'Overview',

        description:
            'Main command and system overview'
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
            'Sin Ranks',

        description:
            'Sin ranking and competitive records'
    },

    [GUIDE_PAGES.titles]: {
        emoji:
            '♜',

        label:
            'Titles',

        description:
            'Title collection and management'
    },

    [GUIDE_PAGES.progression]: {
        emoji:
            '◆',

        label:
            'Progression',

        description:
            'Member progression and profiles'
    },

    [GUIDE_PAGES.server]: {
        emoji:
            'Ⅹ',

        label:
            'THE Ⅹ SINS',

        description:
            'Server information and central records'
    },

    [GUIDE_PAGES.support]: {
        emoji:
            '🎫',

        label:
            'Support',

        description:
            'Tickets and member assistance'
    },

    [GUIDE_PAGES.events]: {
        emoji:
            '🎉',

        label:
            'Events',

        description:
            'Events, giveaways and community activity'
    },

    [GUIDE_PAGES.administration]: {
        emoji:
            '♛',

        label:
            'Administration',

        description:
            'Setup and server management'
    },

    [GUIDE_PAGES.information]: {
        emoji:
            '📖',

        label:
            'Information',

        description:
            'General commands and utilities'
    }
};

/**
 * Command access levels.
 */
const ACCESS_LEVELS = {
    everyone:
        'Everyone',

    self:
        'Personal Use',

    moderator:
        '⚔️ Lieutenant or Higher',

    administrator:
        '🛡️ Captain or Higher',

    highCommand:
        '♛ High Command',

    owner:
        '♛ Sovereign Only'
};/**
 * Command documentation used
 * by Evelynn's Guide.
 *
 * Commands that are not currently loaded
 * are automatically hidden.
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
            'Ban a member from the server.',

        access:
            ACCESS_LEVELS.administrator
    },

    kick: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/kick user [reason]',

        summary:
            'Remove a member without permanently banning them.',

        access:
            ACCESS_LEVELS.moderator
    },

    timeout: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/timeout user duration [reason]',

        summary:
            'Temporarily restrict a member from interacting.',

        access:
            ACCESS_LEVELS.moderator
    },

    untimeout: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/untimeout user [reason]',

        summary:
            'Remove an active timeout from a member.',

        access:
            ACCESS_LEVELS.moderator
    },

    warn: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/warn user reason',

        summary:
            'Record an official warning.',

        access:
            ACCESS_LEVELS.moderator
    },

    warnings: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/warnings user',

        summary:
            'View warnings recorded against a member.',

        access:
            ACCESS_LEVELS.moderator
    },

    unwarn: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/unwarn warning_id [reason]',

        summary:
            'Remove one warning record.',

        access:
            ACCESS_LEVELS.moderator
    },

    clearwarnings: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/clearwarnings user [reason]',

        summary:
            'Remove all warnings from a member.',

        access:
            ACCESS_LEVELS.administrator
    },

    cases: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/cases [user] [limit]',

        summary:
            'View moderation and AutoMod cases.',

        access:
            ACCESS_LEVELS.moderator
    },

    history: {
        page:
            GUIDE_PAGES.moderation,

        syntax:
            '/history user [limit]',

        summary:
            'View a member’s moderation history.',

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
            'Set or remove a channel slowmode delay.',

        access:
            ACCESS_LEVELS.moderator
    },

    /*
     * ======================================================
     * Sin Rank System
     * ======================================================
     */
    setrank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/setrank user rank reason',

        summary:
            'Assign or replace a managed Sin Rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    removerank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/removerank user reason',

        summary:
            'Remove a member’s current managed Sin Rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    rankhistory: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/rankhistory [user] [limit]',

        summary:
            'View rank assignment and removal history.',

        access:
            ACCESS_LEVELS.everyone
    },

    espada: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/espada',

        summary:
            'View the current Ten Sins hierarchy.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * Title System
     * ======================================================
     */
    titles: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/titles [user]',

        summary:
            'View unlocked, active and locked Titles.',

        access:
            ACCESS_LEVELS.everyone
    },

    settitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/settitle category',

        summary:
            'Activate one of your unlocked Titles.',

        access:
            ACCESS_LEVELS.self
    },

    removetitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/removetitle',

        summary:
            'Remove your active Title.',

        access:
            ACCESS_LEVELS.self
    },

    granttitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/granttitle user title reason [activate]',

        summary:
            'Grant a Manual or Event Title to a member.',

        access:
            ACCESS_LEVELS.highCommand
    },

    revoketitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/revoketitle user title reason',

        summary:
            'Revoke a manually granted Title.',

        access:
            ACCESS_LEVELS.highCommand
    },

    /*
     * ======================================================
     * Progression
     * ======================================================
     */
    soul: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/soul [user]',

        summary:
            'Open the complete progression record for a member.',

        access:
            ACCESS_LEVELS.everyone
    },

    profile: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/profile [user]',

        summary:
            'View a compact member profile.',

        access:
            ACCESS_LEVELS.everyone
    },

    level: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/level [user]',

        summary:
            'View current level and progression.',

        access:
            ACCESS_LEVELS.everyone
    },

    rank: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/rank [user]',

        summary:
            'View current rank information.',

        access:
            ACCESS_LEVELS.everyone
    },

    leaderboard: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/leaderboard',

        summary:
            'View progression leaderboards.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * THE Ⅹ SINS
     * ======================================================
     */
    lasnoches: {
        page:
            GUIDE_PAGES.server,

        syntax:
            '/lasnoches',

        summary:
            'Open the interactive THE Ⅹ SINS server overview.',

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
            'Publish the interactive support panel.',

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
            'View support ticket management options.',

        access:
            ACCESS_LEVELS.moderator
    },

    /*
     * ======================================================
     * Events & Community
     * ======================================================
     */
    event: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/event',

        summary:
            'Create or manage an official server event.',

        access:
            ACCESS_LEVELS.administrator
    },

    giveaway: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/giveaway',

        summary:
            'Create or manage a community giveaway.',

        access:
            ACCESS_LEVELS.administrator
    },

    /*
     * ======================================================
     * Administration
     * ======================================================
     */
    setup: {
        page:
            GUIDE_PAGES.administration,

        syntax:
            '/setup',

        summary:
            'Open Evelynn’s interactive server setup.',

        access:
            ACCESS_LEVELS.administrator
    },

    setuprules: {
        page:
            GUIDE_PAGES.administration,

        syntax:
            '/setuprules',

        summary:
            'Publish or refresh the Code of Sins.',

        access:
            ACCESS_LEVELS.administrator
    },

    testwelcome: {
        page:
            GUIDE_PAGES.administration,

        syntax:
            '/testwelcome',

        summary:
            'Preview the current Welcome design.',

        access:
            ACCESS_LEVELS.administrator
    },

    announce: {
        page:
            GUIDE_PAGES.administration,

        syntax:
            '/announce',

        summary:
            'Publish an official server announcement.',

        access:
            ACCESS_LEVELS.administrator
    },

    /*
     * ======================================================
     * Information
     * ======================================================
     */
    help: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/help',

        summary:
            'Open Evelynn’s quick command menu.',

        access:
            ACCESS_LEVELS.everyone
    },

    guide: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/guide',

        summary:
            'Open this detailed interactive command guide.',

        access:
            ACCESS_LEVELS.everyone
    },

    ping: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/ping',

        summary:
            'Check Evelynn’s latency and connection status.',

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
            'View detailed information about THE Ⅹ SINS.',

        access:
            ACCESS_LEVELS.everyone
    }
};/**
 * Quick workflows shown
 * on selected Guide pages.
 */
const PAGE_WORKFLOWS = {
    [GUIDE_PAGES.ranks]: [
        '`/setrank` — assign a Sin Rank',
        '`/rankhistory` — review rank history',
        '`/espada` — view the Ten Sins hierarchy'
    ],

    [GUIDE_PAGES.titles]: [
        '`/titles` — view unlocked Titles',
        '`/settitle` — activate a Title',
        '`/soul` — confirm your active progression record'
    ],

    [GUIDE_PAGES.progression]: [
        '`/soul` — open the full progression record',
        '`/level` — check current level',
        '`/rankhistory` — review rank history'
    ],

    [GUIDE_PAGES.support]: [
        '`/ticketpanel` — publish the support panel',
        '`/ticket` — open a support request',
        '`/tickets` — manage active tickets'
    ]
};

/**
 * Create the interactive
 * Guide category menu.
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
                'Choose a guide category...'
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
}

/**
 * Check whether one command
 * is currently loaded.
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
 * Get every available command
 * belonging to one Guide page.
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
 * Count every documented
 * command currently loaded.
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
 * Count available commands
 * belonging to one page.
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
 * @param {string[]} entries
 * @param {number} maxLength
 * @returns {string[]}
 */
function splitCommandEntries(
    entries,
    maxLength = 1_000
) {
    const chunks =
        [];

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
            if (
                currentChunk
            ) {
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

    if (
        currentChunk
    ) {
        chunks.push(
            currentChunk
        );
    }

    return chunks;
}

/**
 * Create the shared
 * Evelynn Guide Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title
 * @param {string} description
 * @returns {import('discord.js').EmbedBuilder}
 */
function createGuideEmbed(
    interaction,
    title,
    description
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

    return createEmbed({
        title,

        description:
            [
                description,
                '',
                '-# Choose another category below to continue.'
            ].join('\n'),

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
}

/**
 * Add a quick workflow
 * when one is configured.
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
        workflow.length ===
            0
    ) {
        return;
    }

    embed.addFields({
        name:
            '◆・QUICK FLOW',

        value:
            workflow.join(
                '\n'
            ),

        inline:
            false
    });
}/**
 * Build the main Guide overview.
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

    const embed =
        createGuideEmbed(
            interaction,
            'Ⅹ・COMMAND GUIDE',
            [
                `Welcome, ${interaction.user}.`,
                '',
                'Browse Evelynn’s command categories, syntax and access requirements.',
                '',
                `**Loaded Commands:** \`${totalLoadedCommands}\``,
                `**Documented Commands:** \`${availableCommandCount}\``
            ].join('\n')
        );

    embed.addFields(
        {
            name:
                '🛡️・MODERATION',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.moderation
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '⚔️・SIN RANKS',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.ranks
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '♜・TITLES',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.titles
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '◆・PROGRESSION',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.progression
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                'Ⅹ・THE Ⅹ SINS',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.server
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '🎫・SUPPORT',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.support
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '🎉・EVENTS',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.events
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '♛・ADMINISTRATION',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.administration
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                '📖・INFORMATION',

            value:
                `\`${countPageCommands(
                    interaction.client,
                    GUIDE_PAGES.information
                )}\` commands`,

            inline:
                true
        },

        {
            name:
                'Ⅹ・QUICK ACCESS',

            value:
                [
                    '`/help` — quick command menu',
                    '`/guide` — detailed documentation',
                    '`/soul` — progression record',
                    '`/lasnoches` — server overview'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build one Guide category.
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
            `${pageDetails.emoji}・${pageDetails.label.toUpperCase()}`,
            pageDetails.description
        );

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
                '◇・NO COMMANDS',

            value:
                'No commands from this category are currently loaded.',

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
                        ? `${pageDetails.emoji}・COMMANDS`
                        : `${pageDetails.emoji}・COMMANDS — CONTINUED`,

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
 * Build the requested Guide page.
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
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'guide'
            )
            .setDescription(
                'Open Evelynn’s interactive command guide.'
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
                            '❌ Server Only Command',
                            'The command guide can only be opened inside THE Ⅹ SINS.'
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
                                        '❌ Private Guide',
                                        'Only the member who opened this guide may use its menu.'
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
                                        '❌ Unknown Category',
                                        'Evelynn could not recognize the selected guide category.'
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
                            '❌ Evelynn /guide navigation error:',
                            menuError
                        );

                        const navigationErrorEmbed =
                            createErrorEmbed(
                                '❌ Guide Navigation Failed',
                                [
                                    'Evelynn could not open the selected category.',
                                    '',
                                    'Please run `/guide` again.'
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
                '❌ Evelynn /guide command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Command Guide Unavailable',
                    [
                        'Evelynn could not open the interactive guide.',
                        '',
                        'Check the Northflank logs and try again.'
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
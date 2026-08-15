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
            'THE Ⅹ SINS',

        description:
            'The official Sin hierarchy, rank statuses and combat standing.'
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
};

/**
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
     * THE Ⅹ SINS Rank System
     * ======================================================
     */    setrank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/setrank user rank reason',

        summary:
            'Assign or replace a member’s Sin rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    removerank: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/removerank user reason',

        summary:
            'Remove a member’s current Sin rank.',

        access:
            ACCESS_LEVELS.highCommand
    },

    rankhistory: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/rankhistory [user] [limit]',

        summary:
            'View previous Sin rank assignments and removals.',

        access:
            ACCESS_LEVELS.everyone
    },

    espada: {
        page:
            GUIDE_PAGES.ranks,

        syntax:
            '/espada',

        summary:
            'View the current THE Ⅹ SINS rank hierarchy.',

        access:
            ACCESS_LEVELS.everyone
    },

    /*
     * ======================================================
     * Titles
     * ======================================================
     */
    titles: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/titles [user]',

        summary:
            'View unlocked and active Chronicle Titles.',

        access:
            ACCESS_LEVELS.everyone
    },

    settitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/settitle category',

        summary:
            'Activate an unlocked Chronicle Title.',

        access:
            ACCESS_LEVELS.self
    },

    removetitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/removetitle',

        summary:
            'Remove your active Chronicle Title.',

        access:
            ACCESS_LEVELS.self
    },

    granttitle: {
        page:
            GUIDE_PAGES.titles,

        syntax:
            '/granttitle user title reason [activate]',

        summary:
            'Grant a Chronicle Title to a member.',

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
     * Progression
     * ======================================================
     */
    soul: {
        page:
            GUIDE_PAGES.progression,

        syntax:
            '/soul [user]',

        summary:
            'Open a member’s Soul progression record.',

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
     * THE Ⅹ SINS Dashboard
     * ======================================================
     */
    dashboard: {
        page:
            GUIDE_PAGES.server,

        syntax:
            '/dashboard',

        summary:
            'Open the central THE Ⅹ SINS server dashboard.',

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
            'Publish the official support panel.',

        access:
            ACCESS_LEVELS.administrator
    },

    ticket: {
        page:
            GUIDE_PAGES.support,

        syntax:
            '/ticket',

        summary:
            'Create a private support request.',

        access:
            ACCESS_LEVELS.everyone
    },

    tickets: {
        page:
            GUIDE_PAGES.support,

        syntax:
            '/tickets',

        summary:
            'Manage active support tickets.',

        access:
            ACCESS_LEVELS.moderator
    },

    /*
     * ======================================================
     * Events
     * ======================================================
     */
    announce: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/announce',

        summary:
            'Publish an official THE Ⅹ SINS announcement.',

        access:
            ACCESS_LEVELS.administrator
    },

    event: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/event',

        summary:
            'Create and manage server events.',

        access:
            ACCESS_LEVELS.administrator
    },

    giveaway: {
        page:
            GUIDE_PAGES.events,

        syntax:
            '/giveaway',

        summary:
            'Create and manage community giveaways.',

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
            'Open the server setup menu.',

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
            'Preview the Welcome design.',

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
            'Open the quick command menu.',

        access:
            ACCESS_LEVELS.everyone
    },

    guide: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/guide',

        summary:
            'Open this detailed command guide.',

        access:
            ACCESS_LEVELS.everyone
    },

    ping: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/ping',

        summary:
            'Check Evelynn latency and system status.',

        access:
            ACCESS_LEVELS.everyone
    },

    avatar: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/avatar [user]',

        summary:
            'View a member avatar.',

        access:
            ACCESS_LEVELS.everyone
    },

    userinfo: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/userinfo [user]',

        summary:
            'View detailed member information.',

        access:
            ACCESS_LEVELS.everyone
    },

    serverinfo: {
        page:
            GUIDE_PAGES.information,

        syntax:
            '/serverinfo',

        summary:
            'View THE Ⅹ SINS server information.',

        access:
            ACCESS_LEVELS.everyone
    }
};

/**
 * Return the bot avatar.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {string}
 */
function getBotAvatar(
    interaction
) {
    return interaction.client.user
        .displayAvatarURL({
            size:
                256,

            forceStatic:
                false
        });
}

/**
 * Return the server icon or bot avatar.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {string}
 */
function getGuildIcon(
    interaction
) {
    return (
        interaction.guild.iconURL({
            size:
                512,

            forceStatic:
                false
        }) ??
        getBotAvatar(
            interaction
        )
    );
}

/**
 * Get commands belonging to a Guide page.
 *
 * Only commands currently loaded by the client
 * are returned.
 *
 * @param {import('discord.js').Client} client
 * @param {string} pageId
 * @returns {Array}
 */
function getPageCommands(
    client,
    pageId
) {
    return Object.entries(
        GUIDE_COMMANDS
    )
        .filter(
            ([, command]) =>
                command.page ===
                pageId
        )
        .filter(
            ([name]) =>
                client.commands?.has(
                    name
                )
        )
        .map(
            ([name, command]) => ({
                name,
                ...command
            })
        );
}

/**
 * Count loaded slash commands.
 *
 * @param {import('discord.js').Client} client
 * @returns {number}
 */
function getLoadedCommandCount(
    client
) {
    return (
        client.commands?.size ??
        0
    );
}/**
 * Official THE Ⅹ SINS hierarchy.
 *
 * These names are displayed as Guide
 * documentation and must remain aligned
 * with the current server rank system.
 */
const SIN_RANKS = [
    {
        name:
            'SIN OF PRIDE',

        emoji:
            '👑',

        description:
            'The highest recognized Sin of the main hierarchy.'
    },

    {
        name:
            'SIN OF WRATH',

        emoji:
            '💧',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF ENVY',

        emoji:
            '🐍',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF GREED',

        emoji:
            '💰',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF LUST',

        emoji:
            '🖤',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF GLUTTONY',

        emoji:
            '🍷',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF SLOTH',

        emoji:
            '💤',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF RUIN',

        emoji:
            '☠️',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF HERESY',

        emoji:
            '⚜️',

        description:
            'A recognized Sin within the main hierarchy.'
    },

    {
        name:
            'SIN OF VENGEANCE',

        emoji:
            '⚔️',

        description:
            'A recognized Sin within the main hierarchy.'
    }
];

/**
 * Additional recognized rank statuses.
 */
const SIN_STATUSES = [
    {
        name:
            'SIN HEIR',

        emoji:
            '👑',

        description:
            'A designated heir associated with Sin authority.'
    },

    {
        name:
            'SINBOUND',

        emoji:
            '⚔️',

        description:
            'A member bound to the Sin hierarchy.'
    },

    {
        name:
            'ASCENDANT',

        emoji:
            '🗡️',

        description:
            'An advancing member recognized as ascending through the hierarchy.'
    },

    {
        name:
            'UNRANKED',

        emoji:
            '◇',

        description:
            'A member without an assigned Sin rank.'
    }
];

/**
 * Special hierarchy position.
 */
const SPECIAL_SIN_POSITION = {
    name:
        'SIN OF DOMINION',

    emoji:
        '👑',

    description:
        'A special position above the standard Sin hierarchy.'
};

/**
 * Build the official Sin hierarchy text.
 *
 * @returns {string}
 */
function buildSinHierarchyText() {
    const mainRanks =
        SIN_RANKS
            .map(
                (rank, index) =>
                    `${index + 1}. ${rank.emoji} **${rank.name}**`
            )
            .join('\n');

    const statuses =
        SIN_STATUSES
            .map(
                status =>
                    `${status.emoji} **${status.name}** — ${status.description}`
            )
            .join('\n');

    return [
        `**${SPECIAL_SIN_POSITION.emoji} ${SPECIAL_SIN_POSITION.name}**`,
        `-# ${SPECIAL_SIN_POSITION.description}`,
        '',
        '**THE Ⅹ SINS**',
        mainRanks,
        '',
        '**OTHER STATUSES**',
        statuses
    ].join('\n');
}

/**
 * Build the recommended Rank workflow.
 *
 * @returns {string}
 */
function buildRankWorkflow() {
    return [
        '`/rank` — check a member’s current rank',
        '`/setrank` — assign or replace a Sin rank',
        '`/removerank` — remove a Sin rank',
        '`/rankhistory` — review previous rank changes'
    ].join('\n');
}

/**
 * Build the Guide embed.
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
        getBotAvatar(
            interaction
        );

    return createEmbed({
        title,

        description,

        color:
            '#5B3A78',

        thumbnail:
            getGuildIcon(
                interaction
            ),

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                'THE Ⅹ SINS • Command Guide',

            iconURL:
                botAvatar
        }
    });
}

/**
 * Format one documented command.
 *
 * @param {Object} command
 * @returns {string}
 */
function formatCommand(
    command
) {
    return [
        `\`${command.syntax}\``,

        command.summary,

        `-# Access: ${command.access}`
    ].join('\n');
}

/**
 * Split command entries so embeds
 * remain safely below Discord field limits.
 *
 * @param {string[]} entries
 * @returns {string[]}
 */
function splitCommandEntries(
    entries
) {
    const chunks = [];

    let current = [];

    for (
        const entry of entries
    ) {
        const next =
            current.length
                ? [
                    ...current,
                    entry
                ].join('\n\n')
                : entry;

        if (
            next.length > 900 &&
            current.length
        ) {
            chunks.push(
                current.join(
                    '\n\n'
                )
            );

            current = [
                entry
            ];

            continue;
        }

        current.push(
            entry
        );
    }

    if (
        current.length
    ) {
        chunks.push(
            current.join(
                '\n\n'
            )
        );
    }

    return chunks;
}/**
 * Build the Guide dropdown.
 *
 * IMPORTANT:
 * No option emoji is used here.
 *
 * Discord previously rejected several
 * Unicode emojis inside StringSelectMenu
 * options with COMPONENT_INVALID_EMOJI.
 *
 * @param {string} selectedPage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder}
 */
function buildGuideMenu(
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
            )
            .addOptions(
                GUIDE_PAGE_ORDER.map(
                    pageId => {
                        const page =
                            GUIDE_PAGE_DETAILS[
                                pageId
                            ];

                        return new StringSelectMenuOptionBuilder()
                            .setLabel(
                                page.label
                            )
                            .setDescription(
                                page.description
                            )
                            .setValue(
                                pageId
                            )
                            .setDefault(
                                pageId ===
                                selectedPage
                            );
                    }
                )
            );

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

/**
 * Build the main Guide overview.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    interaction
) {
    const embed =
        createGuideEmbed(
            interaction,

            'Ⅹ・COMMAND GUIDE',

            [
                `Welcome, ${interaction.user}.`,
                '',
                'Explore THE Ⅹ SINS commands using the menu below.',
                '',
                `**Loaded Commands:** \`${getLoadedCommandCount(
                    interaction.client
                )}\``,
                '',
                'Only commands currently loaded by Evelynn are displayed.'
            ].join('\n')
        );

    const categoryFields =
        GUIDE_PAGE_ORDER
            .filter(
                pageId =>
                    pageId !==
                    GUIDE_PAGES.overview
            )
            .map(
                pageId => {
                    const page =
                        GUIDE_PAGE_DETAILS[
                            pageId
                        ];

                    const commandCount =
                        getPageCommands(
                            interaction.client,
                            pageId
                        ).length;

                    return {
                        name:
                            `${page.emoji}・${page.label.toUpperCase()}`,

                        value:
                            `\`${commandCount}\` loaded commands`,

                        inline:
                            true
                    };
                }
            );

    embed.addFields(
        ...categoryFields
    );

    embed.addFields({
        name:
            'Ⅹ・QUICK ACCESS',

        value: [
            '`/help` — quick command menu',
            '`/guide` — detailed documentation',
            '`/dashboard` — central server dashboard',
            '`/soul` — progression record'
        ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the official THE Ⅹ SINS Rank page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildRankPage(
    interaction
) {
    const embed =
        createGuideEmbed(
            interaction,

            '⚔️・THE Ⅹ SINS',

            [
                'The official Sin hierarchy and recognized rank statuses.',
                '',
                buildSinHierarchyText()
            ].join('\n')
        );

    embed.addFields({
        name:
            '⚔️・RANK MANAGEMENT',

        value:
            buildRankWorkflow(),

        inline:
            false
    });

    embed.addFields({
        name:
            '◇・RANK RECORDS',

        value: [
            '`/rank` — view current rank information',
            '`/rankhistory` — review previous rank changes'
        ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build a normal category page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} pageId
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildCategoryPage(
    interaction,
    pageId
) {
    const page =
        GUIDE_PAGE_DETAILS[
            pageId
        ];

    if (!page) {
        return buildOverviewPage(
            interaction
        );
    }

    const commands =
        getPageCommands(
            interaction.client,
            pageId
        );

    const embed =
        createGuideEmbed(
            interaction,

            `${page.emoji}・${page.label.toUpperCase()}`,

            [
                page.description,
                '',
                `**Available Commands:** \`${commands.length}\``
            ].join('\n')
        );

    if (
        !commands.length
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

    const entries =
        commands.map(
            formatCommand
        );

    const chunks =
        splitCommandEntries(
            entries
        );

    chunks.forEach(
        (
            chunk,
            index
        ) => {
            embed.addFields({
                name:
                    index === 0
                        ? 'Ⅹ・COMMANDS'
                        : 'Ⅹ・COMMANDS — CONTINUED',

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
        pageId ===
        GUIDE_PAGES.ranks
    ) {
        return buildRankPage(
            interaction
        );
    }

    return buildCategoryPage(
        interaction,
        pageId
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
                'Open Evelynn’s interactive command guide.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute /guide.
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
                            'The Command Guide can only be opened inside THE Ⅹ SINS.'
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

            const message =
                await interaction.editReply({
                    embeds: [
                        buildGuidePage(
                            interaction,
                            selectedPage
                        )
                    ],

                    components: [
                        buildGuideMenu(
                            selectedPage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                message.createMessageComponentCollector({
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
                                        'Only the member who opened this Guide can control it.'
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
                                        'Evelynn could not recognize the selected category.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        selectedPage =
                            requestedPage;

                        await menuInteraction.update({
                            embeds: [
                                buildGuidePage(
                                    interaction,
                                    selectedPage
                                )
                            ],

                            components: [
                                buildGuideMenu(
                                    selectedPage
                                )
                            ]
                        });
                    } catch (error) {
                        console.error(
                            '❌ Evelynn /guide navigation error:',
                            error
                        );

                        await menuInteraction
                            .reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Guide Navigation Failed',
                                        'Evelynn could not open the selected Guide page.'
                                    )
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
                async () => {
                    await interaction
                        .editReply({
                            components: [
                                buildGuideMenu(
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
                    '❌ Guide Unavailable',
                    'Evelynn could not open the Command Guide.'
                );

            if (
                interaction.replied ||
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
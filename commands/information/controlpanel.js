const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const Terminal =
    require('../../utils/terminal');

/**
 * Evelynn Terminal visual color.
 */
const CONTROL_PANEL_COLOR =
    '#C8CDD4';

/**
 * Custom ID used by the Evelynn Terminal
 * module selection menu.
 */
const CONTROL_PANEL_CUSTOM_ID =
    'umbra:control:select';

/**
 * Custom ID used by the live
 * Health Refresh button.
 */
const CONTROL_PANEL_REFRESH_ID =
    'umbra:control:refresh-health';

/**
 * Custom ID used by the Incident Center
 * Refresh button.
 */
const INCIDENT_CENTER_REFRESH_ID =
    'umbra:control:refresh-incidents';

/**
 * Custom ID used by the Services Center
 * Refresh button.
 *
 * The interaction handler will use this
 * during the next Services Center stage.
 */
const SERVICES_CENTER_REFRESH_ID =
    'umbra:control:refresh-services';

/**
 * Maximum time allowed for a live
 * health snapshot.
 *
 * The Terminal will use a safe fallback
 * instead of waiting indefinitely.
 */
const HEALTH_SNAPSHOT_TIMEOUT =
    12_000;

/**
 * Convert one boolean system state into
 * a compact Terminal status.
 *
 * @param {boolean} active
 * @param {string} activeLabel
 * @param {string} inactiveLabel
 * @returns {string}
 */
function formatBooleanStatus(
    active,
    activeLabel =
        'ONLINE',
    inactiveLabel =
        'OFFLINE'
) {
    return active
        ? `🟢 \`${activeLabel}\``
        : `🔴 \`${inactiveLabel}\``;
}

/**
 * Convert one health state into
 * a readable Terminal status.
 *
 * @param {'normal'|'warning'|'critical'} state
 * @returns {string}
 */
function formatHealthState(
    state
) {
    switch (
        state
    ) {
        case 'normal':
            return '🟢 `HEALTHY`';

        case 'warning':
            return '🟡 `WARNING`';

        case 'critical':
            return '🔴 `CRITICAL`';

        default:
            return '⚪ `UNKNOWN`';
    }
}

/**
 * Build a safe fallback snapshot.
 *
 * This is used if the complete diagnostic
 * check fails or exceeds the timeout.
 *
 * @param {import('discord.js').Client} client
 * @returns {Object}
 */
function buildFallbackSnapshot(
    client
) {
    const gatewayConnected =
        client.isReady();

    const gatewayPing =
        Number.isFinite(
            client.ws.ping
        )
            ? Math.max(
                0,
                Math.round(
                    client.ws.ping
                )
            )
            : 0;

    const memoryUsage =
        process.memoryUsage();

    const checkedAt =
        Math.floor(
            Date.now() /
            1_000
        );

    return {
        gatewayConnected,

        gatewayPing,

        gatewayLatencyState:
            gatewayPing >=
                1_500
                ? 'critical'
                : gatewayPing >=
                    500
                    ? 'warning'
                    : 'normal',

        databaseConnected:
            false,

        databaseLatency:
            null,

        memoryUsage,

        memoryState:
            memoryUsage.rss >=
                768 *
                1_024 *
                1_024
                ? 'critical'
                : memoryUsage.rss >=
                    512 *
                    1_024 *
                    1_024
                    ? 'warning'
                    : 'normal',

        /*
         * Keep Black Box properties present
         * even when the fallback is used.
         */
        services:
            [],

        servicesHealthState:
            'warning',

        guildCount:
            client.guilds.cache.size,

        memberCount:
            client.guilds.cache.reduce(
                (
                    total,
                    guild
                ) =>
                    total +
                    guild.memberCount,

                0
            ),

        commandCount:
            client.commands?.size ??
            0,

        checkedAt,

        statistics:
            null,

        fallback:
            true,

        overallHealth: {
            label:
                'DEGRADED',

            emoji:
                '🟡',

            color:
                '#FEE75C',

            message:
                'The basic Terminal is available, but complete database diagnostics did not finish in time.'
        }
    };
}

/**
 * Collect a complete live health snapshot
 * with a strict timeout.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<Object>}
 */
async function collectHealthSafely(
    client
) {
    let timeoutId =
        null;

    const timeoutPromise =
        new Promise(
            resolve => {
                timeoutId =
                    setTimeout(
                        () => {
                            console.warn(
                                `⚠️ Evelynn Terminal health collection exceeded ${HEALTH_SNAPSHOT_TIMEOUT} ms.`
                            );

                            resolve(
                                buildFallbackSnapshot(
                                    client
                                )
                            );
                        },

                        HEALTH_SNAPSHOT_TIMEOUT
                    );

                timeoutId.unref?.();
            }
        );

    try {
        return await Promise.race([
            Terminal.dashboard
                .collectHealth(
                    client
                ),

            timeoutPromise
        ]);
    } catch (error) {
        console.error(
            '❌ Evelynn Terminal health collection failed:'
        );

        console.error(
            error
        );

        return buildFallbackSnapshot(
            client
        );
    } finally {
        if (
            timeoutId
        ) {
            clearTimeout(
                timeoutId
            );
        }
    }
}

/**
 * Build the Evelynn Terminal module menu.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildControlPanelMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            CONTROL_PANEL_CUSTOM_ID
        )

        .setPlaceholder(
            'Select an Evelynn Terminal module...'
        )

        .setMinValues(
            1
        )

        .setMaxValues(
            1
        )

        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Terminal Overview'
                )
                .setDescription(
                    'View live Evelynn health and system information'
                )
                .setEmoji(
                    '🖥️'
                )
                .setValue(
                    'system-overview'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Services Center'
                )
                .setDescription(
                    'View every registered Black Box service'
                )
                .setEmoji(
                    '⚙️'
                )
                .setValue(
                    'services-center'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Incident Center'
                )
                .setDescription(
                    'Review archived Evelynn system incidents'
                )
                .setEmoji(
                    '🚨'
                )
                .setValue(
                    'incident-center'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Rank Trials'
                )
                .setDescription(
                    'View Monthly Rank Trials controls'
                )
                .setEmoji(
                    '⚔️'
                )
                .setValue(
                    'rank-trials'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Ticket Management'
                )
                .setDescription(
                    'View ticket panel and support controls'
                )
                .setEmoji(
                    '🎫'
                )
                .setValue(
                    'tickets'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Sin Ranks'
                )
                .setDescription(
                    'View hierarchy management controls'
                )
                .setEmoji(
                    '👑'
                )
                .setValue(
                    'sin-ranks'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Setup Center'
                )
                .setDescription(
                    'View THE \u2169 SINS setup controls'
                )
                .setEmoji(
                    '📚'
                )
                .setValue(
                    'setup-center'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Guardian Status'
                )
                .setDescription(
                    'View Guardian and AutoMod information'
                )
                .setEmoji(
                    '🛡️'
                )
                .setValue(
                    'guardian-status'
                )
        );
}/**
 * Build the live Health Refresh button.
 *
 * @param {boolean} disabled
 * @returns {ButtonBuilder}
 */
function buildRefreshHealthButton(
    disabled =
        false
) {
    return new ButtonBuilder()
        .setCustomId(
            CONTROL_PANEL_REFRESH_ID
        )

        .setLabel(
            disabled
                ? 'Refreshing Health...'
                : 'Refresh Health'
        )

        .setEmoji(
            '🔄'
        )

        .setStyle(
            ButtonStyle.Secondary
        )

        .setDisabled(
            disabled
        );
}

/**
 * Build the Incident Center
 * Refresh button.
 *
 * @param {boolean} disabled
 * @returns {ButtonBuilder}
 */
function buildRefreshIncidentsButton(
    disabled =
        false
) {
    return new ButtonBuilder()
        .setCustomId(
            INCIDENT_CENTER_REFRESH_ID
        )

        .setLabel(
            disabled
                ? 'Refreshing Incidents...'
                : 'Refresh Incidents'
        )

        .setEmoji(
            '🚨'
        )

        .setStyle(
            ButtonStyle.Danger
        )

        .setDisabled(
            disabled
        );
}

/**
 * Build the Services Center
 * Refresh button.
 *
 * @param {boolean} disabled
 * @returns {ButtonBuilder}
 */
function buildRefreshServicesButton(
    disabled =
        false
) {
    return new ButtonBuilder()
        .setCustomId(
            SERVICES_CENTER_REFRESH_ID
        )

        .setLabel(
            disabled
                ? 'Refreshing Services...'
                : 'Refresh Services'
        )

        .setEmoji(
            '⚙️'
        )

        .setStyle(
            ButtonStyle.Secondary
        )

        .setDisabled(
            disabled
        );
}

/**
 * Build the shared Terminal menu row.
 *
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function buildControlPanelMenuRow() {
    return new ActionRowBuilder()
        .addComponents(
            buildControlPanelMenu()
        );
}

/**
 * Build the standard Terminal
 * Health action row.
 *
 * @param {boolean} refreshDisabled
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildControlPanelActionRow(
    refreshDisabled =
        false
) {
    return new ActionRowBuilder()
        .addComponents(
            buildRefreshHealthButton(
                refreshDisabled
            )
        );
}

/**
 * Build the Incident Center
 * action row.
 *
 * @param {boolean} refreshDisabled
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildIncidentCenterActionRow(
    refreshDisabled =
        false
) {
    return new ActionRowBuilder()
        .addComponents(
            buildRefreshIncidentsButton(
                refreshDisabled
            )
        );
}

/**
 * Build the Services Center
 * action row.
 *
 * @param {boolean} refreshDisabled
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildServicesCenterActionRow(
    refreshDisabled =
        false
) {
    return new ActionRowBuilder()
        .addComponents(
            buildRefreshServicesButton(
                refreshDisabled
            )
        );
}

/**
 * Build the normal Evelynn Terminal
 * component rows.
 *
 * @param {boolean} refreshDisabled
 * @returns {Array<ActionRowBuilder>}
 */
function buildControlPanelComponents(
    refreshDisabled =
        false
) {
    return [
        buildControlPanelMenuRow(),
        buildControlPanelActionRow(
            refreshDisabled
        )
    ];
}

/**
 * Build the Incident Center
 * component rows.
 *
 * @param {boolean} refreshDisabled
 * @returns {Array<ActionRowBuilder>}
 */
function buildIncidentCenterComponents(
    refreshDisabled =
        false
) {
    return [
        buildControlPanelMenuRow(),
        buildIncidentCenterActionRow(
            refreshDisabled
        )
    ];
}

/**
 * Build the Services Center
 * component rows.
 *
 * @param {boolean} refreshDisabled
 * @returns {Array<ActionRowBuilder>}
 */
function buildServicesCenterComponents(
    refreshDisabled =
        false
) {
    return [
        buildControlPanelMenuRow(),
        buildServicesCenterActionRow(
            refreshDisabled
        )
    ];
}

/**
 * Build the live Evelynn Terminal
 * home Embed.
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {Object} snapshot
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildControlPanelEmbed(
    interaction,
    snapshot
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
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const overallHealth =
        snapshot.overallHealth;

    const databaseLatency =
        snapshot.databaseLatency !==
        null
            ? `${snapshot.databaseLatency} ms`
            : 'Unavailable';

    const processUptime =
        Terminal.formatters.uptime(
            process.uptime() *
            1_000
        );

    const memoryUsage =
        Terminal.formatters.bytes(
            snapshot.memoryUsage.rss
        );

    const heapUsage =
        Terminal.formatters.bytes(
            snapshot.memoryUsage.heapUsed
        );

    const serviceCount =
        Array.isArray(
            snapshot.services
        )
            ? snapshot.services.length
            : 0;

    const unhealthyServiceCount =
        Array.isArray(
            snapshot.services
        )
            ? snapshot.services.filter(
                service =>
                    service.status ===
                        'OFFLINE' ||
                    service.status ===
                        'DEGRADED'
            ).length
            : 0;

    const descriptionLines = [
        `**System State:** \`${overallHealth.label}\``,
        '',
        overallHealth.message,
        '',
        `Last diagnostic check: <t:${snapshot.checkedAt}:R>`
    ];

    if (
        snapshot.fallback
    ) {
        descriptionLines.push(
            '',
            '⚠️ Some PostgreSQL statistics are temporarily unavailable.'
        );
    }

    const terminalEmbed =
        createEmbed({
            title:
                `${overallHealth.emoji} Evelynn Terminal`,

            description:
                descriptionLines.join(
                    '\n'
                ),

            color:
                overallHealth.color ??
                CONTROL_PANEL_COLOR,

            thumbnail:
                botAvatar,

            fields: [
                {
                    name:
                        '📡 Discord Gateway',

                    value:
                        [
                            formatBooleanStatus(
                                snapshot.gatewayConnected,
                                'CONNECTED',
                                'DISCONNECTED'
                            ),
                            `**Latency:** \`${snapshot.gatewayPing} ms\``,
                            `**State:** ${formatHealthState(
                                snapshot.gatewayLatencyState
                            )}`
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '🗄️ PostgreSQL',

                    value:
                        [
                            formatBooleanStatus(
                                snapshot.databaseConnected,
                                'CONNECTED',
                                'UNAVAILABLE'
                            ),
                            `**Latency:** \`${databaseLatency}\``
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '🧠 Process Memory',

                    value:
                        [
                            `**RSS:** \`${memoryUsage}\``,
                            `**Heap:** \`${heapUsage}\``,
                            `**State:** ${formatHealthState(
                                snapshot.memoryState
                            )}`
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '⏱️ Runtime',

                    value:
                        [
                            `**Uptime:** \`${processUptime}\``,
                            `**Process ID:** \`${process.pid}\``
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '🌙 THE \u2169 SINS',

                    value:
                        [
                            `**Members:** \`${interaction.guild.memberCount}\``,
                            `**Commands:** \`${snapshot.commandCount}\``
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                },
                {
                    name:
                        '🖥️ Terminal Channel',

                    value:
                        `<#${Terminal.TERMINAL_CHANNEL_ID}>`,

                    inline:
                        true
                },
                {
                    name:
                        '⚙️ Black Box Services',

                    value:
                        [
                            `**Registered:** \`${serviceCount}\``,
                            `**Unhealthy:** \`${unhealthyServiceCount}\``,
                            `**State:** \`${(
                                snapshot.servicesHealthState ??
                                'unknown'
                            ).toUpperCase()}\``
                        ].join(
                            '\n'
                        ),

                    inline:
                        true
                }
            ]
        });

    terminalEmbed.setAuthor({
        name:
            'Evelynn • Core Operations',

        iconURL:
            botAvatar
    });

    terminalEmbed.setFooter({
        text:
            'THE \u2169 SINS • Administrative Terminal',

        iconURL:
            guildIcon
    });

    terminalEmbed.setTimestamp();

    return terminalEmbed;
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'controlpanel'
            )

            .setDescription(
                'Open the live Evelynn administrative terminal.'
            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),

    /**
     * Open the live Evelynn Terminal.
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
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Evelynn Terminal can only be opened inside THE \u2169 SINS.'
                        )
                    ]
                });

                return;
            }

            if (
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await interaction.reply({
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        createErrorEmbed(
                            '❌ Authority Denied',
                            'Only a THE \u2169 SINS Administrator may access the Evelynn Terminal.'
                        )
                    ]
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const snapshot =
                await collectHealthSafely(
                    interaction.client
                );

            const terminalEmbed =
                buildControlPanelEmbed(
                    interaction,
                    snapshot
                );

            await interaction.editReply({
                embeds: [
                    terminalEmbed
                ],

                components:
                    buildControlPanelComponents()
            });

            console.log(
                '======================================'
            );

            console.log(
                '🖥️ Evelynn Terminal Opened'
            );

            console.log(
                `🛡️ Opened By: ${interaction.user.tag}`
            );

            console.log(
                `🏰 Server: ${interaction.guild.name}`
            );

            console.log(
                `📡 Gateway: ${
                    snapshot.gatewayConnected
                        ? 'CONNECTED'
                        : 'DISCONNECTED'
                }`
            );

            console.log(
                `🗄️ Database: ${
                    snapshot.databaseConnected
                        ? 'CONNECTED'
                        : 'UNAVAILABLE'
                }`
            );

            console.log(
                `⚙️ Black Box Services: ${
                    Array.isArray(
                        snapshot.services
                    )
                        ? snapshot.services.length
                        : 0
                }`
            );

            console.log(
                `🌙 Overall Health: ${snapshot.overallHealth.label}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Evelynn Terminal command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Evelynn Terminal Failed',
                    [
                        'Evelynn could not open the administrative Terminal.',
                        '',
                        'Check the Discord Gateway, PostgreSQL connection and Terminal modules.'
                    ].join(
                        '\n'
                    )
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
                        flags:
                            MessageFlags.Ephemeral,

                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        errorEmbed
                    ]
                })
                .catch(
                    () => null
                );
        }
    },    /**
     * Shared Terminal constants.
     */
    CONTROL_PANEL_COLOR,
    CONTROL_PANEL_CUSTOM_ID,
    CONTROL_PANEL_REFRESH_ID,
    INCIDENT_CENTER_REFRESH_ID,
    SERVICES_CENTER_REFRESH_ID,
    HEALTH_SNAPSHOT_TIMEOUT,

    /**
     * Shared formatting helpers.
     */
    formatBooleanStatus,
    formatHealthState,

    /**
     * Health snapshot utilities.
     */
    buildFallbackSnapshot,
    collectHealthSafely,

    /**
     * Terminal menu and button builders.
     */
    buildControlPanelMenu,

    buildRefreshHealthButton,
    buildRefreshIncidentsButton,
    buildRefreshServicesButton,

    buildControlPanelMenuRow,

    buildControlPanelActionRow,
    buildIncidentCenterActionRow,
    buildServicesCenterActionRow,

    buildControlPanelComponents,
    buildIncidentCenterComponents,
    buildServicesCenterComponents,

    /**
     * Main Terminal Embed builder.
     */
    buildControlPanelEmbed
};

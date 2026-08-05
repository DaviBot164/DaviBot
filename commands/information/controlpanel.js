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
 * Umbra Terminal visual color.
 */
const CONTROL_PANEL_COLOR =
    '#C8CDD4';

/**
 * Custom ID used by the Umbra Terminal
 * selection menu.
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
                                `⚠️ Umbra Terminal health collection exceeded ${HEALTH_SNAPSHOT_TIMEOUT} ms.`
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
            '❌ Umbra Terminal health collection failed:'
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
}/**
 * Build the Umbra Terminal selection menu.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildControlPanelMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            CONTROL_PANEL_CUSTOM_ID
        )

        .setPlaceholder(
            'Select an Umbra Terminal module...'
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
                    'View live Umbra health and system information'
                )
                .setEmoji(
                    '🖥️'
                )
                .setValue(
                    'system-overview'
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
                    'Arrancar Ranks'
                )
                .setDescription(
                    'View hierarchy management controls'
                )
                .setEmoji(
                    '👑'
                )
                .setValue(
                    'arrancar-ranks'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Setup Center'
                )
                .setDescription(
                    'View Las Noches setup controls'
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
}

/**
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
 * Build the shared Terminal action row.
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
 * Build both shared Terminal rows.
 *
 * @param {boolean} refreshDisabled
 * @returns {Array<
 *     ActionRowBuilder<
 *         StringSelectMenuBuilder |
 *         ButtonBuilder
 *     >
 * >}
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
 * Build the live Umbra Terminal home Embed.
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
                `${overallHealth.emoji} Umbra Terminal`,

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
                        '🌙 Las Noches',

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
                }
            ]
        });

    terminalEmbed.setAuthor({
        name:
            'Umbra • Core Operations',

        iconURL:
            botAvatar
    });

    terminalEmbed.setFooter({
        text:
            'Las Noches • Administrative Terminal',

        iconURL:
            guildIcon
    });

    terminalEmbed.setTimestamp();

    return terminalEmbed;
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'controlpanel'
            )

            .setDescription(
                'Open the live Umbra administrative terminal.'
            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),

    /**
     * Open the live Umbra Terminal.
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
                            'The Umbra Terminal can only be opened inside Las Noches.'
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
                            'Only a Las Noches Administrator may access the Umbra Terminal.'
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
                '🖥️ Umbra Terminal Opened'
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
                `🌙 Overall Health: ${snapshot.overallHealth.label}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra Terminal command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Umbra Terminal Failed',
                    [
                        'Umbra could not open the administrative Terminal.',
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
    },

    CONTROL_PANEL_COLOR,
    CONTROL_PANEL_CUSTOM_ID,
    CONTROL_PANEL_REFRESH_ID,
    HEALTH_SNAPSHOT_TIMEOUT,

    formatBooleanStatus,
    formatHealthState,

    buildFallbackSnapshot,
    collectHealthSafely,

    buildControlPanelMenu,
    buildRefreshHealthButton,
    buildControlPanelMenuRow,
    buildControlPanelActionRow,
    buildControlPanelComponents,
    buildControlPanelEmbed
};
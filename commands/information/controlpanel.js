const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const Terminal =
    require('../../utils/terminal');

/**
 * Umbra Terminal visual color.
 *
 * This color is used only when a more
 * specific health-state color is unavailable.
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
 * Build the live Umbra Terminal home Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {Awaited<ReturnType<
 *     typeof Terminal.dashboard.collectHealth
 * >>} snapshot
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

    const terminalEmbed =
        createEmbed({
            title:
                `${overallHealth.emoji} Umbra Terminal`,

            description:
                [
                    `**System State:** \`${overallHealth.label}\``,
                    '',
                    overallHealth.message,
                    '',
                    `Last diagnostic check: <t:${snapshot.checkedAt}:R>`
                ].join(
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
                                'DISCONNECTED'
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
                await Terminal.dashboard
                    .collectHealth(
                        interaction.client
                    );

            const terminalEmbed =
                buildControlPanelEmbed(
                    interaction,
                    snapshot
                );

            const terminalMenu =
                buildControlPanelMenu();

            const terminalRow =
                new ActionRowBuilder()
                    .addComponents(
                        terminalMenu
                    );

            await interaction.editReply({
                embeds: [
                    terminalEmbed
                ],

                components: [
                    terminalRow
                ]
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
                        : 'DISCONNECTED'
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
                        'Umbra could not collect the live system-health snapshot.',
                        '',
                        'Check the PostgreSQL connection, Discord Gateway state and Terminal modules.'
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

    formatBooleanStatus,
    formatHealthState,

    buildControlPanelMenu,
    buildControlPanelEmbed
};
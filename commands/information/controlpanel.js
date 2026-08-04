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

/**
 * Umbra Control Panel visual color.
 */
const CONTROL_PANEL_COLOR =
    '#C8CDD4';

/**
 * Custom ID used by the Control Panel
 * selection menu.
 */
const CONTROL_PANEL_CUSTOM_ID =
    'umbra:control:select';

/**
 * Build the Control Panel selection menu.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildControlPanelMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            CONTROL_PANEL_CUSTOM_ID
        )

        .setPlaceholder(
            'Select an Umbra control module...'
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
                    'System Overview'
                )
                .setDescription(
                    'View Umbra systems and management commands'
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
                    'View Arrancar hierarchy management controls'
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
                    'View Las Noches setup and publication controls'
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
 * Build the main Umbra Control Panel Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildControlPanelEmbed(
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
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const controlEmbed =
        createEmbed({
            title:
                '🖥️ Umbra Control Panel',

            description:
                [
                    `Welcome, ${interaction.user}.`,
                    '',
                    'Use this panel to review and manage the primary systems of **Las Noches**.',
                    '',
                    'Select a module from the menu below.'
                ].join(
                    '\n'
                ),

            color:
                CONTROL_PANEL_COLOR,

            thumbnail:
                botAvatar,

            fields: [
                {
                    name:
                        '⚔️ Rank Trials',

                    value:
                        'Monthly announcements, scheduler status and Discord Events.',

                    inline:
                        true
                },
                {
                    name:
                        '🎫 Tickets',

                    value:
                        'Support panel creation and ticket system management.',

                    inline:
                        true
                },
                {
                    name:
                        '👑 Arrancar Ranks',

                    value:
                        'Official hierarchy assignments and Rank records.',

                    inline:
                        true
                },
                {
                    name:
                        '📚 Setup Center',

                    value:
                        'Publish official Las Noches guides and information.',

                    inline:
                        true
                },
                {
                    name:
                        '🛡️ Guardian',

                    value:
                        'Review moderation, spam and protection systems.',

                    inline:
                        true
                },
                {
                    name:
                        '🖥️ System Overview',

                    value:
                        'View the commands used to control each module.',

                    inline:
                        true
                }
            ]
        });

    controlEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            botAvatar
    });

    controlEmbed.setFooter({
        text:
            'Las Noches • Administrative Control Center',

        iconURL:
            guildIcon
    });

    controlEmbed.setTimestamp();

    return controlEmbed;
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'controlpanel'
            )

            .setDescription(
                'Open the Umbra administrative control panel.'
            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),

    /**
     * Open the Umbra Control Panel.
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
                            'The Umbra Control Panel can only be opened inside Las Noches.'
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
                            'Only a Las Noches Administrator may access the Umbra Control Panel.'
                        )
                    ]
                });

                return;
            }

            const controlEmbed =
                buildControlPanelEmbed(
                    interaction
                );

            const controlMenu =
                buildControlPanelMenu();

            const controlRow =
                new ActionRowBuilder()
                    .addComponents(
                        controlMenu
                    );

            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    controlEmbed
                ],

                components: [
                    controlRow
                ]
            });

            console.log(
                '======================================'
            );

            console.log(
                '🖥️ Umbra Control Panel Opened'
            );

            console.log(
                `🛡️ Opened By: ${interaction.user.tag}`
            );

            console.log(
                `🏰 Server: ${interaction.guild.name}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra Control Panel command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Control Panel Failed',
                    'Umbra could not open the administrative Control Panel.'
                );

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
    buildControlPanelMenu,
    buildControlPanelEmbed
};
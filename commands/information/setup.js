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
 * Umbra Setup Wizard visual color.
 *
 * Cold silver-blue matches the current
 * Las Noches visual identity.
 */
const SETUP_EMBED_COLOR =
    '#C8CDD4';

/**
 * Build the Setup Wizard selection menu.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildSetupMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            'umbra:setup:select'
        )

        .setPlaceholder(
            'Select a Las Noches setup module...'
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
                    'Verification Guide'
                )
                .setDescription(
                    'Publish the official verification instructions'
                )
                .setEmoji(
                    '⛩️'
                )
                .setValue(
                    'verification-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Sacred Laws'
                )
                .setDescription(
                    'Publish the official laws of Las Noches'
                )
                .setEmoji(
                    '📜'
                )
                .setValue(
                    'sacred-laws'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Official Decrees'
                )
                .setDescription(
                    'Open the official announcement module'
                )
                .setEmoji(
                    '📢'
                )
                .setValue(
                    'official-decrees'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Server Guide'
                )
                .setDescription(
                    'Publish the guide for new Souls'
                )
                .setEmoji(
                    '📖'
                )
                .setValue(
                    'server-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Role Information'
                )
                .setDescription(
                    'Publish information about server ranks and roles'
                )
                .setEmoji(
                    '🎖️'
                )
                .setValue(
                    'role-information'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Frequently Asked Questions'
                )
                .setDescription(
                    'Publish answers to common questions'
                )
                .setEmoji(
                    '❓'
                )
                .setValue(
                    'faq'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Ticket Guide'
                )
                .setDescription(
                    'Publish instructions for the support system'
                )
                .setEmoji(
                    '🎫'
                )
                .setValue(
                    'ticket-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Full Server Setup'
                )
                .setDescription(
                    'Publish every available setup module'
                )
                .setEmoji(
                    '🚀'
                )
                .setValue(
                    'full-setup'
                )
        );
}

/**
 * Build the main Setup Wizard Embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSetupEmbed(
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

    const setupEmbed =
        createEmbed({
            title:
                '🌙 Umbra Setup Wizard',

            description:
                [
                    `Welcome, ${interaction.user}.`,
                    '',
                    'Select a module below to publish or update the official systems of **Las Noches**.',
                    '',
                    'Only Administrators may use this control panel.'
                ].join(
                    '\n'
                ),

            color:
                SETUP_EMBED_COLOR,

            thumbnail:
                botAvatar,

            fields: [
                {
                    name:
                        '⛩️ Verification Guide',

                    value:
                        'Publish the official Bloxlink verification instructions.',

                    inline:
                        true
                },
                {
                    name:
                        '📜 Sacred Laws',

                    value:
                        'Publish the rules and standards of Las Noches.',

                    inline:
                        true
                },
                {
                    name:
                        '📢 Official Decrees',

                    value:
                        'Manage the official announcement module.',

                    inline:
                        true
                },
                {
                    name:
                        '📖 Server Guide',

                    value:
                        'Publish a simple guide for new Souls.',

                    inline:
                        true
                },
                {
                    name:
                        '🎖️ Role Information',

                    value:
                        'Explain staff roles and Arrancar ranks.',

                    inline:
                        true
                },
                {
                    name:
                        '❓ FAQ',

                    value:
                        'Publish answers to common server questions.',

                    inline:
                        true
                },
                {
                    name:
                        '🎫 Ticket Guide',

                    value:
                        'Explain how members can request support.',

                    inline:
                        true
                },
                {
                    name:
                        '🚀 Full Setup',

                    value:
                        'Publish all available setup modules.',

                    inline:
                        true
                }
            ]
        });

    setupEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            botAvatar
    });

    setupEmbed.setFooter({
        text:
            'Las Noches • Setup Center',

        iconURL:
            guildIcon
    });

    setupEmbed.setTimestamp();

    return setupEmbed;
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'setup'
            )

            .setDescription(
                'Open the Umbra server setup wizard.'
            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .setDMPermission(
                false
            ),

    /**
     * Open the Umbra Setup Wizard.
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
                            'The Umbra Setup Wizard can only be opened inside Las Noches.'
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
                            '❌ Permission Denied',
                            'Only a Las Noches Administrator may access the Umbra Setup Wizard.'
                        )
                    ]
                });

                return;
            }

            const setupEmbed =
                buildSetupEmbed(
                    interaction
                );

            const setupMenu =
                buildSetupMenu();

            const setupRow =
                new ActionRowBuilder()
                    .addComponents(
                        setupMenu
                    );            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    setupEmbed
                ],

                components: [
                    setupRow
                ]
            });

            console.log(
                '======================================'
            );

            console.log(
                '🌙 Umbra Setup Wizard Opened'
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
                '❌ Umbra setup command error:'
            );

            console.error(
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Setup Wizard Failed',
                    'Umbra could not open the Las Noches Setup Wizard. Please try again later.'
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
    }
};
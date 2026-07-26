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

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription(
            'Open the Umbra server setup wizard.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .setDMPermission(false),

    /**
     * Open the Umbra Setup Wizard.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Umbra Setup Wizard can only be opened inside a server.'
                        )
                    ]
                });

                return;
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.reply({
                    flags:
                        MessageFlags.Ephemeral,

                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only an Administrator may access the Umbra Setup Wizard.'
                        )
                    ]
                });

                return;
            }

            const setupEmbed =
                createEmbed({
                    title:
                        '🌑 Umbra Setup Wizard',

                    description:
                        [
                            `Welcome, ${interaction.user}.`,
                            '',
                            'Umbra is ready to prepare the official systems of **Crimson Eclipse**.',
                            '',
                            'Select a module from the menu below.',
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '📜 **Sacred Laws**',
                            'Publish the official laws of the Order.',
                            '',
                            '📢 **Official Decrees**',
                            'Manage official server announcements.',
                            '',
                            '📖 **Server Guide**',
                            'Publish a guide for new Souls.',
                            '',
                            '🎖️ **Role Information**',
                            'Explain the ranks of Crimson Eclipse.',
                            '',
                            '❓ **Frequently Asked Questions**',
                            'Publish answers to common questions.',
                            '',
                            '🎫 **Ticket Guide**',
                            'Explain how the Umbra support system works.',
                            '',
                            '🚀 **Full Server Setup**',
                            'Publish all available setup modules.',
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            '-# Setup access is restricted to Administrators.'
                        ].join('\n'),

                    thumbnail:
                        interaction.client.user.displayAvatarURL({
                            size: 512,
                            forceStatic: false
                        })
                });

            setupEmbed.setAuthor({
                name:
                    'Umbra • Guardian of Crimson Eclipse',

                iconURL:
                    interaction.client.user.displayAvatarURL({
                        size: 256,
                        forceStatic: false
                    })
            });

            setupEmbed.setFooter({
                text:
                    '🌑 Crimson Eclipse • Setup Center',

                iconURL:
                    interaction.guild.iconURL({
                        size: 128,
                        forceStatic: false
                    }) ??
                    interaction.client.user.displayAvatarURL({
                        size: 128,
                        forceStatic: false
                    })
            });

            setupEmbed.setTimestamp();

            const setupMenu =
                new StringSelectMenuBuilder()
                    .setCustomId(
                        'umbra:setup:select'
                    )
                    .setPlaceholder(
                        'Select a setup module...'
                    )
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                'Sacred Laws'
                            )
                            .setDescription(
                                'Publish the official Crimson Eclipse laws'
                            )
                            .setEmoji('📜')
                            .setValue(
                                'sacred-laws'
                            ),

                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                'Official Decrees'
                            )
                            .setDescription(
                                'Open the announcement setup module'
                            )
                            .setEmoji('📢')
                            .setValue(
                                'official-decrees'
                            ),

                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                'Server Guide'
                            )
                            .setDescription(
                                'Publish a guide for new Souls'
                            )
                            .setEmoji('📖')
                            .setValue(
                                'server-guide'
                            ),

                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                'Role Information'
                            )
                            .setDescription(
                                'Publish information about server ranks'
                            )
                            .setEmoji('🎖️')
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
                            .setEmoji('❓')
                            .setValue(
                                'faq'
                            ),

                        new StringSelectMenuOptionBuilder()
                            .setLabel(
                                'Ticket Guide'
                            )
                            .setDescription(
                                'Publish instructions for the ticket system'
                            )
                            .setEmoji('🎫')
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
                            .setEmoji('🚀')
                            .setValue(
                                'full-setup'
                            )
                    );

            const setupRow =
                new ActionRowBuilder()
                    .addComponents(
                        setupMenu
                    );

            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds:
                    [setupEmbed],

                components:
                    [setupRow]
            });

            console.log(
                '======================================'
            );

            console.log(
                '🌑 Umbra Setup Wizard Opened'
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

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Setup Wizard Failed',
                    'Umbra could not open the Setup Wizard. Please try again later.'
                );

            if (interaction.replied) {
                await interaction
                    .followUp({
                        flags:
                            MessageFlags.Ephemeral,

                        embeds:
                            [errorEmbed]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed],

                        components: []
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

                    embeds:
                        [errorEmbed]
                })
                .catch(
                    () => null
                );
        }
    }
};
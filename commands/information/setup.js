const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

const brand =
    require('../../config/brand');

const {
    createEmbed
} = require('../../utils/embeds');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription(
                'Open the Blood Moon setup wizard.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            ),

    async execute(interaction) {
        const embed =
            createEmbed(
                'Blood Moon Setup',
                [
                    'Configure and publish the main Blood Moon server systems.',
                    '',
                    'Select what you want Akane to set up from the menu below.',
                    '',
                    '📜 **Sacred Laws** — Server rules',
                    '📖 **Moon Guide** — Server guide',
                    '⛩️ **Verification Guide** — Bloxlink instructions',
                    '⚔️ **Path Selection** — Slayer or Demon selection',
                    '🎫 **Ticket Panel** — Support system',
                    '🌙 **Full Setup** — Publish all core setup content'
                ].join('\n')
            )
                .setFooter({
                    text:
                        brand.footer
                });

        const menu =
            new StringSelectMenuBuilder()
                .setCustomId(
                    'akane:setup'
                )
                .setPlaceholder(
                    'Choose a setup option'
                )
                .addOptions(
                    {
                        label:
                            'Sacred Laws',
                        description:
                            'Publish the Blood Moon server rules.',
                        value:
                            'sacred_laws',
                        emoji:
                            '📜'
                    },
                    {
                        label:
                            'Moon Guide',
                        description:
                            'Publish the Blood Moon server guide.',
                        value:
                            'moon_guide',
                        emoji:
                            '📖'
                    },
                    {
                        label:
                            'Verification Guide',
                        description:
                            'Publish the Bloxlink verification guide.',
                        value:
                            'verification_guide',
                        emoji:
                            '⛩️'
                    },
                    {
                        label:
                            'Path Selection',
                        description:
                            'Publish the Slayer and Demon path panel.',
                        value:
                            'path_selection',
                        emoji:
                            '⚔️'
                    },
                    {
                        label:
                            'Ticket Panel',
                        description:
                            'Publish the Blood Moon support panel.',
                        value:
                            'ticket_panel',
                        emoji:
                            '🎫'
                    },
                    {
                        label:
                            'Full Setup',
                        description:
                            'Publish all core Blood Moon setup content.',
                        value:
                            'full_setup',
                        emoji:
                            '🌙'
                    }
                );

        const row =
            new ActionRowBuilder()
                .addComponents(
                    menu
                );

        await interaction.reply({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                embed
            ],

            components: [
                row
            ]
        });
    }
};
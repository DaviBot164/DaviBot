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

const SETUP_EMBED_COLOR =
    '#5B3A78';

/**
 * Build the Setup Menu.
 *
 * Internal custom ID remains unchanged
 * for interaction routing compatibility.
 *
 * @returns {StringSelectMenuBuilder}
 */
function buildSetupMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            'umbra:setup:select'
        )
        .setPlaceholder(
            'Choose a setup module...'
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
                    'Publish verification instructions'
                )
                .setEmoji(
                    '✦'
                )
                .setValue(
                    'verification-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Code of Sins'
                )
                .setDescription(
                    'Publish the server rules'
                )
                .setEmoji(
                    '📜'
                )
                .setValue(
                    'sacred-laws'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Sin Codex'
                )
                .setDescription(
                    'Publish the server guide'
                )
                .setEmoji(
                    '📖'
                )
                .setValue(
                    'server-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Role Hierarchy'
                )
                .setDescription(
                    'Publish roles and hierarchy'
                )
                .setEmoji(
                    '♛'
                )
                .setValue(
                    'role-information'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'FAQ'
                )
                .setDescription(
                    'Publish common questions and answers'
                )
                .setEmoji(
                    '❓'
                )
                .setValue(
                    'faq'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Support Guide'
                )
                .setDescription(
                    'Publish ticket instructions'
                )
                .setEmoji(
                    '🎫'
                )
                .setValue(
                    'ticket-guide'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Full Setup'
                )
                .setDescription(
                    'Publish every setup module'
                )
                .setEmoji(
                    'Ⅹ'
                )
                .setValue(
                    'full-setup'
                )
        );
}

/**
 * Build the Setup Embed.
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

    return createEmbed({
        title:
            'Ⅹ・SETUP',

        description:
            [
                `Welcome, ${interaction.user}.`,
                '',
                'Choose what you want Evelynn to publish.',
                '',
                '✦ Verification Guide',
                '📜 Code of Sins',
                '📖 Sin Codex',
                '♛ Role Hierarchy',
                '❓ FAQ',
                '🎫 Support Guide',
                'Ⅹ Full Setup'
            ].join('\n'),

        color:
            SETUP_EMBED_COLOR,

        thumbnail:
            botAvatar,

        author: {
            name:
                'Evelynn • THE Ⅹ SINS',

            iconURL:
                botAvatar
        },

        footer: {
            text:
                'TTS • Setup'
        }
    });
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
                'Open the server setup menu.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute /setup.
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
                            'The Setup Menu can only be opened inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
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
                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only Administrators can use the Setup Menu.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        buildSetupMenu()
                    );

            await interaction.reply({
                embeds: [
                    buildSetupEmbed(
                        interaction
                    )
                ],

                components: [
                    row
                ],

                flags:
                    MessageFlags.Ephemeral
            });

            console.log(
                `Ⅹ Setup opened by ${interaction.user.tag}`
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /setup command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Setup Unavailable',
                    'Evelynn could not open the Setup Menu.'
                );

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
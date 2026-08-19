const {
    Events,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed
} = require('../utils/embeds');

const {
    createHelpCategoryEmbed,
    createHelpSelectMenu
} = require('../utils/helpMenu');

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Help Menu interactions.
     *
     * @param {import('discord.js').StringSelectMenuInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.isStringSelectMenu() ||
                interaction.customId !==
                    'umbra_help_category'
            ) {
                return;
            }

            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Menu',
                            'The command menu can only be used inside LUNAR SEIREITEI.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const selectedCategoryId =
                interaction.values[0];

            const categoryEmbed =
                createHelpCategoryEmbed(
                    interaction,
                    selectedCategoryId
                );

            if (
                !categoryEmbed
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Category Not Found',
                            'Evelynn could not find the selected command category.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.update({
                embeds: [
                    categoryEmbed
                ],

                components: [
                    createHelpSelectMenu(
                        selectedCategoryId
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn Help Menu interaction failed:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Command Category Unavailable',
                    'Evelynn could not open the selected command category.'
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
const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed
} = require('../../utils/embeds');

const {
    createHelpHomeEmbed,
    createHelpSelectMenu
} = require('../../utils/helpMenu');

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'help'
            )
            .setDescription(
                'Open Evelynn’s interactive command menu.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /help command.
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
                            'The command menu can only be opened inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const clientCommands =
                interaction.client.commands;

            if (
                !clientCommands ||
                clientCommands.size === 0
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Commands Unavailable',
                            'No commands are currently loaded.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.reply({
                embeds: [
                    createHelpHomeEmbed(
                        interaction
                    )
                ],

                components: [
                    createHelpSelectMenu()
                ],

                flags:
                    MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /help command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Command Menu Unavailable',
                    'Evelynn could not open the command menu.'
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
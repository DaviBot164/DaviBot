const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createWelcomeEmbed,
    WELCOME_BANNER_NAME
} = require('../../utils/welcomeEmbed');

const path =
    require('node:path');

module.exports = {
    category:
        'general',

    data:
        new SlashCommandBuilder()
            .setName(
                'testwelcome'
            )
            .setDescription(
                'Preview the current THE Ⅹ SINS Welcome message.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute /testwelcome.
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
                    content:
                        '❌ This command can only be used inside THE Ⅹ SINS.',

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const bannerPath =
                path.join(
                    __dirname,
                    '..',
                    '..',
                    'assets',
                    'images',
                    WELCOME_BANNER_NAME
                );

            await interaction.reply({
                embeds: [
                    createWelcomeEmbed(
                        interaction.member
                    )
                ],

                files: [
                    {
                        attachment:
                            bannerPath,

                        name:
                            WELCOME_BANNER_NAME
                    }
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /testwelcome command error:',
                error
            );

            const errorMessage = {
                content:
                    '❌ Evelynn could not generate the Welcome preview.',

                flags:
                    MessageFlags.Ephemeral
            };

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        content:
                            errorMessage.content
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
                    .followUp(
                        errorMessage
                    )
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply(
                    errorMessage
                )
                .catch(
                    () => null
                );
        }
    }
};
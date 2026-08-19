const path =
    require('node:path');

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createWelcomeEmbed,
    WELCOME_BANNER_NAME
} = require('../../utils/welcomeEmbed');

async function sendWelcomeError(
    interaction,
    message
) {
    const payload = {
        content:
            `❌ ${message}`
    };

    if (interaction.deferred) {
        await interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );

        return;
    }

    if (interaction.replied) {
        await interaction
            .followUp({
                ...payload,

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
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

module.exports = {
    category:
        'general',

    data:
        new SlashCommandBuilder()
            .setName(
                'testwelcome'
            )
            .setDescription(
                'Preview the current LUNAR SEIREITEI Welcome message.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendWelcomeError(
                    interaction,
                    'This command can only be used inside LUNAR SEIREITEI.'
                );

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

            await sendWelcomeError(
                interaction,
                'Evelynn could not generate the Welcome preview.'
            );
        }
    }
};
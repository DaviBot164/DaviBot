const path =
    require('node:path');

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createWelcomeEmbed,
    getWelcomeBannerName
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
                'Preview the current server Welcome message.'
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
                    'This command can only be used inside a server.'
                );

                return;
            }

            const bannerName =
                getWelcomeBannerName(
                    interaction.guild.id
                );

            if (!bannerName) {
                await sendWelcomeError(
                    interaction,
                    'No Welcome banner is configured for this server.'
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
                    bannerName
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
                            bannerName
                    }
                ]
            });
        } catch (error) {
            console.error(
                '❌ Welcome preview command error:',
                error
            );

            await sendWelcomeError(
                interaction,
                'The Welcome preview could not be generated.'
            );
        }
    }
};
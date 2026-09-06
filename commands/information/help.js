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

const {
    getGuildProfile
} = require('../../config/guildProfiles');

async function sendHelpError(
    interaction,
    title,
    message
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                message
            )
        ],

        components:
            []
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
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'help'
            )
            .setDescription(
                "Open the bot's interactive command menu."
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        const profile =
            getGuildProfile(
                interaction.guildId
            );

        try {
            if (
                !interaction.inGuild()
            ) {
                await sendHelpError(
                    interaction,
                    '❌ Server Only Command',
                    'The command menu can only be opened inside a server.'
                );

                return;
            }

            if (
                !interaction.client.commands
                    ?.size
            ) {
                await sendHelpError(
                    interaction,
                    '❌ Commands Unavailable',
                    'No commands are currently loaded.'
                );

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
                '❌ Help command error:',
                error
            );

            await sendHelpError(
                interaction,
                '❌ Command Menu Unavailable',
                `${profile.botName} could not open the command menu.`
            );
        }
    }
};
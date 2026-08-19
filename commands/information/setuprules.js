const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed
} = require('../../utils/embeds');

const {
    publishSacredLaws
} = require('../../utils/setup/publishSacredLaws');

async function sendSetupRulesError(
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
                'setuprules'
            )
            .setDescription(
                'Publish the official Sacred Laws.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            ),

    async execute(interaction) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendSetupRulesError(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside LUNAR SEIREITEI.'
                );

                return;
            }

            if (
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await sendSetupRulesError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators may publish the Sacred Laws.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            await publishSacredLaws(
                interaction
            );
        } catch (error) {
            console.error(
                '❌ Evelynn /setuprules failed:',
                error
            );

            await sendSetupRulesError(
                interaction,
                '❌ Sacred Laws Failed',
                'Evelynn could not publish the Sacred Laws.'
            );
        }
    }
};
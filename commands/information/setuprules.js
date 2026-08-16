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
                'Publish the official Code of Sins.'
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
                    'This command can only be used inside THE Ⅹ SINS.'
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
                    'Only Administrators may publish the Code of Sins.'
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
                '❌ Code of Sins Failed',
                'Evelynn could not publish the Code of Sins.'
            );
        }
    }
};
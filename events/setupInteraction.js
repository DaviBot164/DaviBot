const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed
} = require('../utils/embeds');

const {
    publishSacredLaws
} = require('../utils/setup/publishSacredLaws');

const {
    publishServerGuide
} = require('../utils/setup/publishServerGuide');

const {
    publishRoleInformation
} = require('../utils/setup/publishRoleInformation');

const {
    publishTicketGuide
} = require('../utils/setup/publishTicketGuide');

const {
    publishFAQ
} = require('../utils/setup/publishFAQ');

const {
    publishVerificationGuide
} = require('../utils/setup/publishVerificationGuide');

const {
    publishFullSetup
} = require('../utils/setup/publishFullSetup');

/**
 * Send a Setup error safely.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} title
 * @param {string} description
 * @returns {Promise<void>}
 */
async function sendSetupError(
    interaction,
    title,
    description
) {
    const errorEmbed =
        createErrorEmbed(
            title,
            description
        );

    if (
        interaction.deferred
    ) {
        await interaction.editReply({
            embeds: [
                errorEmbed
            ],

            components:
                []
        });

        return;
    }

    if (
        interaction.replied
    ) {
        await interaction.followUp({
            embeds: [
                errorEmbed
            ],

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        embeds: [
            errorEmbed
        ],

        flags:
            MessageFlags.Ephemeral
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Setup Menu interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        if (
            !interaction.isStringSelectMenu() ||
            interaction.customId !==
                'umbra:setup:select'
        ) {
            return;
        }

        try {
            if (
                !interaction.inGuild()
            ) {
                await sendSetupError(
                    interaction,
                    '❌ Server Only Action',
                    'The Setup Menu can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            if (
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await sendSetupError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators can use the Setup Menu.'
                );

                return;
            }

            await interaction.deferUpdate();

            const selectedModule =
                interaction.values[0];

            switch (
                selectedModule
            ) {
                case 'verification-guide':
                    await publishVerificationGuide(
                        interaction
                    );
                    break;

                case 'sacred-laws':
                    await publishSacredLaws(
                        interaction
                    );
                    break;

                case 'server-guide':
                    await publishServerGuide(
                        interaction
                    );
                    break;

                case 'role-information':
                    await publishRoleInformation(
                        interaction
                    );
                    break;

                case 'faq':
                    await publishFAQ(
                        interaction
                    );
                    break;

                case 'ticket-guide':
                    await publishTicketGuide(
                        interaction
                    );
                    break;

                case 'full-setup':
                    await publishFullSetup(
                        interaction
                    );
                    break;

                default:
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Unknown Module',
                                'The selected setup module is not supported.'
                            )
                        ],

                        components:
                            []
                    });
            }
        } catch (error) {
            console.error(
                '❌ Evelynn Setup interaction failed:',
                error
            );

            try {
                await sendSetupError(
                    interaction,
                    '❌ Setup Failed',
                    'Evelynn could not complete the selected setup action.'
                );
            } catch (
                responseError
            ) {
                console.error(
                    '❌ Setup error response failed:',
                    responseError
                );
            }
        }
    }
};
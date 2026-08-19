const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed
} = require('../utils/embeds');

const brand =
    require('../config/brand');

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
 * Keep this ID stable because it is also
 * used by the /setup command.
 */
const SETUP_MENU_ID =
    'umbra:setup:select';

const SETUP_MODULES = Object.freeze({
    'verification-guide':
        publishVerificationGuide,

    'sacred-laws':
        publishSacredLaws,

    'server-guide':
        publishServerGuide,

    'role-information':
        publishRoleInformation,

    faq:
        publishFAQ,

    'ticket-guide':
        publishTicketGuide,

    'full-setup':
        publishFullSetup
});

/**
 * Send a Setup Center error safely.
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
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ],

        components:
            []
    };

    if (interaction.deferred) {
        await interaction.editReply(
            payload
        );

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            ...payload,

            flags:
                MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.reply({
        ...payload,

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
     * Handle Setup Center menu interactions.
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
                SETUP_MENU_ID
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
                    'The Setup Center can only be used inside a server.'
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
                    'Only Administrators can use the Setup Center.'
                );

                return;
            }

            const selectedModule =
                interaction.values[0];

            const publishModule =
                SETUP_MODULES[
                    selectedModule
                ];

            if (!publishModule) {
                await sendSetupError(
                    interaction,
                    '❌ Unknown Module',
                    'The selected setup module is not supported.'
                );

                return;
            }

            await interaction.deferUpdate();

            await publishModule(
                interaction
            );
        } catch (error) {
            console.error(
                'Evelynn Setup interaction failed:',
                error
            );

            await sendSetupError(
                interaction,
                '❌ Setup Failed',
                `${brand.botName} could not complete the selected setup action.`
            ).catch(
                responseError => {
                    console.error(
                        'Setup error response failed:',
                        responseError
                    );
                }
            );
        }
    }
};
const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createErrorEmbed,
    createWarningEmbed
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
 * Safely send an ephemeral
 * Setup Wizard error.
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

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [
                errorEmbed
            ],

            components:
                []
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            flags:
                MessageFlags.Ephemeral,

            embeds: [
                errorEmbed
            ]
        });

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds: [
            errorEmbed
        ]
    });
}

/**
 * Show a temporary coming-soon
 * response for an unfinished module.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} emoji
 * @param {string} moduleName
 * @returns {Promise<void>}
 */
async function showComingSoon(
    interaction,
    emoji,
    moduleName
) {
    await interaction.editReply({
        embeds: [
            createWarningEmbed(
                `${emoji} ${moduleName}`,
                [
                    `The **${moduleName}** archive is not connected yet.`,
                    '',
                    'This module has already been prepared inside the Umbra Setup Wizard.',
                    'It will become available in a future Las Noches update.'
                ].join('\n')
            )
        ],

        components:
            []
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra Setup Wizard
     * interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        if (
            !interaction.isStringSelectMenu()
        ) {
            return;
        }

        if (
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
                    '❌ Las Noches Only Action',
                    'The Umbra Setup Wizard can only be used inside Las Noches.'
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
                    '❌ Authority Denied',
                    'Only a Las Noches Administrator may use the Umbra Setup Wizard.'
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

                case 'official-decrees':
                    await showComingSoon(
                        interaction,
                        '📢',
                        'Kingdom Decrees'
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
                                '❌ Unknown Kingdom Archive',
                                'The selected Setup Wizard module is not supported by Umbra.'
                            )
                        ],

                        components:
                            []
                    });
            }
        } catch (error) {
            console.error(
                '❌ Umbra Setup Wizard interaction error:'
            );

            console.error(
                error
            );

            try {
                await sendSetupError(
                    interaction,
                    '❌ Kingdom Archive Failed',
                    'Umbra could not process the selected Las Noches setup module.'
                );
            } catch (
                responseError
            ) {
                console.error(
                    '❌ Failed to send Setup Wizard error response:'
                );

                console.error(
                    responseError
                );
            }
        }
    }
};
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

/**
 * Safely send an ephemeral setup error.
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
            embeds: [errorEmbed],
            components: []
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            flags:
                MessageFlags.Ephemeral,

            embeds:
                [errorEmbed]
        });

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds:
            [errorEmbed]
    });
}

/**
 * Show a temporary coming-soon response.
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
                    `The **${moduleName}** module is not connected yet.`,
                    '',
                    'This option is prepared inside the Umbra Setup Wizard and will become active in a future update.'
                ].join('\n')
            )
        ],

        components: []
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra Setup Wizard interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
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
            if (!interaction.inGuild()) {
                await sendSetupError(
                    interaction,
                    '❌ Server Only Action',
                    'The Umbra Setup Wizard can only be used inside a server.'
                );

                return;
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await sendSetupError(
                    interaction,
                    '❌ Permission Denied',
                    'Only an Administrator may use the Umbra Setup Wizard.'
                );

                return;
            }

            await interaction.deferUpdate();

            const selectedModule =
                interaction.values[0];

            switch (selectedModule) {
                case 'sacred-laws':
                    await publishSacredLaws(
                        interaction
                    );
                    break;

                case 'official-decrees':
                    await showComingSoon(
                        interaction,
                        '📢',
                        'Official Decrees'
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
                    await showComingSoon(
                        interaction,
                        '❓',
                        'Frequently Asked Questions'
                    );
                    break;

                case 'ticket-guide':
                    await showComingSoon(
                        interaction,
                        '🎫',
                        'Ticket Guide'
                    );
                    break;

                case 'full-setup':
                    await showComingSoon(
                        interaction,
                        '🚀',
                        'Full Server Setup'
                    );
                    break;

                default:
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Unknown Setup Module',
                                'The selected Setup Wizard option is not supported.'
                            )
                        ],

                        components: []
                    });
            }
        } catch (error) {
            console.error(
                '❌ Umbra setup interaction error:'
            );

            console.error(error);

            try {
                await sendSetupError(
                    interaction,
                    '❌ Setup Module Failed',
                    'Umbra could not process the selected setup module.'
                );
            } catch (responseError) {
                console.error(
                    '❌ Failed to send setup interaction error response:'
                );

                console.error(
                    responseError
                );
            }
        }
    }
};
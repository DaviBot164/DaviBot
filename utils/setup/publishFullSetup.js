const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const brand =
    require('../../config/brand');

const {
    publishVerificationGuide
} = require('./publishVerificationGuide');

const {
    publishSacredLaws
} = require('./publishSacredLaws');

const {
    publishServerGuide
} = require('./publishServerGuide');

const {
    publishRoleInformation
} = require('./publishRoleInformation');

const {
    publishFAQ
} = require('./publishFAQ');

const {
    publishTicketGuide
} = require('./publishTicketGuide');

const PUBLICATION_DELAY_MS =
    750;

/**
 * Wait briefly between publications.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(
    milliseconds
) {
    return new Promise(resolve => {
        const timer =
            setTimeout(
                resolve,
                milliseconds
            );

        timer.unref?.();
    });
}

/**
 * Publish the complete
 * LUNAR SEIREITEI information system.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFullSetup(
    interaction
) {
    try {
        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '☾ Setup Started',
                    [
                        `${brand.botName} is publishing the official **${brand.serverName}** information.`,
                        '',
                        '✦ Verification Guide',
                        '📜 Sacred Laws',
                        '📖 Soul Codex',
                        '♛ Role Hierarchy',
                        '❓ FAQ',
                        '🎫 Soul Sanctuary'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            `Full setup started by ${interaction.user.tag}.`
        );

        const publications = [
            publishVerificationGuide,
            publishSacredLaws,
            publishServerGuide,
            publishRoleInformation,
            publishFAQ,
            publishTicketGuide
        ];

        for (
            const [
                index,
                publish
            ] of publications.entries()
        ) {
            await publish(
                interaction
            );

            if (
                index <
                publications.length - 1
            ) {
                await wait(
                    PUBLICATION_DELAY_MS
                );
            }
        }

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Setup Complete',
                    [
                        'All information sections were published successfully.',
                        '',
                        `**${brand.serverName} is ready.**`,
                        '',
                        `-# ${brand.motto}`
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            `Full setup completed by ${interaction.user.tag}.`
        );
    } catch (error) {
        console.error(
            'Evelynn full setup error:',
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Setup Failed',
                    [
                        `${brand.botName} could not complete the full setup.`,
                        '',
                        'Some sections may already have been published.',
                        'Check the configured channel IDs, permissions and bot logs.'
                    ].join('\n')
                )
            ],

            components:
                []
        });
    }
}

module.exports = {
    PUBLICATION_DELAY_MS,
    publishFullSetup
};
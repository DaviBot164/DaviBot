const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

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

/**
 * Wait between publications.
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
 * THE Ⅹ SINS setup.
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
                    'Ⅹ Setup Started',
                    [
                        'Evelynn is publishing the official server information.',
                        '',
                        '✦ Verification Guide',
                        '📜 Code of Sins',
                        '📖 Sin Codex',
                        '♛ Role Hierarchy',
                        '❓ FAQ',
                        '🎫 Support Guide'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            `Ⅹ Full setup started by ${interaction.user.tag}.`
        );

        await publishVerificationGuide(
            interaction
        );

        await wait(
            750
        );

        await publishSacredLaws(
            interaction
        );

        await wait(
            750
        );

        await publishServerGuide(
            interaction
        );

        await wait(
            750
        );

        await publishRoleInformation(
            interaction
        );

        await wait(
            750
        );

        await publishFAQ(
            interaction
        );

        await wait(
            750
        );

        await publishTicketGuide(
            interaction
        );

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Setup Complete',
                    [
                        'All setup sections were published successfully.',
                        '',
                        '**THE Ⅹ SINS information system is ready.**'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            `✅ Full setup completed by ${interaction.user.tag}.`
        );
    } catch (error) {
        console.error(
            '❌ Evelynn full setup error:',
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Setup Failed',
                    [
                        'Evelynn could not complete the full setup.',
                        '',
                        'Some sections may already have been published.',
                        'Check channel IDs, permissions and logs.'
                    ].join('\n')
                )
            ],

            components:
                []
        });
    }
}

module.exports = {
    publishFullSetup
};
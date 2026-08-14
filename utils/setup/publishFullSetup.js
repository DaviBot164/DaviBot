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
 * Wait briefly between setup publications
 * to keep the process stable.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(
    milliseconds
) {
    return new Promise(resolve => {
        setTimeout(
            resolve,
            milliseconds
        );
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
                        'Evelynn is preparing the official **THE Ⅹ SINS** setup.',
                        '',
                        'Publishing:',
                        '',
                        '✦ **Verification Guide**',
                        'Ⅹ **Code of Sins**',
                        '📖 **Sin Codex**',
                        '♛ **Role Hierarchy**',
                        '❓ **FAQ**',
                        '🎫 **Support Guide**',
                        '',
                        'Each section will be published in sequence.'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            '======================================'
        );

        console.log(
            'Ⅹ THE Ⅹ SINS Full Setup Started'
        );

        console.log(
            `🛡️ Started By: ${interaction.user.tag}`
        );

        console.log(
            `🏰 Server: ${interaction.guild.name}`
        );

        console.log(
            '======================================'
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
                        'All **THE Ⅹ SINS** setup sections were published successfully.',
                        '',
                        '✅ Verification Guide',
                        '✅ Code of Sins',
                        '✅ Sin Codex',
                        '✅ Role Hierarchy',
                        '✅ FAQ',
                        '✅ Support Guide',
                        '',
                        '**The server information system is ready.**'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            '======================================'
        );

        console.log(
            '✅ THE Ⅹ SINS Full Setup Completed'
        );

        console.log(
            `🛡️ Completed By: ${interaction.user.tag}`
        );

        console.log(
            `🏰 Server: ${interaction.guild.name}`
        );

        console.log(
            '======================================'
        );
    } catch (error) {
        console.error(
            '❌ THE Ⅹ SINS full setup error:'
        );

        console.error(
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
                        '',
                        'Check channel IDs, permissions and Northflank logs.'
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
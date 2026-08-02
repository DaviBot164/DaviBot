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
 * to keep the process stable and organized.
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
 * Publish every available
 * Las Noches setup archive.
 *
 * Royal Laws, Kingdom Guide,
 * Kingdom Hierarchy and Knowledge Archive
 * are published in the configured
 * Information channel.
 *
 * Verification Guide and Support Codex
 * remain in their own configured channels.
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
                    '🚀 Las Noches Setup Initiated',
                    [
                        'Umbra is preparing the official archives of **Las Noches**.',
                        '',
                        'The following records will be published in the Information Archive:',
                        '',
                        '📜 **Royal Laws**',
                        '📖 **Kingdom Guide**',
                        '👑 **Kingdom Hierarchy**',
                        '📚 **Knowledge Archive**',
                        '',
                        'The following records will be published in their dedicated channels:',
                        '',
                        '⛩️ **Verification Guide**',
                        '🎫 **Support Codex**',
                        '',
                        'Umbra will prepare each archive in sequence.'
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
            '🚀 Las Noches Full Setup Started'
        );

        console.log(
            `🛡️ Started By: ${interaction.user.tag}`
        );

        console.log(
            `🏰 Kingdom: ${interaction.guild.name}`
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
        );        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    '✅ Las Noches Setup Complete',
                    [
                        'Umbra successfully published every available setup archive.',
                        '',
                        'Published in the Information Archive:',
                        '',
                        '✅ **Royal Laws**',
                        '✅ **Kingdom Guide**',
                        '✅ **Kingdom Hierarchy**',
                        '✅ **Knowledge Archive**',
                        '',
                        'Published in dedicated channels:',
                        '',
                        '✅ **Verification Guide**',
                        '✅ **Support Codex**',
                        '',
                        '> **The official records of Las Noches are now ready.**'
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
            '✅ Las Noches Full Setup Completed'
        );

        console.log(
            `🛡️ Completed By: ${interaction.user.tag}`
        );

        console.log(
            `🏰 Kingdom: ${interaction.guild.name}`
        );

        console.log(
            '======================================'
        );
    } catch (error) {
        console.error(
            '❌ Umbra Las Noches full setup error:'
        );

        console.error(
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Las Noches Setup Failed',
                    [
                        'Umbra could not complete every setup archive.',
                        '',
                        'Some records may already have been published before the error occurred.',
                        '',
                        'Check the configured channel IDs, Umbra permissions, and Northflank logs.'
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
const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

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
 * Wait for a short period between setup modules.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(
            resolve,
            milliseconds
        );
    });
}

/**
 * Publish every available Umbra setup module.
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
                    '🚀 Full Server Setup Started',
                    [
                        'Umbra is preparing the Crimson Eclipse Knowledge Center.',
                        '',
                        'The following modules will be published:',
                        '',
                        '📜 Sacred Laws',
                        '📖 Server Guide',
                        '🎖️ Role Information',
                        '❓ Frequently Asked Questions',
                        '🎫 Ticket Guide',
                        '',
                        'Please wait while each archive is prepared.'
                    ].join('\n')
                )
            ],

            components: []
        });

        console.log(
            '======================================'
        );

        console.log(
            '🚀 Full Server Setup Started'
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
                    '✅ Full Server Setup Complete',
                    [
                        'Umbra successfully published every available setup module.',
                        '',
                        '✅ Sacred Laws',
                        '✅ Server Guide',
                        '✅ Role Information',
                        '✅ Frequently Asked Questions',
                        '✅ Ticket Guide',
                        '',
                        'The Crimson Eclipse Knowledge Center is now ready.'
                    ].join('\n')
                )
            ],

            components: []
        });

        console.log(
            '======================================'
        );

        console.log(
            '✅ Full Server Setup Completed'
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
            '❌ Umbra full server setup error:'
        );

        console.error(
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Full Server Setup Failed',
                    [
                        'Umbra could not complete every setup module.',
                        '',
                        'Some modules may already have been published before the error occurred.',
                        '',
                        'Check the configured channels, Umbra permissions, and Northflank logs.'
                    ].join('\n')
                )
            ],

            components: []
        });
    }
}

module.exports = {
    publishFullSetup
};
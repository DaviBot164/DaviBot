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
 * Information modules are published in the configured
 * Information channel.
 *
 * The Ticket Guide remains in its configured
 * Ticket Guide channel.
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
                        'Umbra is preparing the official Crimson Eclipse information.',
                        '',
                        'The following modules will be published in the Information channel:',
                        '',
                        '📜 Sacred Laws',
                        '📖 Server Guide',
                        '🎖️ Role Information',
                        '❓ Frequently Asked Questions',
                        '',
                        'The following module will remain in the Ticket Guide channel:',
                        '',
                        '🎫 Ticket Guide',
                        '',
                        'Please wait while each module is prepared.'
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
                        'Published in the Information channel:',
                        '',
                        '✅ Sacred Laws',
                        '✅ Server Guide',
                        '✅ Role Information',
                        '✅ Frequently Asked Questions',
                        '',
                        'Published in the Ticket Guide channel:',
                        '',
                        '✅ Ticket Guide',
                        '',
                        'The official Crimson Eclipse information is now ready.'
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
                        'Check the configured channel IDs, Umbra permissions, and Northflank logs.'
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
const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

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

const PUBLICATIONS =
    Object.freeze([
        {
            name:
                'Verification Guide',

            publish:
                publishVerificationGuide
        },
        {
            name:
                'Royal Laws',

            publish:
                publishSacredLaws
        },
        {
            name:
                'Kingdom Guide',

            publish:
                publishServerGuide
        },
        {
            name:
                'Role Hierarchy',

            publish:
                publishRoleInformation
        },
        {
            name:
                'FAQ',

            publish:
                publishFAQ
        },
        {
            name:
                'Support Guide',

            publish:
                publishTicketGuide
        }
    ]);

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
 * Publish every configured information section.
 *
 * Legacy publication functions remain unchanged
 * for command and database compatibility.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFullSetup(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    try {
        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    'Setup Started',
                    [
                        `${profile.botName} is publishing the official **${profile.serverName}** information.`,
                        '',
                        ...PUBLICATIONS.map(
                            publication =>
                                `- ${publication.name}`
                        )
                    ].join('\n')
                )
            ],

            components:
                []
        });

        console.log(
            `Full setup started by ${interaction.user.tag}.`
        );

        for (
            const [
                index,
                publication
            ] of PUBLICATIONS.entries()
        ) {
            await publication.publish(
                interaction
            );

            if (
                index <
                PUBLICATIONS.length - 1
            ) {
                await wait(
                    PUBLICATION_DELAY_MS
                );
            }
        }

        await interaction.editReply({
            embeds: [
                createSuccessEmbed(
                    'Setup Complete',
                    [
                        'All information sections were published successfully.',
                        '',
                        `**${profile.serverName} is ready.**`,
                        '',
                        `-# ${profile.motto}`
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
            `${profile.botName} full setup error:`,
            error
        );

        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Setup Failed',
                    [
                        `${profile.botName} could not complete the full setup.`,
                        '',
                        'Some sections may already have been published.',
                        'Check the configured channels, permissions and bot logs.'
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
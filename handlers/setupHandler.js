const {
    MessageFlags
} = require('discord.js');

const {
    publishSacredLaws
} = require('../utils/setup/publishSacredLaws');

const {
    publishMoonGuide
} = require('../utils/setup/publishMoonGuide');

const {
    publishVerificationGuide
} = require('../utils/setup/publishVerificationGuide');

const {
    publishProgressionGuides
} = require('../utils/setup/publishProgressionGuides');

const {
    publishSupportGuide
} = require('../utils/setup/publishSupportGuide');

const {
    publishFullSetup
} = require('../utils/setup/publishFullSetup');

const {
    successEmbed,
    errorEmbed
} = require('../utils/embeds');

const SETUP_OPTIONS = Object.freeze({
    SACRED_LAWS: 'sacred_laws',
    MOON_GUIDE: 'moon_guide',
    VERIFICATION_GUIDE: 'verification_guide',
    PROGRESSION_GUIDES: 'progression_guides',
    SUPPORT_GUIDE: 'support_guide',
    FULL_SETUP: 'full_setup'
});

async function handleSetupSelect(interaction) {
    if (
        !interaction.isStringSelectMenu() ||
        interaction.customId !== 'akane:setup'
    ) {
        return false;
    }

    await interaction.deferReply({
        flags:
            MessageFlags.Ephemeral
    });

    const option =
        interaction.values[0];

    try {
        switch (option) {
            case SETUP_OPTIONS.SACRED_LAWS: {
                const message =
                    await publishSacredLaws(
                        interaction.guild
                    );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Sacred Laws Published',
                            `The Sacred Laws were published in ${message.channel}.`
                        )
                    ]
                });

                break;
            }

            case SETUP_OPTIONS.MOON_GUIDE: {
                const message =
                    await publishMoonGuide(
                        interaction.guild
                    );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Moon Guide Published',
                            `The Moon Guide was published in ${message.channel}.`
                        )
                    ]
                });

                break;
            }

            case SETUP_OPTIONS.VERIFICATION_GUIDE: {
                const message =
                    await publishVerificationGuide(
                        interaction.guild
                    );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Verification Guide Published',
                            `The verification guide was published in ${message.channel}.`
                        )
                    ]
                });

                break;
            }

            case SETUP_OPTIONS.PROGRESSION_GUIDES: {
                const messages =
                    await publishProgressionGuides(
                        interaction.guild
                    );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Progression Guides Published',
                            [
                                `Slayer guide published in ${messages.slayer.channel}.`,
                                `Demon guide published in ${messages.demon.channel}.`
                            ].join('\n')
                        )
                    ]
                });

                break;
            }

            case SETUP_OPTIONS.SUPPORT_GUIDE: {
                const message =
                    await publishSupportGuide(
                        interaction.guild
                    );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Support Guide Published',
                            `The support guide was published in ${message.channel}.`
                        )
                    ]
                });

                break;
            }

            case SETUP_OPTIONS.FULL_SETUP: {
                await publishFullSetup(
                    interaction.guild
                );

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Blood Moon Setup Complete',
                            [
                                'Akane configured the core server content.',
                                '',
                                '📜 Sacred Laws',
                                '📖 Moon Guide',
                                '⛩️ Verification Guide',
                                '⚔️ Slayer Path Guide',
                                '🩸 Demon Path Guide',
                                '⚔️ Path Selection',
                                '📜 Support Guide',
                                '🎫 Ticket Panel'
                            ].join('\n')
                        )
                    ]
                });

                break;
            }

            default:
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            'Unknown Setup Option',
                            'Akane could not recognize that setup option.'
                        )
                    ]
                });
        }
    } catch (error) {
        console.error(
            'Setup publish failed:',
            error
        );

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Publish Failed',
                    'Akane could not publish that setup content.'
                )
            ]
        });
    }

    return true;
}

module.exports = {
    SETUP_OPTIONS,
    handleSetupSelect
};
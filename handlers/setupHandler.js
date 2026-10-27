const {serverText}=require("../utils/guildContext");
const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { publishSacredLaws } = require('../utils/setup/publishSacredLaws');
const { publishMoonGuide } = require('../utils/setup/publishMoonGuide');
const { publishVerificationGuide } = require('../utils/setup/publishVerificationGuide');
const { publishRoleGuide } = require('../utils/setup/publishRoleGuide');
const { publishProgressionGuides } = require('../utils/setup/publishProgressionGuides');
const { publishGameGuide } = require('../utils/setup/publishGameGuide');
const { publishSupportGuide } = require('../utils/setup/publishSupportGuide');
const { publishTrainingGrounds } = require('../utils/setup/publishTrainingGrounds');
const { publishFullSetup } = require('../utils/setup/publishFullSetup');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const SETUP_OPTIONS = Object.freeze({
    SACRED_LAWS: 'sacred_laws',
    MOON_GUIDE: 'moon_guide',
    VERIFICATION_GUIDE: 'verification_guide',
    ROLE_GUIDE: 'role_guide',
    PROGRESSION_GUIDES: 'progression_guides',
    GAME_GUIDE: 'game_guide',
    SUPPORT_GUIDE: 'support_guide',
    TRAINING_GROUNDS: 'training_grounds',
    FULL_SETUP: 'full_setup'
});
async function handleSetupSelect(interaction) {
    if (!interaction.isStringSelectMenu() ||
        interaction.customId !== 'kitsune:setup') {
        return false;
    }
    if (!interaction.inGuild() || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: 'Manage Server permission is required.', flags: MessageFlags.Ephemeral });
        return true;
    }
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });
    const option = interaction.values[0];
    try {
        switch (option) {
            case SETUP_OPTIONS.SACRED_LAWS: {
                const message = await publishSacredLaws(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Sacred Laws Published', `The Sacred Laws were published in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.MOON_GUIDE: {
                const message = await publishMoonGuide(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Moon Guide Published', `The Moon Guide was published in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.VERIFICATION_GUIDE: {
                const message = await publishVerificationGuide(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Verification Guide Published', `The verification guide was published in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.ROLE_GUIDE: {
                const message = await publishRoleGuide(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Role Guide Published', `The role guide was published in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.PROGRESSION_GUIDES: {
                const messages = await publishProgressionGuides(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Progression Guides Published', [
                            serverText(`Slayer guide published in ${messages.slayer.channel}.`),
                            serverText(`Demon guide published in ${messages.demon.channel}.`)
                        ].join('\n'))
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.GAME_GUIDE: {
                const message = await publishGameGuide(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Game Guide Published', serverText(`The Slayers 2 guide directory was published in ${message.channel}.`))
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.SUPPORT_GUIDE: {
                const message = await publishSupportGuide(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Support Guide Published', `The support guide was published in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.TRAINING_GROUNDS: {
                const message = await publishTrainingGrounds(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed('Training Grounds Ready', `The training panel was published or updated in ${message.channel}.`)
                    ]
                });
                break;
            }
            case SETUP_OPTIONS.FULL_SETUP: {
                await publishFullSetup(interaction.guild);
                await interaction.editReply({
                    embeds: [
                        successEmbed(serverText('Blood Moon Setup Complete'), [
                            'Kitsune configured the core server content.',
                            '',
                            '📜 Sacred Laws',
                            '📖 Moon Guide',
                            '⛩️ Verification Guide',
                            '🎭 Role Guide',
                            serverText('⚔️ Slayer Path Guide'),
                            serverText('🩸 Demon Path Guide'),
                            '🗺️ Game Guide',
                            '⚔️ Path Selection',
                            '📜 Support Guide',
                            '🎫 Ticket Panel',
                            '🦊 Mission Control'
                        ].join('\n'))
                    ]
                });
                break;
            }
            default:
                await interaction.editReply({
                    embeds: [
                        errorEmbed('Unknown Setup Option', 'Kitsune could not recognize that setup option.')
                    ]
                });
        }
    }
    catch (error) {
        console.error('Setup publish failed:', error);
        await interaction.editReply({
            embeds: [
                errorEmbed('Publish Failed', 'Kitsune could not publish that setup content.')
            ]
        });
    }
    return true;
}
module.exports = {
    SETUP_OPTIONS,
    handleSetupSelect
};

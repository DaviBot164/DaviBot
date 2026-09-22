const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function buildTrialComponents(
    trialId,
    disabled = false
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `akane:trial:register:${trialId}`
                )
                .setLabel('Register')
                .setEmoji('⚔️')
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId(
                    `akane:trial:withdraw:${trialId}`
                )
                .setLabel('Withdraw')
                .setEmoji('🚪')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(disabled)
        );
}

module.exports = {
    buildTrialComponents
};
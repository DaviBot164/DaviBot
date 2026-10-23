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
                    `kitsune:trial:register:${trialId}`
                )
                .setLabel('Register')
                .setEmoji('⚔️')
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(disabled),

            new ButtonBuilder()
                .setCustomId(
                    `kitsune:trial:withdraw:${trialId}`
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

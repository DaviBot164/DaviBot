const {
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

/**
 * Build the Event creation modal.
 *
 * @param {string} userId
 * @returns {ModalBuilder}
 */
function buildEventModal(
    userId
) {
    const modal =
        new ModalBuilder()
            .setCustomId(
                `umbra:event:create:${userId}`
            )
            .setTitle(
                'Create Crimson Eclipse Event'
            );

    const titleInput =
        new TextInputBuilder()
            .setCustomId(
                'event-title'
            )
            .setLabel(
                'Event Title'
            )
            .setPlaceholder(
                'Example: PvP Tournament'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(3)
            .setMaxLength(100)
            .setRequired(true);

    const descriptionInput =
        new TextInputBuilder()
            .setCustomId(
                'event-description'
            )
            .setLabel(
                'Event Description'
            )
            .setPlaceholder(
                'Explain what will happen during the event.'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setMinLength(5)
            .setMaxLength(1000)
            .setRequired(true);

    const timeInput =
        new TextInputBuilder()
            .setCustomId(
                'event-time'
            )
            .setLabel(
                'Event Time'
            )
            .setPlaceholder(
                'Example: Today at 8:00 PM'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(2)
            .setMaxLength(100)
            .setRequired(true);

    const rewardInput =
        new TextInputBuilder()
            .setCustomId(
                'event-reward'
            )
            .setLabel(
                'Event Reward'
            )
            .setPlaceholder(
                'Example: Eclipse Champion role'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(2)
            .setMaxLength(200)
            .setRequired(true);

    const maxPlayersInput =
        new TextInputBuilder()
            .setCustomId(
                'event-max-players'
            )
            .setLabel(
                'Maximum Players'
            )
            .setPlaceholder(
                'Example: 20'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(1)
            .setMaxLength(4)
            .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                titleInput
            ),

        new ActionRowBuilder()
            .addComponents(
                descriptionInput
            ),

        new ActionRowBuilder()
            .addComponents(
                timeInput
            ),

        new ActionRowBuilder()
            .addComponents(
                rewardInput
            ),

        new ActionRowBuilder()
            .addComponents(
                maxPlayersInput
            )
    );

    return modal;
}

module.exports = {
    buildEventModal
};
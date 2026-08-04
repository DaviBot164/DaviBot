const {
    Events
} = require('discord.js');

/**
 * Return a readable name for one
 * Discord interaction type.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {string}
 */
function getInteractionTypeName(
    interaction
) {
    if (
        interaction.isChatInputCommand()
    ) {
        return 'CHAT_INPUT_COMMAND';
    }

    if (
        interaction.isButton()
    ) {
        return 'BUTTON';
    }

    if (
        interaction.isStringSelectMenu()
    ) {
        return 'STRING_SELECT_MENU';
    }

    if (
        interaction.isModalSubmit()
    ) {
        return 'MODAL_SUBMIT';
    }

    if (
        interaction.isAutocomplete()
    ) {
        return 'AUTOCOMPLETE';
    }

    return `UNKNOWN_TYPE_${interaction.type}`;
}

/**
 * Return the command name or component
 * Custom ID connected to an interaction.
 *
 * @param {import('discord.js').Interaction} interaction
 * @returns {string}
 */
function getInteractionIdentifier(
    interaction
) {
    if (
        interaction.isChatInputCommand() ||
        interaction.isAutocomplete()
    ) {
        return interaction.commandName;
    }

    if (
        interaction.isMessageComponent() ||
        interaction.isModalSubmit()
    ) {
        return interaction.customId;
    }

    return 'No identifier';
}module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Temporary diagnostic listener.
     *
     * This file exists only to verify
     * whether Discord Gateway delivers
     * interactions to Umbra.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        console.log(
            '======================================'
        );

        console.log(
            '🔔 INTERACTION RECEIVED'
        );

        console.log(
            `📦 Type: ${getInteractionTypeName(
                interaction
            )}`
        );

        console.log(
            `🧩 Identifier: ${getInteractionIdentifier(
                interaction
            )}`
        );

        console.log(
            `👤 User: ${
                interaction.user?.tag ??
                'Unknown User'
            }`
        );

        console.log(
            `🏰 Guild: ${
                interaction.guild?.name ??
                'Direct Message'
            }`
        );        console.log(
            `📡 Interaction ID: ${interaction.id}`
        );

        console.log(
            `⏰ Created: ${new Date(
                interaction.createdTimestamp
            ).toISOString()}`
        );

        console.log(
            '======================================'
        );
    }
};
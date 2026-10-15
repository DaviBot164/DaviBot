
const {
    Events,
    MessageFlags
} = require('discord.js');

const {
    handlePathButton
} = require('../handlers/pathHandler');

const {
    handleTrialButton
} = require('../handlers/trialInteractionHandler');

const {
    handleTitleSelect
} = require('../handlers/titleHandler');

const {
    handleTicketInteraction
} = require('../handlers/ticketInteractionHandler');

const {
    handleSetupSelect
} = require('../handlers/setupHandler');

const {
    handleTrainingButton
} = require('../handlers/trainingInteractionHandler');

const {
    handleQuestInteraction
} = require('../handlers/questInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (await handleQuestInteraction(interaction)) {
                    return;
                }

                if (await handleTrainingButton(interaction)) {
                    return;
                }

                if (await handlePathButton(interaction)) {
                    return;
                }

                if (await handleTrialButton(interaction)) {
                    return;
                }

                if (await handleTicketInteraction(interaction)) {
                    return;
                }

                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (await handleTitleSelect(interaction)) {
                    return;
                }

                if (await handleTicketInteraction(interaction)) {
                    return;
                }

                if (await handleSetupSelect(interaction)) {
                    return;
                }

                return;
            }

            if (interaction.isAutocomplete()) {
                const command = interaction.client.commands.get(
                    interaction.commandName
                );

                if (command?.autocomplete) {
                    await command.autocomplete(interaction);
                }

                return;
            }

            if (!interaction.isChatInputCommand()) {
                return;
            }

            const command = interaction.client.commands.get(
                interaction.commandName
            );

            if (!command) {
                return;
            }

            await command.execute(interaction);
        } catch (error) {
            console.error('Interaction failed:', error);

            if (
                !interaction.isRepliable() ||
                interaction.isAutocomplete()
            ) {
                return;
            }

            const payload = {
                content: 'Akane could not complete that action.'
            };

            if (interaction.deferred) {
                await interaction.editReply(payload)
                    .catch(() => null);

                return;
            }

            if (interaction.replied) {
                await interaction.followUp({
                    ...payload,
                    flags: MessageFlags.Ephemeral
                }).catch(() => null);

                return;
            }

            await interaction.reply({
                ...payload,
                flags: MessageFlags.Ephemeral
            }).catch(() => null);
        }
    }
};

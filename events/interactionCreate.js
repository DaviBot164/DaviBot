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

const {
    handleMatchInteraction
} = require('../handlers/matchInteractionHandler');

const {
    handleHelpSelect
} = require('../handlers/helpInteractionHandler');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (await require('../handlers/hub/runtime').handle(interaction)) return;
            if(!require('../handlers/guildModules').allowed(interaction)){if(interaction.isAutocomplete?.()){await interaction.respond([]);return;}if(interaction.isRepliable?.())await interaction.reply({content:'This system is disabled on this server.',flags:MessageFlags.Ephemeral});return;}

            if (interaction.isButton()) {
                if (await handleMatchInteraction(interaction)) {
                    return;
                }

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
                if (await handleHelpSelect(interaction)) {
                    return;
                }

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
                content: 'Kitsune could not complete that action.'
            };

            if (interaction.deferred) {
                if (
                    interaction.isButton() ||
                    interaction.isStringSelectMenu()
                ) {
                    await interaction.followUp({
                        ...payload,
                        flags: MessageFlags.Ephemeral
                    }).catch(() => null);

                    return;
                }

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

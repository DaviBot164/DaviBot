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

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (
                    await handlePathButton(
                        interaction
                    )
                ) {
                    return;
                }

                if (
                    await handleTrialButton(
                        interaction
                    )
                ) {
                    return;
                }

                if (
                    await handleTicketInteraction(
                        interaction
                    )
                ) {
                    return;
                }

                return;
            }

            if (interaction.isStringSelectMenu()) {
                if (
                    await handleTitleSelect(
                        interaction
                    )
                ) {
                    return;
                }

                if (
                    await handleTicketInteraction(
                        interaction
                    )
                ) {
                    return;
                }

                return;
            }

            if (interaction.isAutocomplete()) {
                const command =
                    interaction.client.commands.get(
                        interaction.commandName
                    );

                if (!command?.autocomplete) {
                    return;
                }

                await command.autocomplete(
                    interaction
                );

                return;
            }

            if (!interaction.isChatInputCommand()) {
                return;
            }

            const command =
                interaction.client.commands.get(
                    interaction.commandName
                );

            if (!command) {
                return;
            }

            await command.execute(
                interaction
            );
        } catch (error) {
            console.error(
                'Interaction failed:',
                error
            );

            if (
                !interaction.isRepliable() ||
                interaction.isAutocomplete()
            ) {
                return;
            }

            const payload = {
                content:
                    'Akane could not complete that action.',

                flags:
                    MessageFlags.Ephemeral
            };

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                delete payload.flags;

                await interaction.followUp(
                    payload
                ).catch(() => null);

                return;
            }

            await interaction.reply(
                payload
            ).catch(() => null);
        }
    }
};
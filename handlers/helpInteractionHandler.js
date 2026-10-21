const {
    HELP_MENU_ID,
    buildHelpEmbed,
    buildHelpMenu
} = require('../commands/information/help');

async function handleHelpSelect(interaction) {
    if (
        !interaction.isStringSelectMenu() ||
        interaction.customId !== HELP_MENU_ID
    ) {
        return false;
    }

    await interaction.deferUpdate();

    const requested = interaction.values[0] ?? 'overview';

    const available = buildHelpMenu(interaction, 'overview');

    const options = available[0]
        .toJSON()
        .components[0]
        .options;

    const selected = options.some(
        option => option.value === requested
    )
        ? requested
        : 'overview';

    await interaction.editReply({
        embeds: [
            buildHelpEmbed(interaction, selected)
        ],
        components: buildHelpMenu(interaction, selected),
        allowedMentions: { parse: [] }
    });

    return true;
}

module.exports = { handleHelpSelect };
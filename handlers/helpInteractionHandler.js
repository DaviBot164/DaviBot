
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

    const section = interaction.values[0];

    await interaction.update({
        embeds: [
            buildHelpEmbed(interaction, section)
        ],
        components: buildHelpMenu(interaction, section)
    });

    return true;
}

module.exports = {
    handleHelpSelect
};

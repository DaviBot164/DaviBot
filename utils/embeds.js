const { EmbedBuilder } = require("discord.js");
const embedConfig = require("../config/embed");

function createEmbed(interaction) {
    return new EmbedBuilder()
        .setColor(embedConfig.colors.primary)
        .setFooter({
            text: `${embedConfig.footer.text} • Requested by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
}

function createSuccessEmbed(interaction, title, description) {
    return createEmbed(interaction)
        .setColor(embedConfig.colors.success)
        .setAuthor({
            name: `✅ ${title}`,
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .setDescription(description);
}

function createErrorEmbed(interaction, reason, tip = null) {
    const embed = createEmbed(interaction)
        .setColor(embedConfig.colors.error)
        .setAuthor({
            name: "❌ Action Failed",
            iconURL: interaction.client.user.displayAvatarURL()
        })
        .addFields({
            name: "Reason",
            value: reason
        });

    if (tip) {
        embed.addFields({
            name: "Tip",
            value: tip
        });
    }

    return embed;
}

module.exports = {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
};
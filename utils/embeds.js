const { EmbedBuilder } = require('discord.js');
const brand = require('../config/brand');
const colors = require('../config/colors');

function createEmbed(title, description, color = colors.primary) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: brand.footer })
        .setTimestamp();
}

function successEmbed(title, description) {
    return createEmbed(title, description, colors.success);
}

function errorEmbed(title, description) {
    return createEmbed(title, description, colors.error);
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed
};
const {serverText}=require("../utils/guildContext");
const { MessageFlags } = require('discord.js');
const { getUser } = require('../database/users');
const { assignFaction } = require('./factionService');
const { FACTIONS } = require('../config/progression');
const brand = require('../config/brand');
const { createEmbed, errorEmbed } = require('../utils/embeds');
const PATHS = Object.freeze({
    'kitsune:path:slayer': {
        faction: FACTIONS.SLAYER,
        name: serverText('Slayer'),
        emoji: '⚔️'
    },
    'kitsune:path:demon': {
        faction: FACTIONS.DEMON,
        name: serverText('Demon'),
        emoji: '🩸'
    }
});
async function handlePathButton(interaction) {
    const path = PATHS[interaction.customId];
    if (!path) {
        return false;
    }
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });
    const user = await getUser(interaction.guild.id, interaction.user.id);
    if (user?.faction) {
        const current = user.faction === FACTIONS.SLAYER
            ? serverText('⚔️ Slayer') : serverText('🩸 Demon');
        await interaction.editReply({
            embeds: [
                errorEmbed('Path Already Chosen', `Your current path is **${current}**.`)
            ]
        });
        return true;
    }
    const result = await assignFaction(interaction.member, path.faction);
    const embed = createEmbed(`${path.emoji} ${path.name} Path`, [
        `You have chosen the **${path.name} Path**.`,
        '',
        `Your journey begins as **${result.rank.name}**.`,
        '',
        serverText('Your actions beneath the Blood Moon will shape what comes next.')
    ].join('\n'))
        .setThumbnail(interaction.user
        .displayAvatarURL({
        size: 256
    }))
        .setFooter({
        text: brand.footer
    });
    await interaction.editReply({
        embeds: [
            embed
        ]
    });
    return true;
}
module.exports = {
    handlePathButton
};

const { SlashCommandBuilder } = require('discord.js');
const { ensureUser } = require('../../database/users');
const { getRanks, XP } = require('../../config/progression');
const { factionName } = require('../../utils/guildContext');
const { createEmbed, errorEmbed } = require('../../utils/embeds');
module.exports = {
    data: new SlashCommandBuilder().setName('profile')
        .setDescription('View level, XP, faction and rank.').setDMPermission(false)
        .addUserOption(o => o.setName('member').setDescription('Member to view.')),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('member') ?? interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member || member.user.bot) return interaction.editReply({ embeds: [errorEmbed('Profile unavailable', 'Choose a current server member who is not a bot.')] });
        const user = await ensureUser(interaction.guild.id, member.id, member.joinedAt);
        const rank = getRanks(user.faction).find(r => r.id === user.rank);
        const embed = createEmbed('Member Profile', `${member}`)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Level', value: String(user.level), inline: true },
                { name: 'XP', value: `${user.xp} / ${XP.requiredForLevel(Number(user.level))}`, inline: true },
                { name: 'Faction', value: user.faction ? factionName(user.faction) : 'Not selected', inline: true },
                { name: 'Rank', value: rank?.name ?? user.rank ?? 'Unranked', inline: true },
                { name: 'Eligible messages', value: String(user.messages), inline: true }
            );
        await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
    }
};

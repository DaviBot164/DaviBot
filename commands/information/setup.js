const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

const brand = require('../../config/brand');
const { createEmbed } = require('../../utils/embeds');

const SETUP_ITEMS = [
    {
        label: 'Sacred Laws',
        description: 'Publish the Blood Moon server rules.',
        value: 'sacred_laws',
        emoji: '📜'
    },
    {
        label: 'Moon Guide',
        description: 'Publish the Blood Moon server guide.',
        value: 'moon_guide',
        emoji: '📖'
    },
    {
        label: 'Verification Guide',
        description: 'Publish Bloxlink verification instructions.',
        value: 'verification_guide',
        emoji: '⛩️'
    },
    {
        label: 'Role Guide',
        description: 'Publish the Blood Moon role hierarchy.',
        value: 'role_guide',
        emoji: '🎭'
    },
    {
        label: 'Progression Guides',
        description: 'Publish Slayer and Demon rank guides.',
        value: 'progression_guides',
        emoji: '⚔️'
    },
    {
        label: 'Game Guide',
        description: 'Publish the Slayers 2 guide directory.',
        value: 'game_guide',
        emoji: '🗺️'
    },
    {
        label: 'Support Guide',
        description: 'Publish the Blood Moon support guide.',
        value: 'support_guide',
        emoji: '📜'
    },
    {
        label: 'Mission Control',
        description: 'Update Daily Drop, Missions and profile buttons.',
        value: 'training_grounds',
        emoji: '🥋'
    },
    {
        label: 'Full Setup',
        description: 'Publish all core Blood Moon setup content.',
        value: 'full_setup',
        emoji: '🌙'
    }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Open the Blood Moon setup wizard.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    async execute(interaction) {
        if (!interaction.inGuild() || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({content:'Manage Server permission is required.',flags:MessageFlags.Ephemeral});
            return;
        }
        const embed = createEmbed(
            '🌙 Blood Moon • Setup Studio',
            '**Give every entrance a little atmosphere.**\nChoose a section below to publish or refresh its content.'
        ).setColor('#781D32').addFields(
            {name:'01 · First impressions',value:'📜 **Sacred Laws** — Short, clear community rules\n📖 **Moon Guide** — A member’s first steps\n⛩️ **Verification** — Bloxlink and account access'},
            {name:'02 · Build the journey',value:'🎭 **Roles** — Ranks, milestones and staff\n⚔️ **Progression** — Slayer and Demon paths\n🦊 **Mission Control** — Daily Drop, Missions and profile'},
            {name:'03 · Find your way',value:'🗺️ **Game Guide** — Community guides and parties\n🎫 **Support** — Questions, reports and appeals'},
            {name:'🌙 Full Setup',value:'Refresh the guides, path selection, ticket panel and Mission Control together. Sections publish one after another; a failure may leave earlier sections updated.'}
        ).setFooter({text:brand.footer});
        const icon=interaction.guild.iconURL({size:256});
        if(icon)embed.setThumbnail(icon);

        const menu = new StringSelectMenuBuilder()
            .setCustomId('kitsune:setup')
            .setPlaceholder('Choose a setup option')
            .addOptions(SETUP_ITEMS);

        const row = new ActionRowBuilder()
            .addComponents(menu);

        await interaction.reply({
            flags: MessageFlags.Ephemeral,
            embeds: [embed],
            components: [row]
        });
    }
};

const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed
} = require('../../utils/embeds');

const PUBLIC_SECTIONS = Object.freeze([
    {
        name: '⚔️ PROGRESSION',
        commands: [
            '/profile',
            '/path',
            '/achievements',
            '/titles',
            '/corps',
            '/legacy'
        ]
    },
    {
        name: '🏯 RANKS & TRIALS',
        commands: [
            '/trial'
        ]
    },
    {
        name: '⚙️ UTILITY',
        commands: [
            '/ping'
        ]
    }
]);

const STAFF_SECTIONS = Object.freeze([
    {
        name: '🏯 RANK MANAGEMENT',
        commands: [
            '/setrank',
            '/removerank',
            '/rankhistory'
        ]
    },
    {
        name: '🛡️ MODERATION',
        commands: [
            '/warn',
            '/warnings',
            '/unwarn',
            '/timeout',
            '/untimeout',
            '/kick',
            '/ban',
            '/unban',
            '/clear',
            '/slowmode',
            '/lock',
            '/unlock',
            '/case',
            '/history'
        ]
    },
    {
        name: '🌑 ADMINISTRATION',
        commands: [
            '/setup',
            '/ticketpanel',
            '/emergency'
        ]
    },
    {
        name: '🩸 TESTING',
        commands: [
            '/testlevel',
            '/testwelcome'
        ]
    }
]);

function formatCommands(commands) {
    return commands
        .map(command => `\`${command}\``)
        .join('  ');
}

function addSections(
    embed,
    sections
) {
    for (const section of sections) {
        embed.addFields({
            name:
                section.name,

            value:
                formatCommands(
                    section.commands
                )
        });
    }

    return embed;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('help')
            .setDescription(
                'View Akane commands.'
            ),

    async execute(interaction) {
        const isStaff =
            interaction.memberPermissions
                ?.has(
                    PermissionFlagsBits
                        .ManageMessages
                ) ?? false;

        const embed =
            createEmbed(
                '🌙 AKANE • COMMANDS',
                isStaff
                    ? 'Blood Moon command directory • Staff Access'
                    : 'Blood Moon command directory'
            );

        addSections(
            embed,
            PUBLIC_SECTIONS
        );

        if (isStaff) {
            addSections(
                embed,
                STAFF_SECTIONS
            );
        }

        embed.setFooter({
            text:
                isStaff
                    ? 'Akane • Blood Moon • 31 Commands'
                    : 'Akane • Blood Moon'
        });

        await interaction.reply({
            embeds: [
                embed
            ]
        });
    }
};
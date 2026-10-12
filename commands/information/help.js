const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

const SECTIONS = [
    {
        name: '⚔️ PROGRESSION',
        commands: [
            ['profile', 'View your progression.'],
            ['path', 'Choose your faction.'],
            ['achievements', 'View your achievements.'],
            ['titles', 'View your titles.'],
            ['leaderboard', 'View the level and XP rankings.'],
            ['corps', 'Browse members and ranks.'],
            ['legacy', 'Explore achievements, titles and ranks.']
        ]
    },
    {
        name: '🏯 RANKS & TRIALS',
        commands: [
            ['trial', 'View rank trials.']
        ]
    },
    {
        name: '⚙️ UTILITY',
        commands: [
            ['help', 'View available commands.'],
            ['ping', 'Check bot latency.']
        ]
    },
    {
        name: '🏯 RANK MANAGEMENT',
        staff: true,
        commands: [
            ['setrank', 'Assign a rank.'],
            ['removerank', 'Remove a rank.'],
            ['rankhistory', 'View rank changes.']
        ]
    },
    {
        name: '🛡️ MODERATION',
        staff: true,
        commands: [
            ['warn', 'Warn a member.'],
            ['warnings', 'View member warnings.'],
            ['unwarn', 'Remove a warning.'],
            ['timeout', 'Timeout a member.'],
            ['untimeout', 'Remove a timeout.'],
            ['kick', 'Kick a member.'],
            ['ban', 'Ban a user.'],
            ['unban', 'Unban a user.'],
            ['clear', 'Delete messages.'],
            ['slowmode', 'Set channel slowmode.'],
            ['lock', 'Lock a channel.'],
            ['unlock', 'Unlock a channel.'],
            ['case', 'View a moderation case.'],
            ['history', 'View moderation history.']
        ]
    },
    {
        name: '🌑 ADMINISTRATION',
        staff: true,
        commands: [
            ['announce', 'Publish an announcement.'],
            ['setup', 'Configure server information.'],
            ['ticketpanel', 'Publish a ticket panel.'],
            ['emergency', 'Manage emergency protection.']
        ]
    },
    {
        name: '🩸 TESTING',
        staff: true,
        commands: [
            ['testlevel', 'Test level notifications.'],
            ['testwelcome', 'Test welcome notifications.']
        ]
    }
];

function canViewCommand(interaction, command, staff) {
    const permissions = interaction.memberPermissions;
    const required = command.data.toJSON()
        .default_member_permissions;

    if (required != null) {
        return permissions?.has(
            new PermissionsBitField(BigInt(required))
        ) ?? false;
    }

    return !staff || (
        permissions?.has(PermissionFlagsBits.ManageMessages)
        ?? false
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View available Akane commands.'),

    async execute(interaction) {
        const commands = interaction.client.commands;

        const embed = createEmbed(
            '🌙 AKANE • HELP',
            'Explore your progression and available commands.'
        );

        let count = 0;

        for (const section of SECTIONS) {
            const visible = section.commands.filter(([name]) => {
                const command = commands.get(name);

                return command && canViewCommand(
                    interaction,
                    command,
                    section.staff
                );
            });

            if (!visible.length) continue;

            count += visible.length;

            embed.addFields({
                name: section.name,
                value: visible
                    .map(([name, description]) =>
                        `\`/${name}\` — ${description}`
                    )
                    .join('\n')
            });
        }

        embed.setFooter({
            text: `Akane • Blood Moon • ${count} Commands Available`
        });

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};
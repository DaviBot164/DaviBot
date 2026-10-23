const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');

const { createEmbed } = require('../../utils/embeds');

const HELP_MENU_ID = 'kitsune:help:section';

const SECTIONS = [
    {
        id: 'progression',
        name: '⚔️ PROGRESSION',
        description: 'Levels, rewards and achievements',
        emoji: '⚔️',
        commands: {
            profile: 'View your profile and battle statistics.',
            daily: 'Claim your daily XP reward.',
            achievements: 'View your achievements.',
            titles: 'Explore and equip titles.',
            leaderboard: 'View XP and level rankings.',
            corps: 'Browse faction members and ranks.',
            legacy: 'Explore Blood Moon accomplishments.'
        }
    },
    {
        id: 'battles',
        name: '🩸 PvP & TRAINING',
        description: 'Matches, quests and training',
        emoji: '🩸',
        commands: {
            match: 'Create a 1v1–5v5 match for any game.',
            training: 'Access training activities.',
            quests: 'View daily quests.'
        }
    },
    {
        id: 'ranks',
        name: '🏯 RANKS & TRIALS',
        description: 'Rank trials and advancement',
        emoji: '🏯',
        commands: {
            trial: 'View rank trials.'
        }
    },
    {
        id: 'utility',
        name: '⚙️ UTILITY',
        description: 'General bot commands',
        emoji: '⚙️',
        commands: {
            help: 'Open the command center.',
            avatar: 'View a user avatar.',
            ping: 'Check bot latency.'
        }
    },
    {
        id: 'management',
        name: '👑 RANK MANAGEMENT',
        description: 'Faction and rank administration',
        emoji: '👑',
        staff: true,
        commands: {
            path: 'Publish the faction selection panel.',
            setrank: 'Assign a faction rank.',
            removerank: 'Remove a faction rank.',
            rankhistory: 'View rank changes.'
        }
    },
    {
        id: 'moderation',
        name: '🛡️ MODERATION',
        description: 'Moderation and member safety',
        emoji: '🛡️',
        staff: true,
        commands: {
            warn: 'Warn a member.',
            warnings: 'View member warnings.',
            unwarn: 'Remove a warning.',
            timeout: 'Timeout a member.',
            untimeout: 'Remove a timeout.',
            kick: 'Kick a member.',
            ban: 'Ban a user.',
            unban: 'Unban a user.',
            clear: 'Delete messages.',
            slowmode: 'Manage slowmode.',
            lock: 'Lock a channel.',
            unlock: 'Unlock a channel.',
            case: 'View a moderation case.',
            history: 'View moderation history.'
        }
    },
    {
        id: 'administration',
        name: '🌑 ADMINISTRATION',
        description: 'Server setup and management',
        emoji: '🌑',
        staff: true,
        commands: {
            announce: 'Publish an announcement.',
            setup: 'Publish server guides.',
            ticketpanel: 'Publish the support panel.',
            emergency: 'Manage emergency protection.',
            matchmanage: 'Cancel matches or resolve disputes.'
        }
    },
    {
        id: 'testing',
        name: '🧪 TESTING',
        description: 'Staff testing tools',
        emoji: '🧪',
        staff: true,
        commands: {
            testlevel: 'Test level notifications.',
            testwelcome: 'Test welcome notifications.'
        }
    }
];

function canViewCommand(interaction, command, staff = false) {
    const permissions = interaction.memberPermissions;

    if (!permissions) return !staff &&
        command.data.toJSON().default_member_permissions == null;

    if (permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    const required = command.data.toJSON()
        .default_member_permissions;

    if (required != null) {
        const bits = BigInt(required);

        if (bits === 0n) return false;

        return permissions.has(new PermissionsBitField(bits));
    }

    return !staff ||
        permissions.has(PermissionFlagsBits.ManageMessages);
}
function getVisibleSections(interaction) {
    return SECTIONS.map(section => ({
        ...section,
        visible: Object.entries(section.commands)
            .filter(([name]) => {
                const command = interaction.client.commands.get(name);

                return command && canViewCommand(
                    interaction,
                    command,
                    section.staff
                );
            })
    })).filter(section => section.visible.length);
}

function getOtherCommands(interaction) {
    const listed = new Set(
        SECTIONS.flatMap(section =>
            Object.keys(section.commands)
        )
    );

    return [...interaction.client.commands.values()]
        .filter(command =>
            !listed.has(command.data.name) &&
            canViewCommand(interaction, command)
        )
        .sort((a, b) =>
            a.data.name.localeCompare(b.data.name)
        )
        .map(command => [
            command.data.name,
            command.data.description
        ]);
}

function buildHelpEmbed(interaction, selected = 'overview') {
    const sections = getVisibleSections(interaction);
    const other = getOtherCommands(interaction);

    const embed = createEmbed(
        '🌙 KITSUNE • COMMAND CENTER',
        selected === 'overview'
            ? [
                '**Welcome to the Blood Moon command center.**',
                'Select a category below to explore its commands.',
                '',
                'Commands are filtered by default member permissions. Server command overrides may affect access.'
            ].join('\n')
            : 'Explore your available commands.'
    );

    let count = 0;

    if (selected === 'overview') {
        for (const section of sections) {
            embed.addFields({
                name: section.name,
                value: section.visible
                    .map(([name]) => `\`/${name}\``)
                    .join(' • ')
            });

            count += section.visible.length;
        }

        if (other.length) {
            embed.addFields({
                name: '📚 OTHER COMMANDS',
                value: other.map(([name]) =>
                    `\`/${name}\``
                ).join(' • ')
            });

            count += other.length;
        }
    } else {
        const section = sections.find(item =>
            item.id === selected
        );

        const commands = selected === 'other'
            ? other
            : section?.visible ?? [];

        if (commands.length) {
            embed.addFields({
                name: section?.name ?? '📚 OTHER COMMANDS',
                value: commands.map(([name, description]) =>
                    `\`/${name}\` — ${description}`
                ).join('\n')
            });
        } else {
            embed.setDescription(
                'No commands are available in this category.'
            );
        }

        count = commands.length;
    }

    embed.setFooter({
        text: `KITSUNE • BLOOD MOON • ${count} Commands`
    });

    const icon = interaction.guild?.iconURL({ size: 256 });

    if (icon) {
        embed.setThumbnail(icon);
    }

    return embed;
}

function buildHelpMenu(interaction, selected = 'overview') {
    const sections = getVisibleSections(interaction);
    const other = getOtherCommands(interaction);

    const options = [
        {
            label: 'Overview',
            value: 'overview',
            description: 'View all available command categories.',
            emoji: '🌙'
        },
        ...sections.map(section => ({
            label: section.name.replace(
                /^[^\p{L}\p{N}]+/u,
                ''
            ),
            value: section.id,
            description: section.description,
            emoji: section.emoji
        }))
    ];

    if (other.length) {
        options.push({
            label: 'Other Commands',
            value: 'other',
            description: 'Additional available commands.',
            emoji: '📚'
        });
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId(HELP_MENU_ID)
        .setPlaceholder('Explore Kitsune commands')
        .addOptions(
            options.map(option => ({
                ...option,
                default: option.value === selected
            }))
        );

    return [
        new ActionRowBuilder().addComponents(menu)
    ];
}

module.exports = {
    HELP_MENU_ID,
    buildHelpEmbed,
    buildHelpMenu,

    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(
            'Explore Blood Moon commands and systems.'
        )
        .addStringOption(option =>
            option
                .setName('section')
                .setDescription('Choose a command category.')
                .setRequired(false)
                .addChoices(
                    ...SECTIONS.map(section => ({
                        name: section.name,
                        value: section.id
                    }))
                )
        ),

    async execute(interaction) {
        const section = interaction.options.getString('section')
            ?? 'overview';

        await interaction.reply({
            embeds: [
                buildHelpEmbed(interaction, section)
            ],
            components: buildHelpMenu(interaction, section),
            flags: MessageFlags.Ephemeral
        });
    }
};

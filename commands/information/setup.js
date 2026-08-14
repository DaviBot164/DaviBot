const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const SETUP_COLOR = '#B026FF';

const SETUP_OPTIONS = [
    {
        label: 'Verification Guide',
        description: 'Publish verification instructions',
        emoji: '🔐',
        value: 'verification-guide'
    },
    {
        label: 'Code of Sins',
        description: 'Publish the server rules',
        emoji: '📜',
        value: 'sacred-laws'
    },
    {
        label: 'Sin Codex',
        description: 'Publish the server guide',
        emoji: '📖',
        value: 'server-guide'
    },
    {
        label: 'Role Hierarchy',
        description: 'Publish roles and hierarchy',
        emoji: '👑',
        value: 'role-information'
    },
    {
        label: 'FAQ',
        description: 'Publish common questions and answers',
        emoji: '❓',
        value: 'faq'
    },
    {
        label: 'Support Guide',
        description: 'Publish ticket instructions',
        emoji: '🎫',
        value: 'ticket-guide'
    },
    {
        label: 'Full Setup',
        description: 'Publish every setup module',
        emoji: '⚙️',
        value: 'full-setup'
    }
];

function buildSetupMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId('umbra:setup:select')
        .setPlaceholder('Choose a setup module...')
        .addOptions(
            SETUP_OPTIONS.map(
                option =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(option.label)
                        .setDescription(option.description)
                        .setEmoji(option.emoji)
                        .setValue(option.value)
            )
        );
}

function buildSetupEmbed(interaction) {
    const avatar =
        interaction.client.user.displayAvatarURL({
            size: 256,
            forceStatic: false
        });

    return createEmbed({
        title: 'Ⅹ・SETUP',
        description: [
            `Welcome, ${interaction.user}.`,
            '',
            'Choose what Evelynn should publish.',
            '',
            '🔐 Verification Guide',
            '📜 Code of Sins',
            '📖 Sin Codex',
            '👑 Role Hierarchy',
            '❓ FAQ',
            '🎫 Support Guide',
            '⚙️ Full Setup'
        ].join('\n'),
        color: SETUP_COLOR,
        thumbnail: avatar,
        author: {
            name: 'Evelynn • THE Ⅹ SINS',
            iconURL: avatar
        },
        footer: {
            text: 'TTS • Setup'
        }
    });
}

async function sendError(
    interaction,
    title,
    description
) {
    const embed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        return interaction
            .editReply({
                embeds: [embed],
                components: []
            })
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
}

module.exports = {
    category: 'information',

    data:
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription(
                'Open the server setup menu.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                return sendError(
                    interaction,
                    '❌ Server Only Command',
                    'The Setup Menu can only be opened inside THE Ⅹ SINS.'
                );
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                return sendError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators can use the Setup Menu.'
                );
            }

            await interaction.reply({
                embeds: [
                    buildSetupEmbed(
                        interaction
                    )
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            buildSetupMenu()
                        )
                ],
                flags:
                    MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /setup failed:',
                error
            );

            await sendError(
                interaction,
                '❌ Setup Unavailable',
                'Evelynn could not open the Setup Menu.'
            );
        }
    }
};
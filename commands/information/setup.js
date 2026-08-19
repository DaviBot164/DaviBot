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

const brand =
    require('../../config/brand');

const SETUP_COLOR =
    brand.themeColor;

/**
 * Keep this ID stable because the
 * interaction router depends on it.
 */
const SETUP_MENU_ID =
    'umbra:setup:select';

const SETUP_OPTIONS = Object.freeze([
    {
        label:
            'Verification Guide',

        description:
            'Publish the Soul Reaper verification guide',

        emoji:
            '🔐',

        value:
            'verification-guide'
    },

    {
        label:
            'Sacred Laws',

        description:
            'Publish the official server rules',

        emoji:
            '📜',

        value:
            'sacred-laws'
    },

    {
        label:
            'Soul Codex',

        description:
            'Publish the complete server guide',

        emoji:
            '📖',

        value:
            'server-guide'
    },

    {
        label:
            'Role Hierarchy',

        description:
            'Publish command, captain and soul roles',

        emoji:
            '👑',

        value:
            'role-information'
    },

    {
        label:
            'FAQ',

        description:
            'Publish common questions and answers',

        emoji:
            '❓',

        value:
            'faq'
    },

    {
        label:
            'Soul Sanctuary',

        description:
            'Publish private support instructions',

        emoji:
            '🎫',

        value:
            'ticket-guide'
    },

    {
        label:
            'Full Setup',

        description:
            'Publish every information module',

        emoji:
            '🌙',

        value:
            'full-setup'
    }
]);

function buildSetupMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId(
            SETUP_MENU_ID
        )
        .setPlaceholder(
            'Choose an information module...'
        )
        .addOptions(
            SETUP_OPTIONS.map(
                option =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(
                            option.label
                        )
                        .setDescription(
                            option.description
                        )
                        .setEmoji(
                            option.emoji
                        )
                        .setValue(
                            option.value
                        )
            )
        );
}

function buildSetupEmbed(
    interaction
) {
    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                512,

            forceStatic:
                false
        }) ??
        botAvatar;

    const modules =
        SETUP_OPTIONS.map(
            option =>
                `${option.emoji} **${option.label}**`
        );

    return createEmbed({
        title:
            '☾・SEIREITEI SETUP',

        description:
            [
                `Welcome, ${interaction.user}.`,
                '',
                `Choose what ${brand.botName} should publish in **${brand.serverName}**.`,
                '',
                ...modules
            ].join('\n'),

        color:
            SETUP_COLOR,

        thumbnail:
            guildIcon,

        author: {
            name:
                `${brand.botName} • ${brand.botTitle}`,

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `${brand.serverName} • Setup Center`
        }
    });
}

async function sendSetupError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ],

        components:
            []
    };

    if (interaction.deferred) {
        return interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                ...payload,

                flags:
                    MessageFlags.Ephemeral
            })
            .catch(
                () => null
            );
    }

    return interaction
        .reply({
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'setup'
            )
            .setDescription(
                'Open the LUNAR SEIREITEI setup center.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                return sendSetupError(
                    interaction,
                    '❌ Server Only Command',
                    'The Setup Center can only be opened inside a server.'
                );
            }

            if (
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                return sendSetupError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators can use the Setup Center.'
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
                'Evelynn /setup failed:',
                error
            );

            await sendSetupError(
                interaction,
                '❌ Setup Unavailable',
                `${brand.botName} could not open the Setup Center.`
            );
        }
    }
};
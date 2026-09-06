const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const brand =
    require('../../config/brand');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

/*
 * Legacy export kept for compatibility.
 * Runtime color comes from the Guild Profile.
 */
const ROLE_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getRoleInformationChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .informationChannelId;

    const channel =
        channelId
            ? await interaction.guild.channels
                .fetch(
                    channelId
                )
                .catch(
                    () => null
                )
            : null;

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Information Channel Missing',
                    'The configured information channel could not be found.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (
        !botMember
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    `${profile.botName} Unavailable`,
                    `${profile.botName} could not access the server member record.`
                )
            ],

            components:
                []
        });

        return null;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Missing Permissions',
                    [
                        `${profile.botName} cannot publish role information in ${channel}.`,
                        '',
                        'Required:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return null;
    }

    return channel;
}

function buildRoleFields(
    profile
) {
    const fields =
        [];

    if (
        profile.roles.authority.length
    ) {
        fields.push({
            name:
                '♛・ROYAL AUTHORITY',

            value:
                [
                    ...profile.roles.authority.map(
                        role =>
                            `**${role.name}** — ${role.description}`
                    ),
                    '',
                    '-# Only authority roles grant moderation permissions.'
                ].join('\n'),

            inline:
                false
        });
    }

    if (
        profile.roles.combatRanks.length
    ) {
        fields.push({
            name:
                `🐉・${profile.rankSystemName.toUpperCase()}`,

            value:
                [
                    ...profile.roles.combatRanks.map(
                        (
                            rank,
                            index
                        ) =>
                            index === 0
                                ? `**${rank}** — Highest combat rank`
                                : `**${rank}**`
                    ),
                    '',
                    '**◇・UNRANKED** — No combat rank',
                    '',
                    `-# Ranks are earned through official ${profile.trialSystemName}.`,
                    '-# Combat ranks do not grant staff permissions.'
                ].join('\n'),

            inline:
                false
        });
    }

    if (
        profile.roles.progression.length
    ) {
        fields.push({
            name:
                '✦・KINGDOM PROGRESSION',

            value:
                [
                    ...profile.roles.progression.map(
                        role =>
                            `**${role}**`
                    ),
                    '',
                    '-# Progression reflects activity and advancement.'
                ].join('\n'),

            inline:
                false
        });
    }

    fields.push({
        name:
            '◆・VERIFICATION',

        value:
            [
                `**◆・${profile.roles.verifiedName.toUpperCase()}** — Verified`,
                `**◇・${profile.roles.unverifiedName.toUpperCase()}** — Awaiting verification`
            ].join('\n'),

        inline:
            false
    });

    return fields;
}

/**
 * Publish a server-aware role hierarchy.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishRoleInformation(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channel =
        await getRoleInformationChannel(
            interaction
        );

    if (
        !channel
    ) {
        return;
    }

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
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const roleEmbed =
        createEmbed({
            title:
                '♛・ROLE HIERARCHY',

            description:
                [
                    '**Every member has a place within the kingdom.**',
                    '',
                    `Authority, combat rank and progression are separate systems inside **${profile.serverName}**.`
                ].join('\n'),

            color:
                profile.themeColor,

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                botAvatar,

            fields:
                buildRoleFields(
                    profile
                ),

            author: {
                name:
                    `${profile.botName} • ${profile.serverName}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${profile.serverName} • Role Hierarchy`,

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
        embeds: [
            roleEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                'Role Information Published',
                `Role information was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `${profile.serverName} role hierarchy published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    ROLE_EMBED_COLOR,
    buildRoleFields,
    publishRoleInformation
};
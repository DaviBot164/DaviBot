const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const ROLE_INFORMATION_CHANNEL_ID =
    '1530981738434527493';

/**
 * Find a role by its readable name.
 *
 * This allows the role to keep its emoji prefix.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleName
 * @returns {import('discord.js').Role|null}
 */
function findRoleByName(
    guild,
    roleName
) {
    const normalizedTarget =
        roleName.toLowerCase();

    return (
        guild.roles.cache.find(role =>
            role.name
                .toLowerCase()
                .includes(
                    normalizedTarget
                )
        ) ??
        null
    );
}

/**
 * Return a readable member count.
 *
 * @param {import('discord.js').Role|null} role
 * @returns {string}
 */
function getRoleMemberCount(role) {
    if (!role) {
        return 'Role not found';
    }

    const memberCount =
        role.members.size;

    return (
        `${memberCount} ` +
        `${memberCount === 1 ? 'Member' : 'Members'}`
    );
}

/**
 * Return a readable role mention.
 *
 * @param {import('discord.js').Role|null} role
 * @param {string} fallbackName
 * @returns {string}
 */
function getRoleDisplay(
    role,
    fallbackName
) {
    if (!role) {
        return `**${fallbackName}**`;
    }

    return role.toString();
}

/**
 * Get and validate the Role Information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getRoleInformationChannel(
    interaction
) {
    const roleChannel =
        await interaction.guild.channels.fetch(
            ROLE_INFORMATION_CHANNEL_ID
        );

    if (
        !roleChannel ||
        !roleChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Role Information Channel Missing',
                    'Umbra could not find the configured Role Information channel.'
                )
            ],

            components: []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Umbra Unavailable',
                    'Umbra could not access its server member information.'
                )
            ],

            components: []
        });

        return null;
    }

    const channelPermissions =
        roleChannel.permissionsFor(
            botMember
        );

    if (
        !channelPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Umbra Permissions',
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the Role Information channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return roleChannel;
}

/**
 * Publish the Crimson Eclipse Role Information archive.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishRoleInformation(
    interaction
) {
    const roleChannel =
        await getRoleInformationChannel(
            interaction
        );

    if (!roleChannel) {
        return;
    }

    /*
     * Refresh the guild member cache before counting
     * how many members have each role.
     */
    await interaction.guild.members
        .fetch()
        .catch(error => {
            console.warn(
                '⚠️ Umbra could not refresh all guild members:',
                error.message
            );
        });

    const crimsonLordRole =
        findRoleByName(
            interaction.guild,
            'Crimson Lord'
        );

    const eclipseKeeperRole =
        findRoleByName(
            interaction.guild,
            'Eclipse Keeper'
        );

    const shadowWardenRole =
        findRoleByName(
            interaction.guild,
            'Shadow Warden'
        );

    const umbraRole =
        findRoleByName(
            interaction.guild,
            'Umbra'
        );

    const verifiedRole =
        findRoleByName(
            interaction.guild,
            'Verified'
        );

    /*
     * Search for the first role specifically named Unverified.
     * Bloxlink may create another similarly named role.
     */
    const unverifiedRole =
        interaction.guild.roles.cache.find(role =>
            role.name
                .toLowerCase()
                .includes(
                    'unverified'
                )
        ) ??
        null;

    const publishedAt =
        Math.floor(
            Date.now() / 1000
        );

    const roleEmbed =
        createEmbed({
            title:
                '🎖️ Ranks of Crimson Eclipse',

            description:
                [
                    'Umbra has opened the official Role Archive of the Order.',
                    '',
                    'Every rank carries a purpose, and every position exists to protect or strengthen the community.',
                    '',
                    '*Power within Crimson Eclipse is a responsibility, not a privilege.*'
                ].join('\n'),

            thumbnail:
                interaction.guild.iconURL({
                    size: 512,
                    forceStatic: false
                }) ??
                interaction.client.user.displayAvatarURL({
                    size: 512,
                    forceStatic: false
                }),

            fields: [
                {
                    name:
                        '👑 Leadership',

                    value:
                        [
                            `${getRoleDisplay(crimsonLordRole, 'Crimson Lord')}`,
                            `-# ${getRoleMemberCount(crimsonLordRole)}`,
                            '',
                            'The founder and highest authority of Crimson Eclipse.',
                            '',
                            '• Defines the future of the Order',
                            '• Makes final administrative decisions',
                            '• Oversees the entire community',
                            '',
                            `${getRoleDisplay(eclipseKeeperRole, 'Eclipse Keeper')}`,
                            `-# ${getRoleMemberCount(eclipseKeeperRole)}`,
                            '',
                            'Senior administrators trusted with managing the Order.',
                            '',
                            '• Manage server systems',
                            '• Assist with major decisions',
                            '• Oversee staff and community organization'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Guardians of the Order',

                    value:
                        [
                            `${getRoleDisplay(shadowWardenRole, 'Shadow Warden')}`,
                            `-# ${getRoleMemberCount(shadowWardenRole)}`,
                            '',
                            'The moderation and support guardians of Crimson Eclipse.',
                            '',
                            '• Enforce the Sacred Laws',
                            '• Review reports and evidence',
                            '• Assist members through tickets',
                            '• Protect the community from harmful behavior',
                            '• Carry out fair moderation actions'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🤖 Guardian System',

                    value:
                        [
                            `${getRoleDisplay(umbraRole, 'Umbra')}`,
                            `-# ${getRoleMemberCount(umbraRole)}`,
                            '',
                            'The official Guardian of Crimson Eclipse.',
                            '',
                            '• Protects the server through Guardian systems',
                            '• Manages support tickets',
                            '• Publishes official information',
                            '• Welcomes and guides new members',
                            '• Records moderation activity',
                            '• Maintains order beneath the crimson moon'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Community Ranks',

                    value:
                        [
                            `${getRoleDisplay(verifiedRole, 'Verified')}`,
                            `-# ${getRoleMemberCount(verifiedRole)}`,
                            '',
                            'Verified members who have unlocked access to the community.',
                            '',
                            '• Join public conversations',
                            '• Participate in community activities',
                            '• Access gaming and voice channels',
                            '• Request assistance through tickets',
                            '',
                            `${getRoleDisplay(unverifiedRole, 'Unverified')}`,
                            `-# ${getRoleMemberCount(unverifiedRole)}`,
                            '',
                            'New members who have not completed verification.',
                            '',
                            'Complete the verification process to unlock the Order.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📜 Promotion Philosophy',

                    value:
                        [
                            'Authority inside Crimson Eclipse must be earned.',
                            '',
                            'Promotions are based on:',
                            '',
                            '• Trust',
                            '• Respect',
                            '• Activity',
                            '• Maturity',
                            '• Contribution',
                            '• Knowledge of the Sacred Laws',
                            '',
                            '**Asking repeatedly for authority will not guarantee promotion.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 Final Record',

                    value:
                        [
                            'Every rank exists to serve the community.',
                            '',
                            'Leadership guides.',
                            'Shadow Wardens protect.',
                            'Umbra watches.',
                            'Verified members strengthen the Order.',
                            '',
                            `**Archive updated:** <t:${publishedAt}:F>`,
                            `-# <t:${publishedAt}:R>`,
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    roleEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    roleEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Role Archive',

        iconURL:
            interaction.guild.iconURL({
                size: 128,
                forceStatic: false
            }) ??
            interaction.client.user.displayAvatarURL({
                size: 128,
                forceStatic: false
            })
    });

    roleEmbed.setTimestamp();

    await roleChannel.send({
        embeds:
            [roleEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Role Archive Published',
                `Umbra successfully published the Role Information archive in ${roleChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎖️ Role Information Published Through Setup Wizard'
    );

    console.log(
        `📍 Channel: ${roleChannel.name}`
    );

    console.log(
        `🛡️ Published By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    publishRoleInformation
};
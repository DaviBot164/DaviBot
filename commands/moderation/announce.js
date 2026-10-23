const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Preview and publish a server announcement.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Where to publish the announcement.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription('Announcement title.')
                .setMaxLength(256)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('Announcement text. Use \\n for a new line.')
                .setMaxLength(4000)
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Server member to mention.')
        )
        .addBooleanOption(option =>
            option
                .setName('everyone')
                .setDescription('Mention everyone in the server.')
        ),

    async execute(interaction) {
        if (
            !interaction.inGuild() ||
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            await interaction.reply({
                content: 'You need Manage Server to use this command.',
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const channel = interaction.options.getChannel('channel', true);
        const title = interaction.options.getString('title', true).trim();
        const text = interaction.options
            .getString('text', true)
            .replace(/\\n/g, '\n')
            .trim();

        const user = interaction.options.getUser('member');
        const everyone = interaction.options.getBoolean('everyone') ?? false;

        const fail = async (heading, description) =>
            interaction.editReply({
                content: null,
                embeds: [errorEmbed(heading, description)],
                components: []
            });

        if (!title || !text) {
            await fail(
                'Invalid Announcement',
                'The title and text cannot be empty.'
            );

            return;
        }

        if (user) {
            const member = await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

            if (!member) {
                await fail(
                    'Member Not Found',
                    'Choose a member who is currently in this server.'
                );

                return;
            }
        }

        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ];

        const botMember = await interaction.guild.members.fetchMe();
        const authorMember = await interaction.guild.members.fetch(
            interaction.user.id
        );

        if (!channel.permissionsFor(botMember)?.has(requiredPermissions)) {
            await fail(
                'Missing Permissions',
                'Kitsune needs View Channel, Send Messages, and Embed Links in that channel.'
            );

            return;
        }

        if (
            everyone &&
            (
                !channel.permissionsFor(authorMember)?.has(
                    PermissionFlagsBits.MentionEveryone
                ) ||
                !channel.permissionsFor(botMember)?.has(
                    PermissionFlagsBits.MentionEveryone
                )
            )
        ) {
            await fail(
                'Missing Mention Permission',
                'Both you and Kitsune need Mention Everyone permission in that channel.'
            );

            return;
        }

        const mentions = [
            everyone ? '@everyone' : null,
            user ? `<@${user.id}>` : null
        ].filter(Boolean).join(' ');

        const announcement = new EmbedBuilder()
            .setColor('#9B1C31')
            .setTitle(title)
            .setDescription(text)
            .setFooter({
                text: `KITSUNE • ${interaction.guild.name}`
            })
            .setTimestamp();

        if (user) {
            announcement.setThumbnail(
                user.displayAvatarURL({ size: 256 })
            );
        }

        const publishId = `kitsune:announce:publish:${interaction.id}`;
        const cancelId = `kitsune:announce:cancel:${interaction.id}`;

        const controls = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(publishId)
                .setLabel('Publish')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(cancelId)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        const preview = await interaction.editReply({
            content: [
                `Preview for ${channel}. Confirm within 2 minutes.`,
                mentions ? `Mentions: ${mentions}` : null
            ].filter(Boolean).join('\n'),
            embeds: [announcement],
            components: [controls],
            allowedMentions: { parse: [] }
        });

        let confirmation;

        try {
            confirmation = await preview.awaitMessageComponent({
                filter: component =>
                    component.user.id === interaction.user.id &&
                    [publishId, cancelId].includes(component.customId),
                time: 120_000
            });
        } catch {
            await interaction.editReply({
                content: 'Announcement preview expired. Run /announce again.',
                components: [],
                allowedMentions: { parse: [] }
            }).catch(() => null);

            return;
        }

        await confirmation.deferUpdate();

        await interaction.editReply({
            content: confirmation.customId === cancelId
                ? 'Announcement cancelled.'
                : 'Publishing announcement…',
            components: []
        });

        if (confirmation.customId === cancelId) {
            return;
        }

        try {
            const currentAuthor = await interaction.guild.members.fetch(
                interaction.user.id
            );
            const currentBot = await interaction.guild.members.fetchMe();

            if (
                !currentAuthor.permissions.has(
                    PermissionFlagsBits.ManageGuild
                ) ||
                !channel.permissionsFor(currentBot)?.has(
                    requiredPermissions
                )
            ) {
                await fail(
                    'Permissions Changed',
                    'The required permissions are no longer available.'
                );

                return;
            }

            if (
                everyone &&
                (
                    !channel.permissionsFor(currentAuthor)?.has(
                        PermissionFlagsBits.MentionEveryone
                    ) ||
                    !channel.permissionsFor(currentBot)?.has(
                        PermissionFlagsBits.MentionEveryone
                    )
                )
            ) {
                await fail(
                    'Missing Mention Permission',
                    'Both you and Kitsune need Mention Everyone permission in that channel.'
                );

                return;
            }

            const message = await channel.send({
                content: mentions || undefined,
                embeds: [announcement],
                allowedMentions: {
                    parse: everyone ? ['everyone'] : [],
                    users: user ? [user.id] : [],
                    roles: [],
                    repliedUser: false
                }
            });

            await interaction.editReply({
                content: null,
                embeds: [
                    successEmbed(
                        'Announcement Published',
                        `Published in ${channel}.\n[View announcement](${message.url})`
                    )
                ],
                components: []
            });
        } catch (error) {
            console.error('Announcement publish failed:', error);

            await fail(
                'Publish Failed',
                'Kitsune could not publish the announcement. Check her channel permissions.'
            );
        }
    }
};

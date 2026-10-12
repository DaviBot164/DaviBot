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

        if (!title || !text) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Invalid Announcement',
                        'The title and text cannot be empty.'
                    )
                ]
            });

            return;
        }

        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ];

        const botMember = await interaction.guild.members.fetchMe();

        if (!channel.permissionsFor(botMember)?.has(requiredPermissions)) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Missing Permissions',
                        'Akane needs View Channel, Send Messages, and Embed Links in that channel.'
                    )
                ]
            });

            return;
        }

        const announcement = new EmbedBuilder()
            .setColor('#9B1C31')
            .setTitle(title)
            .setDescription(text)
            .setFooter({
                text: `AKANE • ${interaction.guild.name}`
            })
            .setTimestamp();

        const publishId = `akane:announce:publish:${interaction.id}`;
        const cancelId = `akane:announce:cancel:${interaction.id}`;

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
            content: `Preview for ${channel}. Confirm within 2 minutes.`,
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
                components: []
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
            const message = await channel.send({
                embeds: [announcement],
                allowedMentions: { parse: [] }
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

            await interaction.editReply({
                content: null,
                embeds: [
                    errorEmbed(
                        'Publish Failed',
                        'Akane could not publish the announcement. Check her channel permissions.'
                    )
                ],
                components: []
            });
        }
    }
};
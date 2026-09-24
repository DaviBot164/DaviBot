async function findSetupMessage(
    channel,
    clientUserId,
    embedTitle
) {
    const messages =
        await channel.messages.fetch({
            limit: 100
        });

    return messages.find(
        message =>
            message.author.id ===
                clientUserId &&
            message.embeds.some(
                embed =>
                    embed.title ===
                    embedTitle
            )
    ) ?? null;
}

async function publishSetupMessage(
    channel,
    payload,
    embedTitle
) {
    const clientUserId =
        channel.client.user.id;

    const existingMessage =
        await findSetupMessage(
            channel,
            clientUserId,
            embedTitle
        );

    if (existingMessage) {
        return existingMessage.edit(
            payload
        );
    }

    return channel.send(
        payload
    );
}

module.exports = {
    publishSetupMessage
};
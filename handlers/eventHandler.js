const fs = require('fs');
const path = require('path');

/**
 * Load every Discord event.
 *
 * Multiple files may intentionally listen
 * to the same Discord event.
 *
 * @param {import('discord.js').Client} client
 */
module.exports = client => {
    const eventsPath =
        path.join(
            __dirname,
            '..',
            'events'
        );

    if (
        !fs.existsSync(
            eventsPath
        )
    ) {
        console.error(
            `❌ Events directory not found: ${eventsPath}`
        );

        return;
    }

    let eventFiles;

    try {
        eventFiles =
            fs.readdirSync(
                eventsPath
            )
                .filter(
                    file =>
                        file.endsWith(
                            '.js'
                        )
                )
                .sort();
    } catch (error) {
        console.error(
            '❌ Failed to read Events directory:',
            error
        );

        return;
    }

    let loadedCount =
        0;

    let failedCount =
        0;

    for (
        const file
        of eventFiles
    ) {
        const filePath =
            path.join(
                eventsPath,
                file
            );

        try {
            const event =
                require(
                    filePath
                );

            if (
                !event?.name ||
                typeof event.execute !==
                    'function'
            ) {
                failedCount +=
                    1;

                console.warn(
                    `⚠️ Invalid event file: ${file}`
                );

                continue;
            }

            const listener =
                (...args) =>
                    event.execute(
                        ...args,
                        client
                    );

            if (
                event.once ===
                true
            ) {
                client.once(
                    event.name,
                    listener
                );
            } else {
                client.on(
                    event.name,
                    listener
                );
            }

            loadedCount +=
                1;
        } catch (error) {
            failedCount +=
                1;

            console.error(
                `❌ Failed to load event: ${file}`,
                error
            );
        }
    }

    console.log(
        `⚡ Events Loaded: ${loadedCount}/${eventFiles.length}`
    );

    if (
        failedCount >
        0
    ) {
        console.warn(
            `⚠️ Event Files Failed: ${failedCount}`
        );
    }
};
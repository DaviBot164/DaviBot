const fs = require('fs');
const path = require('path');

/**
 * Load every Umbra Discord event.
 *
 * Multiple files may intentionally listen
 * to the same Discord event.
 *
 * Example:
 * - InteractionCreate
 * - ClientReady
 *
 * @param {import('discord.js').Client} client
 */
module.exports = (
    client
) => {
    const eventsPath =
        path.join(
            __dirname,
            '..',
            'events'
        );

    console.log(
        '======================================'
    );

    console.log(
        '⚡ Loading Events...'
    );

    console.log(
        '======================================'
    );

    /*
     * Missing event files indicate a broken
     * deployment or project structure.
     *
     * Do not silently create an empty folder.
     */
    if (
        !fs.existsSync(
            eventsPath
        )
    ) {
        console.error(
            `❌ Events directory was not found: ${eventsPath}`
        );

        console.log(
            '======================================'
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
            '❌ Failed to read the Events directory:'
        );

        console.error(
            error
        );

        console.log(
            '======================================'
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

        console.log(
            `📄 Loading event file: ${file}`
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
                console.warn(
                    `❌ ${file} is missing event.name or event.execute().`
                );

                console.log(
                    '--------------------------------------'
                );

                failedCount +=
                    1;

                continue;
            }

            /*
             * Pass the Discord event arguments first.
             *
             * The Umbra client is appended as the
             * final argument for handlers that need
             * explicit access to it.
             */
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

            console.log(
                `✅ Successfully Loaded: ${event.name}`
            );

            console.log(
                `   ↳ File: ${file}`
            );

            console.log(
                `   ↳ Mode: ${
                    event.once === true
                        ? 'ONCE'
                        : 'LISTENER'
                }`
            );

            console.log(
                '--------------------------------------'
            );
        } catch (error) {
            failedCount +=
                1;

            console.error(
                `❌ Failed to load event: ${file}`
            );

            console.error(
                error
            );

            console.log(
                '--------------------------------------'
            );
        }
    }

    console.log(
        '======================================'
    );

    console.log(
        `⚡ Total Events Loaded: ${loadedCount}`
    );

    if (
        failedCount >
        0
    ) {
        console.warn(
            `⚠️ Event Files Failed: ${failedCount}`
        );
    }

    console.log(
        `📦 Event Files Found: ${eventFiles.length}`
    );

    console.log(
        '======================================'
    );
};
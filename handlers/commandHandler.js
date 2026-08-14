const fs = require('fs');
const path = require('path');

const {
    Collection
} = require('discord.js');

/**
 * Load every Slash Command.
 *
 * Commands are organized inside category
 * folders under the /commands directory.
 *
 * @param {import('discord.js').Client} client
 */
module.exports = client => {
    if (
        !(client.commands instanceof Collection)
    ) {
        client.commands =
            new Collection();
    } else {
        client.commands.clear();
    }

    const commandsPath =
        path.join(
            __dirname,
            '..',
            'commands'
        );

    if (
        !fs.existsSync(
            commandsPath
        )
    ) {
        console.error(
            `❌ Commands directory not found: ${commandsPath}`
        );

        return;
    }

    let folders;

    try {
        folders =
            fs.readdirSync(
                commandsPath
            );
    } catch (error) {
        console.error(
            '❌ Failed to read Commands directory:',
            error
        );

        return;
    }

    let failedCount =
        0;

    for (
        const folder
        of folders
    ) {
        const folderPath =
            path.join(
                commandsPath,
                folder
            );

        let folderStats;

        try {
            folderStats =
                fs.statSync(
                    folderPath
                );
        } catch (error) {
            failedCount +=
                1;

            console.error(
                `⚠️ Failed to inspect command category: ${folder}`,
                error
            );

            continue;
        }

        if (
            !folderStats.isDirectory()
        ) {
            continue;
        }

        let commandFiles;

        try {
            commandFiles =
                fs.readdirSync(
                    folderPath
                )
                    .filter(
                        file =>
                            file.endsWith(
                                '.js'
                            )
                    )
                    .sort();
        } catch (error) {
            failedCount +=
                1;

            console.error(
                `⚠️ Failed to read command category: ${folder}`,
                error
            );

            continue;
        }

        for (
            const file
            of commandFiles
        ) {
            const commandPath =
                path.join(
                    folderPath,
                    file
                );

            try {
                const command =
                    require(
                        commandPath
                    );

                if (
                    !command?.data ||
                    typeof command.execute !==
                        'function'
                ) {
                    failedCount +=
                        1;

                    console.warn(
                        `⚠️ Invalid command file: ${folder}/${file}`
                    );

                    continue;
                }

                const commandName =
                    command.data.name;

                if (
                    typeof commandName !==
                        'string' ||
                    !commandName.trim()
                ) {
                    failedCount +=
                        1;

                    console.warn(
                        `⚠️ Invalid command name: ${folder}/${file}`
                    );

                    continue;
                }

                if (
                    client.commands.has(
                        commandName
                    )
                ) {
                    failedCount +=
                        1;

                    console.error(
                        `❌ Duplicate Slash Command: /${commandName} (${folder}/${file})`
                    );

                    continue;
                }

                client.commands.set(
                    commandName,
                    command
                );
            } catch (error) {
                failedCount +=
                    1;

                console.error(
                    `❌ Failed to load command: ${folder}/${file}`,
                    error
                );
            }
        }
    }

    console.log(
        `📦 Commands Loaded: ${client.commands.size}`
    );

    if (
        failedCount >
        0
    ) {
        console.warn(
            `⚠️ Command Load Failures: ${failedCount}`
        );
    }
};
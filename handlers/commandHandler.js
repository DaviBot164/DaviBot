const fs = require('fs');
const path = require('path');

const {
    Collection
} = require('discord.js');

/**
 * Load every Umbra Slash Command.
 *
 * Commands are organized inside category
 * folders under the /commands directory.
 *
 * @param {import('discord.js').Client} client
 */
module.exports = (
    client
) => {
    /*
     * Preserve the existing Discord.js
     * Collection when one was already created.
     */
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

    console.log(
        '======================================'
    );

    console.log(
        '📂 Loading Commands...'
    );

    console.log(
        '======================================'
    );

    /*
     * Validate the commands directory before
     * attempting to read category folders.
     */
    if (
        !fs.existsSync(
            commandsPath
        )
    ) {
        console.error(
            `❌ Commands directory was not found: ${commandsPath}`
        );

        console.log(
            '======================================'
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
            '❌ Failed to read the Commands directory:'
        );

        console.error(
            error
        );

        console.log(
            '======================================'
        );

        return;
    }

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
            console.error(
                `⚠️ Could not inspect command category: ${folder}`
            );

            console.error(
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
            console.error(
                `⚠️ Failed to read command category: ${folder}`
            );

            console.error(
                error
            );

            continue;
        }

        console.log(
            `📁 Category: ${folder}`
        );

        for (
            const file
            of commandFiles
        ) {
            const commandPath =
                path.join(
                    folderPath,
                    file
                );

            console.log(
                `📄 Loading file: ${file}`
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
                    console.warn(
                        `❌ ${file} is missing command.data or command.execute().`
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
                    console.warn(
                        `❌ ${file} has an invalid command name.`
                    );

                    continue;
                }

                /*
                 * Prevent hidden command replacement.
                 */
                if (
                    client.commands.has(
                        commandName
                    )
                ) {
                    console.error(
                        `❌ Duplicate Slash Command detected: /${commandName}`
                    );

                    console.error(
                        `   Skipped file: ${folder}/${file}`
                    );

                    continue;
                }

                console.log(
                    `📌 Command Name : ${commandName}`
                );

                console.log(
                    `📝 Description  : ${
                        command.data.description ||
                        'No description'
                    }`
                );

                client.commands.set(
                    commandName,
                    command
                );

                console.log(
                    `✅ Successfully Loaded: ${commandName}`
                );

                console.log(
                    '--------------------------------------'
                );
            } catch (error) {
                console.error(
                    `❌ Failed to load: ${folder}/${file}`
                );

                console.error(
                    error
                );
            }
        }
    }

    console.log(
        '======================================'
    );

    console.log(
        `📦 Total Commands Loaded: ${client.commands.size}`
    );

    console.log(
        '📜 Commands List:'
    );

    for (
        const commandName
        of client.commands.keys()
    ) {
        console.log(
            `➡ ${commandName}`
        );
    }

    console.log(
        '======================================'
    );
};
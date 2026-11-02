const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let count = 0;
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git'].includes(entry.name)) continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.(js|cjs)$/.test(file)) {
            execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
            const source = fs.readFileSync(file, 'utf8');
            for (const match of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)) {
                require.resolve(path.resolve(path.dirname(file), match[1]));
            }
            count++;
        }
    }
}
walk(root);
const client = {};
require('../handlers/commandLoader').loadCommands(client);
for (const command of client.commands.values()) command.data.toJSON();
console.log(`${count} source files checked; ${client.commands.size} commands loaded and serialized.`);
require('../database/connection').closeConnection();

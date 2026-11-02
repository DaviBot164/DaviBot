const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const removed = ['daily', 'achievements', 'titles', 'match', 'matchmanage', 'trial', 'kitsune', 'legacy'];
test('retained commands serialize; obsolete commands and handlers are absent', async () => {
    const client = {};
    require('../handlers/commandLoader').loadCommands(client);
    for (const name of ['profile','path','corps','leaderboard','setrank','removerank','rankhistory','setup','help','ticketpanel','announce','warn','ping']) assert(client.commands.has(name));
    for (const name of removed) assert(!client.commands.has(name), name);
    for (const command of client.commands.values()) assert(command.data.toJSON().name);
    for (const folder of ['handlers/hub','handlers/play','handlers/control','handlers/kitsune']) assert(!fs.existsSync(path.join(root, folder)), folder);
    const setup = fs.readFileSync(path.join(root, 'commands/information/setup.js'), 'utf8');
    assert(!/training_grounds|Mission Control/.test(setup));
    const context = require('../utils/guildContext');
    for (const name of ['conversation','learning','matches','trials']) assert.equal(context.enabled(name), false);
    await require('../database/connection').closeConnection();
});
test('XP boundaries and cooldown remain guild-scoped', () => {
    const leveling = require('../utils/leveling');
    assert.deepEqual(leveling.calculateLevel(1, 360), {level:3,xp:10,levelsGained:2});
    assert.equal(leveling.calculateLevel(1,149).level,1);
    assert.equal(leveling.calculateLevel(1,150).level,2);
    assert.throws(() => leveling.calculateLevel(1,-1));
    const cd = require('../handlers/xpCooldown');
    assert(cd.canEarnXP('a','member'));
    assert(!cd.canEarnXP('a','member'));
    assert(cd.canEarnXP('b','member'));
});
test('guides describe only available systems and preserve staff-only final ranks', () => {
    const model = require('../config/serverSettings');
    const context = require('../utils/guildContext');
    context.run('test', model.legacy(), () => {
        const guides = require('../config/setupGuides');
        const all = ['sacred_laws','moon_guide','verification_guide','role_guide','game_guide','support_guide'].map(guides.guide);
        all.push(guides.pathGuide('slayer'),guides.pathGuide('demon'));
        assert(!/\/daily|\/trial|\/match|\/kitsune|\/titles|\/achievements|Mission Control/.test(JSON.stringify(all)));
        const p = require('../config/progression');
        assert.equal(p.getRankForLevel('slayer',100).id,'kinoe');
        assert.equal(p.getRankForLevel('demon',100).id,'lower_moon');
        const extended = {...model.legacy(), progression:{extended:true}};
        context.run('test',extended,()=>assert.equal(p.getRankForLevel('slayer',20).id,'tsuchinoe'));
    });
});
test('old buttons receive a useful retirement reply', async () => {
    const event = require('../events/interactionCreate');
    for (const id of ['kitsune:trial:old','kitsune:quest:old','kitsune:hub:old']) {
        let result;
        await event.execute({ customId:id, isButton:()=>true, isStringSelectMenu:()=>false, reply:async payload=>{result=payload;} });
        assert.match(result.content,/no longer active/);
    }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
let failUpdate = false;
async function query(sql, params = []) {
    if (failUpdate && /UPDATE kitsune_users\s+SET\s+level/.test(sql)) throw Error('simulated write failure');
    if (sql.includes('pg_advisory_xact_lock')) return {rows:[]}; // Engine has no cross-session advisory locks.
    return params.length ? db.query(sql, params) : db.exec(sql).then(results => results.at(-1) ?? {rows:[]});
}
const conn = require.resolve('../database/connection');
require.cache[conn] = {id:conn,filename:conn,loaded:true,exports:{query,pool:{connect:async()=>({query,release(){}})},testConnection:async()=>query('SELECT 1'),closeConnection:()=>db.close()}};
let roleFailure = false;
const rolesPath = require.resolve('../handlers/progressionRoles');
require.cache[rolesPath] = {id:rolesPath,filename:rolesPath,loaded:true,exports:{syncProgressionRole:async()=>{if(roleFailure)throw Error('role unavailable');},clearProgressionRoles:async()=>{}}};
const notifyPath = require.resolve('../utils/rankNotifications');
require.cache[notifyPath] = {id:notifyPath,filename:notifyPath,loaded:true,exports:{sendRankPromotion:async()=>{}}};
test('real SQL: clean install, XP, rollback, ranks and non-destructive compatibility', async t => {
    await db.waitReady;
    const init = require('../database').initializeDatabase;
    await init();
    const users = require('../database/users');
    const { awardXP } = require('../database/xpRewards');
    await users.ensureUser('g','u',null);
    await users.setProgress('g','u',1,140);
    const reward = await awardXP('g','u',220,{message:true});
    assert.equal(Number(reward.user.level),3); assert.equal(Number(reward.user.xp),10); assert.equal(Number(reward.user.messages),1);
    await assert.rejects(awardXP('g','u',0));
    failUpdate=true;
    await assert.rejects(awardXP('g','u',20,{message:true}),/simulated/);
    failUpdate=false;
    assert.equal(Number((await users.getUser('g','u')).xp),10);
    await users.setFaction('g','u','slayer','slayer');
    await users.setProgress('g','u',25,32);
    const {changeRank}=require('../handlers/rankService');
    const member={id:'u',guild:{id:'g'}};
    roleFailure=true;
    await assert.rejects(changeRank(member,null,{automatic:true}),/role unavailable/);
    assert.equal((await users.getUser('g','u')).rank,'slayer');
    roleFailure=false;
    assert.equal((await changeRank(member,null,{automatic:true,announce:false})).rank.id,'kinoe');
    assert.equal((await query('SELECT count(*) AS n FROM kitsune_rank_history')).rows[0].n,1);
    await changeRank(member,'hashira',{announce:false});
    assert.equal((await changeRank(member,null,{automatic:true})).changed,false,'Automatic promotion cannot demote prestige ranks');
    // Actual message event: moderation blocks XP, eligible messages award once per cooldown.
    let blocked=false;
    const guardian=require.resolve('../handlers/guardian');
    require.cache[guardian]={id:guardian,filename:guardian,loaded:true,exports:{runGuardian:async()=>({blocked})}};
    const levels=require.resolve('../utils/levelNotifications');
    require.cache[levels]={id:levels,filename:levels,loaded:true,exports:{sendLevelUp:async()=>{}}};
    const messageEvent=require('../events/messageCreate');
    const message={inGuild:()=>true,author:{id:'chat-user',bot:false},guild:{id:'g'},member:{id:'chat-user',guild:{id:'g'}}};
    blocked=true;await messageEvent.execute(message);
    assert.equal(await users.getUser('g','chat-user'),null);
    blocked=false;await messageEvent.execute(message);
    const earned=await users.getUser('g','chat-user');assert(Number(earned.xp)>=15&&Number(earned.xp)<=25);
    await messageEvent.execute(message);
    assert.equal(Number((await users.getUser('g','chat-user')).messages),1);
    // Existing unused tables remain as data; no application query depends on them.
    await query('CREATE TABLE kitsune_titles (sentinel TEXT); INSERT INTO kitsune_titles VALUES (\'preserve\')');
    await init();
    assert.equal((await users.getUser('g','u')).rank,'hashira');
    assert.equal(Number((await users.getUser('g','u')).level),25);
    assert.equal((await query('SELECT sentinel FROM kitsune_titles')).rows[0].sentinel,'preserve');
    await query('DROP TABLE kitsune_titles'); // Local test only: prove corps has no removed-table dependency.
    assert.equal((await require('../database/directory').getCorpsMembers('g')).length,1);
    const tables=(await query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows.map(r=>r.tablename);
    for(const name of ['kitsune_daily_quests','kitsune_trials','kitsune_matches','kitsune_achievements'])assert(!tables.includes(name));
    // Old Akane user table is migrated with XP/ranks intact on a pre-existing installation.
    await query('ALTER TABLE kitsune_users RENAME TO akane_users');
    await init();
    assert.equal(Number((await users.getUser('g','u')).xp),32);
    assert.equal((await users.getUser('g','u')).rank,'hashira');
    await db.close();
});

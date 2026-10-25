'use strict';
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = process.argv[2] || path.resolve(__dirname, '..');
// Current offline dialogue suites. language.cjs aliases english.cjs, so run it once.
// The original dialogue.cjs needs the live package environment; logs/missions/setup
// have their own systems and are intentionally outside this dialogue command.
const suites = ['english','dialogue-bank','everyday','understanding','social','defiance','coherence','practical','followups','meaning','nuance','continuity','repairs','refinement','voice','pragmatics','chat','continuation','abuse','emoji','mixed-feedback','context','polish','system-audit','day-chat','listening','expressions','story','learning','corrections','boundaries','social-scope','compound-chat','live-chat','member-boundaries','abuse-forms','listening-forms','listening-continuity','understanding-core','internal-contract','learning-clear','repair-shapes','rename','chat-depth','conversation-limits','music-followups','topic-switch','short-activities','short-controls','ash','short-greetings','addressing','brief-chat','short-answers','flexible-addressing','major-understanding','major-context','major-voice','major-variants','major-delivery','test-lab','cooldown-status','lab-command','status-delivery','follow-through','refinements','semantic-edits','social-depth','casual-scope','conversation-repair','question-followups','everyday-context','actions-scene','fact-revisions','question-scene','casual-phrasing','guided-continuation','conversation-detail','private-ai','ai-command','ai-persona','ai-identity','startup','account-name','daily-delivery'];
let failed = 0;
for (const name of suites) {
    const run = spawnSync(process.execPath, [path.join(root, 'scripts', `test-kitsune-${name}.cjs`), root], {encoding: 'utf8'});
    if (run.stdout) process.stdout.write(run.stdout);
    if (run.status !== 0) {
        failed++;
        console.error(`FAILED: ${name}\n${run.stderr || run.error?.message || 'Unknown test failure'}`);
    }
}
console.log(`${suites.length-failed}/${suites.length} offline dialogue suites passed. No Discord or database calls.`);
if (failed) process.exitCode = 1;

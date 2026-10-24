# Private dialogue lab and live cooldown indicator

## Install and register

Run the guarded installer, then `npm.cmd test`, `npm.cmd run audit`, `git diff --check` and `git status --short`. Commit only the update files and deploy the bot. This update changes the existing `/kitsune` subcommands, so also run `node deploy-commands.js` from the configured project to refresh the guild command schema. The command count remains 38.

## Private lab: Davi only

- `/kitsune test text:<exact chat text> persona:member` tests one turn. Begin a new scenario with a name or actual bot mention, just as in live chat. Unsupported unaddressed text is reported as ignored.
- Use ` || ` or line breaks for up to 10 turns, within 1500 characters. Example: `kitsune pick tea / water || thanks || the other one`.
- Persona options: member, owner, mae, ash. They simulate tone; they do not impersonate or change any real account. Runtime authorization always checks the invoking owner account.
- Leave `seed` unset to continue the same private persona scenario. Set an integer seed to restart it reproducibly. Using the same seed and dialogue produces the same choices and reply-bag order.
- Optional `expected` checks one category for one turn and marks PASS or FAIL.
- `/kitsune testreset` clears all your private personas in this server channel. Live context is not reset.
- Results are ephemeral. Every test includes a downloadable `kitsune-test-report.txt`; longer reports use the file instead of flooding the reply.

Each report shows input, category/status, recognition rule, context before/after, actual reply and optional expected result. The lab calls the real parser, response builder and memory transition. It uses separate session/reply-bag maps and seeded randomness, bypasses cooldown delays, and never emits message events. It awards no XP, performs no moderation, writes no learning data and makes no external AI or database calls. Built-in rules are tested; learned server aliases are not loaded, and third-party member mentions are not resolved in this text-only sandbox. No failure is automatically taught to the bot or committed to the repository. Download a report to review a case for a later regression update.

Private scenarios are scoped by guild, channel, invoking owner and simulated persona. Conversations expire after two real minutes; inactive lab instances are cleaned lazily after 15 minutes, with a global cap of 32 instances. No interval is needed for lab cleanup.

## Live indicator

Short editable text or embed replies gain a small status line: `Next reply in 3s`, `2s`, `1s`, then `Ready`. It reads the actual user/channel expiry values. A new response from another member can extend the shared channel wait. Busy channels display a wait message, not a false Ready. The initial message can appear briefly before its first status edit. Ready is a point-in-time status; later channel activity can restart the cooldown.

An early recognized message updates an existing indicator with a reminder that the message was not processed and needs to be sent again. It does not queue or automatically replay the message. Repeated early messages do not create new warning messages. When no active editable indicator exists, this notice is best-effort and the usual cooldown still applies.

Indicators edit the bot's reply rather than sending additional channel messages. Timers are bounded, unreferenced and stop on readiness, lifetime expiry or edit failure. Maximum 32 active indicators; attempts stop after 10 seconds of continuing channel activity. Files and long replies are skipped to keep content within Discord's limit. `config/kitsuneTesting.js` can disable the indicator. Failed edits never fail a successfully delivered conversation reply or commit new chat memory.

## Validation

Four new offline suites cover sandbox isolation, repeatable seeds, context expiry, scope/owner checks, command schema and ephemeral reports, real-deadline countdowns, shared-channel extensions, early-message bursts, lifetime/cap bounds, edit failures and the actual reply-handler integration. Existing learning-command tests retain all six previous subcommands and account for the two new ones.

# Kitsune conversation consolidation

## What this update changes

This is a rules-and-preset dialogue engine, not a general language model. The update repairs shared recognition, state and presentation paths while retaining the existing dialogue modules and approved-learning system.

- Shared name extraction supports honorifics and start/middle/end placement. Names in quotes, code, links or reported speech are protected; short `kit` remains restricted because it is an English noun. Bounded `kitsuneee` variants work.
- A recovery layer handles missing English request forms, politeness, explicit constraints, common typos, current/past/negated/recovered states, third-person statements, apologies and reported insults. Canonical learning keys are unchanged.
- Thanks, tone changes and short clarification turns preserve active choices. Explicit new topics clear choices. `pick the other one` uses saved options instead of becoming a new incomplete pick.
- Study deferral clears the pending step. Listening controls preserve the active story. Music and game continuations, easy-question corrections and exact saved-question repetition have dedicated context paths.
- Selected advice/joke/secret templates have a bounded pool/index reference for explanations; no member message transcript is stored. Reviewed explanations can be shorter, expanded or illustrated. Unknown meanings request detail instead of being fabricated.
- Criticism, reports, direct hostility, apology and disagreement have different responses. Davi receives protective responses to insults and playful jealousy in positive social contexts; concern or help requests remain practical.
- Only the configured owner account receives the agreed `daddy` response to `mommy`. A display-name change does not grant this behavior. Friends keep their friendly tones. Nickname preferences are temporary conversation state.
- Serious-mode gratitude is plain. Repeated mood questions rotate responses. The default friendly emoji pool no longer uses a smirk.

## Regression inventory

The runner includes all previous suites, the previously deferred flexible-addressing suite, and five new major-update suites.

- `scripts/fixtures/kitsune-major-cases.json`: 145 reviewed live-chat utterances, grouped by failure area. The understanding suite checks recognition and rejects generic fallback responses.
- `test-kitsune-major-context.cjs`: real multi-turn chains, choice retention, corrections, topic resets, listening stories and identity/channel isolation.
- `test-kitsune-major-voice.cjs`: owner/friend/public boundaries, requested names, role spoof prevention, reporting scope, criticism, emotion scope and mood rotation.
- `test-kitsune-major-variants.cjs`: 75 generated phrasing/case/emoji combinations, addressing variants, the observed `sttfu` typo and negative controls.
- `test-kitsune-major-delivery.cjs`: actual reply-handler path with mocked transport, failed-send rollback, cooldown recovery, safe mentions and successful-send memory commits.

These counts describe offline cases, not general-English accuracy. Tests make no real Discord or database calls.

## Remaining work: do not mark these as solved

1. Arbitrary new facts, arbitrary homework questions and unrestricted free-form conversation still require an additional reasoning system or more reviewed content.
2. Not every legacy joke or secret has a semantic explanation. Unmapped templates ask which wording needs clarification; shortening a sentence already short may repeat that sentence.
3. Open questions have a bounded set of follow-ups. Unexpected free-form answers may still need clarification or be ignored when unaddressed.
4. General spelling correction, every slang word and every sentence order are not supported; corrections are deliberately conservative.
5. Ambiguous emoji-only messages and ambiguous references still cannot be reliably interpreted.
6. Account, nickname and tone state is temporary and scoped to the active conversation; this update does not add a persistent personal memory database.
7. Some older response pools remain stylistically uneven. Offline recognition success must be followed by real Discord review of wording, tone and transitions.

## Installation scope

The guarded installer stages reviewed source, runs syntax checks and the full offline runner, then backs up and writes changed files. Failure restores originals. It excludes credentials, dependency trees and root chat-review exports. No slash-command schema or database migration is added; command redeployment is not required.

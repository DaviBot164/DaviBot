# Scoped correction, game advice and open-question continuation

This update handles the collected post-release lab failures. No paid model, external AI request, database schema, Discord command or gameplay/moderation feature removal is introduced.

## Help corrections and reports

Explicit `I mean Daviti helped me, not Ash` changes only the helper. Explicit link/explanation corrections change only their named action role. An unqualified `it was not Ash, it was Daviti` stores a bounded pending correction and asks which role was intended before touching any facts. The subsequent `I mean who helped me` (or explanation/link equivalent) applies that correction to the selected role. Recalling current facts alone does not silently commit an ambiguous correction.

A reviewed uncertain explanation report is acknowledged without replacing confirmed action facts. `I checked, it was Mae` applies only to the role in that pending report. An explicit newer fact for that role clears the old report; topic resets discard both pending reports and pending corrections. Semantic names do not alter account identity or owner permissions.

## Game continuation and advice permission

In an active game conversation, `Roblox`, a better-opponent comment, no-blame statement and desire to improve receive contextual replies. A concrete request such as `got any advice?` or `any small tip?` permits a bounded general practice tip even after a listening-only preference. The existing listening counter is cleared on that explicit request. Shortening applies only to saved advice while advice is permitted. `That's enough advice` removes the saved tip, restores the listening preference and does not stop the whole conversation.

Leaving games for music is an explicit topic switch; `mostly calm stuff` is recognized only in the resulting music context. This does not imply the bot plays Roblox or knows an unprovided game mechanic.

## Open sound questions

The open seaside sound prompt accepts reviewed waves/rain answers, corrections and recall. A proposed rain alternative is kept separate until `I like that too`; additive confirmation preserves an earlier sound. Peaceful/quiet comments are acknowledged. Asking another/different question advances the existing prompt bank and drops pending sound choices. The nonpersonal boundary is retained as fictional-scene conversation.

## Validation and boundaries

Full-chain tests cover all collected utterances, independent role preservation, ambiguous correction before/after clarification, report verification, explicit advice switching and stopping, addressed and implicit turns, sound additions/corrections/recall, recipient personas, render immutability and reset boundaries. Existing suites remain registered. All tests are offline with no real Discord or database calls.

These are finite whole-clause rules. Unknown people, unrestricted paraphrases, arbitrary reported roles and general open-ended answers remain outside this update. Sound-choice logic is scoped to the matching open prompt; it is not global memory. No transcript archive is added.

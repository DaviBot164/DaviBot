# Conversation detail and scoped follow-ups

This update addresses the reviewed dialogue lab chains without adding an external AI service, database schema or Discord commands. Existing progression, moderation, friend identities, learning keys, cooldowns and owner-only nickname permissions remain unchanged.

## Game advice and narration

The stored general practice tip now supports a definition of `exchange`, a generic attack/block/counterattack example and a shorter definition. These follow-ups are scoped to an active game conversation with saved, permitted advice; they do not explain a guessed previous sentence. `No more tips`, `not asking for advice yet` and `just telling you` restore the listening preference and clear saved advice. Project Slayers, early attacks and the user's proposed reason for losing receive acknowledgements without unsolicited coaching or invented game-specific mechanics.

## User titles

The matching open instrumental-title question accepts an explicit `my title is ...` or `maybe ...` answer of at most six alphabetic words and 64 characters. The original title, selected title and optional shorter suggestion are separate temporary slots. Asking for a shorter suggestion does not select it. `I prefer mine` keeps the original, while explicit acceptance selects the proposal. A new question or topic reset discards those slots. No persistent identity/nickname setting is changed.

## Report withdrawal and social scope

`That person was wrong` and `forget that report` clear the pending unconfirmed report while preserving confirmed helpers and action roles. A later bare verification does not resurrect a withdrawn report; it asks which claim was checked and preserves the known facts. Gratitude and a request to stop jealous teasing are acknowledged calmly without losing the helper subject. Reports of insults still target the original speaker, and `not my words`/defending statements do not become the reporter's insult. Ambiguous `him` without a known person asks for a name.

## Scene details

`No people around` uses the existing no-people constraint. `What did I add?` recalls the active details and crowd limit. Existing add/remove operations and new-question resets remain intact.

## Validation and limits

The new actual-parser/lab chains cover addressed and implicit forms, definitions/examples/simplification, listening-state commit, match narration, report withdrawal and stale verification, scene constraints, original versus proposed title, recipient personas and reset boundaries. Render functions copy semantic state before delivery; no live database or Discord calls are made.

Recognition remains bounded to reviewed English forms and current semantic contexts. Title answers use a limited alphabetic format, not arbitrary documents. Game examples are general explanations, not a claim that Kitsune plays or has observed a match. This is not universal English or unrestricted pronoun resolution.

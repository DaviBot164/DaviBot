# Action corrections and scene consent

This update handles the reviewed dialogue lab failures without adding an external AI service or database schema. Existing gameplay, moderation, learning, friend identities and cooldown behavior remain in place.

## Actions

Independent explanation and link-sending roles now support named replacements, explicit additions (`too`), person-specific denials and compound corrections (`Ash did not send it, Mae did`). Removing one actor preserves other actors and unrelated roles. Recall reads the current actor set. Helpers remain separate from explainers and senders.

Pronouns use compatible recently mentioned actors. A female pronoun can resolve to Mae after Ash was mentioned; `he` prefers the most recent compatible actor. A genuinely unresolved pronoun asks for a name, and `I mean Ash` resolves the pending role. These are bounded English rules, not universal coreference. The latest action is stored separately from the latest recall question.

Named yes/no questions do not create facts. Reviewed reported uncertainty and conditional future clauses receive acknowledgements without overwriting established action facts. Rendering copies role maps and arrays; it does not mutate live session memory before delivery. Existing context expiry/reset/isolation still apply.

## Scenes

`Add the breeze back` restores a known detail and clears its exclusion. `Yes, add that` accepts the current valid proposal; only accepted proposals appear alongside user-supplied scene details in recall. Without a proposal, acceptance asks for clarification. `Do not add the lighthouse` records rejection without adding anything and future suggestions exclude rejected and already accepted details.

## Validation

New real-parser/lab dialogue tests cover the supplied chains, additive versus replacement changes, person-specific denials, compatible pronouns, clarification, question/report/conditional guards, identity personas, address placement, context reset, duplicate additions, scene restoration, acceptance and rejection. All tests are offline; no real Discord or database calls.

Known boundaries: independent named action roles recognize Davi/Daviti, Ash, Mae and friend forms; arbitrary open-ended names/actions, arbitrary paraphrases and plural pronoun coreference are not general language support. Scene vocabulary and suggestion alternatives remain intentionally finite. Unknown clauses are not guessed into facts.

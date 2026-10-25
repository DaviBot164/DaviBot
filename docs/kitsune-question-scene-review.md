# Pending answers and scene editing

This update addresses the collected live lab chains. It adds no external AI calls, database schema or new Discord commands. Existing progression, moderation, nickname permissions, friend identities and cooldowns remain intact.

## Short answers

A named action question stores a scoped pending actor and role. Yes/no, compatible he/she/they answers, uncertain answers and not-yet future answers are processed before generic acknowledgement rules. Confirmation adds the actor without replacing other actors; denial removes only the queried actor. A newer named action question replaces the previous pending question. Uncertainty keeps the question open without changing facts. A confirmed answer can be retracted, and a recall can be narrowed with `no, only Ash`.

A mismatched pronoun asks for the intended person. Naming that person resolves the pending confirmation; naming an actor after a question alone does not silently overwrite the last recorded action. A conflicting `yes, but I mean the rules, not the link` asks for clarification rather than asserting a different action.

State remains in temporary guild/channel/user context. Topic changes and expiry drop it. Rendering produces new role objects and arrays; facts are committed through the existing successful-send path.

## Scene edits

A pure scene-edit module operates on both direct details and accepted proposals. Named removal, `remove it`, restoration with `add it back`, replacement, `keep both`, `remove X, keep Y`, and `remove everything except X` update the same active scene. Removed proposals are excluded from subsequent suggestions; explicit restoration clears the exclusion.

Changing to a forest or seaside scene starts fresh, clearing old proposals, accepted details, rejection history, pronoun references and crowd constraints. `Keep the breeze` carries only that explicitly requested existing detail. A stale `add that` after switching cannot restore an old proposal.

## Tests and boundaries

The new full-chain tests cover reviewed short answers, newest-question selection, uncertainty then confirmation, retraction, wrong-pronoun clarification, actor naming without confirmation, role-scope conflict, scene edits and restored details, scene switching, account personas, reset isolation and render immutability. No real database or Discord calls are made.

Recognition is bounded to reviewed whole-clause forms, known role actors and finite scene details. Unsupported clauses do not become facts. This is not a claim of general English or arbitrary pronoun resolution. `Keep both` refers to the latest explicit scene replacement pair; it is not a universal undo system.

# Asked-question follow-ups and gratitude context

## Reviewed live failures

- A nonpersonal scene question -> seaside/a seaside view -> sound of waves -> reciprocal question -> request without options.
- Why that question -> another question -> no choices this time.
- Daviti helped me -> with the server rules -> past confusion -> simple explanation -> gratitude.
- Daviti helped me -> he explained the rules -> I get them now -> gratitude -> explicit no-flirting clarification.

## Behavior

A shared light-question bank defines each prompt and bounded semantic answer slots. The active question index, selected option, nonpersonal/open style and a supported reason are stored as enums. Reciprocal questions use the active scene topic instead of falling back to mood. Why explains the user's requested nonpersonal scope. Asking without options returns an open prompt, and another retains that constraint.

Help discussion records a known helper, subject and stage: asked, explained, initial confusion, understood or grateful. A simple explanation of rules is acknowledged as help instead of being treated as romance. Gratitude does not introduce jealousy or flirting. An explicit no-flirting clarification is handled calmly without changing the underlying help topic.

Context still belongs to one author and channel, expires normally, and clears on restart/topic change. No chat transcript, raw message archive, database schema, slash command, external AI, XP or moderation change is added. Mommy variety from the previous update remains covered by the full suite.

## Verification and limits

The new offline suite covers both versions of every collected chain, response meaning, semantic slots, reciprocal topics, open prompt constraints, helpers and gratitude, all personas, seed/case/polite variants, author/channel isolation, reset and subject/negation controls.

Answer recognition is bounded to the supported forms in the bank; open prompts do not imply arbitrary free-text understanding. These offline checks are not a general-English accuracy score. Live phrasing review is still useful.

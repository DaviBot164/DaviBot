# Social scope, personality and contextual edits

## Collected live cases

- Insult -> criticism of the answer -> actual explanation of the boundary -> concise reply -> explicit apology -> reconciliation. We good is reconciliation rather than an assumed apology.
- Insult about Davi -> clarification that it was quoted -> ordinary criticism -> compliment -> no flirting -> apology.
- Davi/Daviti reports, defence, help, gratitude, compliments and jealousy questions. Aliases are normalized only inside semantic person recognition; display names, account authorization and learning keys are unchanged.
- Owner/member jealousy questions, friendship clarification, reassurance, easy-question requests and company. Jealousy is playful, never an instruction to avoid friends. Reports, gratitude, concern and criticism are not directed attacks.
- Honorifics, modal polite requests and supported name positions, including can you, Kitsune, ask me something easy. Whole-form negatives and per-author/reset boundaries are checked.
- A new choice with instead after cancellation; music as well/too additions versus replacement, frequency retention and duplicate-free corrections; draft detail/formality changes with no-pressure wording; game preference correction/recall; enough-about topic switching.

## Implementation

Extends existing recovery, brief conversation and semantic follow-through modules. A small social tone bank provides varied firm boundaries and owner/member jealousy. Selection uses the existing isolated seeded RNG and avoids immediate repetition in that bank. Actual owner account ID controls owner tone. Gentle and serious modes retain their restraint.

No raw chat transcript is added to memory. Semantic fields record person, social phase/index, answer kind, preference and style. Topic changes and session scoping still clear or isolate context. No slash schema, database, XP, moderation or external AI changes.

## Verification and limits

The new suite covers collected full chains, response meaning, owner/friend/member personas, Davi/Daviti variants, modal/name positions, negative controls, identity spoofing, context reset, constraint reversal and additive preference corrections. The reviewed fixture for we good now expects reconciliation, reflecting the corrected meaning.

This is bounded English recognition, not universal sentence understanding or a general-English accuracy score. Unsupported forms may still require clarification. Offline tests do not replace live review of tone and phrasing.

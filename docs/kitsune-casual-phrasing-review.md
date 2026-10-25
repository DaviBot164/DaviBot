# Casual phrasing and short conversation continuation

The reviewed lab chains now use bounded whole-clause paraphrases in the existing recovery pipeline. No external AI service, database schema, slash command or feature removal is introduced. Canonical learning keys and account-based friend/owner authorization are unchanged.

## Reviewed behavior

- `Ash gave me a hand` starts the existing independent-helper thread. In a help thread, `Mae was the one who explained them`, `the link came from Ash`, `who explained everything` and `who shared the link` resolve to existing independent action roles. Helping someone understand the rules does not itself record an explanation author. Incompatible known he/she references do not assert that understanding.
- `Good, just gaming` opens a game conversation; a loss, denial of anger, disappointment and a request for company continue it. `Wbu` stays about games, with an honest character preference rather than a claim that the bot plays. A no-tips/company request sets the existing listening preference and does not offer unsolicited gameplay tips.
- `That reply was not what I asked for`, `not insulting you`, a direct-answer request and `never mind, let's reset` use existing repair/reset behavior. A request for an easy question with no options uses the open nonpersonal prompt. Work/school exclusion is acknowledged and retained in that scoped scene/question context.
- Scene variants support switching to the forest, keeping only one detail, adding moonlight, recalling details and taking a detail out. A scene switch clears active old details by default. The previous bounded detail keys are retained only to honor a subsequent explicit `keep only the breeze` request; they are not part of recall or suggestions unless explicitly selected. New questions and normal topic resets drop this scene state through the existing context lifecycle.

## Verification and limits

New tests run the actual parser, responses, lab and memory path for full chains, addressed and implicit continuations, known helper identities, recipient personas, listening-state commitment, reset boundaries and negative/quoted-report-like clause guards. All checks are offline; no real Discord or database calls.

This update recognizes the reviewed finite forms; it does not claim general English understanding. Help paraphrases that depend on a prior subject require an active help thread. Scene shorthand requires a nonpersonal scene context. Unknown third-party/report/conditional variants are not turned into action facts. Existing fallback and session isolation remain available.

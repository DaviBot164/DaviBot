# Private Groq dialogue trial

This adds an optional owner-only engine to `/kitsune test`. It does not change the public message handler, existing conversation rules, learning, XP, moderation or database. No new npm dependency is needed on the current Node 24 runtime.

## Install and enable

1. Run the guarded update installer and the existing offline test/audit commands. All provider HTTP calls in tests are mocked, even if a real API key exists in the environment.
2. Commit/push the reviewed source files and deploy the bot on Northflank as usual.
3. Register the updated slash schema once with `node deploy-commands.js` from the local project with its existing Discord TOKEN, CLIENT_ID and GUILD_ID. The new optional option is `engine`; no new top-level command is added. This registration is a real Discord action performed by the operator, not by the installer.
4. Create your own Groq account at https://console.groq.com/ and keep the account on **Free Plan**. Do not upgrade to Developer or add a paid plan for this experiment. Create a Groq API key at https://console.groq.com/keys.
5. In Northflank's secret environment variables, add `GROQ_API_KEY` with that key and `KITSUNE_AI_LAB_ENABLED=true`. Apply the variables/restart the deployed service. Never put the key in Discord, Git, an uploaded report or a source file. The local project does not need the Groq key merely to register commands or run offline tests.
6. Use `/kitsune test`, `engine: groq`, `persona: member`, `seed: 17`, with a short fictional chain such as `kitsune hi || hru? || good, just gaming`.

Start with three turns to confirm access before longer batches. The report explicitly says Groq and generated, rather than claiming rule matches. Use the same chain with `engine: builtin` to compare. `expected` categories are only for the built-in engine.

## Free plan and limits

Groq's official Free Plan FAQ states that free-plan usage is not charged and exceeding provider quotas returns 429. The bot does not upgrade plans, enter payment details or call any billing endpoint. **An API key does not expose a trustworthy billing-tier field: the bot cannot independently prove your account is on Free Plan.** If an operator supplies a paid-plan key, API calls may be billable. The small local cap is a usage guard, not a guarantee against charges on a paid account.

The trial is fixed to `openai/gpt-oss-20b`. Requests use up to 1024 completion tokens, low reasoning effort, final answers only, no tools and no automatic retry. Provider rate limits and model availability can change. A provider error stops the remaining turns and is shown in the private report; it is not silently replaced with a built-in reply.

The local cap is 30 request attempts per UTC day per bot process, including failed attempts. A reset or seed does not reset the cap. A process restart or another bot replica has its own counter; this is not a distributed budget or account-level token limit. Keep one trial replica and use the Free Plan for the cost boundary. There is one AI batch at a time per process, a 15-second deadline per request, at most 10 input turns and no background retries.

## Privacy, memory and persona

Only text entered in the private test and recent turns from that simulated AI conversation are sent to Groq with a fixed Kitsune persona prompt. No Discord channel history, account IDs, database records, learned aliases, token, API key or live bot memory is added to the prompt. The key is used only in the Authorization header to the fixed HTTPS Groq endpoint; redirects are rejected. Obvious API-key or TOKEN/password assignments are rejected in input. Do not use the lab for secrets or private member records.

AI test history stays in process memory for 10 minutes, with at most 16 scenarios, 12 history messages and 6000 history characters each. Older pairs are dropped, so very long scenarios may lose early details. Keys include guild, channel, invoker and simulated persona. A seed starts fresh history but does not promise deterministic model output. `/kitsune testreset` clears your built-in and AI scenarios in that channel; it does not reset quotas. Completed inference turns are retained for that private scenario; provider-failed turns are not committed. This has no effect on live chat state.

Reports are ephemeral with mentions disabled and an attached text report, just like existing private tests. The external model cannot run commands, moderate, award XP, change account permissions or write learning data. Persona simulation is not account authorization. The model's dialogue quality and persona adherence still need real evaluation; passing mocked transport tests does not establish conversation quality.

Groq documents limited inference-data retention for reliability/abuse monitoring and organization data controls, including zero-data-retention options. Read current account settings before any later public integration. The current trial is deliberately available only to the adult owner; it does not enable a public AI service for members.

## Disable / troubleshooting

Set `KITSUNE_AI_LAB_ENABLED=false` or remove it and restart. Remove/revoke the Groq key if no longer needed. Built-in tests and public chat continue normally. On 401/403 check the secret and model access; on 429 wait for provider quota recovery; on timeout wait and try later. Error reports do not include raw provider errors or authorization headers.

## Official references checked while building

- https://community.groq.com/t/do-i-get-charged-for-anything-on-the-groq-free-plan/832
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/models
- https://console.groq.com/docs/text-chat
- https://console.groq.com/docs/reasoning
- https://console.groq.com/docs/your-data

Offline verification covers authorization, opt-in, source/schema routing, empty/malformed/rate-limit/credential/network responses, no retries, timeouts, quota and reset behavior, bounded history, persona/channel isolation and redaction. No real Groq, Discord or database calls were made during implementation or installation validation.

## Persona refinement after the first live trial

The trusted prompt now separates forms of address from people, gives owner/member-specific tone, avoids service-style repeated endings, retains nonpersonal/no-options constraints, recognizes an already-defended quotation, and forbids invented game mechanics or PvP/PvE substitutions. Examples are style guidance, not exact response templates. Public built-in dialogue is unchanged.

Mocked tests verify that the correct trusted prompt and raw dialogue/history reach the provider for every persona. They cannot prove model compliance or factual accuracy. Repeat the short live regression chains after deployment when provider and local quota permit. Existing limits, opt-in, model, authorization and history bounds are unchanged; no slash-command registration is needed for this refinement.

## Address and speaker separation

AI turns now use the existing quote-aware address parser before inference. The provider receives a JSON user envelope with addressee and dialogue; reports retain the original submitted line. Stored private user turns use the same prepared envelope so removed forms of address do not return through history. Quoted names, links and reports follow the existing address protection rules.

A trusted system speaker record comes only from the selected simulation persona: ordinary members have no known name; owner and Mae have the configured direct address Davi but distinct roles. Mentioned names cannot grant owner identity. These structured cues improve grounding but do not enforce generated wording or prove model compliance. No output renaming filter is applied, so a quoted or third-person name is not blindly rewritten.

This update changes private AI input preparation and guidance only. It does not add factual game knowledge, public AI, persistent role memory, extra requests or retries. Live regression is still required, including member-name leakage, Ash/Daviti address separation, advice uncertainty and protected quotes.

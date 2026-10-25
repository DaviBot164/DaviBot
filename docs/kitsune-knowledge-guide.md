# Owner-approved server knowledge

This extends the existing learning tools; it does not retrain Groq or enable public AI. Approved action meanings remain in /kitsune teach (25 choices). Descriptive knowledge has its own typed records and does not turn definitions into executable requests.

## Commands

- /kitsune remember name:tomy kind:member member:@Tomy explanation:A friend from the server.
- /kitsune remember name:tom kind:member member:@Tomy (another nickname for the same ID)
- /kitsune remember name:moonbound kind:term explanation:Your own explanation.
- /kitsune remember name:go ahead phrase kind:phrase explanation:A request to continue speaking.
- /kitsune remember name:training room kind:channel channel:#training
- /kitsune remember name:moon staff kind:role role:@Staff
- /kitsune remember name:daily reward kind:command explanation:Use /daily to claim your daily reward.
- /kitsune remember name:trial day kind:fact explanation:Your server's confirmed schedule.
- /kitsune remember name:moon greeting kind:reply explanation:A custom canned reply.
- /kitsune knowledge page:1
- /kitsune unremember name:tomy

Use the same name in remember to replace a record's type/target/explanation. Removing one nickname leaves other nicknames intact. Member, role and channel types require an actual selected server object, with guild membership verified for members. They store the object's ID; they do not grant roles, owner status, staff bypasses or permissions. Built-in names and recognized built-in requests cannot be overwritten. Learned action aliases retain priority over knowledge for the same literal phrase; use an explicit lookup question or remove the old phrase alias if needed.

## Using knowledge in chat

Address Kitsune: `kitsune tomy`, `kitsune who is tomy?`, `kitsune what does moonbound mean?`, `kitsune tell me about trial day`. Name matching is normalized and exact after a small set of lookup prefixes; it is not fuzzy recognition, arbitrary sentence reasoning or automatic pronoun resolution. Unicode names and explanations can be stored; lookup prefixes are currently English. The normal addressing/reply/short active-session boundary applies. Background chat is never scanned for automatic replies.

A member answer links the saved Discord ID with mentions disabled. It is described as a saved association, not proof of current membership, gender, friendship or permissions. Member nicknames do not change the caller's identity or Kitsune's owner-specific tone. Saved facts are owner-provided and may need manual updates. The system does not scrape member profiles or save their chat history. Custom replies are literal text; code, links, mentions and credential-like explanation text are rejected. Definitions are not sent to external AI.

Knowledge replies currently stand alone and end the active conversation context; they do not add person facts to the semantic conversation engine. Other sentences mentioning a learned name may still need future language support. Describing `go ahead` explains it; use teach meaning:continue when the phrase should actually continue a conversation.

## Storage and boundaries

A new additive kitsune_knowledge table is created by the existing learning schema initializer at startup. Existing aliases, unknown phrases, XP and other data remain unchanged. At most 300 named records per guild, labels 2–80 characters, explanations up to 500. Save/update uses the existing guild advisory-lock namespace, parameterized queries and transaction rollback; a directly matching unknown label is removed only after a successful save. Lists show ten shortened records per page; chat lookup shows the full explanation.

Runtime cache: 50 guilds, 60-second TTL, one in-flight load per guild, 30-second database-failure backoff, immediate local invalidation on save/remove. Other replicas may retain a record until TTL expiry. No persistent conversation transcript is added. Repository connection/query deadlines are bounded; failures do not disable normal dialogue.

## Deploy and verify

Install and run offline checks, commit/push/deploy, then register slash schema once with `node deploy-commands.js` using the correct local GUILD_ID. The top-level command count remains 38; /kitsune has three new subcommands. The schema is initialized by bot startup. Only the real owner may save, view or delete records; replies and reports disable mentions.

After deployment save one member nickname, ask who that name refers to, update its explanation, inspect knowledge and remove it. Verify another guild cannot read it. Do not teach sensitive personal records or secrets. No real database, Discord or Groq calls are made by the installer/offline tests. Transaction tests use an in-memory protocol stub and do not claim real PostgreSQL concurrency coverage.

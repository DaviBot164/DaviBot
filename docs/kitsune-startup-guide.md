# Startup diagnostics and verified TLS

The ready event keeps the bot online if Discord rejects its account rename. It now logs numeric status/code and up to three username validation messages, not the raw request, response, stack or authorization headers. Known secret environment values and URL/credential patterns are redacted. No retry loop was added. The actual 50035 cause must be established from the next deployed error details; this update does not promise that Discord will accept the name Kitsune.

Database configuration converts legacy URI sslmode=prefer/require/verify-ca to explicit verify-full, retaining the current verified behavior described by the installed pg warning across future parser changes. Production fallback TLS now verifies certificates instead of disabling verification. URI certificate options remain intact and pg still owns their parsing. Explicit disable/no-verify modes are not silently rewritten; review those separately if used. Nonproduction without a URI TLS mode retains its previous default.

If the database requires a private CA, configure its trusted CA through the provider-supported certificate configuration (for example sslrootcert in the secret URI). Do not fix a certificate error by disabling verification. No plaintext fallback or automatic connection retry is introduced. This may reveal an invalid certificate on a deployment that previously depended on rejectUnauthorized=false; the existing connected deployment with a legacy sslmode should retain the verified behavior.

No dependencies or slash schema change. Installer checks use mock pg/Discord; after deployment inspect Database: Connected and the name diagnostic. Never share the URI, key or environment screenshot with revealed values.

References: https://node-postgres.com/features/ssl ; https://github.com/discord/discord-api-docs/blob/main/developers/reference.mdx

## Separate account and server names

The account rename target is now KitsuneBM. The visible brand stays Kitsune; in the primary GUILD_ID server the bot sets its own nickname to Kitsune 🦊. It does not edit other guilds or members. Both changes skip an already matching value, run independently and fail without blocking startup or the scheduler. No retry loops or extra environment variables are added. Discord availability and nickname permission are verified only after deployment; KitsuneBM availability has not been checked.

## Initial XP/daily audit (source review)

claimDaily locks the user then stats in a transaction and uses database clock_timestamp after locks; a repeated claim checks the last claim before awarding. awardXP also locks the user before its update. This is useful protection, but source inspection alone is not a completed real concurrency test.

One follow-up issue was identified: the daily command awaits its Discord receipt before progression refresh. If receipt delivery fails after the reward commits, promotion/unlock refresh is skipped for that invocation. Reward rollback must not be attempted after a committed award; delivery and progression side effects need independent error handling in the next reward-focused update. This account-branding update does not alter rewards, balances or database schema.

# Startup diagnostics and verified TLS

The ready event keeps the bot online if Discord rejects its account rename. It now logs numeric status/code and up to three username validation messages, not the raw request, response, stack or authorization headers. Known secret environment values and URL/credential patterns are redacted. No retry loop was added. The actual 50035 cause must be established from the next deployed error details; this update does not promise that Discord will accept the name Kitsune.

Database configuration converts legacy URI sslmode=prefer/require/verify-ca to explicit verify-full, retaining the current verified behavior described by the installed pg warning across future parser changes. Production fallback TLS now verifies certificates instead of disabling verification. URI certificate options remain intact and pg still owns their parsing. Explicit disable/no-verify modes are not silently rewritten; review those separately if used. Nonproduction without a URI TLS mode retains its previous default.

If the database requires a private CA, configure its trusted CA through the provider-supported certificate configuration (for example sslrootcert in the secret URI). Do not fix a certificate error by disabling verification. No plaintext fallback or automatic connection retry is introduced. This may reveal an invalid certificate on a deployment that previously depended on rejectUnauthorized=false; the existing connected deployment with a legacy sslmode should retain the verified behavior.

No dependencies or slash schema change. Installer checks use mock pg/Discord; after deployment inspect Database: Connected and the name diagnostic. Never share the URI, key or environment screenshot with revealed values.

References: https://node-postgres.com/features/ssl ; https://github.com/discord/discord-api-docs/blob/main/developers/reference.mdx

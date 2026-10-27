# Kitsune Studio connection

The optional Control API connects the private Kitsune Studio website to this bot. It is disabled by default. The shared key grants the bot owner access to learning across cached guilds. Never distribute it to server administrators or place it in browser code, Git, logs or chat.

## Enable on Northflank

1. Install and deploy this source update first. Existing chat and all 38 commands continue to work without enabling the API.
2. Generate a new key locally with Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Add Northflank runtime variables: `KITSUNE_CONTROL_ENABLED=true`, `KITSUNE_CONTROL_PORT=8080`, and secret `KITSUNE_CONTROL_KEY=<the generated 64-character hex key>`.
4. Expose HTTP port 8080 through a Northflank HTTPS endpoint. Use its root URL ending in `.code.run` or `.northflank.app`. Do not expose the endpoint without its key. No Discord token, database URI or Groq key belongs in the Studio form.
5. Open the private Studio Connection section, paste this HTTPS URL and Control key. The Studio verifies the authenticated status endpoint before storing the key encrypted on the server.
6. Read the available server IDs there. Put the matching ID into that server profile settings and save. In Learning > Bot knowledge, refresh. Draft records are applied individually with the arrow button; saving a draft alone does not teach the bot.

## Current scope

- Owner-only bearer authentication; constant-time token comparison, body and request caps, no browser CORS.
- Knowledge, learned phrases and unknown phrases are read from existing PostgreSQL repositories, scoped by guild ID. Writes use existing validation, built-in protection and cache invalidation. Member, role and channel IDs are checked against the selected guild.
- Website tests run the isolated built-in dialogue lab with a fresh seed. They do not call Groq, learn phrases or send Discord messages.
- Website server settings are durable drafts only. They do not yet change welcome, moderation, progression, channels, roles, language or branding in the running bot.
- This is a private bot-owner panel. It does not implement Discord OAuth, public server-admin access, code editing or deployment from the browser.
- Complete multi-server conversion of the existing Blood Moon configuration remains separate work. Adding a profile does not invite the bot or convert those systems.

## Disable / rotate

Set `KITSUNE_CONTROL_ENABLED=false` and redeploy/restart to close the listener. Disconnect in Studio to remove the stored connection. To rotate, generate another key, replace the Northflank secret, restart and reconnect Studio. Do not repeatedly restart for Discord account-name synchronization.

The API runs 30 authorized requests per minute per process, accepts at most 16 KB request bodies, and returns generic failure messages. The private dialogue lab supports 1–10 lines, at most 1500 characters. No automatic retries or billable AI calls are introduced.

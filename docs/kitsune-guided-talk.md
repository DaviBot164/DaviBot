# Kitsune guided conversation

Authored English and Georgian dialogue; no AI calls, ambient replies, XP or rank rewards.

Type `kit`, `kitsu` or `kitsune`, then choose Let’s chat. Existing hub chat links open the same engine. English is the default; the language button changes the current reply and subsequent choices without changing the conversation node. Back returns to the previous reply; topic change returns to mood choices. Stories and Games open the existing activity system. Goodbye / Close removes only the private chat panel.

37 authored nodes cover quiet company, tiredness, encouragement, jokes and short fictional branches. Replies rotate within each node when variants exist; Back deliberately restores the previous variant. The system does not interpret free text or invent responses.

Private sessions are held in memory for 30 minutes from opening, with a maximum of 1,000 active sessions and 120 actions per session. Bot restart clears chat sessions; story checkpoints remain in their existing database. Expired or stale buttons never advance a different session. Type kit again to start fresh. Close remains available at the session action limit.

## Studio lab

Deploy this bot update before using the updated Studio dialogue lab. Authenticated `POST /v1/talk/test` accepts the selected guild ID, initial language en/ka, and up to 120 valid action IDs. It replays the pure engine from the beginning and returns the current view plus transcript. It makes no Discord or database calls. Normal Control API authentication and rate caps still apply. Old `/v1/test` stays retired.

Studio uses this endpoint rather than a copied dialogue tree. It offers language switching, actual conversation choices, back, restart, transcript copy/TXT export, issue notes and saved test reports. Saved test reports are private Studio data; they do not teach or modify the bot automatically. Existing archived tests remain intact. Activity buttons are exercised in Discord; this lab tests guided chat only.

Content: handlers/hub/talk-content.json. Pure reducer: talk-engine.js. Discord sessions: talk-runtime.js. conversation.js retains a compatibility view for older hub rendering. New node and both translations must use the same choice IDs and equal reply-variant counts.

Validation: node scripts/run-kitsune-dialogue-tests.cjs

# Kitsune · Server Studio

## Install and register

Keep `GUILD_ID` set to the existing primary server ID during the first deployment. Only that server imports its existing Blood Moon channels and roles. Other servers start with their own neutral defaults. No existing progress/knowledge table is cleared.

Run the guarded update from the bot folder. It checks source, validates the staged files, runs offline tests and creates a source backup before writing. Deploy after reviewing its successful log.

After deploying, run `node deploy-commands.js --clear-primary` once from a trusted environment containing the correct TOKEN, CLIENT_ID and primary GUILD_ID. This registers all 38 commands globally, then removes the old primary-only registrations to avoid duplicates. It does not delete progress or messages. Global command visibility can take time to refresh.

Keep existing database and Control API environment variables. No new dependency, secret or paid service is required by this update. Continue using the existing database/hosting plan.

## Configure a server

Invite the bot using Studio's Discord invitation. Basic chat permissions are the default. Select the additional moderation/roles/tickets option if needed; Administrator permission is not requested. Guild Members and Message Content privileged intents must remain enabled in the application's Discord Developer Portal settings.

In Kitsune Studio choose/create the server profile, save its Discord ID, open Server settings and load the bot configuration. Choose that server's channels and roles, brand text, theme, path/rank labels and enabled systems. Save to the bot. Configuration is stored by guild ID in PostgreSQL with version checks. If another save wins, reload before editing again.

Staff, progression and achievement roles remain separate. Keep Kitsune above roles it should assign. Existing rank IDs and progression rules remain stable; labels are editable. Without role mappings, rank/XP state can still progress, but the bot cannot assign unconfigured Discord roles.

The nine switches gate welcome, moderation, XP/progression, approved learning, conversation, tickets, matches, trials and logging. Old setup posts are not deleted when a switch is disabled. Bot-owner tools remain restricted to the configured bot owner. This is the owner's private control site, not a public Discord administrator login portal.

## Welcome

Choose a custom design, title, subtitle, message, background and accent color. `{server}`, `{user}` and `{count}` are placeholders. The user placeholder mentions only the arriving member in the message. Preview renders a sample PNG without posting to Discord. Download PNG if needed. Save to the bot, enable Welcome and select its channel for future joins. The existing Blood Moon image remains available as Legacy mode.

## Setup

Save settings first. Select guides/panels and preview their content and destination channels. Missing channels or posting permissions block publication. Click Publish to send/update the selected posts. The preview expires after two minutes, is scoped to one guild/settings revision and can be used once. A later preview can retry failed sections. Stored message IDs and guild/page locks update existing posts instead of repeatedly sending copies. Changing destination channels creates the post in its new destination; old-channel posts are not automatically deleted.

Custom guide title/text is optional. Reset a page to use its default content. Setup publishes messages and panels; it does not create channels or roles. Create those in Discord and select them in Studio.

## Existing systems

All 38 commands, tickets, matches, trials, daily rewards, missions, XP, achievements, moderation, logs, dialogue lab and approved knowledge remain in the project. The website does not silently enable external AI in live chat. Groq stays a separate private trial. Existing account username is preserved; per-server branding applies to cards and guides. Every server has independent resource mappings and progress records.

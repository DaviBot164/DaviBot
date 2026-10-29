# Kitsune server hub

The hub replaces ambient free-form conversation and private AI experiments. No external model, API key or per-message AI charge is used.

## Publish

1. Deploy this bot update and run `node deploy-commands.js` once to replace the old `/kitsune` schema.
2. In Studio, load the selected guild settings, assign the Kitsune hub channel and save.
3. Select **Kitsune hub** under Setup, preview, then publish. Existing setup-post tracking edits this bot's previous panel instead of duplicating it.
4. Anyone can use `/kitsune open`. A server member with Manage Server may use `/kitsune publish` for the configured destination.

The public panel opens a private menu. Navigation IDs bind every private view to its guild and member. Shared path, Daily Drop, profile, achievements and mission actions use their existing authorization and reward handlers. Browsing explanations does not grant XP or roles. No server action is inferred from chat.

## Manage knowledge and guides

Studio's server knowledge library keeps approved member nicknames, terms, phrase explanations, roles, channels, commands, facts and custom replies. Members browse or search this same PostgreSQL knowledge store. `/kitsune remember`, `knowledge` and `unremember` remain owner-only.

Custom guide text under Studio Setup is shared by published guide posts and the hub. Rank paths are generated from the selected guild's current configuration. Disabled progression and knowledge modules are hidden; every click checks the current module state.

## What is retained

XP, ranks, factions, rank history, role mappings, tickets, Welcome images and all other operational data remain unchanged. Old taught intent aliases remain in their original table, exported read-only to Studio; they no longer drive conversation. Old unknown-phrase rows are not collected or deleted. Saved Studio dialogue scenarios and reports remain in its read-only archive and exports.

The installer backs up every changed/deleted file locally and writes `restore-source.cjs` in the reported backup directory. The original source ZIP also retains past dialogue rules and test cases. No database table is dropped. Retired conversation/AI source and its matching tests are removed only after staging validation. The smaller system test suite covers the active systems; it is not a comparison of language-model quality.

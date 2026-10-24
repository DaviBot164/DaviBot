# Source cleanup audit

No feature, command, database table, user data, XP, achievement, rank, welcome or moderation system is removed.

## Removed

- `utils/corpsComponents.js`: unreferenced old Corps menu builder. The active `/corps` command uses `utils/recordBrowser.js`.
- `utils/legacyComponents.js`: unreferenced old achievement/title menu builder. The active `/legacy` command uses `utils/recordBrowser.js`.

Both names and their exports were searched throughout the reviewed project. Static dependency traversal from startup, deployment, every command and every event found no live references. The guarded installer backs up their exact bytes before removal and restores them on failure.

## Small maintenance changes

- Removed an unused recognition argument and updated its only call site.
- `npm test` now runs the existing dialogue runner instead of the unused default error placeholder.
- `npm run audit` performs a read-only inventory of local dependencies, exact normalized duplicates, command/event registrations and unreferenced candidates. Dynamic behavior still needs manual review; candidates are never automatically deleted.

## Findings retained intentionally

- All 213 remaining runtime JavaScript files are statically reachable. The audit found 38 command names, 10 event registrations, no missing local require targets, no exact normalized duplicate runtime files and no duplicate registrations. This is a static audit, not proof of runtime coverage.
- Older conversation modules are still referenced and are not obsolete merely because their rules are labelled legacy.
- The database rename migration is still required for compatibility with stored data.
- The language test wrapper is a deliberate compatibility alias, not a second runtime subsystem.
- Untracked root chat-review exports and the accidental `tatus --short` file are outside this code cleanup and are not touched.

Removing unloaded files improves maintainability and source size; it does not materially reduce running-process RAM. Larger memory changes require profiling active caches, timers and pools.

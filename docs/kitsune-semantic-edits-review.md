# Meaning-preserving edits and cancellation

This update covers the collected unanswered-message chains, possible need for space, no-pressure requests, gentle follow-up drafting, shortening without losing the earlier-message reference, explicit earlier-message and unhurried-reply constraints, additional music preferences with too/as well, removal of current genres, cancellation of random/user choices, and switching from a draft to games with a short PvE/PvP explanation.

Read receipts are now distinguished from a general feeling of being ignored. The response acknowledges the user-reported seen-but-unanswered message without claiming to know the friend's reason. Draft variants retain the check-in intent instead of turning it into a generic invitation to chat.

Cancellation uses an explicit semantic marker and clears the selected option. Leaving both options clears the option list too. The memory merge now respects explicit null fields instead of restoring stale values. Recall after cancellation describes no active decision. A fresh choice or topic reset replaces that state. Pausing/resuming a cancelled decision cannot resurrect the old selection.

Music removal deletes the active genre slot, while retaining another supported preference. Recall after all genres are removed describes no current saved preference. No transcript storage or database changes are introduced.

The new offline suite uses the real parser, private lab, responses and memory. It tests full collected chains, meaningful response content, constraint retention, removals, cancellations, resets, scope, personas, capitalization and seeds. Existing handler delivery, rollback and isolation tests remain part of the full runner.

Limits: this remains a bounded English rule engine, not general English understanding. Unsupported genres, subjects and open-ended writing requests may need clarification. These are offline cases, not a general-language accuracy measurement. No live Discord/database calls, schema changes, external AI or new paid service.

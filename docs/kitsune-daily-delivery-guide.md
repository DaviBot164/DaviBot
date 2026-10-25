# Daily reward receipt isolation

After claimDaily finishes its database transaction, Discord receipt delivery is best-effort. A failed edit or embed construction logs only a numeric error code and no longer prevents auto-promotion (when levels were gained) and progression unlock refresh. Existing promotion/refresh error boundaries remain independent. No award retry is added. A duplicate claim still uses the database last-claim check and does not run success-only side effects.

Defer/member validation/profile setup and claim failures still stop before success side effects. Reward amounts, streak calculation, SQL locks, schema, cooldowns and slash definitions are unchanged. Receipt failure cannot roll back an already committed reward; the user may see an unanswered interaction although the claim succeeded. A subsequent daily request reports the cooldown rather than re-awarding.

Offline command tests cover receipt rejection and construction failure, promotion/refresh failures, duplicate claims, no-level-up, missing/bot members, defer/profile/claim failures. Existing mission tests cover repeated claims and rollback. They do not replace a real multi-connection PostgreSQL concurrency test.

After deployment, use /daily once, inspect its XP/streak receipt and then invoke it again to verify a cooldown response. There is no need to intentionally cause a real Discord failure or alter live rewards.

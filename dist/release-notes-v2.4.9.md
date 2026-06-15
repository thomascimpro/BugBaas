## BugBaas 2.4.9

### Fixes
- Fixed the report status reward loop: fixed reports can no longer be moved back and fixed again for repeated rewards.
- Report, comment, status, upvote and fixed BugDex rewards now share one daily BugDex reward limit.
- Foreground reward bugs for report actions are only queued when the daily reward is still available.
- Weekly solo campaign mission now requires wave 20.
- Completing all weekly missions now gives an epic BugDex reward.

### Checks
- `npm run typecheck`

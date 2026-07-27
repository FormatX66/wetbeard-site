# Live Project Feed From Git/GPT Work

## Use when
A portfolio/lab site should reflect actual ongoing work instead of becoming a manually maintained static page.

## Proven pattern
1. Keep real project/activity data in a small machine-readable file such as `activity.json` or `github-status.json`.
2. Refresh the feed on a schedule from factual GitHub/GPT work only.
3. Load the feed at runtime with cache disabled or an appropriate short cache policy so updates do not require a visual rebuild.
4. Separate factual project status from fictional presentation. If information looks like a real status, it must come from real data; fictional content should be clearly part of a puzzle/Easter egg.
5. Expose only sanitized project metadata suitable for the public site.
6. Make refresh failures degrade to an offline/stale message rather than breaking the visual experience.

## Source history
Derived from ArkmatX live worklog/GitHub telemetry in PRs #39 and #41.
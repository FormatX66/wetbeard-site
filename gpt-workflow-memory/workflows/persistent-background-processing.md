# Persistent Background Processing for Web Apps

## Use when
A web task may take longer than the user's page/session and should continue after the browser closes.

## Proven pattern
1. Accept the upload/request quickly and persist it as a queued job.
2. Store progress/status server-side, not only in browser state.
3. Use cron/worker processing with a lock so the same job is not processed twice.
4. Separate local/manual uploads from slower external/cloud polling cadences where appropriate.
5. Persist intermediate progress phases so the UI can resume after refresh.
6. Create a dedicated review/result page per completed job/import.
7. Verify the worker path, queue path, storage permissions, and protected result route during deployment.
8. Keep production data server-side and out of Git.

## UI principle
Do not fake progress. Browser upload progress can represent actual transfer; later stages should read persisted server-side progress states written by the worker.

## Source history
Derived from Social Miner PRs #28, #30, and #32.
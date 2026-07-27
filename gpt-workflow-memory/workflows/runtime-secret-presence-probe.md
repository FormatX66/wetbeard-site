# Safe Runtime Secret Presence Probe

## Use when
Deployment depends on secrets/credentials and GPT needs to know whether they are already configured without exposing them.

## Proven pattern
1. Never print, echo, commit, or return the secret value.
2. Check only whether the expected secret/environment variable exists and is non-empty.
3. Record a boolean/status such as `OPENAI_API_KEY: present` or `missing`.
4. Keep the probe one-shot or narrowly scoped.
5. Let deployment proceed automatically when required values are present.
6. If missing, identify only the exact missing configuration item for the user.

## Rule
Ask the user for credentials only after a safe presence probe shows the required value is genuinely unavailable.

## Source history
Derived from runtime-secret status probing in PR #51.
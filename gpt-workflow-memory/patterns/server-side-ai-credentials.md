# Pattern: Server-Side AI Credentials

## Rule
Never place OpenAI API keys or private creator passwords in browser JavaScript, public JSON, committed source, or rendered HTML.

## Preferred pattern
- Browser sends creator input to a private server endpoint.
- Server reads the API key from environment or protected server storage.
- Server calls the AI API.
- Server returns only required results.
- Raw private notes/uploads remain private unless explicitly published.

## First-run setup fallback
When repository secrets are unavailable, provide a server-side first-run setup page that stores credentials in a protected runtime data directory rather than hard-coding defaults.

## Verification
- Search built frontend for secret values/names.
- Inspect browser network traffic to ensure keys are never sent to the client.
- Confirm private data endpoints require authentication.

## Keywords
OpenAI API key, secret, browser, PHP, creator studio, admin password, server side, private notes

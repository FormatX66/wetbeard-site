# Surgical Shared Host Configuration Edit

## Use when
A change must touch a shared host-level file such as `public_html/.htaccess` without replacing unrelated rules.

## Proven pattern
1. Use a narrowly scoped workflow with production concurrency control.
2. Validate required SSH secrets before connecting.
3. Copy only the specific asset/config needed.
4. On the server, remove only the previously managed marker block for this feature.
5. Append/rewrite a clearly delimited managed block, leaving all unrelated host rules intact.
6. Verify behavior through the public URL using a unique test path and cache-bypass header.
7. Validate both the HTTP status and expected response content.
8. Write a deployment receipt only after the live behavior is confirmed.

## Managed block principle
Use explicit markers such as:

`# BEGIN <FEATURE>`
...
`# END <FEATURE>`

Never replace the whole shared `.htaccess` just to install one rule.

## Source history
Derived from the host-wide 404 deployment workflow.
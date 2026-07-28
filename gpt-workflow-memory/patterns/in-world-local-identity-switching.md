# In-World Local Identity Switching

## Use when
A rendered interactive site already isolates variants, room memory, and discoveries per `login`/`user`, but visitors should not need to hand-edit query parameters to change local profiles.

## Proven pattern
1. Keep identity switching inside the world as a physical-looking console/control rather than adding a conventional account settings page.
2. Treat callsigns as local profile names, not authentication. Make that distinction clear in the interface.
3. Sanitize callsigns to a short, URL-safe display set before navigation.
4. Preserve the current room with a `scene=` parameter when switching identities.
5. Remove forced visual-variant parameters so the new identity receives its own deterministic variant.
6. Clear session-scoped active-login/variant state when creating a fresh anonymous slot.
7. Reuse the existing per-login hashed storage keys for expedition memory and discoveries; do not migrate personal history to the shared world bus.
8. Test explicit callsign switching, room preservation, anonymous-slot reset, desktop/phone layouts, and browser errors with Playwright.

## Important failure modes
- Do not call this authentication or imply server-side accounts when identity exists only in URL/local storage.
- Do not keep `variant=` during profile switching, or every callsign will appear to have the same forced visual build.
- Do not discard the current room; it makes switching feel like a reset and can overwrite expedition memory.
- Do not reuse the previous anonymous visitor UUID when asking for a genuinely new anonymous slot.

## Source history
Introduced for ArkmatX after per-login variants, expedition memory, discovery ledgers, and keyboard-accessible hotspots were already validated.

# Keyboard-Accessible Hotspot Layer

## Use when
A rendered interactive site uses SVG polygons or another invisible overlay for room navigation and object interactions.

## Proven pattern
1. Keep the rendered scene and hotspot geometry separate.
2. Give the hotspot container a named group role and every hotspot an accessible label plus `tabindex="0"`.
3. Support Enter and Space activation. For SVG elements, dispatch a bubbling `MouseEvent('click')` rather than assuming `HTMLElement.click()` exists.
4. Let Arrow keys move to adjacent hotspots; Home and End jump to the first and last hotspot.
5. Announce focused or hovered targets through a polite live region without replacing the underlying scene status permanently.
6. Mark information overlays as modal dialogs with `aria-modal`, `aria-labelledby`, and a labelled close control.
7. When a dialog opens, move focus into its first useful action or close control. When it closes, restore focus to the hotspot that opened it.
8. Keep Escape behavior predictable: close the dialog first, then dismiss any hotspot-reveal mode.
9. Validate the complete keyboard path in a real browser on desktop and phone-sized viewports.

## Common failure modes
- Pointer-only discovery makes the site unusable without a mouse.
- Invisible polygons receive focus but provide no target announcement.
- A modal opens visually while focus remains behind it.
- Closing a modal drops focus onto the document body, forcing keyboard users to restart navigation.
- Calling `.click()` on an SVG polygon fails silently or throws because it is not an `HTMLElement`.

## Source history
Established during the ArkmatX final interaction-polish phase after rendered workshop, server, paradox, variants, and per-login expedition memory were validated.
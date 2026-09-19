# OGLight plugin scripts

This repo holds small **Tampermonkey userscripts** that act as "plugins"
for OGLight, a large third-party OGame userscript (auto-generated, not
part of this repo — it lives in the user's Tampermonkey and is loaded
separately, matched to `https://*.ogame.gameforge.com/game/*`).

These plugin scripts never modify OGLight's own code. They only load
`@after` it (via `@run-at document-idle`) and override its behavior
purely through `GM_addStyle` CSS (and, when unavoidable, a small
`MutationObserver`-based JS snippet). This is a deliberate constraint —
keep it that way unless there's a strong reason not to.

## Reference copy of OGLight's source

`reference/oglight.js` is a local, untracked-by-conventions copy of
OGLight's actual script (currently **v5.4.3-b9** — check
`oglVersion`/`betaVersion` near the top of the file for the version any
given copy corresponds to). It's not part of this repo's own plugins;
it exists purely so icon names, selectors, class names, and internal
function behavior can be grepped/confirmed directly instead of guessed.
If it's ever replaced with a newer version, update the version noted
here.

## Critical constraint: OGLight's trimmed Material Icons font

OGLight embeds a **custom-subset** Material Icons font via a base64
`@font-face` at the end of its CSS. It is NOT the full Google Material
Icons set — it only contains the glyphs (and their ligature-substitution
mappings) that OGLight's own script already uses somewhere in its UI.

**Practical consequence:** if you reference an icon ligature name (e.g.
`content: "some_icon"`) that OGLight never uses anywhere in its own
source, nothing renders at all — no tofu box, no fallback, just blank.
There is no way to inspect the font's contents directly (it's a
minified base64 blob); the only reliable way to know an icon name is
safe is to grep OGLight's own source for that literal string being used
as `material-icons` content somewhere.

**Filled vs. outline is per-glyph and NOT controllable via CSS.**
Confirmed icons don't share one consistent visual style — e.g. `home`
renders filled, `factory` renders outline, in the same font. Each
glyph just looks however it happened to look wherever OGLight's own
UI used it; the subset is a grab-bag of individually copied-in glyphs,
not a derivation from one consistent master font. Confirmed (by
testing in-browser): `font-variation-settings: "FILL" 1` has no
effect, so this isn't a variable font with a toggleable FILL axis --
there is no way to force a given icon name to render filled if it
doesn't already. If a specific icon needs to look filled, that has to
be verified live (can't be predicted from OGLight's source), and if
the only confirmed name for that concept renders outline, the choice
is between accepting outline or picking a different (possibly less
semantically precise) confirmed name that happens to render filled.

### Icon names confirmed present (spotted in OGLight's own UI)

`settings`, `science`, `rocket_launch`, `genetics`, `handyman`,
`factory` (renders outline), `diamond`, `security`, `planet`,
`bedtime`, `crown`, `account_balance`, `keep`, `stroke_full`,
`favorite`, `directory_sync`, `sync_alt`, `bug_report`, `query_stats`,
`person_add`, `block`, `edit`, `delete`, `delete_forever`, `lists`,
`close`, `search`, `schedule`, `warning`, `skull`, `star`, `east`,
`fiber_manual_record`, `language`, `send`, `swords`, `cube-send`,
`visibility`, `local_shipping`, `compass`, `handshake`,
`electric_bolt`, `kitchen`, `local_gas_station`, `euro_symbol`,
`home` (renders filled -- confirmed live in-browser via
`OGLight-BuildIcons.user.js`'s `lfbuilding` icon, previously listed
below as unconfirmed).

### Icon names tried and NOT confirmed (use with caution)

- `construction`, `home_work`, `psychology` — tried earlier, dropped
  because they're presumed absent from the subset (never seen used
  elsewhere in OGLight).

When adding a new icon, always check this list first. If unsure,
default to a confirmed name over a "more semantically correct" one —
a working, slightly-off icon beats a broken invisible one.

## Outline/border trick

Icons are rendered as ligature text via a `::before` pseudo-element
(`content: "icon_name"` + `font-family: "Material Icons"`). A normal
CSS `border` does not hug glyph shapes. To fake an outline for
contrast against busy backgrounds, stack four diagonal `text-shadow`s
on the `::before` itself (not the parent element):

```css
.some-icon::before {
    text-shadow:
        -1px -1px 1px #000,
         1px -1px 1px #000,
        -1px  1px 1px #000,
         1px  1px 1px #000 !important;
}
```

Use a small blur radius (`1px`, not `0`) — a hard 0-blur outline looks
jagged/pixelated at the small sizes these icons run at (~12px).

## Files

### `OGLight-BuildIcons.user.js`

Restyles OGLight's per-planet **build-queue indicator**
(`.ogl_buildIconList` / `.ogl_buildIcon[data-type=...]`, created by
OGLight's `TopbarManager.checkUpgrade()`). Originally tiny 10×3px
solid-color bars; this plugin turns them into actual Material Icons
glyphs, each with its own icon, color (kept identical to OGLight's
original palette — never changed), and a custom CSS-only hover tooltip.

**Current mapping** (`data-type` → icon / color / tooltip):

| data-type    | icon           | color     | tooltip              |
|--------------|----------------|-----------|-----------------------|
| building     | `settings`     | `#ff8200` | "Resources"           |
| research     | `science`      | `#32fb2f` | "Research"            |
| ship         | `rocket_launch`| `#ffeb00` | "Shipyard"            |
| lfbuilding   | `home`         | `#ff79bd` | "Lifeform building"   |
| lfresearch   | `genetics`     | `#42afff` | "Lifeform research"   |

**Positioning notes** (why the CSS looks the way it does):

- The row (`.smallplanet`) is only 39px tall. OGLight's own
  `.planet-name` (top:6px, font 11px) and `.planet-koords` (top:21px,
  font 12px) leave only ~3.6px of clear space at the very bottom —
  enough for a 3px bar, not for a real icon.
- Fix applied: shifted `.planet-name` to `top: 0px` and
  `.planet-koords` to `top: 13px` (same relative gap between them,
  just moved up as a block), freeing enough room at the bottom for a
  12px icon anchored at `bottom: 0`.
- The icon container was tried on the right side
  (`right: 3px`) to dodge the text — reverted, because the right side
  is fully occupied top-to-bottom by OGLight's own "resources
  available" indicator (`.ogl_available`). Left side + shifted text
  was the only viable fix.
- `.ogl_buildIconList` has `pointer-events: none` in OGLight's own
  CSS (so it doesn't block clicks on the planet). Our custom
  `::after`-based tooltip needs hover, so `.ogl_buildIcon` re-enables
  `pointer-events: auto` on itself specifically.
- The tooltip itself is plain CSS (`::after` + `opacity` transition on
  `:hover`), not wired into OGLight's own tippy.js tooltip system —
  simpler and good enough for this element.

**Explicitly reverted / out of scope for this file:**

The user asked to also restyle OGLight's **fleet-movement icons**
(`.ogl_fleetIcon.ogl_missionN`, shown next to a planet when a fleet is
inbound/outbound — created by `MovementManager.addFleetIcon()`). A full
implementation was built (per-mission icon shapes via CSS, plus a
`MutationObserver`-based JS snippet to set `data-tooltip-title` so the
tooltip renders through OGLight's own tippy.js system instead of a
plain native one) — **then explicitly rejected by the user**, who asked
to revert to build-queue-icons-only (v1.0.0). Do not re-add this
without being asked again. If asked again, the approach and mission-id
mapping from that attempt are worth reusing rather than rediscovering:

| mission id | name          | icon             | confidence |
|-----------|---------------|------------------|------------|
| 1         | Attack        | `swords`         | high       |
| 2         | ACS Defend    | `security`       | high       |
| 3         | Transport     | `cube-send`      | high       |
| 4         | Deployment    | (default `send`) | high       |
| 5         | Espionage     | `visibility`     | high       |
| 6         | Colonize      | `language`       | high       |
| 7         | Destroy       | `skull`          | medium     |
| 8         | Harvest       | `local_shipping` | confirmed in OGLight source |
| 9         | Missile Attack| (default `send`) | medium     |
| 15        | Expedition    | `compass`        | confirmed in OGLight source |
| 18        | Discovery     | `search`         | medium-high |

The tippy-integration trick (for future reference, any element with
OGLight's own `tooltip` class): setting `data-tooltip-title` on the
element via a `MutationObserver` reliably beats OGLight's own
`initTooltips()` call, because `MutationObserver` callbacks run as a
microtask, and OGLight schedules `initTooltips()` via `Util.runAsync`
(a `setTimeout`, i.e. a macrotask) — the microtask always wins the race.

### `OGLight-TodoLevels.user.js`

Overlays the **target level from OGLight's Todolist** on top of the
current level number on building/research overview tiles (e.g. the
"Resource buildings" page) — appends `→<targetLevel>` in gold directly
inside the game's own bottom-right `.level` badge, next to the current
level, whenever a higher level is queued in the user's personal
Todolist. (Appended as a suffix inside that existing element on
purpose, rather than a separately-positioned badge — that way it
inherits the native badge's exact position/background instead of us
guessing coordinates to avoid overlap.)

**Why this one breaks the CSS-only rule:** the target level isn't
anywhere in the DOM — it only lives in OGLight's own in-memory state,
`unsafeWindow.ogl.currentPlanet.obj.todolist`. This plugin reads that
(never calls into or modifies OGLight's own code) via a small JS
snippet, reactive through a `MutationObserver` on `#technologies`.

**Todolist data shape** (see `reference/oglight.js`,
`TechManager.addToTodolist`/`checkTodolist`, ~line 11138):
`{ [techId]: { [level]: { id, amount, level, cost } } }`. For real
buildings/research, `level` is always a genuine target level number.
For ships/defense (quantity-based, no "level" concept) it falls back
to a timestamp key instead — that's why the plugin only touches tiles
that have a `.icon .level` badge (buildings/research/lifeform) and
skips `.icon .amount` tiles (shipyard/defense) entirely, where a
"target level" wouldn't mean anything.

**Reactivity:** `#technologies` tiles are only known to change when
OGLight finishes its own per-tile rendering pass (which may land after
this plugin's first pass) or when the user adds a Todolist entry from
a tile's detail panel — neither is a clean single event to hook, so
the plugin watches `#technologies` broadly via `MutationObserver` and
disconnects/reconnects around its own writes to avoid re-triggering
itself.

**Important quirk of OGLight's own Todolist, confirmed in
`reference/oglight.js`, `TechManager.checkTodolist()` (~line 11163):
OGLight clears a todolist entry as soon as the build is queued in-game
(compares against the native `.targetlevel` — "will reach this level
once the current queue finishes" — not the settled `.level`), i.e.
when production *starts*, not when it *finishes*. That cleanup never
touches `#technologies` (only the planet-list sidebar's todo icon), so
the `MutationObserver` alone can't catch it — a badge could go stale
right after queuing. `checkTodolist()` itself runs periodically off
OGLight's own loop, so this plugin also polls every 2s as a fallback
to stay in sync with it.

**Not yet live-tested in a browser** — position/collision with
OGLight's own tile UI (e.g. the native "currently building" target
level, or the debug-mode id overlay) may need adjusting once tried
against a real account.

### `OGLight-FleetShortcuts.user.js`

On the fleet-dispatch page (`.secondcol` toolbar), adds three one-click
shortcuts next to OGLight's own resource-picker button (the
`cube-send` icon div, built by `FleetManager.init()`,
`reference/oglight.js` ~line 5458 — opens a popup to type resource
quantities and auto-selects enough cargo ships) that each send 100% of
a single resource (metal / crystal / deuterium) straight away, no
popup. Also lays the fleet-dispatch toolbar out over two rows (row 1:
`#sendall`, `.ogl_quickCollectBtn`, `.ogl_fsButton`; row 2: `#resetall`,
cube-send + the three resource shortcuts), per the user's requested
layout.

**`cube-send` itself is never wrapped, moved, or restyled** — only
repositioned in place (a class added purely for CSS targeting, since
it has no stable selector of its own). This was a deliberate choice,
not the original design: `cube-send` drives a tippy.js popup positioned
relative to itself, so hiding or relocating it as a reference element
risked the popup showing up in the wrong place; a wrapper wrapping
*around* it also visually forced it into a "segment" look it never had
natively. The user asked for the three resource shortcuts to read as
*neighbors* of `cube-send` (simulating a split-button look through
adjacency) rather than as children nested inside it or inside a shared
wrapper — so they're independent sibling `div`s, positioned to sit
flush against it.

**Positioning the three shortcuts without knowing `cube-send`'s
width:** since it keeps its untouched native size (no fixed-size box
from us, unlike the other four toolbar elements), its rendered width
isn't something to hard-code. `positionSender()` measures it at
runtime via `getBoundingClientRect()` right after adding the
positioning class (forces the position change to apply first) and
places the three shortcuts edge-to-edge starting from that measured
right edge — self-correcting regardless of what width it actually
renders at.

**Click behavior**, mirrors OGLight's own popup "OK" handler exactly
(same file, ~line 5490-5501: compute the ship count for the total
*before* writing the per-resource cargo fields, then write all four
— the other three zeroed — then `refresh()`): sets
`fleetDispatcher.cargo<Resource>` to the full on-planet amount for the
clicked resource (others to 0), calls `fleetDispatcher.selectShip`
with `FleetManager.shipsForResources()`'s ship count for that total,
then `refresh()` + `focusSubmitFleet1()`.

**Visual style** of the three shortcuts: each has its own background
using OGLight's own `--metal`/`--crystal`/`--deut` CSS custom
properties (global variables it defines on `:root` for its resource
color palette, used throughout its UI — `#9a9ac1`/`#8dceec`/`#41aa9c`)
rather than a flat gray gradient, so each button reads as "this is the
metal/crystal/deuterium one" at a glance. The darker gradient stop is
computed via `color-mix(in srgb, var(--metal) 55%, black)` instead of a
second hand-picked color, so it stays in sync automatically if OGLight
ever changes its palette. They're joined to each other *and to
`cube-send`* with 1px black dividers — `cube-send` counts as the first
of a four-segment
block now: it gets a `border-right` divider and left-side
`border-radius` (rounded top-left/bottom-left) even though it has no
background of its own, `.ogl_deut` (last) keeps its right-side rounding
and no right border, and `.ogl_metal`/`.ogl_crystal` — middle segments
now that `cube-send` is the first one — are square on all corners.
Squaring them needed an explicit `border-radius:0` on the shared base
`.ogl_resourceShortcut` rule (confirmed live) — without it they picked
up rounding from OGLight's own ambient `.ogl_icon{border-radius:3px}`
(the class the resource sprites are borrowed through, see above), not
from anything this plugin had set. `.ogl_deut`'s own rule still wins
back its right-side rounding since its selector is one class more
specific.

**Resource icons** reuse OGLight's own `.ogl_icon.ogl_metal` /
`.ogl_crystal` / `.ogl_deut` classes (real PNG sprites, same ones used
in OGLight's own resource-picker popup) rather than the Material Icons
font — sidesteps the trimmed-font-subset problem entirely, and stays
correct even if OGLight's underlying asset URLs ever change, since we
reference the classes, not the URLs. Only the `:before` pseudo-element's
`width`/`height` are overridden (`20x26px`, tuned live by hand to look
right in the 24px segment) — everything else about the sprite
(`content`, `background-image`/`position`/`size`, `display`) is left to
OGLight's own ambient `.ogl_icon:before` rules rather than reset and
rebuilt ourselves; an earlier version fought those with
`background-position:center; background-size:contain` and rendered
worse.

**Two-row layout — final design: fixed-size positioning, no DOM
moves.** `.secondcol` isn't just this button strip — it's the *entire
right-hand panel* of the fleet dispatch page (mission tabs ["Standard
fleets" / "Expedition Fleet", each with its own template `<select>`,
native markup — `.firstcol`], the API button, resource totals, etc.),
sitting `.fleft` (float:left) next to `.firstcol`. `.secondcol` gets an
*explicit* fixed size (`width:200px; height:64px` — the content itself
only needs ~136px [two 30px rows plus a 4px gap], the extra width is
headroom confirmed available live before hitting `.firstcol`) instead
of its native `width:auto`, and every element placed in it is
`position:absolute` — `#sendall`/`.ogl_quickCollectBtn`/`.ogl_fsButton`/
`#resetall`/`cube-send` at a hand-picked pixel offset each (`top:0` for
row 1, `top:34px` for row 2), the three resource shortcuts at a
measured offset from `cube-send` (above). Because `.secondcol` is a
real, explicitly-sized box in normal flow, `.firstcol` reflows around
it the standard CSS-float way — no flex algorithm involved.

Critically, `#sendall`/`#resetall`/`.ogl_quickCollectBtn`/
`.ogl_fsButton`/`cube-send` are never *moved* to a new parent — only
positioned in place. `#sendall`/`#resetall` stay inside their native
`<span class="send_all">`/`<span class="send_none">` wrappers
(`position:absolute` skips right past those: it positions against the
nearest *positioned* ancestor — `.secondcol` itself — regardless of
how many plain, `position:static` wrappers sit in between), and
`cube-send`/`.ogl_quickCollectBtn`/`.ogl_fsButton` stay direct children
of `.secondcol`. That means OGLight's own `.secondcol>[class*=ogl_]`
(30×30 box look), `.secondcol #sendall.material-icons` / `#resetall...`
(colors), and `.secondcol .ogl_fsButton>div...` (the fsButton
split-segment look) rules all keep matching and applying exactly as
they did before this plugin existed — nothing to replicate ourselves
for those, no span-nesting or element-ordering bugs possible, since
nothing changes parents.

**Selector specificity note:** all of this plugin's `.secondcol` rules
are written as `#fleetdispatchcomponent .secondcol` rather than bare
`.secondcol` — confirmed live that the base game's own CSS has a
same-shaped, higher-specificity rule (an ID plus a class beats our
plain class) fighting our sizing. Both sides use `!important`, so
specificity is what actually decides it; matching the native rule's
shape is what wins.

**Stacking / tooltip note:** an earlier version gave every one of this
plugin's `position:absolute` elements `z-index:0`, after confirming
live that without it these buttons painted *over* native tooltips
(hovering a neighboring element) — `position:absolute` alone puts an
element ahead in paint order relative to normal-flow content even with
no explicit z-index of its own. That `z-index:0` was reverted, and the
three resource shortcuts' own CSS-only hover tooltip (labels like
"Send 100% Metal") was dropped entirely instead, on request — simpler
than reasoning about paint order against tooltips whose own z-index
isn't known, and the shortcuts' icons are self-explanatory enough
without one. If a future edit re-adds a tooltip to them, re-check
whether `z-index:0` (or similar) is needed again.

**This took several live-tested-and-reverted attempts before landing
here — worth remembering the shape of each failure, since none of it
was visible from `reference/oglight.js` (only OGLight's own rules live
there; `.secondcol`/`.firstcol`/`.allornonewrap` are the base game's
own markup/CSS, confirmed only by testing live):**
- Forcing `flex-direction: column` directly on `.secondcol` reflowed
  the *entire* panel (tabs, totals, everything) into one column, not
  just this button strip.
- Moving all five target elements (including `cube-send`, wrapped
  together with the three shortcuts) into an intermediate
  `.ogl_fleetToolbar` div (itself `flex-direction: column`) kept
  `.secondcol`'s own layout untouched, but growing that one child
  taller (2 rows, both in flow) still overlapped `.firstcol`'s tab
  *text* sideways — and moving elements to a new parent is also what
  first broke OGLight's own `.secondcol>[class*=ogl_]` styling,
  needing a manual re-scoped copy.
- Taking row 2 out of flow with `position:absolute` (nested under that
  wrapper) stopped the text overlap, but row 2 then had no reserved
  space and landed on top of `.firstcol`'s template *dropdowns*
  instead — a different neighbor, same root problem: nothing was
  reserving room for it.
- Removing the wrapper and using `.secondcol{flex-wrap:wrap}` +
  `flex:0 0 100%` on two direct-child rows kept things in normal flow
  (right idea) but still relied on flexbox's shrink-to-fit width
  resolution against an auto-width, percentage-basis container — an
  edge case worth distrusting rather than a clean guarantee.
- Explicit fixed size on `.secondcol` + `position:absolute` per
  element (still wrapping `cube-send` together with the three
  shortcuts in `.ogl_fleetShortcuts`) sidestepped the flexbox/float
  edge cases, but needed its own explicit `width:102px` on that
  wrapper too — shrink-to-fit didn't reliably size a `position:absolute`
  flex container with 4 children, confirmed live it collapsed to just
  the first child's width. It also still lost `cube-send`'s native
  look/tippy-popup-positioning reliability by wrapping it.
- **Final fix (current):** stop wrapping `cube-send` at all — leave it
  fully untouched except for its own `position:absolute`, and make the
  three shortcuts independent siblings positioned from its *measured*
  width instead of nesting them together or hand-picking an offset for
  the group.

  **Lessons for any future edit here:** (1) don't fight `.secondcol`'s
  shared-panel layout with flex tricks — give it an explicit fixed
  size and position children absolutely within it instead; (2) prefer
  repositioning elements in place over moving them to a new parent
  when possible — moving is what breaks OGLight's own CSS and DOM
  assumptions (span wrappers, `>`-scoped ambient rules); (3) never wrap
  or hide an element that drives its own tippy.js popup (or anything
  else positioned relative to itself) — reposition it in place and
  measure it at runtime instead of assuming its size.

### `OGLight-Notes.user.js`

Adds a small persistent notes panel (`.ogl_notesPanel`, styled with
OGLight's own `.ogl_ogameDiv` class) directly below `#planetList` — a
plain, title-less `<textarea>` the user can jot freeform notes into
(build order reminders, target lists, whatever), auto-saved 400ms after
the last keystroke. Its drag-resized height (the native `resize: vertical`
handle) is persisted the same way, via a `ResizeObserver` on the textarea
— a plain size change like that fires no `input`/`change` event of its
own, so `ResizeObserver` is the only reliable hook for it.

**Why this one breaks the CSS-only rule:** there's nothing in OGLight's
own DOM to re-skin here (unlike `OGLight-BuildIcons.user.js`'s
`.ogl_buildIconList` or `OGLight-FleetShortcuts.user.js`'s toolbar
buttons) — the panel itself has to be created from scratch, so a small JS
snippet is unavoidable.

**Persistence is scoped per-universe** (`GM_setValue`/`GM_getValue` keyed
by `location.host`, e.g. `s123-en.ogame.gameforge.com`), not per-account
like OGLight's own DB (`OGLight.DBName`, `reference/oglight.js`, near the
top of the `OGLight` constructor — `${accountID}-${host}`, accountID read
out of the `prsess_` cookie). Deliberately not replicated here: one
browser profile only ever has one account logged into a given universe in
practice, and reading OGLight's own `unsafeWindow.ogl.DBName` isn't a safe
alternative either — `#planetList` (which this plugin waits on) exists in
OGame's native DOM independently of OGLight's own init, so there's no
guarantee `unsafeWindow.ogl` is ready by the time this runs.

**Insertion:** `#planetList` itself is never replaced wholesale by
OGLight or the base game (only its children are updated in place), so a
one-shot `insertAdjacentElement('afterend', ...)` on boot is enough — no
`MutationObserver` needed to keep the panel from getting wiped out.

**Live-tested finding: panel can vanish, reappears on refresh.** Confirmed
on a real account — the panel would occasionally disappear entirely,
restored by a page refresh (which just re-runs `boot()`). Root cause:
`boot()` only ever inserted the panel once, at script load, with nothing
watching afterward. The base game refreshes the planet-list sidebar area
via its own periodic AJAX calls, independent of OGLight and outside this
repo's visibility (`reference/oglight.js` only contains OGLight's own code,
and confirms OGLight itself never touches `#planetList`'s DOM — it's pure
CSS grid styling on that id) — the earlier assumption that "`#planetList`
itself is never replaced wholesale" turned out to not hold for whatever
contains/surrounds it. That refresh can wipe our appended sibling without a
full navigation. Fix: `boot()` is now also called from a 2s
`setInterval` (same fallback-polling pattern as `OGLight-TodoLevels.user.js`'s
Todolist sync) and re-inserts the panel if `.ogl_notesPanel` is missing from
the DOM. Safe to re-run — it early-returns if the panel is already present,
and saved content/height live in `GM_setValue` storage, not on the element
itself, so nothing is lost when it gets re-created.

## Testing

No build step. Install the `.user.js` file directly in Tampermonkey
(or point Tampermonkey at this file's raw path for live-reload during
editing) and reload an OGame tab. Changes are CSS/JS only, evaluated by
the browser at userscript-load time — no compilation involved.

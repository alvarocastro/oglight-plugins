// ==UserScript==
// @name            OGLight - Fleet Shortcuts
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.5.4
// @description     Adds one-click buttons to instantly send 100% of a resource when dispatching a fleet, no popup needed
// @author          Alvaro Castro
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/fleet-shortcuts/OGLight-FleetShortcuts.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/fleet-shortcuts/OGLight-FleetShortcuts.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

/*
 * OGLight's own FleetManager.init() (reference/oglight.js, ~line 5458) builds
 * a plain div (ligature text "cube-send") as a direct child of the native
 * ".secondcol" fleet-dispatch toolbar. Clicking it opens a popup to pick
 * resource quantities and auto-selects enough cargo ships for the total.
 *
 * cube-send is never wrapped, moved, or restyled -- it drives a tippy.js
 * popup positioned relative to itself, so a hidden/relocated reference
 * element risks the popup showing up in the wrong place. We only reposition
 * it in place (see LAYOUT below) and add three one-click *sibling*
 * shortcuts next to it (not nested inside it) that each send 100% of a
 * single resource straight away, no popup.
 *
 * FleetManager.init() rebuilds cube-send from scratch every time the fleet
 * dispatch page (re)loads via OGame's SPA navigation, so this is
 * MutationObserver-driven rather than a one-shot DOM query.
 *
 * LAYOUT: five elements (sendAll, quickCollect, fsButton -- row 1; resetAll,
 * cube-send + the three resource shortcuts -- row 2), per the user's
 * requested two-row layout. ".secondcol" is NOT just this button strip --
 * it's the whole right-hand panel of the fleet dispatch page (mission tabs,
 * the API button, resource totals, etc.), sitting ".fleft" (float:left)
 * next to a sibling ".firstcol" column, so it can't be resized with
 * flow/flex tricks without risking that panel's own layout or overlapping
 * ".firstcol". Instead ".secondcol" gets an *explicit* fixed size
 * (200x64px -- content only needs ~136px, the rest is confirmed-live
 * headroom before ".firstcol"), and every element in it is
 * "position:absolute" -- a hand-picked pixel offset for the first four, one
 * computed at runtime from cube-send's *measured* width for the three
 * resource shortcuts (see positionSender()). A real, explicitly-sized box
 * in normal flow lets ".firstcol" reflow around it the standard way.
 *
 * None of #sendall/#resetall/.ogl_quickCollectBtn/.ogl_fsButton/cube-send
 * are *moved* to a different parent -- only repositioned in place -- so
 * none of OGLight's own CSS for them breaks: #sendall/#resetall stay inside
 * their native <span class="send_all">/<span class="send_none"> wrappers
 * (position:absolute positions against the nearest *positioned* ancestor,
 * ".secondcol" itself, regardless of plain wrappers in between), and the
 * others stay direct children of ".secondcol", so OGLight's own
 * ".secondcol>[class*=ogl_]" (box look), ".secondcol
 * #sendall.material-icons" / "#resetall..." (colors), and ".secondcol
 * .ogl_fsButton>div..." (split-segment look) rules keep applying exactly as
 * before this plugin existed.
 *
 * All the CSS below is prefixed "#fleetdispatchcomponent .secondcol" rather
 * than bare ".secondcol" to match the specificity of a same-shaped native
 * game rule (ID + class) that otherwise wins the cascade (both sides use
 * !important, so specificity is what decides it).
 */

GM_addStyle(`
    /* "#fleetdispatchcomponent .secondcol" prefix (rather than bare
       ".secondcol") to match the specificity of the native game's own
       same-shaped rule, which otherwise wins the cascade. */
    #fleetdispatchcomponent .secondcol {
        position: relative !important;
        width: 200px !important;
        height: 64px !important;
    }

    /* Row 1 */
    #fleetdispatchcomponent .secondcol #sendall {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
    }

    #fleetdispatchcomponent .secondcol .ogl_quickCollectBtn {
        position: absolute !important;
        top: 0 !important;
        left: 34px !important;
    }

    #fleetdispatchcomponent .secondcol .ogl_fsButton {
        position: absolute !important;
        top: 0 !important;
        left: 68px !important;
    }

    /* Row 2 */
    #fleetdispatchcomponent .secondcol #resetall {
        position: absolute !important;
        top: 34px !important;
        left: 0 !important;
    }

    /* cube-send keeps its native OGLight look untouched (no background/
       color/font-size override) -- only its position changes, to land in
       row 2's first slot. As the first segment of the joined block (see
       positionSender()), it gets a divider + left-rounding, mirroring
       .ogl_deut's right-side treatment below. */
    #fleetdispatchcomponent .secondcol .ogl_cubeSendPositioned {
        position: absolute !important;
        top: 34px !important;
        left: 34px !important;
        border-right: 1px solid #000 !important;
        border-radius: 3px 0 0 3px !important;
    }

    /* Independent siblings, not nested inside cube-send or a shared
       wrapper -- "left" for each is set inline per-instance (see
       positionSender()), everything else here is shared. Reads as one
       joined 4-segment block (cube-send + the 3 resource shortcuts) via
       shared borders/radius: rounded corners only on the outer edges
       (cube-send above, .ogl_deut below) -- .ogl_metal/.ogl_crystal are
       middle segments, square on all corners. */
    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut {
        position: absolute !important;
        top: 34px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 30px !important;
        cursor: pointer !important;
        border-right: 1px solid #000 !important;
        /* Square by default -- without this, .ogl_metal/.ogl_crystal
           would inherit OGLight's own ambient ".ogl_icon{border-radius:
           3px}" instead of staying flush with their neighbors.
           ".ogl_deut" below overrides this back on (higher specificity). */
        border-radius: 0 !important;
    }

    /* Per-resource background instead of a flat gray gradient -- OGLight
       defines --metal/--crystal/--deut as global CSS custom properties
       (its own resource-color palette, used throughout its UI), so we
       reuse those directly rather than picking our own colors. Darker
       gradient stop via color-mix() rather than a second hand-picked
       color, so it stays in sync if OGLight ever changes these. */
    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut.ogl_metal {
        background: linear-gradient(var(--metal), color-mix(in srgb, var(--metal) 55%, black)) !important;
    }

    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut.ogl_crystal {
        background: linear-gradient(var(--crystal), color-mix(in srgb, var(--crystal) 55%, black)) !important;
    }

    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut.ogl_deut {
        background: linear-gradient(var(--deut), color-mix(in srgb, var(--deut) 55%, black)) !important;
        border-right: none !important;
        border-radius: 0 3px 3px 0 !important;
    }

    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut:hover {
        filter: brightness(1.2) !important;
    }

    /* Reuses OGLight's own .ogl_icon/.ogl_<resource> sprite images (real
       PNGs, not the trimmed Material Icons font -- no glyph-availability
       risk) via the same classes it uses in its own resource-picker popup.
       Only the pseudo-element's size is overridden (tuned live to fit our
       24px segment) -- everything else (content, background-image/
       position/size, display) is left to OGLight's own ambient
       ".ogl_icon:before" rules, which render the sprite correctly as long
       as we don't fight their positioning. */
    #fleetdispatchcomponent .secondcol .ogl_resourceShortcut:before {
        width: 20px !important;
        height: 26px !important;
    }
`);

const RESOURCES = [
    { key:'metal', className:'ogl_metal' },
    { key:'crystal', className:'ogl_crystal' },
    { key:'deut', className:'ogl_deut' }
];

function sendAllOf(resourceKey)
{
    const fd = unsafeWindow.fleetDispatcher;
    const fleetManager = unsafeWindow.ogl?._fleet;
    if(!fd || !fleetManager) return;

    const total = fd[fleetManager.resOnPlanet[resourceKey]] || 0;

    // Same order as OGLight's own resource-popup "OK" handler
    // (reference/oglight.js ~line 5490-5501): compute the ship count for
    // the total *before* writing the cargo fields, then write them all
    // (zeroing the other three), then refresh.
    if(total > 0)
    {
        fd.selectShip(unsafeWindow.ogl.db.options.defaultShip, fleetManager.shipsForResources(false, total));
    }

    ['metal', 'crystal', 'deut', 'food'].forEach(key =>
    {
        fd[fleetManager.cargo[key]] = key === resourceKey ? total : 0;
    });

    fd.refresh();
    setTimeout(() => fd.focusSubmitFleet1(), 50);
}

/*
 * cube-send itself is only repositioned (class added for CSS targeting,
 * see ".ogl_cubeSendPositioned" above) -- never wrapped or restyled, so
 * its own width isn't something we control or can hard-code. The three
 * resource shortcuts are inserted as its next siblings (not children of
 * it or of any shared wrapper) and placed edge-to-edge starting from its
 * *measured* right edge, so they stay glued to it regardless of how wide
 * it actually renders.
 */
function positionSender(sender)
{
    sender.classList.add('ogl_cubeSendPositioned');

    let left = 34 + sender.getBoundingClientRect().width;
    let previous = sender;

    RESOURCES.forEach(({ key, className }) =>
    {
        const btn = document.createElement('div');
        btn.className = `ogl_resourceShortcut ogl_icon ${className}`;
        btn.style.left = `${left}px`;
        btn.addEventListener('click', () => sendAllOf(key));
        previous.after(btn);

        previous = btn;
        left += 24;
    });
}

function scan()
{
    document.querySelectorAll('.secondcol').forEach(secondCol =>
    {
        if(secondCol.querySelector('.ogl_cubeSendPositioned')) return;

        const sender = [...secondCol.children].find(el => el.textContent.trim() === 'cube-send');
        if(sender) positionSender(sender);
    });
}

let scanQueued = false;
function scheduleScan()
{
    if(scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() =>
    {
        scanQueued = false;
        scan();
    });
}

new MutationObserver(scheduleScan).observe(document.body, { childList:true, subtree:true });
scan();

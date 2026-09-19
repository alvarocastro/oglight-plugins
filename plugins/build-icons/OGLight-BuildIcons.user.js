// ==UserScript==
// @name            OGLight - Build Queue Icons
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.5.3
// @description     Turns the tiny build queue bars in the planet list into clear icons showing what's building where, with hover tooltips
// @author          Alvaro Castro
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/build-icons/OGLight-BuildIcons.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/build-icons/OGLight-BuildIcons.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

GM_addStyle(`
    /* Container: back to its original left side (the right side is fully
       occupied top-to-bottom by OGLight's own "resources available"
       indicator, so that wasn't a safe spot either). Instead we make room
       by nudging the planet's own name/coords text upward a bit further
       below, and keep the icon on the smaller side to fit the freed gap. */
    .ogl_buildIconList {
        gap: 2px !important;
        left: 23px !important;
        right: auto !important;
        bottom: 0 !important;
    }

    /* Moons don't have the same left-side text taking up room (no
       separate planet-name/planet-koords pair to dodge the way the
       planet row does), so drop the left offset above for them and let
       the icon list fall back to its natural position instead. */
    .smallplanet .moonlink .ogl_buildIconList {
        left: auto !important;
    }

    /* Shift the game's own planet name and coordinates text up a few
       pixels each, keeping the gap between them the same, to free up
       space at the bottom of the row for our icon. */
    .smallplanet .planet-name {
        top: 0px !important;
    }
    .smallplanet .planet-koords {
        top: 13px !important;
    }

    /* Move OGLight's own build-queue refresh timer badge (shown per
       planet/moon when "display planet timers" is enabled) from the
       bottom-left corner of the row to the top-left corner, so it
       doesn't sit in the same area as our build-queue icons anymore.
       OGLight's own rule is bottom:-3px;left:-2px with a rounded
       top-right corner (border-radius: 0 9px 0 0) so the tab reads as
       hanging off the bottom edge; we mirror it vertically -- top
       instead of bottom, and the rounded corner moved from
       top-right to bottom-right -- so it reads the same way but
       hanging off the top edge instead. */
    .smallplanet .ogl_refreshTimer {
        top: -3px !important;
        bottom: auto !important;
        border-radius: 0 0 9px 0 !important;
        z-index: 1 !important;
    }

    /* The build-icon tooltip (::after below) lives inside .planetlink /
       .moonlink, which OGLight gives overflow: hidden. A z-index on the
       tooltip or the icon itself isn't enough to put it above the refresh
       timer badge above: since .planetlink/.moonlink never get an explicit
       z-index of their own, browsers paint their whole clipped subtree --
       tooltip included, no matter how high its own z-index is -- as one
       flattened unit at .planetlink/.moonlink's own place in the stacking
       order, which loses to the timer (a later DOM sibling). Raising
       .planetlink/.moonlink's own z-index fixes that -- but only while a
       tooltip inside it is actually showing: .planetlink/.moonlink have
       their own opaque background covering the whole row, so raising it
       all the time would permanently bury the timer under it instead of
       just during hover. */
    .smallplanet .planetlink:has(.ogl_buildIcon:hover),
    .smallplanet .moonlink:has(.ogl_buildIcon:hover) {
        z-index: 2 !important;
    }

    /* Let the tooltip escape the icon's own box */
    .ogl_buildIcon {
        position: relative !important;
        pointer-events: auto !important; /* the container has pointer-events:none, so we re-enable it here */
    }

    /* Tooltip: hidden by default (text is set per [data-type] below) */
    .ogl_buildIcon::after {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: #171c24;
        color: #fff !important;
        border: 1px solid #000;
        border-radius: 3px;
        padding: 3px 7px;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 11px !important;
        line-height: 14px !important;
        font-weight: 700;
        white-space: nowrap;
        text-shadow: none;
        box-shadow: 0 2px 6px rgba(0,0,0,.6);
        opacity: 0;
        pointer-events: none;
        transition: opacity .1s ease-in-out;
        z-index: 1000005;
    }

    .ogl_buildIcon:hover::after {
        opacity: 1;
    }

    /* Base: switch from solid-color bar to a Material Icons glyph */
    .ogl_buildIcon {
        width: 12px !important;
        height: 12px !important;
        background: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        font-family: "Material Icons" !important;
        font-size: 12px !important;
        line-height: 12px !important;
        text-align: center !important;
    }

    /* The icon glyph is actually text (rendered via ::before), so a normal
       CSS border won't hug its shape. We fake an outline by stacking four
       black text-shadows, one per diagonal direction, with a touch of blur
       so it doesn't look jagged/pixelated at this small size. */
    .ogl_buildIcon::before {
        text-shadow:
            -1px -1px 1px #000,
             1px -1px 1px #000,
            -1px  1px 1px #000,
             1px  1px 1px #000 !important;
    }

    /* One icon and color per queue type.
       IMPORTANT: OGLight bundles a trimmed Material Icons font -- it only
       includes the icon names the script itself already uses somewhere in
       its UI. That's why we pick icons already confirmed to be present
       (spotted in other parts of the script) instead of random "logical"
       names that might not exist in the font and render nothing.
       Also: whether a given confirmed icon renders filled or outline
       varies per glyph and isn't controllable via CSS (confirmed --
       font-variation-settings has no effect, so the font isn't a
       variable font with a toggleable FILL axis). Each glyph just looks
       however it happened to look wherever OGLight's own UI used it. */
    .ogl_buildIcon[data-type="building"] {
        color: #ff8200 !important;
    }
    .ogl_buildIcon[data-type="building"]::before {
        content: "settings"; /* used in OGLight's own settings menu */
    }

    .ogl_buildIcon[data-type="research"] {
        color: #32fb2f !important;
    }
    .ogl_buildIcon[data-type="research"]::before {
        content: "science"; /* used in the account summary ("research" icon) */
    }

    .ogl_buildIcon[data-type="ship"] {
        color: #ffeb00 !important;
    }
    .ogl_buildIcon[data-type="ship"]::before {
        content: "rocket_launch"; /* used in several places (fleet) */
    }

    .ogl_buildIcon[data-type="lfbuilding"] {
        color: #ff79bd !important;
    }
    .ogl_buildIcon[data-type="lfbuilding"]::before {
        content: "home"; /* NOT confirmed in OGLight's font subset, may not render */
    }

    .ogl_buildIcon[data-type="lfresearch"] {
        color: #42afff !important;
    }
    .ogl_buildIcon[data-type="lfresearch"]::before {
        content: "genetics"; /* used in the "Lifeforms Bonuses" link */
    }

    /* Tooltip text, one per type */
    .ogl_buildIcon[data-type="building"]::after    { content: "Resources"; }
    .ogl_buildIcon[data-type="research"]::after    { content: "Research"; }
    .ogl_buildIcon[data-type="ship"]::after         { content: "Shipyard"; }
    .ogl_buildIcon[data-type="lfbuilding"]::after  { content: "Lifeform building"; }
    .ogl_buildIcon[data-type="lfresearch"]::after  { content: "Lifeform research"; }
`);

// ==UserScript==
// @name            OGLight - Notes Panel
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.2.3
// @description     Adds a small persistent notes panel below your planet list, for build orders and reminders
// @author          Alvaro Castro
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/notes/OGLight-Notes.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/notes/OGLight-Notes.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// ==/UserScript==
'use strict';

/*
 * Unlike most plugins in this repo, this one can't be pure CSS -- there's
 * nothing in OGLight's own DOM to re-skin, so it has to inject a brand new
 * element and persist its content itself.
 *
 * Storage is scoped per-universe (GM storage keyed by `location.host`, e.g.
 * "s123-en.ogame.gameforge.com") rather than per-account like OGLight's own
 * DB does -- replicating its cookie-based account-id lookup (reference/
 * oglight.js, OGLight constructor, near the top of the file) just for this
 * felt like overkill, since in practice one browser profile only ever has
 * one account logged into a given universe.
 */

const STORAGE_KEY = `ogl_notes_${location.host}`;
const HEIGHT_STORAGE_KEY = `ogl_notesHeight_${location.host}`;

GM_addStyle(`
    /* Reuses OGLight's own .ogl_ogameDiv look (background/box-shadow) so
       this reads as a native panel instead of a foreign element bolted on --
       same trick .ogl_miniStats uses right below the planet list. */
    .ogl_notesPanel {
        margin-top: 10px;
        border-radius: 3px;
    }

    .ogl_notesPanel textarea {
        box-sizing: border-box;
        display: block;
        width: 100%;
        min-height: 90px;
        padding: 6px;
        resize: vertical;
        color: #b7c1c9;
        background: #121518;
        border: 1px solid #080b10;
        border-radius: 3px;
        box-shadow: inset 0 2px 3px #0b0e12;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        line-height: 1.4;
    }

    .ogl_notesPanel textarea:focus {
        outline: 2px solid var(--ogl);
    }
`);

function boot()
{
    if(document.querySelector('.ogl_notesPanel')) return; // already inserted on this page

    const planetList = document.querySelector('#planetList');
    if(!planetList)
    {
        setTimeout(boot, 500);
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'ogl_notesPanel ogl_ogameDiv';
    panel.innerHTML = `<textarea placeholder="Notes"></textarea>`;

    const textarea = panel.querySelector('textarea');
    textarea.value = GM_getValue(STORAGE_KEY, '');

    const savedHeight = GM_getValue(HEIGHT_STORAGE_KEY, 0);
    if(savedHeight) textarea.style.height = `${savedHeight}px`;

    let saveTimeout;
    textarea.addEventListener('input', () =>
    {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => GM_setValue(STORAGE_KEY, textarea.value), 400);
    });

    // Drag-resizing the textarea (CSS `resize: vertical`) is a plain size
    // change, not an input event -- ResizeObserver is the only reliable way
    // to catch it and persist the new height across reloads.
    let resizeTimeout;
    new ResizeObserver(() =>
    {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => GM_setValue(HEIGHT_STORAGE_KEY, textarea.offsetHeight), 400);
    }).observe(textarea);

    planetList.insertAdjacentElement('afterend', panel);
}

boot();

// The base game periodically refreshes the planet-list sidebar via its own
// AJAX calls (independent of OGLight), which can silently wipe out our
// appended sibling without a full page reload. There's no single clean event
// to hook for that, so -- same fallback-polling approach as
// OGLight-TodoLevels.user.js -- just check every 2s and re-insert if gone.
// Saved content/height survive this fine since they live in GM storage, not
// on the removed element.
setInterval(boot, 2000);

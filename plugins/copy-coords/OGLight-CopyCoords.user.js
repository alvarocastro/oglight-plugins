// ==UserScript==
// @name            OGLight - Copy Coordinates
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.0.0
// @description     Shift+click a planet in your planet list to copy its coordinates as a forum [coordinates] BBCode tag
// @author          Alvaro Castro
// @license         MIT
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/copy-coords/OGLight-CopyCoords.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/copy-coords/OGLight-CopyCoords.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

/*
 * The base game periodically re-renders the planet-list sidebar via its own
 * AJAX calls, independent of OGLight (confirmed live -- see
 * OGLight-Notes.user.js's own note on this, where it was found to wipe an
 * appended sibling of #planetList without a full navigation). That implies
 * #planetList's own DOM node can get swapped out too, so a listener attached
 * directly to it could go stale. Delegating from `document` instead sidesteps
 * that entirely -- it never gets replaced, so no polling/observer is needed
 * here.
 */

GM_addStyle(`
    @keyframes ogl_coordsCopiedFlash {
        0%   { outline: 2px solid var(--ogl); }
        100% { outline: 2px solid transparent; }
    }

    .smallplanet.ogl_coordsCopied {
        animation: ogl_coordsCopiedFlash 0.6s ease-out;
    }
`);

document.addEventListener('click', event =>
{
    if(!event.shiftKey) return;

    const row = event.target.closest('#planetList .smallplanet');
    if(!row) return;

    // Native markup: `.planet-koords` textContent is "[galaxy:system:position]"
    // (OGLight only visually hides the brackets via a wrapping span, see
    // reference/oglight.js ~line 1727 -- textContent still includes them).
    const koords = row.querySelector('.planet-koords');
    if(!koords) return;

    event.preventDefault();

    const coords = koords.textContent.trim().slice(1, -1);
    navigator.clipboard.writeText(`[coordinates]${coords}[/coordinates]`);

    row.classList.remove('ogl_coordsCopied');
    void row.offsetWidth; // force reflow so the flash restarts on repeat clicks
    row.classList.add('ogl_coordsCopied');
});

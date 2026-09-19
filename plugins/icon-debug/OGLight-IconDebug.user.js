// ==UserScript==
// @name            OGLight - Icon Debug Panel (TEMPORARY)
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.1.2
// @description     Dev tool: dumps every Material Icons name/codepoint OGLight's own script references into an on-page panel, to eyeball which ones actually render in its trimmed font subset. Not meant to stay installed.
// @author          Alvaro Castro
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/icon-debug/OGLight-IconDebug.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/icon-debug/OGLight-IconDebug.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

/*
 * Throwaway dev tool, not a real plugin -- built to answer the recurring
 * "is this icon name actually in OGLight's trimmed Material Icons subset"
 * question (see CLAUDE.md's "confirmed icons" list) without grepping and
 * live-testing one name at a time.
 *
 * NAMES was built by grepping reference/oglight.js for every place it
 * either sets `content:"name"` on a `.material-icons`-styled ::before/
 * ::after, or writes a name as literal text (`child:'name'`) into an
 * element whose class carries `font-family: Material Icons`. Rendering
 * all of them here, forced through `.material-icons`, makes the outcome
 * obvious at a glance: a real glyph means it's confirmed present; a blank/
 * tofu box means it's absent from the subset; plain readable text (e.g.
 * "save", "done", "date") means the grep picked up ordinary button/label
 * text that was never a Material Icons ligature to begin with -- those
 * three are visually distinct, no manual cross-checking needed.
 *
 * CODEPOINTS_HEX is every literal ligature codepoint (`content:"\fXXX"`)
 * used directly in the CSS instead of a name -- real glyphs in the subset
 * too, just ones nobody bothered (or dared) to look up an English name
 * for. Kept as plain hex strings (turned into an actual character at
 * runtime via String.fromCharCode) instead of as escaped-unicode string
 * literals written directly in this file -- some tooling silently
 * normalizes those into raw, invisible Private Use Area characters while
 * saving this file, which turns it into blank cells in an editor and
 * makes it impossible to review or diff.
 */

const NAMES =
[
    'account_balance',
    'alert',
    'arrow_back',
    'arrow_forward',
    'arrow_right_alt',
    'bedtime',
    'block',
    'blocked',
    'bug_report',
    'cancel_schedule_send',
    'check',
    'chevron-double-right',
    'chevron_left',
    'chevron_right',
    'clock_loader_60',
    'close',
    'compass',
    'contrast',
    'conversion_path',
    'crown',
    'cube-send',
    'database',
    'date',
    'debris',
    'delete',
    'delete_forever',
    'device_thermostat',
    'diamond',
    'directions_run',
    'directory_sync',
    'done',
    'door_back',
    'east',
    'edit',
    'electric_bolt',
    'empty',
    'euro_symbol',
    'factory',
    'favorite',
    'fiber_manual_record',
    'file_copy',
    'file_export',
    'file_open',
    'flag',
    'flex_wrap',
    'functions',
    'genetics',
    'globe',
    'globe_uk',
    'handshake',
    'handyman',
    'jump_to_element',
    'keep',
    'keyboard_alt',
    'keyboard_arrow_left',
    'keyboard_arrow_right',
    'kitchen',
    'language',
    'lists',
    'local_gas_station',
    'local_shipping',
    'mode_heat',
    'monitoring',
    'more_horiz',
    'new',
    'newspaper',
    'oglight_simple',
    'package_2',
    'person_add',
    'photo_camera',
    'planet',
    'play_arrow',
    'ptre',
    'query_stats',
    'rocket',
    'rocket_launch',
    'save',
    'schedule',
    'science',
    'search',
    'security',
    'send',
    'settings',
    'sigma',
    'skull',
    'speed',
    'sports_score',
    'star',
    'stroke_full',
    'subdirectory_arrow_left',
    'swords',
    'sync',
    'sync_alt',
    'toggle_off',
    'toggle_on',
    'trophy',
    'visibility',
    'warning',
];

const CODEPOINTS_HEX =
[
    'f102',
    'f103',
    'f105',
    'f106',
    'f109',
    'f10a',
    'f10e',
    'f10f',
    'f111',
    'f114',
    'f115',
    'f117',
    'f118',
    'f119',
    'f11d',
    'f120',
    'f128',
    'f12c',
    'f12d',
    'f12f',
    'f133',
    'f13a',
    'f13b',
    'f13e',
    'f13f',
    'f143',
    'f14a',
    'f14c',
    'f14d',
    'f14e',
    'f14f',
    'f151',
    'f152',
    'f153',
    'f154',
    'f155',
    'f156',
    'f157',
    'f158',
    'f15a',
    'f15b',
    'f15c',
    'f15d',
    'f15f',
    'f160',
    'f164',
    'f165',
    'f166',
    'f168',
    'f170',
    'f173',
    'f179',
];

GM_addStyle(`
    #oglIconDebug {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 2000000;
        width: 380px;
        max-height: 90vh;
        overflow-y: auto;
        background: #171c24;
        color: #b7c1c9;
        border: 1px solid #000;
        border-radius: 5px;
        box-shadow: 0 0 20px -5px #000, 0 0 0 1px #17191c;
        padding: 8px;
        font-family: Arial, Helvetica, sans-serif;
    }

    #oglIconDebug h3 {
        color: #6f9fc8;
        margin: 4px 0;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #oglIconDebug h3 span {
        cursor: pointer;
        color: #ff665b;
        font-weight: 700;
    }

    #oglIconDebug .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 4px;
        margin-bottom: 10px;
    }

    #oglIconDebug .cell {
        box-sizing: border-box;
        background: #0e1116;
        border: 1px solid #000;
        border-radius: 3px;
        padding: 4px 2px;
        text-align: center;
        font-size: 9px;
        line-height: 1.3;
        word-break: break-all;
        cursor: pointer;
    }

    #oglIconDebug .cell:hover {
        box-shadow: inset 0 0 0 1px var(--ogl, #ffb800);
    }

    #oglIconDebug .cell .material-icons {
        display: block;
        font-size: 20px !important;
        line-height: 24px !important;
        color: #ffb800;
        margin-bottom: 2px;
    }
`);

function boot()
{
    if(document.querySelector('#oglIconDebug')) return;

    const panel = document.createElement('div');
    panel.id = 'oglIconDebug';
    panel.innerHTML = `
        <h3>By name (${NAMES.length}) <span data-close>close</span></h3>
        <div class="grid" data-grid="names"></div>
        <h3>By raw codepoint (${CODEPOINTS_HEX.length})</h3>
        <div class="grid" data-grid="codepoints"></div>
    `;

    const nameGrid = panel.querySelector('[data-grid="names"]');
    NAMES.forEach(name =>
    {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.title = 'click to copy';
        cell.innerHTML = `<span class="material-icons">${name}</span>${name}`;
        cell.addEventListener('click', () => navigator.clipboard.writeText(name));
        nameGrid.appendChild(cell);
    });

    const codeGrid = panel.querySelector('[data-grid="codepoints"]');
    CODEPOINTS_HEX.forEach(hex =>
    {
        const char = String.fromCharCode(parseInt(hex, 16));
        const label = 'u+' + hex;
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.title = 'click to copy';
        cell.innerHTML = `<span class="material-icons">${char}</span>${label}`;
        cell.addEventListener('click', () => navigator.clipboard.writeText(label));
        codeGrid.appendChild(cell);
    });

    document.body.appendChild(panel);
    panel.querySelector('[data-close]').addEventListener('click', () => panel.remove());
}

boot();

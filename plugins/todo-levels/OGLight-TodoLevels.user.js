// ==UserScript==
// @name            OGLight - Todolist Target Levels
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.0.2
// @description     Shows the target level set in OGLight's Todolist over the current level on building/research overview tiles
// @author          Alvaro Castro
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/todo-levels/OGLight-TodoLevels.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/todo-levels/OGLight-TodoLevels.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

/*
 * Unlike the other plugins in this repo, this one can't be pure CSS: the
 * "target level" isn't in the DOM anywhere, it only exists inside OGLight's
 * own in-memory state (unsafeWindow.ogl.currentPlanet.obj.todolist). We only
 * read it, never call into or modify OGLight's own code.
 *
 * todolist shape (see reference/oglight.js, TechManager.addToTodolist /
 * checkTodolist around line 11138): { [techId]: { [level]: { id, amount,
 * level, cost } } }. For actual buildings/research, `level` is always a real
 * target level number. For ships/defense (quantity-based, no "level" concept)
 * it falls back to a Date.now()+performance.now() key instead -- that's why
 * we scope this to tiles with a `.level` badge (buildings/research/lifeform)
 * and deliberately skip `.amount` tiles (shipyard/defense), where a "target
 * level" badge wouldn't mean anything.
 */

GM_addStyle(`
    /* Appended as a suffix inside the game's own bottom-right ".level"
       badge, so it sits wherever that badge already sits instead of us
       having to guess its position/size to place a second one nearby. */
    .ogl_todoTarget {
        font-family: Arial, Helvetica, sans-serif !important;
        font-weight: 700;
        color: #ffb800; /* OGLight's own accent gold (--ogl), kept consistent with its UI */
    }
`);

const TECH_CONTAINER_SELECTOR = '#technologies';

function refreshTodoTargets()
{
    const container = document.querySelector(TECH_CONTAINER_SELECTOR);
    if(!container) return;

    const todolist = unsafeWindow.ogl?.currentPlanet?.obj?.todolist;

    // Disconnect while we write, otherwise our own badge insertions would
    // re-trigger the observer below and loop forever.
    observer.disconnect();

    container.querySelectorAll('.technology[data-technology]').forEach(tile =>
    {
        const levelEl = tile.querySelector('.icon .level');
        levelEl?.querySelector('.ogl_todoTarget')?.remove();

        if(!levelEl || !todolist) return;

        const entries = todolist[tile.getAttribute('data-technology')];
        if(!entries) return;

        const targetLevel = Math.max(...Object.keys(entries).map(Number));
        const currentLevel = parseInt(levelEl.getAttribute('data-value'), 10) || 0;
        if(!Number.isFinite(targetLevel) || targetLevel <= currentLevel) return;

        const badge = document.createElement('span');
        badge.className = 'ogl_todoTarget';
        badge.textContent = `→${targetLevel}`;
        levelEl.appendChild(badge);
    });

    observer.observe(container, { childList:true, subtree:true, attributes:true, attributeFilter:['data-value', 'class'] });
}

let refreshQueued = false;
function scheduleRefresh()
{
    if(refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() =>
    {
        refreshQueued = false;
        refreshTodoTargets();
    });
}

// Covers both OGLight's own tile rendering pass (which mutates #technologies
// once its data is ready -- our first pass may well run before that) and
// adding a todolist entry from the tile detail panel.
const observer = new MutationObserver(scheduleRefresh);

function boot()
{
    if(!document.querySelector(TECH_CONTAINER_SELECTOR))
    {
        setTimeout(boot, 500);
        return;
    }

    refreshTodoTargets();

    /*
     * The observer above can't catch everything: OGLight clears a todolist
     * entry as soon as the build is *queued* in-game (TechManager.
     * checkTodolist(), reference/oglight.js ~line 11163, compares against
     * the native ".targetlevel" -- "will reach this level once the current
     * queue finishes" -- not against the settled ".level"), and that cleanup
     * only touches the planet-list sidebar icon, never #technologies. So a
     * badge could go stale right after you queue the build, well before it
     * actually finishes. checkTodolist() itself runs periodically off
     * OGLight's own loop (via updateSideIcons()), so a small poll here is
     * the simplest way to stay in sync with it.
     */
    setInterval(refreshTodoTargets, 2000);
}

boot();

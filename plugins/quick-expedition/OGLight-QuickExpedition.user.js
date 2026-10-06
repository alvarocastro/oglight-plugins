// ==UserScript==
// @name            OGLight - Quick Expedition
// @namespace       https://github.com/alvarocastro/oglight-plugins
// @version         1.2.3
// @description     Adds a one-click button on the galaxy page that selects and sends your first saved expedition fleet template
// @author          Alvaro Castro
// @license         MIT
// @match           https://*.ogame.gameforge.com/game/*
// @downloadURL     https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/quick-expedition/OGLight-QuickExpedition.user.js
// @updateURL       https://raw.githubusercontent.com/alvarocastro/oglight-plugins/main/plugins/quick-expedition/OGLight-QuickExpedition.user.js
// @run-at          document-idle
// @grant           GM_addStyle
// ==/UserScript==
'use strict';

/*
 * This one isn't about OGLight at all -- the galaxy page's "Deep space" row
 * (#galaxyRow16 > #expeditionDebrisSlotActions) is native OGame markup, not
 * OGLight's, so reference/oglight.js has nothing on it. Confirmed live via
 * devtools instead: it holds a hidden real <select id="expeditionFleetTemplateSelect">
 * (mirrored by a custom dropdown widget for display) of the player's saved
 * expedition fleet templates, plus a "send" action
 * (#sendExpeditionFleetTemplateFleet) that only becomes visible/enabled once
 * a real template (not the "0"/"-" placeholder) is selected -- presumably
 * because selecting one kicks off some native lookup of that template's ship
 * composition before it's safe to send. This button does both steps at once:
 * pick the first saved template, then fire the send action, without needing
 * two manual clicks.
 *
 * Inserted right after #sendExpeditionFleetTemplateFleet, and styled to
 * match the native #expeditionbutton ("Expedition") button next to it
 * (btn_blue/btn_system_action classes, same "expedition" sprite icon)
 * rather than OGLight's own Material Icons look, since it lives entirely
 * inside native game markup.
 */

GM_addStyle(`
    /* Reuses the native .galaxy_icons class (same sprite sheet #expeditionbutton's
       own icon comes from) instead of hardcoding its background-image URL
       ourselves -- only the sprite offset needs to be ours, confirmed live to
       be the same one #expeditionbutton:before uses for its "expedition" icon. */
    .ogl_quickExpeditionIcon {
        background-position: 0px -99px !important;
        margin-top: 1px !important;
    }

    /* btn_blue's own default padding doesn't leave room for the icon --
       #expeditionbutton overrides it the same way (there with 20px, tuned
       here to 3px since this button has no absolutely-positioned icon
       hanging outside its box the way #expeditionbutton's does). */
    .ogl_quickExpedition {
        padding: 0 5px 0 3px !important;
        min-width: 40px !important;
        height: 16px !important;
    }

    /* OGLight's own .material-icons class already sets up the Material
       Icons font-face -- just needs vertical centering next to the sprite icon. */
    .ogl_quickExpedition .material-icons {
        vertical-align: middle;
        font-size: 16px !important;
        line-height: 16px !important;
        color: #fff !important;
    }

    /* Widen the row so the extra button fits without wrapping -- shrink the
       "Deep space:" label column and grow the actions column to make room.
       :not([class*="ogl_"]) excludes OGLight's own injected sibling
       (.ogl_expeditionRow, confirmed live -- it's a direct child div of
       .expeditionDebrisSlotBox too, and got caught by this rule without it). */
    #galaxyContent .expeditionDebrisSlotBox > div:not([class*="ogl_"]),
    #galaxyContent .bdaySlotBox > div:not([class*="ogl_"]) {
        width: 31% !important;
    }

    #galaxyContent .expeditionDebrisSlotBox > div#expeditionDebrisSlotActions {
        width: 60% !important;
    }
`);

function selectAndSend(select, sendBtn)
{
    const firstTemplate = [...select.options].find(o => o.value !== '0');
    if(!firstTemplate) return;

    select.value = firstTemplate.value;
    select.dispatchEvent(new Event('change', { bubbles:true }));
    select.dispatchEvent(new Event('input', { bubbles:true }));

    const clickWhenReady = () =>
    {
        if(sendBtn.hasAttribute('disabled') || sendBtn.style.display === 'none') return false;
        sendBtn.dispatchEvent(new MouseEvent('click', { bubbles:true }));
        return true;
    };

    // Selecting a template may kick off a native lookup before the send
    // button is actually ready -- wait for that signal instead of guessing
    // a timeout.
    if(clickWhenReady()) return;

    const observer = new MutationObserver(() =>
    {
        if(clickWhenReady()) observer.disconnect();
    });
    observer.observe(sendBtn, { attributes:true, attributeFilter:['disabled', 'style'] });
    setTimeout(() => observer.disconnect(), 5000);
}

function addButton(actions)
{
    if(actions.querySelector('.ogl_quickExpedition')) return;

    const select = actions.querySelector('#expeditionFleetTemplateSelect');
    const sendBtn = actions.querySelector('#sendExpeditionFleetTemplateFleet');
    if(!select || !sendBtn) return;

    const btn = document.createElement('div');
    btn.className = 'btn_blue float_right btn_system_action ogl_quickExpedition';
    btn.title = 'Select & send first saved fleet';
    btn.innerHTML = '<span class="galaxy_icons ogl_quickExpeditionIcon"></span><span class="material-icons">send</span>';
    btn.addEventListener('click', () => selectAndSend(select, sendBtn));

    sendBtn.insertAdjacentElement('afterend', btn);
}

function boot()
{
    document.querySelectorAll('#expeditionDebrisSlotActions').forEach(addButton);
}

boot();

// Galaxy rows get replaced wholesale via AJAX when switching systems --
// same fallback-polling approach as OGLight-Notes.user.js/
// OGLight-TodoLevels.user.js for elements with no single clean event to hook.
setInterval(boot, 1000);

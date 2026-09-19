# OGLight Plugins

A small collection of [Tampermonkey](https://www.tampermonkey.net/) userscripts that extend [OGLight](https://forum.origin.ogame.gameforge.com/forum/thread/537-oglight/), a third-party UI overhaul for the browser game [OGame](https://ogame.gameforge.com/).

These plugins never modify OGLight itself — they load after it and add or restyle small pieces of its UI. **OGLight must already be installed** for any of these to do anything.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) if you don't have it, and make sure OGLight is installed and working first.
2. Open the `.user.js` file for the plugin you want (in this repo), click **Raw**, and Tampermonkey will prompt you to install it.
3. Reload your OGame tab.

Each plugin is independent — install only the ones you want.

## Plugins

### [OGLight - Build Queue Icons](plugins/build-icons/OGLight-BuildIcons.user.js)

Turns the tiny colored bars next to each planet (showing what's currently queued — building, research, ship, lifeform) into proper icons with hover tooltips, so you can tell at a glance what's building where.

![Build Queue Icons](plugins/build-icons/BuildIcons.png)

### [OGLight - Fleet Shortcuts](plugins/fleet-shortcuts/OGLight-FleetShortcuts.user.js)

Adds one-click buttons on the fleet-dispatch screen to send 100% of your metal, crystal, or deuterium instantly — no popup, no typing amounts.

![Fleet Shortcuts](plugins/fleet-shortcuts/FleetShortcuts.png)

### [OGLight - Todolist Target Levels](plugins/todo-levels/OGLight-TodoLevels.user.js)

Shows the target level from your OGLight Todolist directly on the building/research tiles, right next to the current level, so you always know what you're working toward without opening the Todolist.

![Todolist Target Levels](plugins/todo-levels/TodoLevels.png)

### [OGLight - Notes Panel](plugins/notes/OGLight-Notes.user.js)

Adds a simple persistent notes box below your planet list — jot down build orders, targets, or reminders. Auto-saves as you type, per universe.

![Notes Panel](plugins/notes/Notes.png)

## Compatibility

Tested against OGLight v5.4.3-b9. These plugins hook into OGLight's DOM structure and CSS classes, so a future OGLight update could occasionally require a matching update here.

## License

[MIT](LICENSE)

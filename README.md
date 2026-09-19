# OGLight Plugins

A small collection of [Tampermonkey](https://www.tampermonkey.net/) userscripts that extend [OGLight](https://forum.origin.ogame.gameforge.com/forum/thread/537-oglight/), a third-party UI overhaul for the browser game [OGame](https://ogame.gameforge.com/).

These plugins never modify OGLight itself — they load after it and add or restyle small pieces of its UI. **OGLight must already be installed** for any of these to do anything.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) if you don't have it, and make sure OGLight is installed and working first.
2. Open the `.user.js` file for the plugin you want (in this repo), click **Raw**, and Tampermonkey will prompt you to install it.
3. Reload your OGame tab.

Each plugin is independent — install only the ones you want.

## Plugins

- [Build Queue Icons](plugins/build-icons/) — proper icons (with tooltips) instead of tiny colored bars for each planet's build queue
- [Fleet Shortcuts](plugins/fleet-shortcuts/) — one-click buttons to send 100% of a resource when dispatching a fleet
- [Todolist Target Levels](plugins/todo-levels/) — shows your Todolist's target level next to the current level on building/research tiles
- [Notes Panel](plugins/notes/) — a small persistent notes box below your planet list

Each one has its own README with a screenshot and install link.

## Compatibility

Tested against OGLight v5.4.3-b9. These plugins hook into OGLight's DOM structure and CSS classes, so a future OGLight update could occasionally require a matching update here.

## License

[MIT](LICENSE)

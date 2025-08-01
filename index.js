/// <reference types="../CTAutocomplete" />

import Skyblock from "../BloomCore/Skyblock";
import PogObject from "../PogData";

const data = new PogObject("bigdiamond", {
    x: 100,
    y: 100,
    scale: 1.0
}, "settings.json");

const GUI = new Gui();

GUI.registerMouseDragged( (mx, my, c, t) => {
    data.x = mx
    data.y = my
});

GUI.registerScrolled( (mx, my, dir) => {
    data.scale += (dir / 10.0);
});

GUI.registerClosed( () => {
    data.save();
});

let totalItems = 0;
let totalSeconds = 0;
let totalItemsStr = "0";
let profitStr = "0";
let isRegistered = false;


register("command", (...args) => {
    if (args?.[0]) {
        totalItems = 0;
        totalSeconds = 0;
        totalItemsStr = "0";
        profitStr = "0";
        return;
    }
    GUI.open();
}).setName("bigdiamond").setAliases(["bigd"]);

const profitDisplay = register("renderOverlay", () => {
    Renderer.scale(data.scale);
    Renderer.translate(data.x / data.scale, data.y / data.scale);
    Renderer.drawString(`§a$total > §f${totalItemsStr}`, 0, 0);
    Renderer.scale(data.scale);
    Renderer.translate(data.x / data.scale, data.y / data.scale);
    Renderer.drawString(`§a$hr > §f${profitStr}`, 0, 10);
}).unregister();

const chatTracker = register("chat", (numItems, seconds, event) => {
    seconds = parseInt(seconds);
    totalSeconds += seconds;
    let hoverValue = new Message(event).getMessageParts().find(text => text.getHoverValue() != null)?.getHoverValue()?.removeFormatting().split("\n");
    if (!hoverValue) return;
    for(let i = 0; i < hoverValue.length; i++) {
        let line = hoverValue[i].match(/\+([\d,]+) (Enchanted Diamond|Diamond) \(/);
        if (!line) continue;
        let amt = parseInt(line[1].replaceAll(",", ""));
        let item = line[2];
        if (item == "Enchanted Diamond") {
            amt *= 160;
        }
        totalItems += amt;
    }

    totalItemsStr = (totalItems * 8).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    profitStr = Math.floor(totalItems / totalSeconds) * 3600 * 8;
    profitStr = profitStr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}).setCriteria(/\[Sacks\] \+(.+) items. \(Last (\d+)s.\)/).unregister();

const worldSearch = register("step", () => {
    if (!Skyblock?.area) return;
    
    if (Skyblock.area?.includes("Dwarven Mines")) {
        isRegistered = true;
        profitDisplay.register();
        chatTracker.register();
    } else {
        worldSearch.unregister();
    }
}).setFps(2).unregister();

register("worldLoad", () => {
    if (isRegistered) {
        profitDisplay.unregister();
        chatTracker.unregister();
    }
    worldSearch.register();
});

import { initGrid, rebuildGrid, renderTerritories } from "./js/grid.js";
import { initUnits, updateBoard } from "./js/units.js";
import { initFOB } from "./js/fob.js";
import { loadGameStateFromServer } from "./js/server.js";
import { initUI } from "./js/ui.js";

document.addEventListener("DOMContentLoaded", () => {
    initGrid();
    initUnits();
    initFOB();
    initUI();

    // ⭐ Render territory outlines after grid is built
    renderTerritories();

    loadGameStateFromServer();
    setInterval(loadGameStateFromServer, 10000);

    window.addEventListener("resize", () => {
        rebuildGrid();
        updateBoard();

        // ⭐ Re-apply territory outlines after rebuild
        renderTerritories();
    });
});

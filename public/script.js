import { initGrid, rebuildGrid, renderTerritories } from "./js/grid.js";
import { initUnits, updateBoard } from "./js/units.js";
import { initFOB } from "./js/fob.js";
import { loadGameStateFromServer } from "./js/server.js";
import { initUI } from "./js/ui.js";

document.addEventListener("DOMContentLoaded", () => {
    // Build grid + UI
    initGrid();
    initUnits();
    initFOB();
    initUI();

    // Initial territory render
    renderTerritories();

    // Load game state from server
    loadGameStateFromServer();

    // ⭐ Re-apply territory outlines AFTER units update the board
    updateBoard();
    renderTerritories();

    // Auto-refresh every 10 seconds
    setInterval(() => {
        loadGameStateFromServer();
        updateBoard();
        renderTerritories();   // ⭐ critical to prevent outlines disappearing
    }, 10000);

    // Handle window resizing
    window.addEventListener("resize", () => {
        rebuildGrid();
        updateBoard();
        renderTerritories();   // outlines restored after rebuild
    });
});

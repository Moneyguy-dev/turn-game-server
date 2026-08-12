import {
    initGrid,
    rebuildGrid,
    renderTerritories
} from "./js/grid.js";

import {
    initUnits,
    updateBoard
} from "./js/units.js";

import {
    loadGameStateFromServer
} from "./js/server.js";

import {
    initUI
} from "./js/ui.js";


document.addEventListener("DOMContentLoaded", () => {

    /* ============================
       BUILD GRID
       ============================ */

    initGrid();


    /* ============================
       INITIALIZE UNITS
       ============================ */

    initUnits();


    /* ============================
       INITIALIZE UI
       ============================ */

    initUI();


    /* ============================
       INITIAL TERRITORY RENDER
       ============================ */

    renderTerritories();


    /* ============================
       LOAD GAME STATE
       ============================ */

    loadGameStateFromServer();


    /* ============================
       INITIAL BOARD UPDATE
       ============================ */

    updateBoard();

    renderTerritories();


    /* ============================
       AUTO REFRESH
       ============================ */

    setInterval(() => {

        loadGameStateFromServer();

        updateBoard();

        renderTerritories();

    }, 10000);


    /* ============================
       WINDOW RESIZE
       ============================ */

    window.addEventListener("resize", () => {

        rebuildGrid();

        updateBoard();

        renderTerritories();

    });

});
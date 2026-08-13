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
    loadGameStateFromServer,
    resetGameOnServer
} from "./js/server.js";

import {
    initUI
} from "./js/ui.js";


document.addEventListener(
    "DOMContentLoaded",
    async () => {

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
           INITIAL TERRITORIES
        ============================ */

        renderTerritories();


        /* ============================
           LOAD SERVER STATE
        ============================ */

        try {

            await loadGameStateFromServer();

        } catch (error) {

            console.error(
                "Initial game-state load failed:",
                error
            );
        }


        /* ============================
           UPDATE BOARD
        ============================ */

        updateBoard();

        renderTerritories();


        /* ============================
           RESET GAME
        ============================ */

        const resetButton =
            document.getElementById(
                "resetGame"
            );

        if (resetButton) {

            resetButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            "Are you sure you want to reset the game?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    resetButton.disabled = true;

                    resetButton.textContent =
                        "Resetting...";

                    try {

                        const result =
                            await resetGameOnServer();

                        alert(
                            result.message ||
                            "Game has been reset."
                        );

                        /*
                         * Reload the board from
                         * the server.
                         */

                        await loadGameStateFromServer();

                        updateBoard();

                        renderTerritories();

                    } catch (error) {

                        console.error(
                            "Reset failed:",
                            error
                        );

                        alert(
                            "Reset failed. Check the server."
                        );

                    } finally {

                        resetButton.disabled =
                            false;

                        resetButton.textContent =
                            "Reset";
                    }
                }
            );
        }


        /* ============================
           AUTO REFRESH
        ============================ */

        setInterval(
            async () => {

                try {

                    await loadGameStateFromServer();

                    updateBoard();

                    renderTerritories();

                } catch (error) {

                    console.error(
                        "Auto refresh failed:",
                        error
                    );
                }

            },
            10000
        );


        /* ============================
           WINDOW RESIZE
        ============================ */

        window.addEventListener(
            "resize",
            () => {

                rebuildGrid();

                updateBoard();

                renderTerritories();
            }
        );
    }
);
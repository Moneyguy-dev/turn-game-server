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
       RESET GAME
    ============================ */

    const resetButton =
        document.getElementById("resetGame");

    if (resetButton) {

        resetButton.addEventListener("click", async () => {

            const confirmed =
                confirm(
                    "Are you sure you want to reset the game?"
                );

            if (!confirmed) {
                return;
            }

            resetButton.disabled = true;
            resetButton.textContent = "Resetting...";

            try {

                /*
                 * Get the game ID from the URL.
                 * If none exists, use "default".
                 */
                const params =
                    new URLSearchParams(
                        window.location.search
                    );

                const gameId =
                    params.get("gameId") || "default";


                const response =
                    await fetch("/resetGame", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            gameId
                        })
                    });


                if (!response.ok) {
                    throw new Error(
                        `Server returned ${response.status}`
                    );
                }


                const result =
                    await response.json();


                /*
                 * Show the server's reset message.
                 */
                alert(
                    result.message ||
                    "Game has been reset."
                );


                /*
                 * Reload the board so all units
                 * appear at their FOBs.
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

                resetButton.disabled = false;
                resetButton.textContent = "Reset";
            }
        });
    }


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
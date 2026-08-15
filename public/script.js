// ============================================================
// MAIN APPLICATION
// ============================================================

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
    initFOB
} from "./js/fob.js";

import {
    loadGameStateFromServer
} from "./js/server.js";

import {
    initUI
} from "./js/ui.js";

import {
    initArmamentUI
} from "./js/armamentUI.js";


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // ====================================================
        // GRID
        // ====================================================

        const gridReady =
            initGrid();


        if (!gridReady) {

            console.error(
                "Grid initialization failed."
            );

            return;
        }


        // ====================================================
        // FOB
        // ====================================================

        initFOB();


        // ====================================================
        // UNITS
        // ====================================================

        initUnits();


        // ====================================================
        // UI
        // ====================================================

        initUI();


        // ====================================================
        // ARMAMENT UI
        // ====================================================

        initArmamentUI();


        // ====================================================
        // UNIT DISPLAY MODE
        //
        // OFF = existing stacked/grouped view
        // ON  = individual circular unit pieces
        // ====================================================

        const unitDisplayToggle =
            document.getElementById(
                "unitDisplayToggle"
            );


        if (unitDisplayToggle) {

            // Make sure the initial body state matches
            // the actual position of the switch.

            document.body.classList.toggle(
                "individual-unit-view",
                unitDisplayToggle.checked
            );


            unitDisplayToggle.addEventListener(
                "change",
                () => {

                    const individualView =
                        unitDisplayToggle.checked;


                    document.body.classList.toggle(
                        "individual-unit-view",
                        individualView
                    );


                    // Redraw the board immediately so the
                    // visual change happens without refresh.

                    updateBoard();

                }
            );

        }


        // ====================================================
        // SERVER STATE
        // ====================================================

        try {

            await loadGameStateFromServer();

        } catch (error) {

            console.error(
                "Initial server state load failed:",
                error
            );
        }


        // ====================================================
        // DRAW
        // ====================================================

        updateBoard();

        renderTerritories();


        // ====================================================
        // RESET
        // ====================================================

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


                    resetButton.disabled =
                        true;

                    resetButton.textContent =
                        "Resetting...";


                    try {

                        const params =
                            new URLSearchParams(
                                window.location.search
                            );


                        const gameId =
                            params.get("gameId") ||
                            "default";


                        const response =
                            await fetch(
                                "/resetGame",
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({
                                            gameId
                                        })
                                }
                            );


                        if (!response.ok) {

                            throw new Error(
                                `Server returned ${response.status}`
                            );
                        }


                        const result =
                            await response.json();


                        alert(
                            result.message ||
                            "Game has been reset."
                        );


                        // Reload the new server state.

                        await loadGameStateFromServer();


                        // Redraw everything.

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


        // ====================================================
        // AUTO REFRESH
        // ====================================================

        setInterval(
            async () => {

                try {

                    await loadGameStateFromServer();


                    // Keep the current display mode.

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


        // ====================================================
        // RESIZE
        // ====================================================

        let resizeTimer =
            null;


        window.addEventListener(
            "resize",
            () => {

                clearTimeout(
                    resizeTimer
                );


                resizeTimer =
                    setTimeout(
                        () => {

                            rebuildGrid();

                            updateBoard();

                            renderTerritories();

                        },
                        150
                    );

            }
        );

    }
);
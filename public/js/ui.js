// ============================================================
// UI CONTROLS
// ============================================================

import {
    submitTurnToServer,
    continueTurnOnServer,
    loadGameStateFromServer
} from "./server.js";

import {
    updateBoard
} from "./units.js";


let currentZoom = 1;


// ============================================================
// INITIALIZE UI
// ============================================================

export function initUI() {

    // ========================================================
    // ELEMENTS
    // ========================================================

    const zoomInBtn =
        document.getElementById("zoomIn");

    const zoomOutBtn =
        document.getElementById("zoomOut");

    const zoomUnitsBtn =
        document.getElementById("zoomUnits");

    const unitsBtn =
        document.getElementById("unitsBtn");

    const unitPanel =
        document.getElementById("unitPanel");

    const armamentsBtn =
        document.getElementById("armaments");

    const armamentsPanel =
        document.getElementById("armamentsPanel");

    const closeArmamentsPanel =
        document.getElementById(
            "closeArmamentsPanel"
        );

    const backButton =
        document.getElementById("backButton");

    const submitButton =
        document.getElementById("submitTurn");

    const continueButton =
        document.getElementById("continueTurn");


    // ========================================================
    // ZOOM IN
    // ========================================================

    if (zoomInBtn) {

        zoomInBtn.onclick = () => {

            currentZoom += 0.1;

            currentZoom =
                Math.min(
                    currentZoom,
                    3
                );

            applyZoom();
        };
    }


    // ========================================================
    // ZOOM OUT
    // ========================================================

    if (zoomOutBtn) {

        zoomOutBtn.onclick = () => {

            currentZoom -= 0.1;

            currentZoom =
                Math.max(
                    currentZoom,
                    0.3
                );

            applyZoom();
        };
    }


    // ========================================================
    // ZOOM TO UNITS
    // ========================================================

    if (zoomUnitsBtn) {

        zoomUnitsBtn.onclick = () => {

            zoomToUnits();
        };
    }


    // ========================================================
    // UNITS PANEL
    // ========================================================

    if (
        unitsBtn &&
        unitPanel
    ) {

        unitsBtn.onclick = () => {

            /*
             * Close armaments when opening units.
             */

            armamentsPanel?.classList.remove(
                "open"
            );


            unitPanel.classList.toggle(
                "open"
            );
        };
    }


    // ========================================================
    // CLOSE UNIT PANEL
    // ========================================================

    const closeUnitPanel =
        document.getElementById(
            "closeUnitPanel"
        );

    if (closeUnitPanel) {

        closeUnitPanel.onclick = () => {

            unitPanel?.classList.remove(
                "open"
            );
        };
    }


    // ========================================================
    // ARMAMENTS PANEL
    // ========================================================

    if (
        armamentsBtn &&
        armamentsPanel
    ) {

        armamentsBtn.onclick = () => {

            /*
             * Close the Units panel first.
             */

            unitPanel?.classList.remove(
                "open"
            );


            /*
             * Open / close Armaments.
             */

            armamentsPanel.classList.toggle(
                "open"
            );
        };
    }


    // ========================================================
    // CLOSE ARMAMENTS PANEL
    // ========================================================

    if (closeArmamentsPanel) {

        closeArmamentsPanel.onclick = () => {

            armamentsPanel?.classList.remove(
                "open"
            );
        };
    }


    // ========================================================
    // BACK BUTTON
    // ========================================================

    if (backButton) {

        backButton.onclick = () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "/";
            }
        };
    }


    // ========================================================
    // SUBMIT TURN
    // ========================================================

    if (submitButton) {

        submitButton.onclick =
            async () => {

                if (
                    submitButton.disabled
                ) {
                    return;
                }


                const confirmed =
                    confirm(
                        "Submit your turn?"
                    );


                if (!confirmed) {
                    return;
                }


                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Submitting...";


                try {

                    await submitTurnToServer();


                    await loadGameStateFromServer();


                    updateBoard();


                    submitButton.textContent =
                        "Submitted";


                    setTimeout(
                        () => {

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Submit";

                        },
                        1000
                    );


                } catch (error) {

                    console.error(
                        "Submit turn failed:",
                        error
                    );


                    alert(
                        "Submit failed. Check the server."
                    );


                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Submit";
                }
            };
    }


    // ========================================================
    // CONTINUE BUTTON
    // ========================================================

    if (continueButton) {

        continueButton.onclick =
            async () => {

                if (
                    continueButton.disabled
                ) {
                    return;
                }


                continueButton.disabled =
                    true;

                continueButton.textContent =
                    "Continuing...";


                try {

                    await continueTurnOnServer();


                    await loadGameStateFromServer();


                    updateBoard();


                    continueButton.textContent =
                        "Continue";


                } catch (error) {

                    console.error(
                        "Continue turn failed:",
                        error
                    );


                    alert(
                        "Continue failed. Check the server."
                    );


                } finally {

                    continueButton.disabled =
                        false;

                    continueButton.textContent =
                        "Continue";
                }
            };
    }


    // ========================================================
    // DIAGNOSTIC
    // ========================================================

    createDiagnosticOverlay();
}


// ============================================================
// APPLY ZOOM
// ============================================================

function applyZoom() {

    const gameBoard =
        document.getElementById(
            "gameBoard"
        );


    if (!gameBoard) {
        return;
    }


    gameBoard.style.transform =
        `scale(${currentZoom})`;
}


// ============================================================
// ZOOM TO UNITS
// ============================================================

function zoomToUnits() {

    const gameBoard =
        document.getElementById(
            "gameBoard"
        );


    if (!gameBoard) {
        return;
    }


    const occupied =
        gameBoard.querySelectorAll(
            ".unit-count"
        );


    if (
        occupied.length === 0
    ) {

        alert(
            "There are no units on the map."
        );

        return;
    }


    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;


    occupied.forEach(
        element => {

            const rect =
                element.getBoundingClientRect();


            minX =
                Math.min(
                    minX,
                    rect.left
                );

            maxX =
                Math.max(
                    maxX,
                    rect.right
                );

            minY =
                Math.min(
                    minY,
                    rect.top
                );

            maxY =
                Math.max(
                    maxY,
                    rect.bottom
                );
        }
    );


    const width =
        maxX - minX;

    const height =
        maxY - minY;


    if (
        width <= 0 ||
        height <= 0
    ) {
        return;
    }


    const availableWidth =
        window.innerWidth * 0.8;

    const availableHeight =
        (window.innerHeight - 100) * 0.8;


    const zoomX =
        availableWidth / width;

    const zoomY =
        availableHeight / height;


    currentZoom =
        Math.min(
            zoomX,
            zoomY
        );


    currentZoom =
        Math.max(
            0.3,
            Math.min(
                currentZoom,
                3
            )
        );


    applyZoom();
}


// ============================================================
// DIAGNOSTIC OVERLAY
// ============================================================

export function createDiagnosticOverlay() {

    const existing =
        document.getElementById(
            "diagOverlay"
        );


    if (existing) {
        return;
    }


    const diag =
        document.createElement(
            "div"
        );


    diag.id =
        "diagOverlay";


    Object.assign(
        diag.style,
        {

            position: "fixed",

            top: "10px",

            left: "10px",

            padding: "10px 14px",

            background:
                "rgba(0,0,0,0.75)",

            color: "#0f0",

            fontFamily:
                "monospace",

            fontSize: "12px",

            zIndex: "9999",

            border:
                "1px solid #0f0",

            borderRadius: "6px",

            pointerEvents: "none"
        }
    );


    diag.textContent =
        "Diagnostic Overlay Active";


    document.body.appendChild(
        diag
    );
}
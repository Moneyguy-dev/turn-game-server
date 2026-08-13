import {
    loadGameStateFromServer,
    submitTurnToServer,
    continueTurnOnServer
} from "./server.js";

import { updateBoard } from "./units.js";

let currentZoom = 1;

/* ============================
   INITIALIZE UI
============================ */

export function initUI() {

    const unitPanel =
        document.getElementById("unitPanel");

    const mapContainer =
        document.getElementById("mapContainer");

    const unitsBtn =
        document.getElementById("unitsBtn");

    const zoomInBtn =
        document.getElementById("zoomIn");

    const zoomOutBtn =
        document.getElementById("zoomOut");

    const zoomUnitsBtn =
        document.getElementById("zoomUnits");

    const backButton =
        document.getElementById("backButton");

    const submitTurnButton =
        document.getElementById("submitTurn");

    const continueTurnButton =
        document.getElementById("continueTurn");


    /* ============================
       UNITS PANEL
    ============================ */

    if (
        unitsBtn &&
        unitPanel &&
        mapContainer
    ) {

        unitsBtn.addEventListener(
            "click",
            () => {

                const isOpen =
                    unitPanel.classList.toggle("open");

                unitsBtn.textContent =
                    isOpen
                        ? "Units ◂"
                        : "Units ▸";

                mapContainer.style.marginRight =
                    isOpen
                        ? "300px"
                        : "0px";
            }
        );
    }


    /* ============================
       ZOOM IN
    ============================ */

    if (zoomInBtn) {

        zoomInBtn.addEventListener(
            "click",
            () => {

                currentZoom += 0.1;

                applyZoom();
            }
        );
    }


    /* ============================
       ZOOM OUT
    ============================ */

    if (zoomOutBtn) {

        zoomOutBtn.addEventListener(
            "click",
            () => {

                currentZoom =
                    Math.max(
                        0.3,
                        currentZoom - 0.1
                    );

                applyZoom();
            }
        );
    }


    /* ============================
       ZOOM TO UNITS
    ============================ */

    if (zoomUnitsBtn) {

        zoomUnitsBtn.addEventListener(
            "click",
            () => {

                zoomToUnits();
            }
        );
    }


    /* ============================
       BACK BUTTON
    ============================ */

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";
            }
        );
    }


    /* ============================
       SUBMIT TURN
    ============================ */

    if (submitTurnButton) {

        submitTurnButton.addEventListener(
            "click",
            async () => {

                const originalText =
                    submitTurnButton.textContent;

                submitTurnButton.disabled = true;

                submitTurnButton.textContent =
                    "Submitting...";

                try {

                    const result =
                        await submitTurnToServer();

                    console.log(
                        "Turn submitted:",
                        result
                    );

                    submitTurnButton.textContent =
                        "Submitted";

                    /*
                     * Reload the current game state.
                     */

                    await loadGameStateFromServer();

                } catch (error) {

                    console.error(
                        "Submit turn failed:",
                        error
                    );

                    alert(
                        "Could not submit turn. Check the server."
                    );

                    submitTurnButton.textContent =
                        originalText;

                } finally {

                    submitTurnButton.disabled = false;
                }
            }
        );
    }


    /* ============================
       CONTINUE TURN
    ============================ */

    if (continueTurnButton) {

        continueTurnButton.addEventListener(
            "click",
            async () => {

                const originalText =
                    continueTurnButton.textContent;

                const confirmed =
                    confirm(
                        "Resolve the current turn?"
                    );

                if (!confirmed) {
                    return;
                }

                continueTurnButton.disabled = true;

                continueTurnButton.textContent =
                    "Resolving...";

                try {

                    const result =
                        await continueTurnOnServer();

                    console.log(
                        "Turn resolved:",
                        result
                    );

                    /*
                     * Reload the board after the
                     * server applies all pending moves.
                     */

                    await loadGameStateFromServer();

                    updateBoard();

                    continueTurnButton.textContent =
                        "Continue";

                } catch (error) {

                    console.error(
                        "Continue turn failed:",
                        error
                    );

                    alert(
                        "Could not continue the turn. Check the server."
                    );

                    continueTurnButton.textContent =
                        originalText;

                } finally {

                    continueTurnButton.disabled = false;
                }
            }
        );
    }


    createDiagnosticOverlay();
}


/* ============================
   APPLY ZOOM
============================ */

function applyZoom() {

    const gameBoard =
        document.getElementById("gameBoard");

    if (!gameBoard) {
        return;
    }

    gameBoard.style.transform =
        `scale(${currentZoom})`;
}


/* ============================
   ZOOM TO UNITS
============================ */

function zoomToUnits() {

    const gameBoard =
        document.getElementById("gameBoard");

    if (!gameBoard) {
        return;
    }

    const units =
        gameBoard.querySelectorAll(".unit");

    if (units.length === 0) {
        return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    units.forEach(unit => {

        const rect =
            unit.getBoundingClientRect();

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
    });

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

    const zoomX =
        window.innerWidth / width;

    const zoomY =
        (window.innerHeight - 50) / height;

    currentZoom =
        Math.min(
            zoomX,
            zoomY
        ) * 0.8;

    applyZoom();
}


/* ============================
   DIAGNOSTIC OVERLAY
============================ */

export function createDiagnosticOverlay() {

    /*
     * Don't create duplicates.
     */

    if (
        document.getElementById(
            "diagOverlay"
        )
    ) {
        return;
    }

    const diag =
        document.createElement("div");

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

            fontFamily: "monospace",

            fontSize: "12px",

            zIndex: "9999",

            border:
                "1px solid #0f0",

            borderRadius: "6px"
        }
    );

    diag.textContent =
        "Diagnostic Overlay Active";

    document.body.appendChild(diag);
}
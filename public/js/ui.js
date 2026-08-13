let currentZoom = 1;


/* ============================
   INITIALIZE UI
============================ */

export function initUI() {

    const zoomInBtn =
        document.getElementById(
            "zoomIn"
        );


    const zoomOutBtn =
        document.getElementById(
            "zoomOut"
        );


    const zoomUnitsBtn =
        document.getElementById(
            "zoomUnits"
        );


    const unitsBtn =
        document.getElementById(
            "unitsBtn"
        );


    const unitPanel =
        document.getElementById(
            "unitPanel"
        );


    /*
     * Zoom in
     */

    if (zoomInBtn) {

        zoomInBtn.addEventListener(
            "click",
            () => {

                currentZoom += 0.1;

                applyZoom();
            }
        );
    }


    /*
     * Zoom out
     */

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


    /*
     * Zoom to units
     */

    if (zoomUnitsBtn) {

        zoomUnitsBtn.addEventListener(
            "click",
            () => {

                zoomToUnits();
            }
        );
    }


    /*
     * Units button now simply
     * toggles the selection panel.
     */

    if (
        unitsBtn &&
        unitPanel
    ) {

        unitsBtn.addEventListener(
            "click",
            () => {

                unitPanel.classList.toggle(
                    "open"
                );
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
        document.getElementById(
            "gameBoard"
        );


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
        document.getElementById(
            "gameBoard"
        );


    if (!gameBoard) {
        return;
    }


    const units =
        gameBoard.querySelectorAll(
            ".unit"
        );


    /*
     * Units are no longer physically
     * rendered on the board.
     *
     * Instead, zoom to the occupied
     * hexes.
     */

    const occupied =
        gameBoard.querySelectorAll(
            ".unit-count"
        );


    if (
        occupied.length === 0
    ) {

        return;
    }


    let minX =
        Infinity;

    let maxX =
        -Infinity;

    let minY =
        Infinity;

    let maxY =
        -Infinity;


    occupied.forEach(
        (element) => {

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


    const zoomX =
        window.innerWidth /
        width;


    const zoomY =
        (window.innerHeight - 50) /
        height;


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

            padding:
                "10px 14px",

            background:
                "rgba(0,0,0,0.75)",

            color: "#0f0",

            fontFamily:
                "monospace",

            fontSize:
                "12px",

            zIndex:
                "9999",

            border:
                "1px solid #0f0",

            borderRadius:
                "6px",

            pointerEvents:
                "none"
        }
    );


    diag.textContent =
        "Diagnostic Overlay Active";


    document.body.appendChild(
        diag
    );
}
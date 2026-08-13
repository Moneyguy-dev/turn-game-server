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
// ARMAMENT DATA
// ============================================================

const ARMAMENTS = {

    aircraft: [
        {
            name: "Air-to-Air Missiles",
            description: "Long-range and short-range weapons for engaging hostile aircraft."
        },
        {
            name: "Air-to-Ground Missiles",
            description: "Precision weapons for attacking ground targets."
        },
        {
            name: "Guided Bombs",
            description: "Precision-guided bombs for fixed and high-value targets."
        },
        {
            name: "Unguided Bombs",
            description: "Conventional bombs for general ground attack."
        }
    ],

    naval: [
        {
            name: "Anti-Ship Missiles",
            description: "Long-range missiles designed to engage surface vessels."
        },
        {
            name: "Surface-to-Air Missiles",
            description: "Defensive missiles used against aircraft and incoming threats."
        },
        {
            name: "Naval Guns",
            description: "Ship-mounted guns for surface and shore engagements."
        }
    ],

    ground: [
        {
            name: "Anti-Tank Weapons",
            description: "Weapons designed to engage armored ground units."
        },
        {
            name: "Artillery",
            description: "Long-range indirect-fire weapons."
        },
        {
            name: "Air Defense",
            description: "Ground-based systems for defending against aircraft."
        }
    ]
};


// ============================================================
// INITIALIZE UI
// ============================================================

export function initUI() {

    const zoomInBtn =
        document.getElementById("zoomIn");

    const zoomOutBtn =
        document.getElementById("zoomOut");

    const zoomUnitsBtn =
        document.getElementById("zoomUnits");

    const unitsBtn =
        document.getElementById("unitsBtn");

    const armamentsBtn =
        document.getElementById("armaments");

    const unitPanel =
        document.getElementById("unitPanel");

    const backButton =
        document.getElementById("backButton");

    const submitButton =
        document.getElementById("submitTurn");

    const continueButton =
        document.getElementById("continueTurn");

    const resetButton =
        document.getElementById("resetGame");


    // ========================================================
    // CREATE ARMAMENTS PANEL
    // ========================================================

    const armamentsPanel =
        createArmamentsPanel();


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
             * Close Armaments if it is open.
             */

            armamentsPanel?.classList.remove(
                "open"
            );


            /*
             * Toggle Units panel.
             */

            unitPanel.classList.toggle(
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
             * Close Units panel if it is open.
             */

            unitPanel?.classList.remove(
                "open"
            );


            /*
             * Toggle Armaments panel.
             */

            armamentsPanel.classList.toggle(
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
    // CLOSE ARMAMENTS PANEL
    // ========================================================

    const closeArmamentsPanel =
        document.getElementById(
            "closeArmamentsPanel"
        );

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

            /*
             * Close open panels first.
             */

            unitPanel?.classList.remove(
                "open"
            );

            armamentsPanel?.classList.remove(
                "open"
            );


            /*
             * Return to the side-selection page.
             */

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


                    /*
                     * Get newest server state.
                     */

                    await loadGameStateFromServer();


                    /*
                     * Redraw map.
                     */

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
    // RESET BUTTON
    // ========================================================

    /*
     * script.js already handles resetGame.
     *
     * Do NOT attach another reset handler here.
     */


    // ========================================================
    // DIAGNOSTIC
    // ========================================================

    createDiagnosticOverlay();
}


// ============================================================
// CREATE ARMAMENTS PANEL
// ============================================================

function createArmamentsPanel() {

    /*
     * If the panel already exists, use it.
     *
     * This prevents duplicate panels if initUI()
     * is ever called more than once.
     */

    const existing =
        document.getElementById(
            "armamentsPanel"
        );


    if (existing) {
        return existing;
    }


    // ========================================================
    // PANEL
    // ========================================================

    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "armamentsPanel";


    panel.className =
        "armaments-side-panel";


    // ========================================================
    // HEADER
    // ========================================================

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "sidePanelHeader";


    const title =
        document.createElement(
            "span"
        );


    title.id =
        "armamentsPanelTitle";


    title.textContent =
        "Armaments";


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.id =
        "closeArmamentsPanel";


    closeButton.className =
        "closePanelBtn";


    closeButton.textContent =
        "×";


    header.appendChild(
        title
    );

    header.appendChild(
        closeButton
    );


    // ========================================================
    // CONTENT
    // ========================================================

    const content =
        document.createElement(
            "div"
        );


    content.id =
        "armamentsList";


    buildArmamentsList(
        content
    );


    // ========================================================
    // ADD TO PANEL
    // ========================================================

    panel.appendChild(
        header
    );

    panel.appendChild(
        content
    );


    // ========================================================
    // ADD TO PAGE
    // ========================================================

    document
        .getElementById("layout")
        ?.appendChild(panel);


    return panel;
}


// ============================================================
// BUILD ARMAMENT LIST
// ============================================================

function buildArmamentsList(
    container
) {

    Object.entries(
        ARMAMENTS
    ).forEach(
        ([category, weapons]) => {

            const categorySection =
                document.createElement(
                    "div"
                );


            categorySection.className =
                "armamentCategory";


            const categoryTitle =
                document.createElement(
                    "div"
                );


            categoryTitle.className =
                "armamentCategoryTitle";


            categoryTitle.textContent =
                formatCategoryName(
                    category
                );


            categorySection.appendChild(
                categoryTitle
            );


            weapons.forEach(
                weapon => {

                    const weaponElement =
                        document.createElement(
                            "div"
                        );


                    weaponElement.className =
                        "armamentItem";


                    const weaponName =
                        document.createElement(
                            "div"
                        );


                    weaponName.className =
                        "armamentName";


                    weaponName.textContent =
                        weapon.name;


                    const description =
                        document.createElement(
                            "div"
                        );


                    description.className =
                        "armamentDescription";


                    description.textContent =
                        weapon.description;


                    weaponElement.appendChild(
                        weaponName
                    );

                    weaponElement.appendChild(
                        description
                    );


                    categorySection.appendChild(
                        weaponElement
                    );
                }
            );


            container.appendChild(
                categorySection
            );
        }
    );
}


// ============================================================
// FORMAT CATEGORY NAME
// ============================================================

function formatCategoryName(
    category
) {

    return category
        .charAt(0)
        .toUpperCase() +
        category.slice(1);
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
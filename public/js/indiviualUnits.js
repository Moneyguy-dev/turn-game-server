import {
    board,
    rows,
    cols
} from "/js/grid.js";


const pageType =
    document.body.classList.contains("red-page")
        ? "red"
        : document.body.classList.contains("admin-page")
            ? "admin"
            : "blue";


const STORAGE_KEY =
    `${pageType}-individual-unit-display`;


let individualMode =
    localStorage.getItem(STORAGE_KEY) === "true";


let renderTimer = null;


/* =========================================================
   APPLY DISPLAY MODE
========================================================= */

function applyIndividualMode() {

    const gameBoard =
        document.getElementById("gameBoard");


    const toggle =
        document.getElementById("individualUnitsToggle");


    if (!gameBoard) {
        return;
    }


    gameBoard.classList.toggle(
        "individual-units-mode",
        individualMode
    );


    if (toggle) {
        toggle.checked =
            individualMode;
    }


    renderIndividualUnits();
}


/* =========================================================
   RENDER INDIVIDUAL UNITS
========================================================= */

function renderIndividualUnits() {

    const gameBoard =
        document.getElementById("gameBoard");


    if (!gameBoard) {
        return;
    }


    gameBoard
        .querySelectorAll(
            ".individual-unit-piece"
        )
        .forEach(
            piece => piece.remove()
        );


    if (!individualMode) {
        return;
    }


    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < cols;
            col++
        ) {

            const stack =
                board?.[row]?.[col];


            if (
                !Array.isArray(stack) ||
                stack.length === 0
            ) {
                continue;
            }


            const wrapper =
                gameBoard.querySelector(
                    `.hex-wrapper[data-row="${row}"][data-col="${col}"]`
                );


            if (!wrapper) {
                continue;
            }


            const hex =
                wrapper.querySelector(".hex");


            if (!hex) {
                continue;
            }


            const count =
                stack.length;


            stack.forEach(
                (unit, index) => {

                    const piece =
                        document.createElement("div");


                    piece.className =
                        "individual-unit-piece";


                    const team =
                        unit?.team;


                    if (team === "blue") {

                        piece.classList.add(
                            "blue"
                        );

                    } else if (team === "red") {

                        piece.classList.add(
                            "red"
                        );

                    } else {

                        piece.classList.add(
                            "neutral"
                        );

                    }


                    piece.textContent =
                        unit?.type ||
                        unit?.name ||
                        "Unit";


                    /*
                     * Spread units around the center
                     * of the hex.
                     */

                    const angle =
                        count === 1
                            ? 0
                            : (
                                (Math.PI * 2) /
                                count
                            ) * index;


                    const radius =
                        count === 1
                            ? 0
                            : Math.min(
                                26,
                                12 + count * 2
                            );


                    const x =
                        Math.cos(angle) *
                        radius;


                    const y =
                        Math.sin(angle) *
                        radius;


                    piece.style.setProperty(
                        "--unit-x",
                        `${x}px`
                    );


                    piece.style.setProperty(
                        "--unit-y",
                        `${y}px`
                    );


                    hex.appendChild(
                        piece
                    );

                }
            );

        }

    }

}


/* =========================================================
   INITIALIZE SWITCH
========================================================= */

function initializeIndividualUnits() {

    const toggle =
        document.getElementById(
            "individualUnitsToggle"
        );


    if (!toggle) {
        return;
    }


    toggle.checked =
        individualMode;


    toggle.addEventListener(
        "change",
        () => {

            individualMode =
                toggle.checked;


            localStorage.setItem(
                STORAGE_KEY,
                String(individualMode)
            );


            applyIndividualMode();

        }
    );


    applyIndividualMode();


    /*
     * script.js may redraw the board after:
     *
     * - loading the game
     * - moving units
     * - changing turns
     * - resizing
     *
     * We only refresh while individual mode is enabled.
     */

    renderTimer =
        window.setInterval(
            () => {

                if (!individualMode) {
                    return;
                }


                renderIndividualUnits();

            },
            300
        );

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeIndividualUnits,
        {
            once: true
        }
    );

} else {

    initializeIndividualUnits();

}
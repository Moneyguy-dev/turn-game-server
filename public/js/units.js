import {
    board,
    rows,
    cols,
    gameBoard,
    startHexes
} from "./grid.js";

import {
    getValidMoves,
    isFobHex,
    getFobTeamAt
} from "./fob.js";

import {
    sendMoveToServer
} from "./server.js";


/* ============================
   SELECTION STATE
============================ */

export let selectedUnit = null;

export let validMoves = [];


/* ============================
   UNIT LIMIT
============================ */

export const MAX_UNITS_PER_HEX = 4;


/* ============================
   INITIALIZE
============================ */

export function initUnits() {

    updateBoard();
}


/* ============================
   PANEL ELEMENTS
============================ */

function getPanel() {

    return document.getElementById(
        "unitPanel"
    );
}


function getPanelTitle() {

    return document.getElementById(
        "unitPanelTitle"
    );
}


function getUnitList() {

    return document.getElementById(
        "unitList"
    );
}


/* ============================
   OPEN UNIT PANEL
============================ */

export function openUnitPanel(
    title,
    units,
    mode = "hex"
) {

    const panel =
        getPanel();

    const titleElement =
        getPanelTitle();

    const list =
        getUnitList();


    if (
        !panel ||
        !titleElement ||
        !list
    ) {

        console.error(
            "Unit panel elements not found."
        );

        return;
    }


    titleElement.textContent =
        title;


    list.innerHTML = "";


    if (
        !units ||
        units.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "unitPanelEmpty";

        empty.textContent =
            "No units available.";

        list.appendChild(
            empty
        );

    } else {

        units.forEach(
            (unit, index) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    `panel-unit ${unit.team}`;


                button.type =
                    "button";


                button.textContent =
                    unit.type;


                const info =
                    document.createElement(
                        "span"
                    );


                info.className =
                    "panel-unit-move";


                info.textContent =
                    `Move ${unit.move}`;


                button.appendChild(
                    info
                );


                button.addEventListener(
                    "click",
                    () => {

                        selectUnitFromPanel(
                            unit,
                            mode
                        );
                    }
                );


                if (
                    selectedUnit &&
                    selectedUnit.unit === unit
                ) {

                    button.classList.add(
                        "selected"
                    );
                }


                list.appendChild(
                    button
                );
            }
        );
    }


    panel.classList.add(
        "open"
    );
}


/* ============================
   CLOSE PANEL
============================ */

export function closeUnitPanel() {

    const panel =
        getPanel();


    if (panel) {

        panel.classList.remove(
            "open"
        );
    }
}


/* ============================
   SELECT UNIT FROM PANEL
============================ */

function selectUnitFromPanel(
    unit,
    mode
) {

    /*
     * Find where this unit currently
     * exists on the board.
     */

    let location = null;


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            if (
                board[r][c].includes(
                    unit
                )
            ) {

                location = {
                    r,
                    c
                };

                break;
            }
        }


        if (location) {
            break;
        }
    }


    if (!location) {

        console.error(
            "Could not find selected unit on board."
        );

        return;
    }


    selectedUnit = {

        r: location.r,

        c: location.c,

        unit,

        fromFob:
            isFobHex(
                location.r,
                location.c
            )
    };


    validMoves =
        getValidMoves(
            location.r,
            location.c,
            unit.move
        );


    /*
     * Close the panel after selecting.
     * The map is now the focus.
     */

    closeUnitPanel();


    updateBoard();


    console.log(
        "Selected:",
        unit.type,
        "at",
        location
    );
}


/* ============================
   UPDATE BOARD
============================ */

export function updateBoard() {

    if (!gameBoard) {
        return;
    }


    const wrappers =
        gameBoard.children;


    let index = 0;


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            const wrapper =
                wrappers[index++];


            if (!wrapper) {
                continue;
            }


            const hex =
                wrapper.querySelector(
                    ".hex"
                );


            if (!hex) {
                continue;
            }


            /*
             * Clear previous contents.
             */

            hex.innerHTML = "";


            /*
             * Normal background.
             */

            hex.style.background =
                "#333";


            /*
             * Movement highlight.
             */

            if (
                validMoves.some(
                    ([vr, vc]) =>
                        vr === r &&
                        vc === c
                )
            ) {

                hex.style.background =
                    "#555";
            }


            /*
             * Hex click.
             */

            wrapper.onclick =
                () => {

                    onHexClick(
                        r,
                        c
                    );
                };


            /*
             * Don't display units
             * inside FOB hexes.
             *
             * Don't display individual
             * units anywhere on the map.
             */

            const stack =
                board[r][c];


            if (
                stack &&
                stack.length > 0
            ) {

                /*
                 * Create unit count.
                 */

                const count =
                    document.createElement(
                        "div"
                    );


                count.className =
                    "unit-count";


                count.textContent =
                    stack.length;


                /*
                 * Color the indicator
                 * based on the first unit.
                 */

                const firstUnit =
                    stack[0];


                if (
                    firstUnit
                ) {

                    count.classList.add(
                        firstUnit.team
                    );
                }


                /*
                 * Mark FOB counts.
                 */

                if (
                    isFobHex(r, c)
                ) {

                    count.classList.add(
                        "fob-count"
                    );
                }


                hex.appendChild(
                    count
                );
            }


            /*
             * Show FOB label.
             */

            if (
                isFobHex(r, c)
            ) {

                const team =
                    getFobTeamAt(
                        r,
                        c
                    );


                const label =
                    document.createElement(
                        "div"
                    );


                label.className =
                    `fob-label ${team}`;


                label.textContent =
                    team === "blue"
                        ? "FOB"
                        : "FOB";


                hex.appendChild(
                    label
                );
            }
        }
    }


    /*
     * Re-render selected outline
     * through movement highlighting.
     */

    highlightSelectedUnitHex();
}


/* ============================
   SELECTED HEX VISUAL
============================ */

function highlightSelectedUnitHex() {

    if (!selectedUnit) {
        return;
    }


    const wrapper =
        document.querySelector(
            `.hex-wrapper[data-row="${selectedUnit.r}"][data-col="${selectedUnit.c}"]`
        );


    if (
        wrapper
    ) {

        wrapper.classList.add(
            "selected-hex"
        );
    }
}


/* ============================
   HEX CLICK
============================ */

export function onHexClick(
    r,
    c
) {

    const stack =
        board[r][c] || [];


    /*
     * If a unit is currently selected,
     * clicking a valid movement hex
     * moves the unit.
     */

    if (
        selectedUnit &&
        isValidMove(r, c)
    ) {

        moveSelectedUnit(
            r,
            c
        );

        return;
    }


    /*
     * Clicking the selected hex again
     * cancels selection.
     */

    if (
        selectedUnit &&
        selectedUnit.r === r &&
        selectedUnit.c === c
    ) {

        clearSelection();

        return;
    }


    /*
     * Clicking a hex containing units
     * opens the selection panel.
     */

    if (
        stack.length > 0
    ) {

        const title =
            isFobHex(r, c)
                ? `${getFobTeamAt(r, c).toUpperCase()} FOB`
                : `UNITS AT ${r}, ${c}`;


        openUnitPanel(
            title,
            stack,
            isFobHex(r, c)
                ? "fob"
                : "hex"
        );


        return;
    }


    /*
     * Empty hex with nothing selected.
     */

    clearSelection();
}


/* ============================
   CHECK VALID MOVE
============================ */

function isValidMove(
    r,
    c
) {

    return validMoves.some(
        ([vr, vc]) =>
            vr === r &&
            vc === c
    );
}


/* ============================
   MOVE SELECTED UNIT
============================ */

export async function moveSelectedUnit(
    r,
    c
) {

    if (!selectedUnit) {
        return;
    }


    /*
     * Don't allow overstacking.
     */

    if (
        board[r][c].length >=
        MAX_UNITS_PER_HEX
    ) {

        alert(
            `A hex cannot contain more than ${MAX_UNITS_PER_HEX} units.`
        );

        return;
    }


    const fromR =
        selectedUnit.r;

    const fromC =
        selectedUnit.c;


    const unit =
        selectedUnit.unit;


    const fromStack =
        board[fromR][fromC];


    const unitIndex =
        fromStack.indexOf(
            unit
        );


    if (
        unitIndex === -1
    ) {

        console.error(
            "Selected unit is no longer at its original location."
        );

        clearSelection();

        return;
    }


    /*
     * Build server move before
     * changing the board.
     */

    const movePayload = {

        from: {
            r: fromR,
            c: fromC
        },

        to: {
            r,
            c
        },

        unit:
            unit.type,

        team:
            unit.team
    };


    /*
     * Move locally.
     */

    fromStack.splice(
        unitIndex,
        1
    );


    board[r][c].push(
        unit
    );


    /*
     * Clear selection.
     */

    selectedUnit =
        null;

    validMoves =
        [];


    closeUnitPanel();


    /*
     * Update immediately.
     */

    updateBoard();


    /*
     * Send to server.
     */

    try {

        await sendMoveToServer(
            movePayload
        );


        console.log(
            "Move submitted:",
            movePayload
        );

    } catch (error) {

        console.error(
            "Move submission failed:",
            error
        );


        /*
         * Undo local move.
         */

        const destinationStack =
            board[r][c];


        const movedIndex =
            destinationStack.indexOf(
                unit
            );


        if (
            movedIndex !== -1
        ) {

            destinationStack.splice(
                movedIndex,
                1
            );
        }


        fromStack.push(
            unit
        );


        updateBoard();


        alert(
            "The move could not be submitted."
        );
    }
}


/* ============================
   CLEAR SELECTION
============================ */

export function clearSelection() {

    selectedUnit =
        null;

    validMoves =
        [];


    closeUnitPanel();


    updateBoard();
}
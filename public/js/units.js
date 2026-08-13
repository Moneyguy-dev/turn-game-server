import {
    board,
    rows,
    cols,
    gameBoard
} from "./grid.js";

import {
    getValidMoves,
    isFobHex,
    getFobTeamAt
} from "./fob.js";

import {
    sendMoveToServer
} from "./server.js";


/* =========================================================
   SELECTION STATE
========================================================= */

export let selectedUnit = null;

export let validMoves = [];


/* =========================================================
   UNIT LIMIT
========================================================= */

export const MAX_UNITS_PER_HEX = 4;


/* =========================================================
   INITIALIZE
========================================================= */

export function initUnits() {

    ensureUnitPanel();

    updateBoard();
}


/* =========================================================
   CREATE / REPAIR UNIT PANEL
========================================================= */

/*
 * This makes the system work even if the HTML only contains:
 *
 * <div id="unitPanel">
 *     <div id="unitList"></div>
 * </div>
 *
 * The header and title are created automatically.
 */

function ensureUnitPanel() {

    const panel =
        document.getElementById("unitPanel");

    if (!panel) {
        console.error(
            "unitPanel was not found."
        );

        return null;
    }


    let header =
        document.getElementById(
            "unitPanelHeader"
        );


    if (!header) {

        header =
            document.createElement("div");

        header.id =
            "unitPanelHeader";

        panel.insertBefore(
            header,
            panel.firstChild
        );
    }


    let title =
        document.getElementById(
            "unitPanelTitle"
        );


    if (!title) {

        title =
            document.createElement("h3");

        title.id =
            "unitPanelTitle";

        title.textContent =
            "Units";

        header.appendChild(
            title
        );
    }


    let closeButton =
        document.getElementById(
            "unitPanelClose"
        );


    if (!closeButton) {

        closeButton =
            document.createElement("button");

        closeButton.id =
            "unitPanelClose";

        closeButton.type =
            "button";

        closeButton.textContent =
            "×";

        closeButton.className =
            "menuBtn";

        closeButton.style.padding =
            "4px 10px";

        closeButton.addEventListener(
            "click",
            () => {
                closeUnitPanel();
            }
        );

        header.appendChild(
            closeButton
        );
    }


    let list =
        document.getElementById(
            "unitList"
        );


    if (!list) {

        list =
            document.createElement("div");

        list.id =
            "unitList";

        panel.appendChild(
            list
        );
    }


    return panel;
}


/* =========================================================
   PANEL ELEMENTS
========================================================= */

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


/* =========================================================
   OPEN UNIT PANEL
========================================================= */

export function openUnitPanel(
    title,
    units,
    mode = "hex"
) {

    ensureUnitPanel();


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
            "Unit panel elements could not be created."
        );

        return;
    }


    titleElement.textContent =
        title;


    list.innerHTML = "";


    /*
     * No units.
     */

    if (
        !units ||
        units.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "unitPanelEmpty";

        empty.textContent =
            "No units available.";

        list.appendChild(
            empty
        );

    } else {

        /*
         * Create one button for each unit.
         */

        units.forEach(
            (unit) => {

                const button =
                    document.createElement("button");

                button.type =
                    "button";

                button.className =
                    `panel-unit ${unit.team || ""}`;


                /*
                 * Unit name.
                 */

                const name =
                    document.createElement("span");

                name.textContent =
                    unit.type ||
                    "Unknown Unit";


                /*
                 * Movement information.
                 */

                const info =
                    document.createElement("span");

                info.className =
                    "panel-unit-move";

                info.textContent =
                    `Move ${unit.move ?? 0}`;


                button.appendChild(
                    name
                );

                button.appendChild(
                    info
                );


                /*
                 * Selected unit styling.
                 */

                if (
                    selectedUnit &&
                    selectedUnit.unit === unit
                ) {

                    button.classList.add(
                        "selected"
                    );
                }


                /*
                 * Click this specific unit.
                 */

                button.addEventListener(
                    "click",
                    () => {

                        selectUnitFromPanel(
                            unit,
                            mode
                        );
                    }
                );


                list.appendChild(
                    button
                );
            }
        );
    }


    /*
     * Open panel.
     */

    panel.classList.add(
        "open"
    );
}


/* =========================================================
   CLOSE UNIT PANEL
========================================================= */

export function closeUnitPanel() {

    const panel =
        getPanel();


    if (panel) {

        panel.classList.remove(
            "open"
        );
    }
}


/* =========================================================
   SELECT UNIT FROM PANEL
========================================================= */

function selectUnitFromPanel(
    unit,
    mode
) {

    let location =
        null;


    /*
     * Search the complete board
     * for the selected unit.
     */

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

            const stack =
                board[r][c] || [];


            if (
                stack.includes(unit)
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


    /*
     * Unit wasn't found.
     */

    if (!location) {

        console.error(
            "Could not find selected unit on board.",
            unit
        );

        return;
    }


    /*
     * Store selection.
     */

    selectedUnit = {

        r:
            location.r,

        c:
            location.c,

        unit,

        fromFob:
            isFobHex(
                location.r,
                location.c
            )
    };


    /*
     * Calculate legal movement.
     */

    validMoves =
        getValidMoves(
            location.r,
            location.c,
            unit.move || 0
        );


    /*
     * Close panel.
     */

    closeUnitPanel();


    /*
     * Redraw board.
     */

    updateBoard();


    console.log(
        "Selected unit:",
        unit.type,
        "at",
        location,
        "valid moves:",
        validMoves
    );
}


/* =========================================================
   UPDATE BOARD
========================================================= */

export function updateBoard() {

    if (!gameBoard) {
        return;
    }


    const wrappers =
        gameBoard.querySelectorAll(
            ".hex-wrapper"
        );


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
             * Remove previous selected state.
             */

            wrapper.classList.remove(
                "selected-hex"
            );


            /*
             * Clear previous visual contents.
             */

            hex.innerHTML = "";


            /*
             * Default background.
             */

            hex.style.background =
                "#333";


            /*
             * Highlight legal movement hexes.
             */

            if (
                isValidMove(r, c)
            ) {

                hex.style.background =
                    "#555";
            }


            /*
             * Make the whole hex clickable.
             */

            wrapper.onclick =
                () => {

                    onHexClick(
                        r,
                        c
                    );
                };


            /*
             * Get units at this location.
             */

            const stack =
                board[r][c] || [];


            /*
             * IMPORTANT:
             *
             * We do NOT render individual units.
             *
             * We only render a number showing
             * how many units are there.
             */

            if (
                stack.length > 0
            ) {

                const count =
                    document.createElement(
                        "div"
                    );


                count.className =
                    "unit-count";


                count.textContent =
                    stack.length;


                /*
                 * Determine indicator color.
                 *
                 * If everyone is the same team,
                 * use that team's color.
                 *
                 * If mixed teams are present,
                 * use neutral gray.
                 */

                const teams =
                    [
                        ...new Set(
                            stack
                                .map(
                                    unit =>
                                        unit.team
                                )
                                .filter(Boolean)
                        )
                    ];


                if (
                    teams.length === 1
                ) {

                    count.classList.add(
                        teams[0]
                    );

                } else if (
                    teams.length > 1
                ) {

                    count.classList.add(
                        "mixed"
                    );
                }


                /*
                 * FOB indicator.
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
             * FOB label.
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
                    `fob-label ${team || ""}`;


                label.textContent =
                    "FOB";


                hex.appendChild(
                    label
                );
            }
        }
    }


    /*
     * Restore selected hex.
     */

    highlightSelectedUnitHex();
}


/* =========================================================
   CHECK VALID MOVE
========================================================= */

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


/* =========================================================
   SELECTED HEX VISUAL
========================================================= */

function highlightSelectedUnitHex() {

    if (!selectedUnit) {
        return;
    }


    const wrapper =
        document.querySelector(
            `.hex-wrapper[data-row="${selectedUnit.r}"][data-col="${selectedUnit.c}"]`
        );


    if (wrapper) {

        wrapper.classList.add(
            "selected-hex"
        );
    }
}


/* =========================================================
   HEX CLICK
========================================================= */

export function onHexClick(
    r,
    c
) {

    const stack =
        board[r][c] || [];


    /*
     * -------------------------------------------------------
     * A UNIT IS ALREADY SELECTED
     * -------------------------------------------------------
     */

    if (selectedUnit) {

        /*
         * Clicking a valid destination
         * moves the selected unit.
         */

        if (
            isValidMove(r, c)
        ) {

            moveSelectedUnit(
                r,
                c
            );

            return;
        }


        /*
         * Clicking the selected hex
         * cancels selection.
         */

        if (
            selectedUnit.r === r &&
            selectedUnit.c === c
        ) {

            clearSelection();

            return;
        }


        /*
         * Clicking another occupied hex
         * opens that hex's unit panel.
         */

        if (
            stack.length > 0
        ) {

            clearSelection();


            const title =
                isFobHex(r, c)
                    ? `${String(
                        getFobTeamAt(r, c) || ""
                      ).toUpperCase()} FOB`
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
         * Clicking another empty hex
         * cancels the selection.
         */

        clearSelection();

        return;
    }


    /*
     * -------------------------------------------------------
     * NO UNIT IS SELECTED
     * -------------------------------------------------------
     */


    /*
     * Clicking an occupied hex opens the
     * unit selection panel.
     */

    if (
        stack.length > 0
    ) {

        const title =
            isFobHex(r, c)
                ? `${String(
                    getFobTeamAt(r, c) || ""
                  ).toUpperCase()} FOB`
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
     * Empty hex.
     */

    clearSelection();
}


/* =========================================================
   MOVE SELECTED UNIT
========================================================= */

export async function moveSelectedUnit(
    r,
    c
) {

    if (!selectedUnit) {
        return;
    }


    /*
     * Make sure destination exists.
     */

    if (
        !board[r] ||
        !board[r][c]
    ) {

        console.error(
            "Invalid destination:",
            r,
            c
        );

        return;
    }


    /*
     * Make sure destination is legal.
     */

    if (
        !isValidMove(r, c)
    ) {

        console.warn(
            "Attempted illegal move:",
            r,
            c
        );

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


    const destinationStack =
        board[r][c];


    /*
     * Find exact unit.
     */

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
     * Build server payload.
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
     * -------------------------------------------------------
     * MOVE LOCALLY
     * -------------------------------------------------------
     */

    fromStack.splice(
        unitIndex,
        1
    );


    destinationStack.push(
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
     * Immediately redraw.
     */

    updateBoard();


    /*
     * -------------------------------------------------------
     * SEND TO SERVER
     * -------------------------------------------------------
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
         * ---------------------------------------------------
         * ROLLBACK
         * ---------------------------------------------------
         */

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


        fromStack.splice(
            unitIndex,
            0,
            unit
        );


        updateBoard();


        alert(
            "The move could not be submitted. The unit was returned to its original hex."
        );
    }
}


/* =========================================================
   CLEAR SELECTION
========================================================= */

export function clearSelection() {

    selectedUnit =
        null;

    validMoves =
        [];


    closeUnitPanel();


    updateBoard();
}
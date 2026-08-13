// ============================================================
// UNIT SYSTEM
// ============================================================

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


// ============================================================
// SELECTION STATE
// ============================================================

export let selectedUnit = null;

export let validMoves = [];

export const MAX_UNITS_PER_HEX = 4;


// ============================================================
// INITIALIZE
// ============================================================

export function initUnits() {

    ensureUnitPanel();

    updateBoard();
}


// ============================================================
// CREATE PANEL IF NEEDED
// ============================================================

function ensureUnitPanel() {

    const panel =
        document.getElementById(
            "unitPanel"
        );


    if (!panel) {

        console.error(
            "UNIT ERROR: #unitPanel was not found."
        );

        return null;
    }


    let header =
        document.getElementById(
            "unitPanelHeader"
        );


    if (!header) {

        header =
            document.createElement(
                "div"
            );

        header.id =
            "unitPanelHeader";

        panel.prepend(
            header
        );
    }


    let title =
        document.getElementById(
            "unitPanelTitle"
        );


    if (!title) {

        title =
            document.createElement(
                "h3"
            );

        title.id =
            "unitPanelTitle";

        title.textContent =
            "Units";

        header.appendChild(
            title
        );
    }


    let close =
        document.getElementById(
            "unitPanelClose"
        );


    if (!close) {

        close =
            document.createElement(
                "button"
            );

        close.id =
            "unitPanelClose";

        close.type =
            "button";

        close.className =
            "panel-close";

        close.textContent =
            "×";

        close.addEventListener(
            "click",
            closeUnitPanel
        );

        header.appendChild(
            close
        );
    }


    let list =
        document.getElementById(
            "unitList"
        );


    if (!list) {

        list =
            document.createElement(
                "div"
            );

        list.id =
            "unitList";

        panel.appendChild(
            list
        );
    }


    return panel;
}


// ============================================================
// OPEN PANEL
// ============================================================

export function openUnitPanel(
    title,
    units,
    mode = "hex"
) {

    ensureUnitPanel();


    const panel =
        document.getElementById(
            "unitPanel"
        );

    const titleElement =
        document.getElementById(
            "unitPanelTitle"
        );

    const list =
        document.getElementById(
            "unitList"
        );


    if (
        !panel ||
        !titleElement ||
        !list
    ) {

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
            "No units.";

        list.appendChild(
            empty
        );

    } else {

        units.forEach(
            unit => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";

                button.className =
                    `panel-unit ${unit.team || ""}`;


                const name =
                    document.createElement(
                        "span"
                    );

                name.className =
                    "panel-unit-name";

                name.textContent =
                    unit.type ||
                    "Unknown Unit";


                const movement =
                    document.createElement(
                        "span"
                    );

                movement.className =
                    "panel-unit-move";

                movement.textContent =
                    `Move ${unit.move ?? 0}`;


                button.appendChild(
                    name
                );

                button.appendChild(
                    movement
                );


                if (
                    selectedUnit &&
                    selectedUnit.unit === unit
                ) {

                    button.classList.add(
                        "selected"
                    );
                }


                button.addEventListener(
                    "click",
                    () => {

                        selectUnitFromPanel(
                            unit
                        );
                    }
                );


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


// ============================================================
// CLOSE PANEL
// ============================================================

export function closeUnitPanel() {

    const panel =
        document.getElementById(
            "unitPanel"
        );


    if (panel) {

        panel.classList.remove(
            "open"
        );
    }
}


// ============================================================
// SELECT UNIT FROM PANEL
// ============================================================

function selectUnitFromPanel(
    unit
) {

    let location =
        null;


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


    if (!location) {

        console.error(
            "Could not locate unit.",
            unit
        );

        return;
    }


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


    validMoves =
        getValidMoves(
            location.r,
            location.c,
            unit.move || 0
        );


    closeUnitPanel();

    updateBoard();
}


// ============================================================
// UPDATE BOARD
// ============================================================

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


            wrapper.classList.remove(
                "selected-hex"
            );


            hex.innerHTML = "";

            hex.style.background =
                "#333";


            /*
             * Valid movement locations.
             */

            if (
                isValidMove(r, c)
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
             * Units at this hex.
             */

            const stack =
                board[r][c] || [];


            /*
             * Do NOT render the pieces.
             *
             * Only render a count.
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


    highlightSelectedUnitHex();
}


// ============================================================
// CHECK VALID MOVE
// ============================================================

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


// ============================================================
// HEX CLICK
// ============================================================

export function onHexClick(
    r,
    c
) {

    const stack =
        board[r][c] || [];


    /*
     * Unit selected.
     */

    if (selectedUnit) {

        /*
         * Valid destination.
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
         * Click selected hex
         * to cancel.
         */

        if (
            selectedUnit.r === r &&
            selectedUnit.c === c
        ) {

            clearSelection();

            return;
        }


        /*
         * Clicking another occupied
         * hex opens that stack.
         */

        if (
            stack.length > 0
        ) {

            clearSelection();

            openStackPanel(
                r,
                c,
                stack
            );

            return;
        }


        clearSelection();

        return;
    }


    /*
     * No unit selected.
     */

    if (
        stack.length > 0
    ) {

        openStackPanel(
            r,
            c,
            stack
        );

        return;
    }


    clearSelection();
}


// ============================================================
// OPEN STACK PANEL
// ============================================================

function openStackPanel(
    r,
    c,
    stack
) {

    let title;


    if (
        isFobHex(r, c)
    ) {

        const team =
            getFobTeamAt(
                r,
                c
            );


        title =
            `${String(
                team || ""
            ).toUpperCase()} FOB`;

    } else {

        title =
            `UNITS AT ${r}, ${c}`;
    }


    openUnitPanel(
        title,
        stack,
        isFobHex(r, c)
            ? "fob"
            : "hex"
    );
}


// ============================================================
// SELECTED HEX
// ============================================================

function highlightSelectedUnitHex() {

    if (!selectedUnit) {
        return;
    }


    const wrapper =
        gameBoard.querySelector(
            `.hex-wrapper[data-row="${selectedUnit.r}"][data-col="${selectedUnit.c}"]`
        );


    if (wrapper) {

        wrapper.classList.add(
            "selected-hex"
        );
    }
}


// ============================================================
// MOVE UNIT
// ============================================================

export async function moveSelectedUnit(
    r,
    c
) {

    if (!selectedUnit) {
        return;
    }


    if (!isValidMove(r, c)) {

        console.warn(
            "Illegal move."
        );

        return;
    }


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


    const unitIndex =
        fromStack.indexOf(
            unit
        );


    if (
        unitIndex === -1
    ) {

        console.error(
            "Selected unit no longer exists."
        );

        clearSelection();

        return;
    }


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
     * Move locally first.
     */

    fromStack.splice(
        unitIndex,
        1
    );


    destinationStack.push(
        unit
    );


    selectedUnit =
        null;

    validMoves =
        [];


    closeUnitPanel();

    updateBoard();


    /*
     * Send to server.
     */

    try {

        await sendMoveToServer(
            movePayload
        );

    } catch (error) {

        console.error(
            "Move failed:",
            error
        );


        /*
         * Roll back.
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
            "The move could not be submitted."
        );
    }
}


// ============================================================
// CLEAR SELECTION
// ============================================================

export function clearSelection() {

    selectedUnit =
        null;

    validMoves =
        [];


    closeUnitPanel();

    updateBoard();
}
import {
    board,
    rows,
    cols,
    gameBoard
} from "./grid.js";

import {
    getValidMoves
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
   INITIALIZE UNITS
============================ */

export function initUnits() {

    updateBoard();
}


/* ============================
   CHECK IF HEX IS VALID MOVE
============================ */

function isValidMove(r, c) {

    return validMoves.some(
        ([vr, vc]) =>
            vr === r &&
            vc === c
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

    let i = 0;


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
                wrappers[i++];


            if (!wrapper) {
                continue;
            }


            const hex =
                wrapper.querySelector(".hex");


            if (!hex) {
                continue;
            }


            /* ============================
               CLEAR HEX
            ============================ */

            hex.innerHTML = "";

            hex.style.background =
                "#333";


            /* ============================
               VALID MOVE HIGHLIGHT
            ============================ */

            if (
                isValidMove(r, c)
            ) {

                hex.style.background =
                    "#555";
            }


            /* ============================
               HEX CLICK
            ============================ */

            /*
             * Remove the old listener by
             * replacing the wrapper.
             *
             * Instead, use onclick so that
             * updateBoard can safely replace
             * the current handler.
             */

            wrapper.onclick = () => {

                onHexClick(r, c);
            };


            /* ============================
               UNITS ON HEX
            ============================ */

            const stack =
                board[r][c];


            if (
                stack &&
                stack.length > 0
            ) {

                const wrap =
                    document.createElement(
                        "div"
                    );


                wrap.className =
                    "unit-stack";


                stack.forEach(
                    (u) => {

                        const d =
                            document.createElement(
                                "div"
                            );


                        d.className =
                            `unit ${u.team}`;


                        d.textContent =
                            u.type;


                        /*
                         * Prevent clicking a unit
                         * from also clicking its hex.
                         */

                        d.addEventListener(
                            "click",
                            (e) => {

                                e.stopPropagation();

                                onUnitClick(
                                    r,
                                    c,
                                    u
                                );
                            }
                        );


                        /* ============================
                           SELECTED UNIT OUTLINE
                        ============================ */

                        if (
                            selectedUnit &&
                            selectedUnit.unit === u &&
                            !selectedUnit.fromFob
                        ) {

                            d.style.outline =
                                "2px solid yellow";

                            d.style.outlineOffset =
                                "1px";
                        }


                        wrap.appendChild(d);
                    }
                );


                hex.appendChild(
                    wrap
                );

            } else {

                /*
                 * Only show coordinates when
                 * there is no unit.
                 */

                hex.textContent =
                    `${r},${c}`;
            }
        }
    }
}


/* ============================
   UNIT CLICK
============================ */

export function onUnitClick(
    r,
    c,
    unit
) {

    /*
     * Only allow selecting a unit if
     * the player owns it.
     *
     * Spectators/admin can still be
     * adjusted later if desired.
     */

    selectedUnit = {
        r,
        c,
        unit,
        fromFob: false
    };


    /*
     * Calculate movement range.
     */

    validMoves =
        getValidMoves(
            r,
            c,
            unit.move
        );


    console.log(
        "Selected unit:",
        unit.type
    );

    console.log(
        "Valid moves:",
        validMoves
    );


    updateBoard();
}


/* ============================
   HEX CLICK
============================ */

export async function onHexClick(
    r,
    c
) {

    /*
     * Nothing selected.
     */

    if (!selectedUnit) {
        return;
    }


    /*
     * Clicking the current hex cancels
     * the selection.
     */

    if (
        r === selectedUnit.r &&
        c === selectedUnit.c
    ) {

        clearSelection();

        return;
    }


    /*
     * Make sure destination is allowed.
     */

    if (
        !isValidMove(r, c)
    ) {

        console.log(
            "Invalid movement hex"
        );

        return;
    }


    /*
     * Prevent overstacking.
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


    /*
     * Make sure the unit still exists
     * on its original hex.
     */

    const fromStack =
        board[fromR][fromC];


    const unitIndex =
        fromStack.indexOf(unit);


    if (
        unitIndex === -1
    ) {

        console.error(
            "Selected unit could not be found on the board."
        );

        clearSelection();

        return;
    }


    /* ============================
       MOVE LOCALLY
    ============================ */

    fromStack.splice(
        unitIndex,
        1
    );


    board[r][c].push(
        unit
    );


    /*
     * Save movement payload.
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

        unit: unit.type,

        team: unit.team
    };


    console.log(
        "Move:",
        movePayload
    );


    /*
     * Clear selection before sending.
     */

    clearSelection();


    /*
     * Update the screen immediately.
     */

    updateBoard();


    /* ============================
       SEND MOVE TO SERVER
    ============================ */

    try {

        await sendMoveToServer(
            movePayload
        );

        console.log(
            "Move successfully submitted."
        );

    } catch (error) {

        console.error(
            "Failed to submit move:",
            error
        );


        /*
         * Undo the local move if the
         * server rejected the request.
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
            "The move could not be submitted to the server."
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

    updateBoard();
}
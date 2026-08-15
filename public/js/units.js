// ============================================================
// UNIT SYSTEM
// ============================================================

import {
    board,
    rows,
    cols
} from "./grid.js";

import {
    getValidMoves,
    isFobHex,
    getFobTeamAt
} from "./fob.js";

import {
    sendMoveToServer,
    getUnitId
} from "./server.js";

import {
    unitIsLoading
} from "./armamentSystem.js";


// ============================================================
// SELECTION STATE
// ============================================================

export let selectedUnit = null;

export let validMoves = [];

export const MAX_UNITS_PER_HEX = 4;


// ============================================================
// INDIVIDUAL UNIT DISPLAY
// ============================================================

const INDIVIDUAL_UNIT_VIEW_KEY =
    "turnGameIndividualUnitView";


export let individualUnitView =
    loadIndividualUnitView();


// ============================================================
// LOAD DISPLAY SETTING
// ============================================================

function loadIndividualUnitView() {

    try {

        return (
            localStorage.getItem(
                INDIVIDUAL_UNIT_VIEW_KEY
            ) === "true"
        );

    } catch (error) {

        console.warn(
            "Could not load individual unit view setting:",
            error
        );

        return false;
    }
}


// ============================================================
// APPLY DISPLAY CLASS
// ============================================================

function applyIndividualUnitViewClass() {

    const gameBoard =
        document.getElementById(
            "gameBoard"
        );

    if (!gameBoard) {
        return;
    }

    gameBoard.classList.toggle(
        "individual-unit-view",
        individualUnitView
    );
}


// ============================================================
// SET DISPLAY MODE
// ============================================================

export function setIndividualUnitView(
    enabled
) {

    individualUnitView =
        Boolean(enabled);


    try {

        localStorage.setItem(
            INDIVIDUAL_UNIT_VIEW_KEY,
            String(individualUnitView)
        );

    } catch (error) {

        console.warn(
            "Could not save individual unit view setting:",
            error
        );
    }


    applyIndividualUnitViewClass();

    updateBoard();
}


// ============================================================
// TOGGLE DISPLAY MODE
// ============================================================

export function toggleIndividualUnitView() {

    setIndividualUnitView(
        !individualUnitView
    );
}


// ============================================================
// GET DISPLAY MODE
// ============================================================

export function isIndividualUnitViewEnabled() {

    return individualUnitView;
}


// ============================================================
// INITIALIZE
// ============================================================

export function initUnits() {

    ensureUnitPanel();

    applyIndividualUnitViewClass();

    updateBoard();
}


// ============================================================
// CREATE / PREPARE UNIT PANEL
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

        header.className =
            "sidePanelHeader";

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
                "span"
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
            "closeUnitPanel"
        );


    if (!close) {

        close =
            document.createElement(
                "button"
            );

        close.id =
            "closeUnitPanel";

        close.type =
            "button";

        close.className =
            "panel-close closePanelBtn";

        close.setAttribute(
            "aria-label",
            "Close unit panel"
        );

        close.textContent =
            "×";

        header.appendChild(
            close
        );

    } else {

        close.classList.add(
            "panel-close",
            "closePanelBtn"
        );
    }


    close.onclick =
        closeUnitPanel;


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

    const panel =
        ensureUnitPanel();


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

        console.error(
            "UNIT ERROR: Could not open unit panel."
        );

        return;
    }


    titleElement.textContent =
        title || "Units";


    list.innerHTML =
        "";


    if (
        !Array.isArray(units) ||
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

                if (!unit) {
                    return;
                }


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
                    unitIsLoading(unit)
                ) {

                    button.classList.add(
                        "loading"
                    );


                    movement.textContent =
                        "LOADING";
                }


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

    if (!unit) {
        return;
    }


    let location =
        null;


    for (
        let r = 0;
        r < rows && !location;
        r++
    ) {

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            const stack =
                Array.isArray(board[r]?.[c])
                    ? board[r][c]
                    : [];


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


    // --------------------------------------------------------
    // LOADING UNITS CANNOT SELECT MOVEMENT OPTIONS
    // --------------------------------------------------------

    if (
        unitIsLoading(unit)
    ) {

        validMoves = [];

    } else {

        validMoves =
            getValidMoves(
                location.r,
                location.c,
                Number(unit.move) || 0
            );
    }


    closeUnitPanel();

    updateBoard();
}


// ============================================================
// UPDATE BOARD
// ============================================================

export function updateBoard() {

    const gameBoard =
        document.getElementById(
            "gameBoard"
        );


    if (!gameBoard) {

        console.error(
            "UNIT ERROR: #gameBoard was not found."
        );

        return;
    }


    // --------------------------------------------------------
    // KEEP CSS STATE SYNCHRONIZED WITH JS STATE
    // --------------------------------------------------------

    gameBoard.classList.toggle(
        "individual-unit-view",
        individualUnitView
    );


    const wrappers =
        gameBoard.querySelectorAll(
            ".hex-wrapper"
        );


    let index =
        0;


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


            // ------------------------------------------------
            // REMOVE OLD UNIT VISUALS
            // ------------------------------------------------

            hex.querySelectorAll(
                ".unit-count, .unit-piece, .fob-label"
            ).forEach(
                element => {
                    element.remove();
                }
            );


            // ------------------------------------------------
            // VALID MOVES
            // ------------------------------------------------

            hex.style.background =
                isValidMove(r, c)
                    ? "#555"
                    : "#333";


            // ------------------------------------------------
            // HEX CLICK
            // ------------------------------------------------

            wrapper.onclick =
                () => {

                    onHexClick(
                        r,
                        c
                    );
                };


            // ------------------------------------------------
            // UNITS AT HEX
            // ------------------------------------------------

            const stack =
                Array.isArray(board[r]?.[c])
                    ? board[r][c]
                    : [];


            if (
                stack.length > 0
            ) {

                if (
                    individualUnitView
                ) {

                    renderIndividualUnitPieces(
                        hex,
                        stack
                    );

                } else {

                    renderStackCount(
                        hex,
                        stack,
                        r,
                        c
                    );
                }
            }


            // ------------------------------------------------
            // FOB LABEL
            // ------------------------------------------------

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
// RENDER NORMAL STACK COUNT
// ============================================================

function renderStackCount(
    hex,
    stack,
    r,
    c
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
                            unit?.team
                    )
                    .filter(
                        Boolean
                    )
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


// ============================================================
// RENDER INDIVIDUAL UNIT PIECES
// ============================================================
//
// Maximum stack is four units.
//
// Positions:
//
//                 TOP
//
//             [ UNIT ]
//
//        [ UNIT ] HEX [ UNIT ]
//
//             [ UNIT ]
//
// ============================================================

function renderIndividualUnitPieces(
    hex,
    stack
) {

    const positions = [
        "top",
        "left",
        "right",
        "bottom"
    ];


    stack
        .slice(
            0,
            MAX_UNITS_PER_HEX
        )
        .forEach(
            (unit, index) => {

                if (!unit) {
                    return;
                }


                const piece =
                    document.createElement(
                        "div"
                    );


                piece.className =
                    "unit-piece";


                const team =
                    unit.team ||
                    "neutral";


                piece.classList.add(
                    team
                );


                piece.classList.add(
                    `unit-piece-${positions[index] || "bottom"}`
                );


                // ------------------------------------------------
                // UNIT NAME
                // ------------------------------------------------

                piece.textContent =
                    unit.type ||
                    "UNIT";


                piece.title =
                    unit.type ||
                    "Unknown Unit";


                piece.setAttribute(
                    "aria-label",
                    unit.type ||
                    "Unknown Unit"
                );


                // ------------------------------------------------
                // LOADING STATE
                // ------------------------------------------------

                if (
                    unitIsLoading(unit)
                ) {

                    piece.classList.add(
                        "loading"
                    );
                }


                // ------------------------------------------------
                // SELECTED UNIT
                // ------------------------------------------------

                if (
                    selectedUnit &&
                    selectedUnit.unit === unit
                ) {

                    piece.classList.add(
                        "selected"
                    );
                }


                hex.appendChild(
                    piece
                );
            }
        );
}


// ============================================================
// CHECK VALID MOVE
// ============================================================

function isValidMove(
    r,
    c
) {

    return validMoves.some(
        move => {

            if (
                !Array.isArray(move) ||
                move.length < 2
            ) {

                return false;
            }


            return (
                move[0] === r &&
                move[1] === c
            );
        }
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
        Array.isArray(board[r]?.[c])
            ? board[r][c]
            : [];


    if (selectedUnit) {

        if (
            isValidMove(r, c)
        ) {

            moveSelectedUnit(
                r,
                c
            );

            return;
        }


        if (
            selectedUnit.r === r &&
            selectedUnit.c === c
        ) {

            clearSelection();

            return;
        }


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


    const gameBoard =
        document.getElementById(
            "gameBoard"
        );


    if (!gameBoard) {
        return;
    }


    const wrappers =
        gameBoard.querySelectorAll(
            ".hex-wrapper"
        );


    let wrapper =
        null;


    for (
        const candidate of wrappers
    ) {

        if (
            Number(
                candidate.dataset.row
            ) === selectedUnit.r &&
            Number(
                candidate.dataset.col
            ) === selectedUnit.c
        ) {

            wrapper =
                candidate;

            break;
        }
    }


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


    const unit =
        selectedUnit.unit;


    if (!unit) {

        clearSelection();

        return;
    }


    // ========================================================
    // LOADING UNITS CANNOT MOVE
    // ========================================================

    if (
        unitIsLoading(unit)
    ) {

        alert(
            `${unit.type || "This unit"} is loading an armament and cannot move this round.`
        );


        clearSelection();

        return;
    }


    if (!isValidMove(r, c)) {

        console.warn(
            "Illegal move."
        );

        return;
    }


    const destinationStack =
        Array.isArray(board[r]?.[c])
            ? board[r][c]
            : null;


    if (!destinationStack) {

        console.error(
            "Destination hex does not contain a valid unit stack.",
            r,
            c
        );

        return;
    }


    if (
        destinationStack.length >=
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


    const fromStack =
        Array.isArray(board[fromR]?.[fromC])
            ? board[fromR][fromC]
            : null;


    if (!fromStack) {

        console.error(
            "Source hex does not contain a valid unit stack."
        );


        clearSelection();

        return;
    }


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


    // ========================================================
    // UNIT ID
    // ========================================================

    const unitId =
        getUnitId(
            unit
        );


    if (!unitId) {

        alert(
            "This unit does not have a valid unit ID and cannot be moved."
        );


        console.error(
            "Move blocked because unit has no ID:",
            unit
        );


        return;
    }


    // ========================================================
    // MOVE PAYLOAD
    // ========================================================

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
            unit.team,

        unitId
    };


    // ========================================================
    // LOCAL MOVE
    // ========================================================

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


    // ========================================================
    // SERVER MOVE
    // ========================================================

    try {

        await sendMoveToServer(
            movePayload
        );


    } catch (error) {

        console.error(
            "Move failed:",
            error
        );


        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

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
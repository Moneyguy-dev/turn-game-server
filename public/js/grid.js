// ============================================================
// GRID + HEX RENDER ENGINE
// ============================================================

export let rows = 17;
export let cols = 19;

export let hexSize = 40;
export let horizontalSpacing = 30;
export let verticalSpacing = 34.64;

export let gameBoard = null;
export let board = [];


// ============================================================
// FOB / START LOCATIONS
// ============================================================

export const startHexes = {

    blue: {
        r: 15,
        c: 15
    },

    red: {
        r: 3,
        c: 10
    }

};


// ============================================================
// INITIALIZE GRID
// ============================================================

export function initGrid() {

    gameBoard =
        document.getElementById("gameBoard");

    if (!gameBoard) {

        console.error(
            "GRID ERROR: #gameBoard was not found."
        );

        return false;
    }

    computeHexSize();

    buildHexGrid();

    initBoard();

    renderTerritories();

    return true;
}


// ============================================================
// CALCULATE HEX SIZE
// ============================================================

export function computeHexSize() {

    if (!gameBoard) {

        gameBoard =
            document.getElementById("gameBoard");
    }

    const mapContainer =
        document.getElementById("mapContainer");


    let availableWidth =
        window.innerWidth;

    let availableHeight =
        window.innerHeight;


    /*
     * Prefer the actual map container.
     * This prevents the grid from becoming
     * too large or too small because of the
     * browser window dimensions.
     */

    if (mapContainer) {

        const rect =
            mapContainer.getBoundingClientRect();

        if (rect.width > 0) {

            availableWidth =
                rect.width - 20;
        }

        if (rect.height > 0) {

            availableHeight =
                rect.height - 20;
        }
    }


    /*
     * Hex dimensions.
     *
     * Flat-top hex:
     *
     * width  = hexSize
     * height = hexSize * sqrt(3) / 2
     */

    const hexHeightRatio =
        Math.sqrt(3) / 2;


    /*
     * Total horizontal board size.
     */

    const requiredWidthUnits =
        ((cols - 1) * 0.75) + 1;


    /*
     * Total vertical board size.
     *
     * Odd columns are shifted down
     * by half a hex height.
     */

    const requiredHeightUnits =
        (rows - 1) +
        0.5 +
        hexHeightRatio;


    const widthSize =
        availableWidth /
        requiredWidthUnits;


    const heightSize =
        availableHeight /
        requiredHeightUnits;


    hexSize =
        Math.floor(
            Math.min(
                widthSize,
                heightSize
            )
        );


    /*
     * Prevent extremely tiny hexes.
     */

    hexSize =
        Math.max(
            hexSize,
            20
        );


    horizontalSpacing =
        hexSize * 0.75;


    verticalSpacing =
        hexSize *
        hexHeightRatio;
}


// ============================================================
// BUILD HEX GRID
// ============================================================

export function buildHexGrid() {

    if (!gameBoard) {

        gameBoard =
            document.getElementById("gameBoard");
    }


    if (!gameBoard) {

        console.error(
            "GRID ERROR: Cannot build grid because #gameBoard is missing."
        );

        return;
    }


    /*
     * Clear only the visual grid.
     *
     * IMPORTANT:
     * Do NOT call initBoard() here.
     *
     * Rebuilding the visual grid should not
     * erase the units currently on the board.
     */

    gameBoard.innerHTML = "";


    const hexHeight =
        hexSize *
        (Math.sqrt(3) / 2);


    /*
     * Calculate total board dimensions.
     */

    const boardWidth =
        ((cols - 1) *
            horizontalSpacing) +
        hexSize;


    const boardHeight =
        ((rows - 1) *
            verticalSpacing) +
        (verticalSpacing / 2) +
        hexHeight;


    gameBoard.style.position =
        "relative";


    gameBoard.style.width =
        `${boardWidth}px`;


    gameBoard.style.height =
        `${boardHeight}px`;


    /*
     * Create every hex.
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

            const wrapper =
                document.createElement("div");


            wrapper.className =
                "hex-wrapper";


            wrapper.dataset.row =
                String(r);


            wrapper.dataset.col =
                String(c);


            /*
             * Create actual hex.
             */

            const hex =
                document.createElement("div");


            hex.className =
                "hex";


            hex.id =
                `hex-${r}-${c}`;


            /*
             * Horizontal position.
             */

            const x =
                c *
                horizontalSpacing;


            /*
             * Vertical position.
             */

            let y =
                r *
                verticalSpacing;


            /*
             * Offset every odd column.
             */

            if (
                c % 2 !== 0
            ) {

                y +=
                    verticalSpacing / 2;
            }


            /*
             * Wrapper positioning.
             */

            wrapper.style.position =
                "absolute";


            wrapper.style.left =
                `${x}px`;


            wrapper.style.top =
                `${y}px`;


            wrapper.style.width =
                `${hexSize}px`;


            wrapper.style.height =
                `${hexHeight}px`;


            /*
             * Hex dimensions.
             */

            hex.style.width =
                "100%";


            hex.style.height =
                "100%";


            /*
             * Store coordinates directly
             * on the hex as well.
             */

            hex.dataset.row =
                String(r);


            hex.dataset.col =
                String(c);


            /*
             * Put hex inside wrapper.
             */

            wrapper.appendChild(
                hex
            );


            /*
             * Put wrapper on board.
             */

            gameBoard.appendChild(
                wrapper
            );
        }
    }


    /*
     * Reapply territory markings after
     * rebuilding the visual grid.
     */

    renderTerritories();
}


// ============================================================
// INITIALIZE BOARD DATA
// ============================================================

export function initBoard() {

    board = [];


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        board[r] = [];


        for (
            let c = 0;
            c < cols;
            c++
        ) {

            /*
             * Every hex contains an array.
             *
             * Example:
             *
             * board[5][7] = [
             *     unit1,
             *     unit2
             * ];
             */

            board[r][c] = [];
        }
    }
}


// ============================================================
// REBUILD GRID
// ============================================================

export function rebuildGrid() {

    /*
     * IMPORTANT:
     * Do not initialize the board here.
     *
     * This function only rebuilds the visual
     * hex grid.
     */

    computeHexSize();

    buildHexGrid();
}


// ============================================================
// GET HEX WRAPPER
// ============================================================

export function getHexWrapper(
    r,
    c
) {

    if (!gameBoard) {
        return null;
    }


    return gameBoard.querySelector(
        `.hex-wrapper[data-row="${r}"][data-col="${c}"]`
    );
}


// ============================================================
// GET HEX ELEMENT
// ============================================================

export function getHex(
    r,
    c
) {

    const wrapper =
        getHexWrapper(
            r,
            c
        );


    if (!wrapper) {
        return null;
    }


    return wrapper.querySelector(
        ".hex"
    );
}


// ============================================================
// TERRITORIES
// ============================================================

export const territories = {

    /*
     * BLUE
     */

    natuna: [

        {
            r: 14,
            c: 2
        }

    ],


    /*
     * BLUE
     */

    palawan: [

        {
            r: 11,
            c: 8
        },

        {
            r: 10,
            c: 9
        },

        {
            r: 10,
            c: 10
        }

    ],


    /*
     * RED
     */

    taiwan: [

        {
            r: 2,
            c: 10
        },

        {
            r: 3,
            c: 10
        },

        {
            r: 1,
            c: 11
        },

        {
            r: 2,
            c: 11
        }

    ],


    /*
     * RED
     */

    redsingle: [

        {
            r: 6,
            c: 5
        }

    ],


    /*
     * BLUE
     */

    bluesingle: [

        {
            r: 11,
            c: 12
        },

        {
            r: 10,
            c: 13
        },

        {
            r: 10,
            c: 14
        },

        {
            r: 15,
            c: 15
        },

        {
            r: 16,
            c: 16
        }

    ]

};


// ============================================================
// RENDER TERRITORIES
// ============================================================

export function renderTerritories() {

    if (!gameBoard) {
        return;
    }


    /*
     * Remove old territory classes first.
     *
     * This is important when the grid is rebuilt.
     */

    const wrappers =
        gameBoard.querySelectorAll(
            ".hex-wrapper"
        );


    wrappers.forEach(
        wrapper => {

            wrapper.classList.forEach(
                className => {

                    if (
                        className.startsWith(
                            "territory-"
                        )
                    ) {

                        wrapper.classList.remove(
                            className
                        );
                    }
                }
            );
        }
    );


    /*
     * Add territory classes.
     */

    Object.entries(
        territories
    ).forEach(
        ([name, hexes]) => {

            hexes.forEach(
                ({ r, c }) => {

                    const wrapper =
                        getHexWrapper(
                            r,
                            c
                        );


                    if (
                        wrapper
                    ) {

                        wrapper.classList.add(
                            `territory-${name}`
                        );
                    }
                }
            );
        }
    );
}


// ============================================================
// WINDOW RESIZE
// ============================================================

let resizeTimer = null;


window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );


        resizeTimer =
            setTimeout(
                () => {

                    /*
                     * Recalculate the hex size
                     * and rebuild only the visual
                     * grid.
                     *
                     * The board array is preserved.
                     */

                    rebuildGrid();


                    /*
                     * If units.js is loaded,
                     * ask it to redraw the units
                     * and selection indicators.
                     */

                    if (
                        typeof window.updateBoard === "function"
                    ) {

                        window.updateBoard();
                    }

                },
                150
            );
    }
);
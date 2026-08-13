// GRID + RENDER ENGINE

export let rows = 17;
export let cols = 19;

export let hexSize = 40;
export let horizontalSpacing = 30;
export let verticalSpacing = 34.64;

export let gameBoard = null;
export let board = [];


/* ============================
   INITIALIZE GRID
============================ */

export function initGrid() {

    gameBoard =
        document.getElementById("gameBoard");

    if (!gameBoard) {

        console.error(
            "Could not find #gameBoard"
        );

        return;
    }

    computeHexSize();

    buildHexGrid();

    initBoard();
}


/* ============================
   HEX SIZE CALCULATION
============================ */

export function computeHexSize() {

    const w =
        window.innerWidth;

    const h =
        window.innerHeight;


    /*
     * Hex geometry:
     *
     * Width  = hexSize
     * Height = hexSize * sqrt(3) / 2
     *
     * Columns overlap horizontally by 25%.
     * Rows are separated by the hex height.
     */


    const hexHeightRatio =
        Math.sqrt(3) / 2;


    /*
     * Calculate how much space the
     * entire grid requires.
     */

    const requiredWidthUnits =
        (cols - 1) * 0.75 + 1;


    const requiredHeightUnits =
        (rows - 1) +
        0.5 +
        hexHeightRatio;


    /*
     * Leave some room around the map.
     */

    const availableWidth =
        w * 0.90;

    const availableHeight =
        h * 0.90;


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
     * Prevent extremely small hexes.
     */

    hexSize =
        Math.max(
            hexSize,
            20
        );


    horizontalSpacing =
        hexSize * 0.75;


    verticalSpacing =
        hexSize * hexHeightRatio;
}


/* ============================
   BUILD HEX GRID
============================ */

export function buildHexGrid() {

    if (!gameBoard) {
        return;
    }


    /*
     * Remove old hexes.
     */

    gameBoard.innerHTML = "";


    /*
     * Calculate the actual dimensions
     * of one hex.
     */

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


    /*
     * Give the board a real size.
     */

    gameBoard.style.width =
        `${boardWidth}px`;

    gameBoard.style.height =
        `${boardHeight}px`;


    gameBoard.style.position =
        "relative";


    /*
     * Build every hex.
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

            /*
             * HEX WRAPPER
             */

            const wrapper =
                document.createElement("div");


            wrapper.className =
                "hex-wrapper";


            /*
             * Store coordinates.
             */

            wrapper.dataset.row =
                r;

            wrapper.dataset.col =
                c;


            /*
             * HEX
             */

            const hex =
                document.createElement("div");


            hex.className =
                "hex";


            hex.id =
                `hex-${r}-${c}`;


            /*
             * Position the column.
             */

            const x =
                c * horizontalSpacing;


            /*
             * Position the row.
             */

            let y =
                r * verticalSpacing;


            /*
             * Odd columns are shifted
             * downward by half a hex.
             */

            if (c % 2 !== 0) {

                y +=
                    verticalSpacing / 2;
            }


            /*
             * Wrapper position.
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


            hex.style.boxSizing =
                "border-box";


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
}


/* ============================
   INIT BOARD DATA
============================ */

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

            board[r][c] = [];
        }
    }
}


/* ============================
   REBUILD GRID
============================ */

export function rebuildGrid() {

    computeHexSize();

    buildHexGrid();
}


/* ============================
   TERRITORY DEFINITIONS
============================ */

export const territories = {

    /*
     * Blue territory
     */

    natuna: [
        {
            r: 14,
            c: 2
        }
    ],


    /*
     * Blue territory
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
     * Red territory
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
     * Red territory
     */

    redsingle: [
        {
            r: 6,
            c: 5
        }
    ],


    /*
     * Blue territory / Blue FOB area
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


/* ============================
   TERRITORY RENDERER
============================ */

export function renderTerritories() {

    Object.entries(
        territories
    ).forEach(
        ([name, hexes]) => {

            hexes.forEach(
                ({ r, c }) => {

                    const wrapper =
                        document.querySelector(
                            `.hex-wrapper[data-row="${r}"][data-col="${c}"]`
                        );


                    if (wrapper) {

                        wrapper.classList.add(
                            `territory-${name}`
                        );
                    }
                }
            );
        }
    );
}
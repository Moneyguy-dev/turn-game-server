// GRID + RENDER ENGINE

export let rows = 17;
export let cols = 19;

export let hexSize = 40;
export let horizontalSpacing = 30;
export let verticalSpacing = 34.64;

export let gameBoard = null;
export let board = [];


/* ============================
   FOB LOCATIONS
============================ */

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


    const hexHeightRatio =
        Math.sqrt(3) / 2;


    const requiredWidthUnits =
        (cols - 1) * 0.75 + 1;


    const requiredHeightUnits =
        (rows - 1) +
        0.5 +
        hexHeightRatio;


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


    gameBoard.innerHTML = "";


    const hexHeight =
        hexSize *
        (Math.sqrt(3) / 2);


    const boardWidth =
        ((cols - 1) *
            horizontalSpacing) +
        hexSize;


    const boardHeight =
        ((rows - 1) *
            verticalSpacing) +
        (verticalSpacing / 2) +
        hexHeight;


    gameBoard.style.width =
        `${boardWidth}px`;

    gameBoard.style.height =
        `${boardHeight}px`;

    gameBoard.style.position =
        "relative";


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
                r;

            wrapper.dataset.col =
                c;


            const hex =
                document.createElement("div");


            hex.className =
                "hex";


            hex.id =
                `hex-${r}-${c}`;


            const x =
                c * horizontalSpacing;


            let y =
                r * verticalSpacing;


            if (c % 2 !== 0) {

                y +=
                    verticalSpacing / 2;
            }


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


            hex.style.width =
                "100%";

            hex.style.height =
                "100%";


            wrapper.appendChild(
                hex
            );


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
   TERRITORIES
============================ */

export const territories = {

    natuna: [
        {
            r: 14,
            c: 2
        }
    ],

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

    redsingle: [
        {
            r: 6,
            c: 5
        }
    ],

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
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
// TERRITORIES
// ============================================================

export const territories = {

    natuna: [
        { r: 14, c: 2 }
    ],

    palawan: [
        { r: 11, c: 8 },
        { r: 10, c: 9 },
        { r: 10, c: 10 }
    ],

    taiwan: [
        { r: 2, c: 10 },
        { r: 3, c: 10 },
        { r: 1, c: 11 },
        { r: 2, c: 11 }
    ],

    redsingle: [
        { r: 6, c: 5 }
    ],

    bluesingle: [
        { r: 11, c: 12 },
        { r: 10, c: 13 },
        { r: 10, c: 14 },
        { r: 15, c: 15 },
        { r: 16, c: 16 }
    ]
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

    const mapContainer =
        document.getElementById("mapContainer");

    let availableWidth =
        window.innerWidth;

    let availableHeight =
        window.innerHeight;


    if (mapContainer) {

        const rect =
            mapContainer.getBoundingClientRect();

        if (rect.width > 0) {

            availableWidth =
                rect.width - 30;
        }

        if (rect.height > 0) {

            availableHeight =
                rect.height - 30;
        }
    }


    const hexHeightRatio =
        Math.sqrt(3) / 2;


    const requiredWidthUnits =
        ((cols - 1) * 0.75) + 1;


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
            "GRID ERROR: Cannot build grid."
        );

        return;
    }


    /*
     * Rebuild only the visual grid.
     * Board data is preserved.
     */

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


    gameBoard.style.position =
        "relative";

    gameBoard.style.width =
        `${boardWidth}px`;

    gameBoard.style.height =
        `${boardHeight}px`;


    // ========================================================
    // CREATE HEXES
    // ========================================================

    let hexNumber = 1;


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


            const hex =
                document.createElement("div");


            hex.className =
                "hex";


            hex.id =
                `hex-${r}-${c}`;


            hex.dataset.row =
                String(r);

            hex.dataset.col =
                String(c);


            // =================================================
            // HEX NUMBER
            // =================================================

            const numberLabel =
                document.createElement("div");


            numberLabel.className =
                "hex-number";


            numberLabel.textContent =
                String(hexNumber);


            numberLabel.style.position =
                "absolute";

            numberLabel.style.left =
                "50%";

            numberLabel.style.top =
                "50%";

            numberLabel.style.transform =
                "translate(-50%, -50%)";

            numberLabel.style.zIndex =
                "2";

            numberLabel.style.pointerEvents =
                "none";

            numberLabel.style.fontSize =
                `${Math.max(
                    10,
                    Math.floor(hexSize * 0.25)
                )}px`;

            numberLabel.style.fontWeight =
                "700";

            numberLabel.style.color =
                "#ffffff";

            numberLabel.style.textShadow =
                "0 1px 2px #000000, 0 0 3px #000000";


            // =================================================
            // HEX POSITION
            // =================================================

            const x =
                c *
                horizontalSpacing;


            let y =
                r *
                verticalSpacing;


            if (
                c % 2 !== 0
            ) {

                y +=
                    verticalSpacing / 2;
            }


            wrapper.style.left =
                `${x}px`;

            wrapper.style.top =
                `${y}px`;

            wrapper.style.width =
                `${hexSize}px`;

            wrapper.style.height =
                `${hexHeight}px`;


            // =================================================
            // ADD ELEMENTS
            // =================================================

            hex.appendChild(
                numberLabel
            );


            wrapper.appendChild(
                hex
            );


            gameBoard.appendChild(
                wrapper
            );


            hexNumber++;
        }
    }


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

            board[r][c] = [];
        }
    }
}


// ============================================================
// REBUILD GRID
// ============================================================

export function rebuildGrid() {

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
// GET HEX
// ============================================================

export function getHex(
    r,
    c
) {

    const wrapper =
        getHexWrapper(r, c);


    if (!wrapper) {
        return null;
    }


    return wrapper.querySelector(
        ".hex"
    );
}


// ============================================================
// RENDER TERRITORIES
// ============================================================

export function renderTerritories() {

    if (!gameBoard) {
        return;
    }


    const wrappers =
        gameBoard.querySelectorAll(
            ".hex-wrapper"
        );


    wrappers.forEach(
        wrapper => {

            [...wrapper.classList]
                .forEach(
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
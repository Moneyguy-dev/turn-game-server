// GRID + RENDER ENGINE

export let rows = 17;
export let cols = 19;

export let hexSize;
export let horizontalSpacing;
export let verticalSpacing;

export let gameBoard = null;
export let board = [];

export function initGrid() {
    gameBoard = document.getElementById("gameBoard");
    computeHexSize();
    buildHexGrid();
    initBoard();
}

/* ============================
   HEX SIZE CALCULATION
   ============================ */
export function computeHexSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const maxHexWidth = w / (cols * 0.85);
    const maxHexHeight = h / (rows * 1.00);

    hexSize = Math.floor(Math.min(maxHexWidth, maxHexHeight));
    horizontalSpacing = hexSize * 0.75;
    verticalSpacing = hexSize * Math.sqrt(3) / 2;
}

/* ============================
   BUILD HEX GRID
   ============================ */
export function buildHexGrid() {
    gameBoard.innerHTML = "";

    let maxX = 0;
    let maxY = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const wrapper = document.createElement("div");
            wrapper.classList.add("hex-wrapper");

            const hex = document.createElement("div");
            hex.classList.add("hex");
            hex.id = `hex-${r}-${c}`;

            wrapper.appendChild(hex);

            let x = c * horizontalSpacing;
            let y = r * verticalSpacing;
            if (c % 2 !== 0) y += verticalSpacing / 2;

            wrapper.style.left = `${x}px`;
            wrapper.style.top = `${y}px`;
            wrapper.style.width = `${hexSize}px`;
            wrapper.style.height = `${hexSize * 0.866}px`;

            hex.style.width = "100%";
            hex.style.height = "100%";
            hex.style.lineHeight = `${hexSize * 0.866}px`;

            // ⭐ Dynamic padding to prevent text overlapping border
            const pad = hexSize * 0.866 * 0.12;
            hex.style.paddingTop = `${pad}px`;
            hex.style.paddingBottom = `${pad}px`;

            wrapper.dataset.row = r;
            wrapper.dataset.col = c;

            gameBoard.appendChild(wrapper);

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    }

    gameBoard.style.width = (maxX + hexSize) + "px";
    gameBoard.style.height = (maxY + hexSize) + "px";
}

/* ============================
   INIT BOARD DATA
   ============================ */
export function initBoard() {
    board = [];
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
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
    ]
};

/* ============================
   TERRITORY RENDERER
   ============================ */
export function renderTerritories() {
    Object.entries(territories).forEach(([name, hexes]) => {
        hexes.forEach(({ r, c }) => {
            const wrapper = document.querySelector(`.hex-wrapper[data-row="${r}"][data-col="${c}"]`);
            if (wrapper) wrapper.classList.add(`territory-${name}`);
        });
    });
}

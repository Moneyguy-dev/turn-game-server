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

export function computeHexSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const maxHexWidth = w / (cols * 0.85);
    const maxHexHeight = h / (rows * 1.00);

    hexSize = Math.floor(Math.min(maxHexWidth, maxHexHeight));
    horizontalSpacing = hexSize * 0.75;
    verticalSpacing = hexSize * Math.sqrt(3) / 2;
}

export function buildHexGrid() {
    gameBoard.innerHTML = "";

    let maxX = 0;
    let maxY = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const cell = document.createElement("div");
            cell.classList.add("hex");

            let x = c * horizontalSpacing;
            let y = r * verticalSpacing;
            if (c % 2 !== 0) y += verticalSpacing / 2;

            cell.style.left = `${x}px`;
            cell.style.top = `${y}px`;
            cell.style.width = `${hexSize}px`;
            cell.style.height = `${hexSize * 0.866}px`;
            cell.style.lineHeight = `${hexSize * 0.866}px`;

            cell.dataset.row = r;
            cell.dataset.col = c;

            gameBoard.appendChild(cell);

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
    }

    gameBoard.style.width = (maxX + hexSize) + "px";
    gameBoard.style.height = (maxY + hexSize) + "px";
}

export function initBoard() {
    board = [];
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            board[r][c] = [];
        }
    }
}

export function rebuildGrid() {
    computeHexSize();
    buildHexGrid();
}

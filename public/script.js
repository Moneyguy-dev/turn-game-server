document.addEventListener("DOMContentLoaded", () => {

/* =========================
   READ MODE FROM URL
========================= */
const urlParams = new URLSearchParams(window.location.search);
let filterMode = urlParams.get("mode") || "all"; 
let playerId = filterMode;

const SERVER_URL = "https://turn-game-server.onrender.com";
let gameId = 1;

/* =========================
   FIRST LOAD FLAG
========================= */
let firstLoad = true;

/* =========================
   HTTP FUNCTIONS
========================= */

async function sendMoveToServer(movePayload) {
    const res = await fetch(`${SERVER_URL}/submitMove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            gameId,
            playerId,
            move: movePayload,
            board
        })
    });

    const data = await res.json();
    console.log("Server move response:", data);
}

async function loadGameStateFromServer() {
    const res = await fetch(`${SERVER_URL}/gameState?gameId=${gameId}`);
    const state = await res.json();

    console.log("Loaded game state:", state);

    if (firstLoad) {
        if (state.board) {
            board = state.board;
            updateBoard();
        } else {
            createBoard();
            await sendMoveToServer({ init: true });
        }
        firstLoad = false;
        return;
    }

    // Replace board from server
    if (state.board) {
        board = state.board;
    }

    // Apply remote move
    if (state.lastMove && !state.lastMove.init) {
        applyRemoteMove(state.lastMove);
    }

    // Draw board once
    updateBoard();
}

setInterval(loadGameStateFromServer, 10000);

/* =========================
   GAME LOGIC
========================= */

const rows = 17;
const cols = 19;

const hexSize = 60;
const horizontalSpacing = hexSize * 0.75;
const verticalSpacing = hexSize * Math.sqrt(3) / 2;

const MAX_UNITS_PER_HEX = 4;

let board = [];
let selectedUnit = null;
let validMoves = [];

const gameBoard = document.getElementById("gameBoard");
const unitList = document.getElementById("unitList");

const startHexes = {
    blue: { r: 0, c: 0 },
    red: { r: rows - 1, c: cols - 1 }
};

function isStartHex(r, c) {
    return (
        (r === startHexes.blue.r && c === startHexes.blue.c) ||
        (r === startHexes.red.r && c === startHexes.red.c)
    );
}

const units = {
    blue: {
        F15E: { move: 8 },
        F16:  { move: 7 },
        F22:  { move: 8 },
        F35:  { move: 6 },
        B2:   { move: 10 },
        B52:  { move: 11 },
        KC135:{ move: 12 },
        DDG80:{ move: 6 },
        ARG:  { move: 3 }
    },
    red: {
        J10:  { move: 7 },
        J11:  { move: 7 },
        J16:  { move: 7 },
        J20:  { move: 8 },
        H6:   { move: 9 },
        Y20:  { move: 11 },
        Type052: { move: 5 },
        Garrison: { move: 0 },
        ARG:  { move: 3 }
    }
};

function createBoard() {
    gameBoard.innerHTML = "";
    board = [];

    for (let r = 0; r < rows; r++) {
        board[r] = [];

        for (let c = 0; c < cols; c++) {
            board[r][c] = [];

            const cell = document.createElement("div");
            cell.classList.add("hex");

            let x = c * horizontalSpacing;
            let y = r * verticalSpacing;

            if (c % 2 !== 0) y += verticalSpacing / 2;

            cell.style.left = `${x}px`;
            cell.style.top = `${y}px`;

            cell.dataset.row = r;
            cell.dataset.col = c;

            cell.addEventListener("click", onHexClick);

            gameBoard.appendChild(cell);
        }
    }

    spawnAllUnits();
    updateBoard();
}

function addUnit(r, c, type, team) {
    if (!isStartHex(r, c) && board[r][c].length >= MAX_UNITS_PER_HEX) {
        return;
    }

    board[r][c].push({
        type,
        team,
        move: units[team][type].move
    });
}

function spawnAllUnits() {
    const blueStart = startHexes.blue;
    const redStart = startHexes.red;

    Object.keys(units.blue).forEach(type => {
        addUnit(blueStart.r, blueStart.c, type, "blue");
    });

    Object.keys(units.red).forEach(type => {
        addUnit(redStart.r, redStart.c, type, "red");
    });
}

function getNeighbors(r, c) {
    const even = [
        [-1, 0], [-1, -1],
        [0, -1], [0, 1],
        [1, 0], [1, -1]
    ];

    const odd = [
        [-1, 1], [-1, 0],
        [0, -1], [0, 1],
        [1, 1], [1, 0]
    ];

    const dirs = (c % 2 === 0) ? even : odd;

    return dirs
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) =>
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols
        );
}

function getValidMoves(r, c, range) {
    let visited = new Set();
    let queue = [[r,c,0]];
    let result = [];

    while (queue.length) {
        let [cr,cc,d] = queue.shift();
        let key = `${cr},${cc}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (d > 0) result.push([cr,cc]);
        if (d === range) continue;

        for (let [nr,nc] of getNeighbors(cr,cc)) {
            queue.push([nr,nc,d+1]);
        }
    }

    return result;
}

function onUnitClick(r, c, unit) {
    selectedUnit = { r, c, unit };
    validMoves = getValidMoves(r, c, unit.move);
    updateBoard();
}

function onHexClick(e) {
    if (!selectedUnit) return;

    const toR = +e.currentTarget.dataset.row;
    const toC = +e.currentTarget.dataset.col;

    let valid = validMoves.some(([r,c]) => r === toR && c === toC);
    if (!valid) return;

    let { r: fr, c: fc, unit } = selectedUnit;

    let fromStack = board[fr][fc];
    let toStack = board[toR][toC];

    if (!isStartHex(toR, toC) && toStack.length >= MAX_UNITS_PER_HEX) {
        alert("Max 4 units per hex!");
        return;
    }

    let index = fromStack.findIndex(u => u === unit);
    if (index === -1) return;

    fromStack.splice(index, 1);
    toStack.push(unit);

    sendMoveToServer({
        from: { r: fr, c: fc },
        to: { r: toR, c: toC },
        unit: unit.type,
        team: unit.team
    });

    selectedUnit = null;
    validMoves = [];

    updateBoard();
}

function applyRemoteMove(data) {
    const { from, to, unit, team } = data;

    let fromStack = board[from.r][from.c];
    let toStack = board[to.r][to.c];

    let uIndex = fromStack.findIndex(u => u.type === unit && u.team === team);
    if (uIndex === -1) return;

    let u = fromStack[uIndex];

    fromStack.splice(uIndex, 1);
    toStack.push(u);

    updateBoard();
}

function updateBoard() {
    const cells = gameBoard.children;
    let i = 0;

    for (let r=0;r<rows;r++) {
        for (let c=0;c<cols;c++) {

            const cell = cells[i++];
            if (!cell) return;

            cell.className = "hex";
            cell.innerHTML = "";

            if (validMoves.some(([vr, vc]) => vr === r && vc === c)) {
                cell.classList.add("highlight");
            }

            if (r === startHexes.blue.r && c === startHexes.blue.c) {
                cell.classList.add("base-blue");
            }
            if (r === startHexes.red.r && c === startHexes.red.c) {
                cell.classList.add("base-red");
            }

            let stack = board[r][c];

            if (stack.length) {
                const wrap = document.createElement("div");
                wrap.className = "unit-stack";

                stack.forEach(u => {

                    if (filterMode !== "all" && u.team !== filterMode) return;

                    const d = document.createElement("div");
                    d.className = `unit ${u.team}`;
                    d.textContent = u.type;

                    // TEAM LOCKING FIX
                    d.addEventListener("click", (e) => {
                        e.stopPropagation();

                        if (playerId !== "all" && u.team !== playerId) {
                            return;
                        }

                        onUnitClick(r, c, u);
                    });

                    if (selectedUnit && selectedUnit.unit === u) {
                        d.style.outline = "2px solid yellow";
                    }

                    wrap.appendChild(d);
                });

                cell.appendChild(wrap);
            } else {
                if (r === startHexes.blue.r && c === startHexes.blue.c) {
                    cell.textContent = "BLUE BASE";
                }
                else if (r === startHexes.red.r && c === startHexes.red.c) {
                    cell.textContent = "RED BASE";
                }
                else {
                    cell.textContent = `${r},${c}`;
                }
            }
        }
    }

    updateUnitList();
}

function updateUnitList() {
    unitList.innerHTML = "";

    for (let r=0;r<rows;r++) {
        for (let c=0;c<cols;c++) {
            for (let u of board[r][c]) {

                if (filterMode !== "all" && u.team !== filterMode) continue;

                let div = document.createElement("div");
                div.textContent = `${u.type} (${u.team}) [${r},${c}]`;
                unitList.appendChild(div);
            }
        }
    }
}

loadGameStateFromServer();

});

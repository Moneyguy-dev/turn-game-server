document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const SERVER_URL = "https://turn-game-server.onrender.com";

    const rows = 17;
    const cols = 19;
    const hexSize = 60;
    const horizontalSpacing = hexSize * 0.75;
    const verticalSpacing = hexSize * Math.sqrt(3) / 2;
    const MAX_UNITS_PER_HEX = 4;

    let playerId = urlParams.get("mode") || "all";
    let gameId = 1;
    let firstLoad = true;
    let turnLocked = { red: false, blue: false };
    let board = [];
    let selectedUnit = null;
    let validMoves = [];

    const gameBoard = document.getElementById("gameBoard");
    const unitList = document.getElementById("unitList");

    const startHexes = {
        blue: { r: 0, c: 0 },
        red: { r: rows - 1, c: cols - 1 }
    };

    const units = {
        blue: {
            F15E:  { move: 8 },
            F16:   { move: 7 },
            F22:   { move: 8 },
            F35:   { move: 6 },
            B2:    { move: 10 },
            B52:   { move: 11 },
            KC135: { move: 12 },
            DDG80: { move: 6 },
            ARG:   { move: 3 }
        },
        red: {
            J10:      { move: 7 },
            J11:      { move: 7 },
            J16:      { move: 7 },
            J20:      { move: 8 },
            H6:       { move: 9 },
            Y20:      { move: 11 },
            Type052:  { move: 5 },
            Garrison: { move: 0 },
            ARG:      { move: 3 }
        }
    };

    function isStartHex(r, c) {
        return (
            (r === startHexes.blue.r && c === startHexes.blue.c) ||
            (r === startHexes.red.r && c === startHexes.red.c)
        );
    }

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
        if (!isStartHex(r, c) && board[r][c].length >= MAX_UNITS_PER_HEX) return;

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
        const visited = new Set();
        const queue = [[r, c, 0]];
        const result = [];

        while (queue.length) {
            const [cr, cc, d] = queue.shift();
            const key = `${cr},${cc}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (d > 0) result.push([cr, cc]);
            if (d === range) continue;

            for (const [nr, nc] of getNeighbors(cr, cc)) {
                queue.push([nr, nc, d + 1]);
            }
        }

        return result;
    }

    function onUnitClick(r, c, unit) {
        if (playerId !== "all" && turnLocked[playerId]) {
            alert("You have already submitted your moves.");
            return;
        }

        if (playerId !== "all" && unit.team !== playerId) return;

        selectedUnit = { r, c, unit };
        validMoves = getValidMoves(r, c, unit.move);
        updateBoard();
    }

    function onHexClick(e) {
        if (playerId !== "all" && turnLocked[playerId]) return;
        if (!selectedUnit) return;

        const toR = +e.currentTarget.dataset.row;
        const toC = +e.currentTarget.dataset.col;

        const valid = validMoves.some(([r, c]) => r === toR && c === toC);
        if (!valid) return;

        const { r: fr, c: fc, unit } = selectedUnit;
        const fromStack = board[fr][fc];
        const toStack = board[toR][toC];

        if (!isStartHex(toR, toC) && toStack.length >= MAX_UNITS_PER_HEX) {
            alert("Max 4 units per hex!");
            return;
        }

        const index = fromStack.findIndex(u => u === unit);
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

    function updateBoard() {
        const cells = gameBoard.children;
        let i = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
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

                const stack = board[r][c];

                if (stack.length) {
                    const wrap = document.createElement("div");
                    wrap.className = "unit-stack";

                    stack.forEach(u => {
                        const d = document.createElement("div");
                        d.className = `unit ${u.team}`;
                        d.textContent = u.type;

                        d.addEventListener("click", (e) => {
                            e.stopPropagation();
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
                    } else if (r === startHexes.red.r && c === startHexes.red.c) {
                        cell.textContent = "RED BASE";
                    } else {
                        cell.textContent = `${r},${c}`;
                    }
                }
            }
        }

        updateUnitList();
    }

    function updateUnitList() {
        if (!unitList) return;

        unitList.innerHTML = "";

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                for (const u of board[r][c]) {
                    const div = document.createElement("div");
                    div.textContent = `${u.type} (${u.team}) [${r},${c}]`;
                    unitList.appendChild(div);
                }
            }
        }
    }

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

        if (state.turnLocked) {
            turnLocked = state.turnLocked;
        }

        // FIRST LOAD: ensure units exist; only use server board if it has units
        if (firstLoad) {
            if (state.board && state.board.flat().some(cell => cell.length > 0)) {
                // server already has a populated board
                board = state.board;
                createBoard(); // builds DOM; board already has units
            } else {
                // server board empty or missing: create fresh board + units, then send init
                createBoard();
                await sendMoveToServer({ init: true });
            }

            updateBoard();
            firstLoad = false;
            return;
        }

        // SUBSEQUENT LOADS
        if (state.board) {
            board = state.board;
        } else {
            console.log("Board missing — forcing rebuild.");
            createBoard();
        }

        if (state.lastMove && !state.lastMove.init) {
            applyRemoteMove(state.lastMove);
        }

        updateBoard();
    }

    function applyRemoteMove(data) {
        const { from, to, unit, team } = data;

        const fromStack = board[from.r][from.c];
        const toStack = board[to.r][to.c];

        const uIndex = fromStack.findIndex(u => u.type === unit && u.team === team);
        if (uIndex === -1) return;

        const u = fromStack[uIndex];

        fromStack.splice(uIndex, 1);
        toStack.push(u);

        updateBoard();
    }

    const submitBtn = document.getElementById("submitTurn");
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            if (playerId === "all") return;

            await fetch(`${SERVER_URL}/submitTurn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId, playerId })
            });

            turnLocked[playerId] = true;
            await loadGameStateFromServer();

            alert("Your moves have been submitted. Waiting for admin to continue.");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        });
    }

    const continueBtn = document.getElementById("continueTurn");
    if (continueBtn) {
        continueBtn.addEventListener("click", async () => {
            await fetch(`${SERVER_URL}/continueTurn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });

            await loadGameStateFromServer();
            alert("New turn started. Red and Blue unlocked.");
        });
    }

    const resetBtn = document.getElementById("resetGame");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            await fetch(`${SERVER_URL}/resetGame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });

            alert("Game reset. Fresh board created.");
            window.location.href = "index.html";
        });
    }

    const backBtn = document.getElementById("backButton");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    loadGameStateFromServer();
    setInterval(loadGameStateFromServer, 10000);
});

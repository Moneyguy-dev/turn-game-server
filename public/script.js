document.addEventListener("DOMContentLoaded", () => {

    const rows = 17;
    const cols = 19;

    /* UNIVERSAL AUTO-SCALING HEX SIZE */
    function getAutoHexSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const maxHexWidth = w / (cols * 0.85);
        const maxHexHeight = h / (rows * 1.00);

        return Math.floor(Math.min(maxHexWidth, maxHexHeight));
    }

    let hexSize = getAutoHexSize();
    let horizontalSpacing = hexSize * 0.75;
    let verticalSpacing = hexSize * Math.sqrt(3) / 2;

    const urlParams = new URLSearchParams(window.location.search);
    const SERVER_URL = "https://turn-game-server.onrender.com";

    let playerId = urlParams.get("mode") || "all";
    let gameId = 1;
    let firstLoad = true;
    let turnLocked = { red: false, blue: false };
    let board = [];
    let selectedUnit = null;
    let validMoves = [];

    // FOB pool: units not yet deployed
    let fobPool = {
        blue: [],
        red: []
    };

    const gameBoard = document.getElementById("gameBoard");
    const unitList = document.getElementById("unitList");
    const unitPanel = document.getElementById("unitPanel");
    const toggleUnits = document.getElementById("toggleUnits");
    const mapContainer = document.getElementById("mapContainer");

    const fobPanel = document.getElementById("fobPanel");
    const fobList = document.getElementById("fobList");
    const fobButton = document.getElementById("fobButton");

    const logBookBtn = document.getElementById("logBook");
    const armamentsBtn = document.getElementById("armaments");

    const startHexes = {
        blue: { r: 0, c: 0 },
        red: { r: rows - 1, c: cols - 1 }
    };

    const MAX_UNITS_PER_HEX = 4;

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

    /* BUILD HEX GRID */
    function buildHexGrid() {
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

                cell.addEventListener("click", onHexClick);

                gameBoard.appendChild(cell);

                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }

        gameBoard.style.width = (maxX + hexSize) + "px";
        gameBoard.style.height = (maxY + hexSize) + "px";
    }

    /* INIT BOARD (EMPTY) */
    function initLocalBoard() {
        board = [];
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = [];
            }
        }
    }

    /* INIT FOB POOL (UNITS NOT DEPLOYED) */
    function initFobPool() {
        fobPool.blue = [];
        fobPool.red = [];

        Object.keys(units.blue).forEach(type => {
            fobPool.blue.push({
                type,
                team: "blue",
                move: units.blue[type].move
            });
        });

        Object.keys(units.red).forEach(type => {
            fobPool.red.push({
                type,
                team: "red",
                move: units.red[type].move
            });
        });
    }

    function addUnitToBoard(r, c, unit) {
        if (!isStartHex(r, c) && board[r][c].length >= MAX_UNITS_PER_HEX) return;
        board[r][c].push(unit);
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

        selectedUnit = { r, c, unit, fromFob: false };
        validMoves = getValidMoves(r, c, unit.move);
        updateBoard();
    }

    function onFobUnitClick(unit) {
        if (playerId !== "all" && turnLocked[playerId]) {
            alert("You have already submitted your moves.");
            return;
        }

        if (playerId !== "all" && unit.team !== playerId && playerId !== "all") return;

        const start = startHexes[unit.team];

        selectedUnit = {
            r: start.r,
            c: start.c,
            unit,
            fromFob: true
        };

        validMoves = getValidMoves(start.r, start.c, unit.move);
        updateBoard();
    }

    function onHexClick(e) {
        if (playerId !== "all" && turnLocked[playerId]) return;
        if (!selectedUnit) return;

        const toR = +e.currentTarget.dataset.row;
        const toC = +e.currentTarget.dataset.col;

        const valid = validMoves.some(([r, c]) => r === toR && c === toC);
        if (!valid) return;

        const { r: fr, c: fc, unit, fromFob } = selectedUnit;

        if (!isStartHex(toR, toC) && board[toR][toC].length >= MAX_UNITS_PER_HEX) {
            alert("Max 4 units per hex!");
            return;
        }

        if (fromFob) {
            // Deploy from FOB pool to board
            addUnitToBoard(toR, toC, unit);

            const pool = fobPool[unit.team];
            const idx = pool.indexOf(unit);
            if (idx !== -1) pool.splice(idx, 1);

            sendMoveToServer({
                from: { r: fr, c: fc },
                to: { r: toR, c: toC },
                unit: unit.type,
                team: unit.team
            });
        } else {
            // Normal movement from board
            const fromStack = board[fr][fc];
            const toStack = board[toR][toC];

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
        }

        selectedUnit = null;
        validMoves = [];
        updateBoard();
        updateFobList();
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
                cell.style.background = "";

                if (validMoves.some(([vr, vc]) => vr === r && vc === c)) {
                    cell.style.background = "#555";
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

                        if (selectedUnit && selectedUnit.unit === u && !selectedUnit.fromFob) {
                            d.style.outline = "2px solid yellow";
                        }

                        wrap.appendChild(d);
                    });

                    cell.appendChild(wrap);
                } else {
                    cell.textContent = `${r},${c}`;
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

    function updateFobList() {
        if (!fobList) return;

        fobList.innerHTML = "";

        let teamsToShow = [];

        if (playerId === "red" || playerId === "blue") {
            teamsToShow = [playerId];
        } else {
            teamsToShow = ["blue", "red"];
        }

        teamsToShow.forEach(team => {
            const pool = fobPool[team];

            pool.forEach(u => {
                const div = document.createElement("div");
                div.className = `fob-unit ${team}`;
                div.textContent = `${u.type} (${team})`;
                div.addEventListener("click", () => {
                    onFobUnitClick(u);
                });
                fobList.appendChild(div);
            });
        });
    }

    async function sendMoveToServer(movePayload) {
        await fetch(`${SERVER_URL}/submitMove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                gameId,
                playerId,
                move: movePayload
            })
        });
    }

    async function loadGameStateFromServer() {
        const res = await fetch(`${SERVER_URL}/gameState?gameId=${gameId}`);
        const state = await res.json();

        if (state.turnLocked) {
            turnLocked = state.turnLocked;
        }

        if (firstLoad) {
            buildHexGrid();

            if (state.board && state.board.flat().some(cell => cell.length > 0)) {
                board = state.board;
                fobPool.blue = [];
                fobPool.red = [];
            } else {
                initLocalBoard();
                initFobPool();
            }

            updateBoard();
            updateFobList();
            firstLoad = false;
            return;
        }

        if (state.board) {
            board = state.board;
        }

        updateBoard();
        updateFobList();
    }

    /* SUBMIT TURN */
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

            alert("Your moves have been submitted.");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        });
    }

    /* ADMIN CONTINUE TURN */
    const continueBtn = document.getElementById("continueTurn");
    if (continueBtn) {
        continueBtn.addEventListener("click", async () => {
            await fetch(`${SERVER_URL}/continueTurn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });

            await loadGameStateFromServer();
            alert("New turn started.");
        });
    }

    /* ADMIN RESET GAME */
    const resetBtn = document.getElementById("resetGame");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            await fetch(`${SERVER_URL}/resetGame`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });

            alert("Game reset.");
            window.location.href = "index.html";
        });
    }

    /* BACK BUTTON */
    const backBtn = document.getElementById("backButton");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    /* UI BUTTONS */
    if (logBookBtn) {
        logBookBtn.addEventListener("click", () => {
            alert("Log Book coming soon.");
        });
    }

    if (armamentsBtn) {
        armamentsBtn.addEventListener("click", () => {
            alert("Armaments coming soon.");
        });
    }

    function updateMapMargin() {
        const anyOpen =
            (unitPanel && unitPanel.classList.contains("open")) ||
            (fobPanel && fobPanel.classList.contains("open"));

        mapContainer.style.marginRight = anyOpen ? "300px" : "0px";
    }

    /* COLLAPSIBLE UNIT PANEL */
    if (toggleUnits && unitPanel) {
        toggleUnits.addEventListener("click", () => {
            const isOpen = unitPanel.classList.toggle("open");

            if (isOpen) {
                toggleUnits.textContent = "Units ◂";
            } else {
                toggleUnits.textContent = "Units ▸";
            }

            updateMapMargin();
        });
    }

    /* FOB BUTTON / PANEL */
    if (fobButton && fobPanel) {
        fobButton.addEventListener("click", () => {
            const isOpen = fobPanel.classList.toggle("open");
            updateFobList();
            updateMapMargin();
        });
    }

    /* INITIAL LOAD */
    loadGameStateFromServer();
    setInterval(loadGameStateFromServer, 10000);

    /* REBUILD GRID ON RESIZE */
    window.addEventListener("resize", () => {
        hexSize = getAutoHexSize();
        horizontalSpacing = hexSize * 0.75;
        verticalSpacing = hexSize * Math.sqrt(3) / 2;

        buildHexGrid();
        updateBoard();
    });

    /* ================================
       DIAGNOSTIC OVERLAY (LIVE DEBUG)
       ================================ */

    function createDiagnosticOverlay() {
        const diag = document.createElement("div");
        diag.id = "diagOverlay";
        diag.style.position = "fixed";
        diag.style.top = "10px";
        diag.style.left = "10px";
        diag.style.padding = "10px 14px";
        diag.style.background = "rgba(0,0,0,0.75)";
        diag.style.color = "#0f0";
        diag.style.fontFamily = "monospace";
        diag.style.fontSize = "12px";
        diag.style.zIndex = "9999";
        diag.style.border = "1px solid #0f0";
        diag.style.borderRadius = "6px";
        diag.style.pointerEvents = "none";
        document.body.appendChild(diag);
    }

    function updateDiagnosticOverlay() {
        const diag = document.getElementById("diagOverlay");
        if (!diag) return;

        const boardWidth = gameBoard.offsetWidth;
        const boardHeight = gameBoard.offsetHeight;

        diag.innerHTML =
            "Viewport: " + window.innerWidth + " x " + window.innerHeight + "<br>" +
            "Hex Size: " + hexSize + "<br>" +
            "H-Spacing: " + horizontalSpacing.toFixed(2) + "<br>" +
            "V-Spacing: " + verticalSpacing.toFixed(2) + "<br>" +
            "Board: " + boardWidth + " x " + boardHeight + "<br>" +
            "Cols: " + cols + "  Rows: " + rows;
    }

    createDiagnosticOverlay();
    setInterval(updateDiagnosticOverlay, 200);

});

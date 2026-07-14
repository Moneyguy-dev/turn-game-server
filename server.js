const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const games = {};

function getGame(gameId) {
    if (!games[gameId]) {
        games[gameId] = {
            gameId,
            board: null,
            lastMove: null,
            moveHistory: [],
            currentTurnPlayer: "red",
            unlockTime: null,
            turnLocked: { red: false, blue: false }
        };
    }
    return games[gameId];
}

/* =========================
   UNIT DEFINITIONS (MATCH CLIENT)
========================= */
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

const startHexes = {
    blue: { r: 0, c: 0 },
    red: { r: 16, c: 18 }
};

/* =========================
   SERVER-SIDE UNIT SPAWN
========================= */
function addUnit(board, r, c, type, team) {
    board[r][c].push({
        type,
        team,
        move: units[team][type].move
    });
}

function spawnAllUnits(board) {
    const blueStart = startHexes.blue;
    const redStart = startHexes.red;

    Object.keys(units.blue).forEach(type => {
        addUnit(board, blueStart.r, blueStart.c, type, "blue");
    });

    Object.keys(units.red).forEach(type => {
        addUnit(board, redStart.r, redStart.c, type, "red");
    });
}

/* =========================
   EMPTY BOARD GENERATOR
========================= */
function generateEmptyBoard() {
    const rows = 17;
    const cols = 19;

    const board = [];
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            board[r][c] = [];
        }
    }
    return board;
}

/* =========================
   APPLY MOVE TO BOARD
========================= */
function applyMoveToBoard(board, move) {
    if (!move || move.init) return;

    const { from, to, unit, team } = move;

    const fromStack = board[from.r][from.c];
    const toStack = board[to.r][to.c];

    const idx = fromStack.findIndex(u => u.type === unit && u.team === team);
    if (idx === -1) return;

    const u = fromStack[idx];
    fromStack.splice(idx, 1);
    toStack.push(u);
}

/* =========================
   SUBMIT MOVE
========================= */
app.post("/submitMove", (req, res) => {
    const { gameId, playerId, move, board } = req.body;
    const game = getGame(gameId);

    if (playerId !== "all" && game.turnLocked[playerId]) {
        return res.json({ status: "error", message: "Turn already submitted" });
    }

    if (playerId !== "all" && game.currentTurnPlayer !== playerId) {
        return res.json({ status: "error", message: "Not your turn" });
    }

    // Apply move to server board
    if (!game.board) {
        game.board = generateEmptyBoard();
        spawnAllUnits(game.board);
    }

    applyMoveToBoard(game.board, move);

    game.lastMove = move;
    game.moveHistory.push(move);

    if (playerId !== "all") {
        game.currentTurnPlayer = playerId === "red" ? "blue" : "red";
    }

    game.unlockTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

    res.json({
        status: "ok",
        nextTurnPlayer: game.currentTurnPlayer,
        unlockTime: game.unlockTime
    });
});

/* =========================
   SUBMIT TURN
========================= */
app.post("/submitTurn", (req, res) => {
    const { gameId, playerId } = req.body;
    const game = getGame(gameId);

    if (playerId === "red") game.turnLocked.red = true;
    if (playerId === "blue") game.turnLocked.blue = true;

    res.json({ status: "ok", turnLocked: game.turnLocked });
});

/* =========================
   CONTINUE TURN (NO RESET)
========================= */
app.post("/continueTurn", (req, res) => {
    const { gameId } = req.body;
    const game = getGame(gameId);

    // DO NOT TOUCH game.board
    // DO NOT TOUCH game.lastMove

    game.turnLocked.red = false;
    game.turnLocked.blue = false;
    game.currentTurnPlayer = "red";

    res.json({ status: "ok" });
});


/* =========================
   RESET GAME — SPAWNS UNITS
========================= */
app.post("/resetGame", (req, res) => {
    const { gameId } = req.body;

    delete games[gameId];
    const game = getGame(gameId);

    game.board = generateEmptyBoard();
    spawnAllUnits(game.board);

    game.lastMove = null;
    game.moveHistory = [];
    game.turnLocked = { red: false, blue: false };
    game.currentTurnPlayer = "red";

    res.json({ status: "ok", message: "Game reset with units" });
});

/* =========================
   GET GAME STATE — SPAWN IF EMPTY
========================= */
app.get("/gameState", (req, res) => {
    const gameId = req.query.gameId;
    const game = getGame(gameId);

    if (!game.board) {
        game.board = generateEmptyBoard();
        spawnAllUnits(game.board);
    }

    res.json(game);
});

/* =========================
   START SERVER
========================= */
app.listen(process.env.PORT || 3000, () => {
    console.log("HTTP server running");
});

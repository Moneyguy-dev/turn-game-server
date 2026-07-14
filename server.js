const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// Serve static files
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

            turnLocked: {
                red: false,
                blue: false
            }
        };
    }
    return games[gameId];
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

    // Keep board as proper nested array
    game.board = JSON.parse(JSON.stringify(board));

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
   SUBMIT TURN (LOCK PLAYER)
========================= */
app.post("/submitTurn", (req, res) => {
    const { gameId, playerId } = req.body;
    const game = getGame(gameId);

    if (playerId === "red") game.turnLocked.red = true;
    if (playerId === "blue") game.turnLocked.blue = true;

    res.json({
        status: "ok",
        turnLocked: game.turnLocked
    });
});

/* =========================
   ADMIN CONTINUE TURN
========================= */
app.post("/continueTurn", (req, res) => {
    const { gameId } = req.body;
    const game = getGame(gameId);

    game.turnLocked.red = false;
    game.turnLocked.blue = false;
    game.currentTurnPlayer = "red";

    res.json({ status: "ok" });
});

/* =========================
   RESET GAME (ADMIN)
========================= */
app.post("/resetGame", (req, res) => {
    const { gameId } = req.body;

    // Delete entire game state
    delete games[gameId];

    // Recreate fresh game
    const game = getGame(gameId);

    game.board = generateEmptyBoard();
    game.lastMove = null;
    game.moveHistory = [];
    game.turnLocked = { red: false, blue: false };
    game.currentTurnPlayer = "red";

    res.json({ status: "ok", message: "Game reset" });
});

/* =========================
   GET GAME STATE
========================= */
app.get("/gameState", (req, res) => {
    const gameId = req.query.gameId;
    const game = getGame(gameId);

    if (!game.board) {
        console.log("Server: Board missing — generating empty board.");
        game.board = generateEmptyBoard();
    }

    res.json(game);
});

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
   START SERVER
========================= */
app.listen(process.env.PORT || 3000, () => {
    console.log("HTTP server running");
});

const express = require("express");
const app = express();
app.use(express.json());

// TEMPORARY IN-MEMORY STORAGE
const games = {};

function getGame(gameId) {
    if (!games[gameId]) {
        games[gameId] = {
            gameId,
            board: null,          // full board array
            lastMove: null,       // last move object
            moveHistory: [],      // list of moves
            currentTurnPlayer: "red",
            unlockTime: null
        };
    }
    return games[gameId];
}

// POST /submitMove
app.post("/submitMove", (req, res) => {
    const { gameId, playerId, move, board } = req.body;

    const game = getGame(gameId);

    // Turn validation
    if (playerId !== "all" && game.currentTurnPlayer !== playerId) {
        return res.json({ status: "error", message: "Not your turn" });
    }

    // Save board + move
    game.board = board;
    game.lastMove = move;
    game.moveHistory.push(move);

    // Switch turn
    if (playerId !== "all") {
        game.currentTurnPlayer = playerId === "red" ? "blue" : "red";
    }

    // Lock next turn for 7 days
    game.unlockTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

    res.json({
        status: "ok",
        nextTurnPlayer: game.currentTurnPlayer,
        unlockTime: game.unlockTime
    });
});

// GET /gameState
app.get("/gameState", (req, res) => {
    const gameId = req.query.gameId;
    const game = getGame(gameId);
    res.json(game);
});

// Render uses PORT
app.listen(process.env.PORT || 3000, () => {
    console.log("HTTP server running");
});

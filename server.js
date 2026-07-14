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

app.post("/submitMove", (req, res) => {
    const { gameId, playerId, move, board } = req.body;

    const game = getGame(gameId);

    if (playerId !== "all" && game.turnLocked[playerId]) {
        return res.json({ status: "error", message: "Turn already submitted" });
    }

    if (playerId !== "all" && game.currentTurnPlayer !== playerId) {
        return res.json({ status: "error", message: "Not your turn" });
    }

    game.board = board;
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

app.post("/continueTurn", (req, res) => {
    const { gameId } = req.body;
    const game = getGame(gameId);

    game.turnLocked.red = false;
    game.turnLocked.blue = false;
    game.currentTurnPlayer = "red";

    res.json({ status: "ok" });
});

app.get("/gameState", (req, res) => {
    const gameId = req.query.gameId;
    const game = getGame(gameId);
    res.json(game);
});

app.listen(process.env.PORT || 3000, () => {
    console.log("HTTP server running");
});
//force redeploy
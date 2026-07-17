import { board } from "./grid.js";
import { updateBoard } from "./units.js";
import { updateFobList } from "./fob.js";

const SERVER_URL = "https://turn-game-server.onrender.com";
let gameId = 1;

export async function loadGameStateFromServer() {
    const res = await fetch(`${SERVER_URL}/gameState?gameId=${gameId}`);
    const state = await res.json();

    if (state.board) {
        window.board = state.board;
    }

    updateBoard();
    updateFobList();
}

export async function sendMoveToServer(movePayload) {
    await fetch(`${SERVER_URL}/submitMove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            gameId,
            playerId: window.playerId,
            move: movePayload
        })
    });
}

import { board } from "./grid.js";
import { updateBoard } from "./units.js";
import { updateFobList } from "./fob.js";

const SERVER_URL = "https://turn-game-server.onrender.com";

export function getGameId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("gameId") || "default";
}

export function getPlayerId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return params.get("mode") || "spectator";
}

/* ============================
   LOAD GAME STATE
============================ */

export async function loadGameStateFromServer() {

    try {

        const gameId = getGameId();

        const res = await fetch(
            `${SERVER_URL}/gameState?gameId=${encodeURIComponent(gameId)}`
        );

        if (!res.ok) {
            throw new Error(
                `Server returned ${res.status}`
            );
        }

        const state = await res.json();

        /*
         * Copy the server board into the board
         * exported by grid.js.
         *
         * Do NOT do:
         *
         * window.board = state.board
         *
         * because units.js is using the imported
         * board from grid.js.
         */

        if (state.board) {

            board.length = 0;

            state.board.forEach(row => {
                board.push(row);
            });
        }

        /*
         * Store useful server state globally.
         */

        window.turnLocked =
            state.turnLocked || {
                red: false,
                blue: false
            };

        window.currentTurnPlayer =
            state.currentTurnPlayer || "red";

        updateBoard();

        if (
            typeof updateFobList === "function"
        ) {
            updateFobList();
        }

        return state;

    } catch (error) {

        console.error(
            "Failed to load game state:",
            error
        );

        throw error;
    }
}

/* ============================
   SEND MOVE
============================ */

export async function sendMoveToServer(movePayload) {

    const gameId = getGameId();
    const playerId = getPlayerId();

    const response = await fetch(
        `${SERVER_URL}/submitMove`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                gameId,
                playerId,
                move: movePayload
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Move submission failed: ${response.status}`
        );
    }

    return await response.json();
}

/* ============================
   SUBMIT TURN
============================ */

export async function submitTurnToServer() {

    const gameId = getGameId();
    const playerId = getPlayerId();

    const response = await fetch(
        `${SERVER_URL}/submitTurn`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                gameId,
                playerId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Submit turn failed: ${response.status}`
        );
    }

    return await response.json();
}

/* ============================
   CONTINUE / RESOLVE TURN
============================ */

export async function continueTurnOnServer() {

    const gameId = getGameId();

    const response = await fetch(
        `${SERVER_URL}/continueTurn`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                gameId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Continue turn failed: ${response.status}`
        );
    }

    return await response.json();
}

/* ============================
   RESET GAME
============================ */

export async function resetGameOnServer() {

    const gameId = getGameId();

    const response = await fetch(
        `${SERVER_URL}/resetGame`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                gameId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Reset failed: ${response.status}`
        );
    }

    return await response.json();
}
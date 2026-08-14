// ============================================================
// SERVER COMMUNICATION
// ============================================================

import {
    board,
    rows,
    cols
} from "./grid.js";


// ============================================================
// SERVER URL
// ============================================================

const SERVER_URL =
    "https://turn-game-server.onrender.com";


// ============================================================
// GET GAME ID
// ============================================================

export function getGameId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("gameId") ||
        "default"
    );
}


// ============================================================
// GET PLAYER / SIDE
// ============================================================

export function getPlayerId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("mode") ||
        "spectator"
    );
}


// ============================================================
// GET JSON HELPER
// ============================================================

async function getJson(url) {

    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache:
                    "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `Server returned ${response.status}`
        );
    }


    return await response.json();
}


// ============================================================
// POST JSON HELPER
// ============================================================

async function postJson(
    url,
    data
) {

    const response =
        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );


    if (!response.ok) {

        let message =
            `Server returned ${response.status}`;


        try {

            const errorData =
                await response.json();


            if (
                errorData &&
                errorData.error
            ) {

                message =
                    errorData.error;
            }

            else if (
                errorData &&
                errorData.message
            ) {

                message =
                    errorData.message;
            }

        } catch {
            // Ignore invalid JSON.
        }


        throw new Error(
            message
        );
    }


    return await response.json();
}


// ============================================================
// NORMALIZE BOARD
// ============================================================

function normalizeBoard(
    serverBoard
) {

    /*
     * Always keep the client board exactly
     * rows x cols.
     *
     * Every hex gets an array.
     */

    for (
        let r = 0;
        r < rows;
        r++
    ) {

        if (
            !Array.isArray(
                board[r]
            )
        ) {

            board[r] = [];
        }


        for (
            let c = 0;
            c < cols;
            c++
        ) {

            const value =
                serverBoard?.[r]?.[c];


            board[r][c] =
                Array.isArray(value)
                    ? value
                    : [];
        }
    }


    board.length =
        rows;
}


// ============================================================
// LOAD GAME STATE
// ============================================================

export async function loadGameStateFromServer() {

    const gameId =
        getGameId();


    try {

        const state =
            await getJson(
                `${SERVER_URL}/gameState?gameId=${encodeURIComponent(gameId)}`
            );


        // ----------------------------------------------------
        // BOARD
        // ----------------------------------------------------

        if (
            state &&
            state.board
        ) {

            normalizeBoard(
                state.board
            );
        }


        // ----------------------------------------------------
        // TURN LOCKS
        // ----------------------------------------------------

        window.turnLocked =
            state?.turnLocked || {
                red: false,
                blue: false
            };


        // ----------------------------------------------------
        // CURRENT TURN
        // ----------------------------------------------------

        window.currentTurnPlayer =
            state?.currentTurnPlayer ||
            "red";


        // ----------------------------------------------------
        // COMPLETE STATE
        // ----------------------------------------------------

        window.gameState =
            state;


        console.log(
            "Game state loaded:",
            state
        );


        return state;

    } catch (error) {

        console.error(
            "Failed to load game state:",
            error
        );


        throw error;
    }
}


// ============================================================
// SEND MOVE
// ============================================================

export async function sendMoveToServer(
    movePayload
) {

    const gameId =
        getGameId();

    const playerId =
        getPlayerId();


    if (!movePayload) {

        throw new Error(
            "No move payload was provided."
        );
    }


    const result =
        await postJson(
            `${SERVER_URL}/submitMove`,
            {
                gameId,

                playerId,

                move:
                    movePayload
            }
        );


    console.log(
        "Move sent to server:",
        result
    );


    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    return result;
}


// ============================================================
// SAVE ARMAMENT LOADOUT
// ============================================================

export async function saveArmamentLoadout(
    unit,
    r,
    c
) {

    if (!unit) {

        throw new Error(
            "No unit was provided."
        );
    }


    if (
        typeof r !== "number" ||
        typeof c !== "number"
    ) {

        throw new Error(
            "Unit board position is required."
        );
    }


    const gameId =
        getGameId();


    const playerId =
        getPlayerId();


    if (
        playerId !== "red" &&
        playerId !== "blue"
    ) {

        throw new Error(
            "You must be on the red or blue team."
        );
    }


    if (
        unit.team !== playerId
    ) {

        throw new Error(
            "You cannot modify the opposing team's units."
        );
    }


    const armaments =
        Array.isArray(
            unit.armaments
        )
            ? [...unit.armaments]
            : [];


    const result =
        await postJson(
            `${SERVER_URL}/updateArmament`,
            {
                gameId,

                playerId,

                unitType:
                    unit.type,

                unitTeam:
                    unit.team,

                r,

                c,

                armaments
            }
        );


    console.log(
        "Armament loadout saved:",
        result
    );


    /*
     * If the server returns the updated board,
     * immediately synchronize the local board.
     */

    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    return result;
}


// ============================================================
// SUBMIT TURN
// ============================================================

export async function submitTurnToServer() {

    const gameId =
        getGameId();

    const playerId =
        getPlayerId();


    console.log(
        "Submitting turn:",
        {
            gameId,
            playerId
        }
    );


    const result =
        await postJson(
            `${SERVER_URL}/submitTurn`,
            {
                gameId,

                playerId
            }
        );


    console.log(
        "Turn submitted:",
        result
    );


    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    if (
        result &&
        result.turnLocked
    ) {

        window.turnLocked =
            result.turnLocked;
    }


    if (
        result &&
        result.currentTurnPlayer
    ) {

        window.currentTurnPlayer =
            result.currentTurnPlayer;
    }


    return result;
}


// ============================================================
// CONTINUE / RESOLVE TURN
// ============================================================

export async function continueTurnOnServer() {

    const gameId =
        getGameId();


    console.log(
        "Continuing turn:",
        gameId
    );


    const result =
        await postJson(
            `${SERVER_URL}/continueTurn`,
            {
                gameId
            }
        );


    console.log(
        "Turn continued:",
        result
    );


    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    if (
        result &&
        result.turnLocked
    ) {

        window.turnLocked =
            result.turnLocked;
    }


    if (
        result &&
        result.currentTurnPlayer
    ) {

        window.currentTurnPlayer =
            result.currentTurnPlayer;
    }


    return result;
}


// ============================================================
// RESET GAME
// ============================================================

export async function resetGameOnServer() {

    const gameId =
        getGameId();


    console.log(
        "Resetting game:",
        gameId
    );


    const result =
        await postJson(
            `${SERVER_URL}/resetGame`,
            {
                gameId
            }
        );


    console.log(
        "Game reset:",
        result
    );


    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    window.turnLocked = {
        red: false,
        blue: false
    };


    if (
        result &&
        result.turnLocked
    ) {

        window.turnLocked =
            result.turnLocked;
    }


    window.currentTurnPlayer =
        result?.currentTurnPlayer ||
        "red";


    return result;
}


// ============================================================
// CHECK SERVER CONNECTION
// ============================================================

export async function checkServerConnection() {

    try {

        const state =
            await loadGameStateFromServer();


        return {
            connected: true,
            state
        };

    } catch (error) {

        console.error(
            "Server connection check failed:",
            error
        );


        return {
            connected: false,
            error
        };
    }
}
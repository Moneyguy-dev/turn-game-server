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

async function getJson(
    url
) {

    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache: "no-store"
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
            // Ignore invalid error JSON.
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


    /*
     * Remove extra rows if the server
     * returned more than our local grid.
     */

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
        // STORE COMPLETE STATE
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


    /*
     * If the server returned a new board,
     * immediately synchronize it.
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

/* =========================
   UPDATE ARMAMENT LOADOUT
========================= */

app.post(
    "/updateArmament",
    async (req, res) => {

        try {

            const {
                gameId,
                playerId,
                unitType,
                unitTeam,
                armaments
            } = req.body;


            if (!gameId) {

                return res
                    .status(400)
                    .json({
                        status: "error",
                        message:
                            "Missing gameId"
                    });
            }


            if (
                playerId !== "red" &&
                playerId !== "blue"
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",
                        message:
                            "Invalid playerId"
                    });
            }


            if (
                unitTeam !==
                playerId
            ) {

                return res
                    .status(403)
                    .json({
                        status: "error",
                        message:
                            "You cannot modify the opposing team's units."
                    });
            }


            if (
                !unitType ||
                !Array.isArray(
                    armaments
                )
            ) {

                return res
                    .status(400)
                    .json({
                        status: "error",
                        message:
                            "Invalid armament data."
                    });
            }


            const game =
                getGame(gameId);


            if (!game.board) {

                game.board =
                    generateEmptyBoard();

                spawnAllUnits(
                    game.board
                );
            }


            /*
             * Find the matching unit.
             *
             * If multiple identical units exist,
             * we use the first matching unit that
             * can be identified by its current loadout.
             *
             * A stronger unique unit ID can be added
             * later when we build the full combat system.
             */

            let foundUnit =
                null;


            for (
                let r = 0;
                r < game.board.length;
                r++
            ) {

                for (
                    let c = 0;
                    c < game.board[r].length;
                    c++
                ) {

                    const stack =
                        game.board[r][c];


                    for (
                        const unit
                        of stack
                    ) {

                        if (
                            unit.type ===
                                unitType &&
                            unit.team ===
                                unitTeam
                        ) {

                            /*
                             * Prefer a unit whose current
                             * loadout matches the submitted
                             * loadout.
                             */

                            const current =
                                Array.isArray(
                                    unit.armaments
                                )
                                    ? unit.armaments
                                    : [];


                            if (
                                JSON.stringify(
                                    current
                                ) ===
                                JSON.stringify(
                                    armaments
                                )
                            ) {

                                foundUnit =
                                    unit;

                                break;
                            }


                            if (!foundUnit) {

                                foundUnit =
                                    unit;
                            }
                        }
                    }


                    if (foundUnit) {
                        break;
                    }
                }


                if (foundUnit) {
                    break;
                }
            }


            if (!foundUnit) {

                return res
                    .status(404)
                    .json({
                        status: "error",
                        message:
                            "Unit not found."
                    });
            }


            /*
             * Store loadout.
             */

            foundUnit.armaments =
                [...armaments];


            /*
             * Save complete game state.
             */

            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "Failed to save armament loadout:",
                    err.message
                );
            }


            res.json({

                status: "ok",

                message:
                    "Armament loadout updated",

                armaments:
                    foundUnit.armaments
            });

        } catch (error) {

            console.error(
                "updateArmament error:",
                error
            );

            res
                .status(500)
                .json({
                    status: "error",
                    message:
                        "Internal server error"
                });
        }
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


    /*
     * Synchronize board if the server
     * returned one.
     */

    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    /*
     * Update turn information if supplied.
     */

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


    /*
     * Synchronize returned board.
     */

    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    /*
     * Synchronize turn information.
     */

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


    /*
     * If reset returned a board,
     * synchronize it immediately.
     */

    if (
        result &&
        result.board
    ) {

        normalizeBoard(
            result.board
        );
    }


    /*
     * Reset turn state.
     */

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
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
// FOB LOCATIONS
// ============================================================
//
// These MUST match the actual FOB squares on your board.
//
// Blue FOB:
//     r 15
//     c 15
//
// Red FOB:
//     r 3
//     c 10
// ============================================================

const FOB_LOCATIONS = {

    blue: {
        r: 15,
        c: 15
    },

    red: {
        r: 3,
        c: 10
    }

};


// ============================================================
// GET FOB LOCATION
// ============================================================

export function getFOBLocation(team) {

    return (
        FOB_LOCATIONS[team] ||
        null
    );

}


// ============================================================
// CHECK UNIT IS AT FOB
// ============================================================
//
// A unit is considered to be at its FOB ONLY when the
// coordinates passed to this function match that team's FOB.
//
// Aircraft are NOT automatically considered airborne.
//
// An aircraft sitting on its FOB is NOT airborne.
// ============================================================

export function isUnitAtFOB(
    unit,
    r,
    c
) {

    if (!unit) {

        return false;

    }


    const fob =
        getFOBLocation(
            unit.team
        );


    if (!fob) {

        return false;

    }


    return (
        Number(r) === Number(fob.r) &&
        Number(c) === Number(fob.c)
    );

}


// ============================================================
// CHECK UNIT IS AIRBORNE
// ============================================================

export function isUnitAirborne(
    unit,
    r,
    c
) {

    if (!unit) {

        return false;

    }


    return !isUnitAtFOB(
        unit,
        r,
        c
    );

}


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
// GET UNIT ID
// ============================================================
//
// Unit IDs are permanent.
// No position-based fallback is used.
// ============================================================

export function getUnitId(unit) {

    if (!unit) {

        return null;

    }


    if (
        unit.id !== undefined &&
        unit.id !== null &&
        String(unit.id).trim() !== ""
    ) {

        return String(
            unit.id
        );

    }


    if (
        unit.unitId !== undefined &&
        unit.unitId !== null &&
        String(unit.unitId).trim() !== ""
    ) {

        return String(
            unit.unitId
        );

    }


    if (
        unit.uid !== undefined &&
        unit.uid !== null &&
        String(unit.uid).trim() !== ""
    ) {

        return String(
            unit.uid
        );

    }


    return null;

}


// ============================================================
// GET JSON
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
// POST JSON
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


        if (
            state &&
            state.board
        ) {

            normalizeBoard(
                state.board
            );

        }


        window.turnLocked =
            state?.turnLocked || {
                red: false,
                blue: false
            };


        window.currentTurnPlayer =
            state?.currentTurnPlayer ||
            "red";


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


    if (!movePayload.unitId) {

        throw new Error(
            "Move is missing unitId."
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
//
// IMPORTANT:
//
// Loading armaments is only allowed when the unit is
// physically sitting on its team's FOB.
//
// Example:
//
// Blue unit at 15,15
//     -> AT FOB
//     -> CAN LOAD
//
// Blue unit at 14,15
//     -> NOT AT FOB
//     -> AIRBORNE
//     -> CANNOT LOAD
//
// Red unit at 3,10
//     -> AT FOB
//     -> CAN LOAD
//
// Red unit anywhere else
//     -> AIRBORNE
//     -> CANNOT LOAD
//
// This check happens BEFORE the request is sent.
// ============================================================

export async function saveArmamentLoadout(
    unit,
    r,
    c,
    armament,
    action = "load"
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


    if (!armament) {

        throw new Error(
            "No armament was provided."
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


    // ========================================================
    // FOB CHECK
    // ========================================================
    //
    // Only perform this restriction for loading.
    //
    // This is important because unloading/cancelling a load
    // should not accidentally become impossible simply because
    // the unit has moved away from the FOB.
    // ========================================================

    if (action === "load") {

        const fob =
            getFOBLocation(
                unit.team
            );


        if (!fob) {

            throw new Error(
                `No FOB location is configured for ${unit.team}.`
            );

        }


        const atFOB =
            isUnitAtFOB(
                unit,
                r,
                c
            );


        if (!atFOB) {

            throw new Error(
                `${unit.type} is airborne and must return to its FOB before loading armaments.`
            );

        }


        console.log(
            `${unit.type} is confirmed AT FOB at (${r}, ${c}).`
        );

    }


    // ========================================================
    // UNIT ID
    // ========================================================

    const unitId =
        getUnitId(
            unit
        );


    if (!unitId) {

        throw new Error(
            "Unable to determine unit ID."
        );

    }


    // ========================================================
    // ARMAMENT ID
    // ========================================================

    const armamentId =
        armament.id;


    if (
        armamentId === undefined ||
        armamentId === null
    ) {

        throw new Error(
            "Unable to determine armament ID."
        );

    }


    // ========================================================
    // COPY LOADOUT ARRAYS
    // ========================================================

    const armaments =
        Array.isArray(
            unit.armaments
        )
            ? [...unit.armaments]
            : [];


    const loadingArmaments =
        Array.isArray(
            unit.loadingArmaments
        )
            ? [...unit.loadingArmaments]
            : [];


    // ========================================================
    // CREATE PAYLOAD
    // ========================================================

    const payload = {

        gameId,

        playerId,

        team:
            unit.team,

        action,

        unitId,

        unit: {
            ...unit,

            armaments,

            loadingArmaments
        },

        unitType:
            unit.type,

        unitTeam:
            unit.team,

        // Current board position.
        r,

        c,

        // Also provide from for compatibility with
        // the existing server.
        from: {
            r,
            c
        },

        armamentId,

        armament,

        armaments,

        loadingArmaments,

        // Explicit FOB information.
        //
        // This makes the request unambiguous to the
        // backend and gives the backend enough information
        // to perform its own validation.
        atFOB:
            isUnitAtFOB(
                unit,
                r,
                c
            ),

        airborne:
            isUnitAirborne(
                unit,
                r,
                c
            )

    };


    console.log(
        "Saving armament loadout:",
        payload
    );


    const result =
        await postJson(
            `${SERVER_URL}/updateArmament`,
            payload
        );


    console.log(
        "Armament loadout saved:",
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
// SUBMIT TURN
// ============================================================

export async function submitTurnToServer() {

    const gameId =
        getGameId();


    const playerId =
        getPlayerId();


    if (
        playerId !== "red" &&
        playerId !== "blue"
    ) {

        throw new Error(
            "Invalid player."
        );

    }


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
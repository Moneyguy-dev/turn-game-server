const axios = require("axios");
const express = require("express");
const path = require("path");

const app = express();


// ============================================================
// EXPRESS SETUP
// ============================================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ============================================================
// GAME STORAGE
// ============================================================

let games = {};


// ============================================================
// BOARD CONSTANTS
// ============================================================

const ROWS = 17;
const COLS = 19;


// ============================================================
// GITHUB PERSISTENCE
// ============================================================

async function saveGameStateToGitHub(gameState) {

    const username =
        process.env.GITHUB_USERNAME;

    const repo =
        process.env.GITHUB_REPO;

    const token =
        process.env.GITHUB_TOKEN;

    if (!username || !repo || !token) {

        console.warn(
            "⚠ GitHub persistence is not configured."
        );

        return;
    }

    const filePath = "game-state.json";

    const apiUrl =
        `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;

    const jsonString =
        JSON.stringify(
            gameState,
            null,
            2
        );

    const contentEncoded =
        Buffer
            .from(jsonString)
            .toString("base64");

    let sha = null;

    try {

        const existing =
            await axios.get(
                apiUrl,
                {
                    headers: {
                        Authorization:
                            `token ${token}`,

                        Accept:
                            "application/vnd.github+json"
                    }
                }
            );

        sha =
            existing.data.sha;

    } catch (err) {

        if (
            err.response &&
            err.response.status !== 404
        ) {

            throw err;
        }
    }

    const payload = {

        message:
            "Update game state",

        content:
            contentEncoded
    };

    if (sha) {

        payload.sha = sha;
    }

    await axios.put(
        apiUrl,
        payload,
        {
            headers: {

                Authorization:
                    `token ${token}`,

                Accept:
                    "application/vnd.github+json",

                "Content-Type":
                    "application/json"
            }
        }
    );

    console.log(
        "✔ Game state saved to GitHub"
    );
}


// ============================================================
// LOAD GAME STATE FROM GITHUB
// ============================================================

async function loadGameStateFromGitHub() {

    const username =
        process.env.GITHUB_USERNAME;

    const repo =
        process.env.GITHUB_REPO;

    const token =
        process.env.GITHUB_TOKEN;

    if (!username || !repo || !token) {

        console.warn(
            "⚠ GitHub persistence is not configured."
        );

        return null;
    }

    const filePath = "game-state.json";

    const apiUrl =
        `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;

    try {

        const res =
            await axios.get(
                apiUrl,
                {
                    headers: {

                        Authorization:
                            `token ${token}`,

                        Accept:
                            "application/vnd.github+json"
                    }
                }
            );

        const decoded =
            Buffer
                .from(
                    res.data.content,
                    "base64"
                )
                .toString("utf8");

        const gameState =
            JSON.parse(decoded);

        console.log(
            "✔ Game state restored from GitHub"
        );

        return gameState;

    } catch (err) {

        if (
            err.response &&
            err.response.status !== 404
        ) {

            console.error(
                "⚠ Failed loading game state from GitHub:",
                err.message
            );

        } else {

            console.log(
                "⚠ No saved game state found on GitHub"
            );
        }

        return null;
    }
}


// ============================================================
// GET / CREATE GAME
// ============================================================

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
            },

            pendingMoves: []
        };
    }

    return games[gameId];
}


// ============================================================
// UNIT DEFINITIONS
// ============================================================

const units = {

    blue: {

        F15E: {
            move: 8
        },

        F16: {
            move: 7
        },

        F22: {
            move: 8
        },

        F35: {
            move: 6
        },

        B2: {
            move: 10
        },

        B52: {
            move: 11
        },

        KC135: {
            move: 12
        },

        DDG80: {
            move: 6
        },

        ARG: {
            move: 3
        }
    },

    red: {

        J10: {
            move: 7
        },

        J11: {
            move: 7
        },

        J16: {
            move: 7
        },

        J20: {
            move: 8
        },

        H6: {
            move: 9
        },

        Y20: {
            move: 11
        },

        Type052: {
            move: 5
        },

        Garrison: {
            move: 0
        },

        ARG: {
            move: 3
        }
    }
};


// ============================================================
// FOB LOCATIONS
// ============================================================

const startHexes = {

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
// ADD UNIT
// ============================================================

function addUnit(
    board,
    r,
    c,
    type,
    team
) {

    board[r][c].push({

        type,

        team,

        move:
            units[team][type].move,

        armaments: [],

        loadingArmaments: []
    });
}


// ============================================================
// SPAWN ALL UNITS
// ============================================================

function spawnAllUnits(board) {

    const blueStart =
        startHexes.blue;

    const redStart =
        startHexes.red;


    Object.keys(
        units.blue
    ).forEach(
        type => {

            addUnit(
                board,
                blueStart.r,
                blueStart.c,
                type,
                "blue"
            );
        }
    );


    Object.keys(
        units.red
    ).forEach(
        type => {

            addUnit(
                board,
                redStart.r,
                redStart.c,
                type,
                "red"
            );
        }
    );
}


// ============================================================
// EMPTY BOARD
// ============================================================

function generateEmptyBoard() {

    const board = [];

    for (
        let r = 0;
        r < ROWS;
        r++
    ) {

        board[r] = [];

        for (
            let c = 0;
            c < COLS;
            c++
        ) {

            board[r][c] = [];
        }
    }

    return board;
}


// ============================================================
// NORMALIZE EXISTING UNITS
// ============================================================

function normalizeBoardUnits(board) {

    if (!Array.isArray(board)) {
        return;
    }


    for (
        let r = 0;
        r < board.length;
        r++
    ) {

        if (!Array.isArray(board[r])) {
            continue;
        }


        for (
            let c = 0;
            c < board[r].length;
            c++
        ) {

            const stack =
                board[r][c];


            if (!Array.isArray(stack)) {
                continue;
            }


            stack.forEach(unit => {

                if (!unit) {
                    return;
                }


                if (
                    !Array.isArray(
                        unit.armaments
                    )
                ) {

                    unit.armaments = [];
                }


                if (
                    !Array.isArray(
                        unit.loadingArmaments
                    )
                ) {

                    unit.loadingArmaments = [];
                }


                if (
                    unit.move === undefined &&
                    unit.team &&
                    unit.type &&
                    units[unit.team] &&
                    units[unit.team][unit.type]
                ) {

                    unit.move =
                        units[
                            unit.team
                        ][
                            unit.type
                        ].move;
                }
            });
        }
    }
}


// ============================================================
// FIND UNIT ON BOARD
// ============================================================

function findUnitOnBoard(
    board,
    options
) {

    if (
        !board ||
        !options
    ) {

        return null;
    }


    const {
        team,
        unit,
        unitId,
        from
    } = options;


    function matches(candidate) {

        if (!candidate) {
            return false;
        }


        if (
            team &&
            candidate.team !== team
        ) {

            return false;
        }


        if (
            unit &&
            candidate.type !== unit
        ) {

            return false;
        }


        if (unitId) {

            const candidateId =
                candidate.id ??
                candidate.unitId ??
                candidate.uid;


            if (
                candidateId !== undefined &&
                candidateId !== null
            ) {

                if (
                    String(candidateId) !==
                    String(unitId)
                ) {

                    return false;
                }
            }
        }


        return true;
    }


    // --------------------------------------------------------
    // SEARCH PROVIDED LOCATION FIRST
    // --------------------------------------------------------

    if (
        from &&
        Number.isInteger(from.r) &&
        Number.isInteger(from.c) &&
        from.r >= 0 &&
        from.r < ROWS &&
        from.c >= 0 &&
        from.c < COLS
    ) {

        const stack =
            board[from.r][from.c];


        if (Array.isArray(stack)) {

            const index =
                stack.findIndex(matches);


            if (index !== -1) {

                return {

                    unit:
                        stack[index],

                    stack,

                    index,

                    r:
                        from.r,

                    c:
                        from.c
                };
            }
        }
    }


    // --------------------------------------------------------
    // SEARCH ENTIRE BOARD
    // --------------------------------------------------------

    for (
        let r = 0;
        r < ROWS;
        r++
    ) {

        for (
            let c = 0;
            c < COLS;
            c++
        ) {

            const stack =
                board[r][c];


            if (!Array.isArray(stack)) {
                continue;
            }


            const index =
                stack.findIndex(matches);


            if (index !== -1) {

                return {

                    unit:
                        stack[index],

                    stack,

                    index,

                    r,

                    c
                };
            }
        }
    }


    return null;
}


// ============================================================
// APPLY MOVE
// ============================================================

function applyMoveToBoard(
    board,
    move
) {

    if (
        !move ||
        move.init
    ) {

        return true;
    }


    const {
        from,
        to,
        unit,
        team,
        unitId
    } = move;


    if (
        !from ||
        !to ||
        !unit ||
        !team
    ) {

        console.log(
            "⚠ Invalid move payload:",
            move
        );

        return false;
    }


    if (
        from.r < 0 ||
        from.r >= ROWS ||
        from.c < 0 ||
        from.c >= COLS ||
        to.r < 0 ||
        to.r >= ROWS ||
        to.c < 0 ||
        to.c >= COLS
    ) {

        console.log(
            "⚠ Move outside board:",
            move
        );

        return false;
    }


    const fromStack =
        board[from.r][from.c];

    const toStack =
        board[to.r][to.c];


    const found =
        findUnitOnBoard(
            board,
            {
                team,
                unit,
                unitId,
                from
            }
        );


    if (!found) {

        console.log(
            "⚠ Unit not found:",
            move
        );

        return false;
    }


    const movingUnit =
        found.unit;


    const actualFromStack =
        found.stack;

    const actualIndex =
        found.index;


    // --------------------------------------------------------
    // LOADING UNITS CANNOT MOVE
    // --------------------------------------------------------

    if (
        Array.isArray(
            movingUnit.loadingArmaments
        ) &&
        movingUnit.loadingArmaments.length > 0
    ) {

        console.log(
            `⚠ ${team} ${unit} cannot move because it is loading an armament.`
        );

        return false;
    }


    // --------------------------------------------------------
    // DESTINATION CAPACITY
    // --------------------------------------------------------

    if (
        toStack.length >= 4
    ) {

        console.log(
            "⚠ Destination hex is full:",
            move
        );

        return false;
    }


    actualFromStack.splice(
        actualIndex,
        1
    );

    toStack.push(
        movingUnit
    );


    console.log(
        `✔ ${team} ${unit} moved ` +
        `from ${from.r},${from.c} ` +
        `to ${to.r},${to.c}`
    );


    return true;
}


// ============================================================
// RESOLVE LOADING
// ============================================================

function resolveLoading(board) {

    if (!Array.isArray(board)) {
        return;
    }


    for (
        let r = 0;
        r < board.length;
        r++
    ) {

        if (!Array.isArray(board[r])) {
            continue;
        }


        for (
            let c = 0;
            c < board[r].length;
            c++
        ) {

            const stack =
                board[r][c];


            if (!Array.isArray(stack)) {
                continue;
            }


            stack.forEach(unit => {

                if (!unit) {
                    return;
                }


                if (
                    !Array.isArray(
                        unit.armaments
                    )
                ) {

                    unit.armaments = [];
                }


                if (
                    !Array.isArray(
                        unit.loadingArmaments
                    )
                ) {

                    unit.loadingArmaments = [];
                }


                if (
                    unit.loadingArmaments.length === 0
                ) {

                    return;
                }


                unit.loadingArmaments.forEach(
                    armamentId => {

                        if (
                            !unit.armaments.includes(
                                armamentId
                            )
                        ) {

                            unit.armaments.push(
                                armamentId
                            );
                        }
                    }
                );


                console.log(
                    `✔ ${unit.team} ${unit.type} finished loading:`,
                    unit.loadingArmaments
                );


                unit.loadingArmaments = [];
            });
        }
    }
}


// ============================================================
// ENSURE GAME BOARD
// ============================================================

function ensureGameBoard(game) {

    if (!game.board) {

        game.board =
            generateEmptyBoard();

        spawnAllUnits(
            game.board
        );
    }

    normalizeBoardUnits(
        game.board
    );


    if (!Array.isArray(game.pendingMoves)) {

        game.pendingMoves = [];
    }


    if (!Array.isArray(game.moveHistory)) {

        game.moveHistory = [];
    }


    if (!game.turnLocked) {

        game.turnLocked = {

            red: false,

            blue: false
        };
    }


    if (
        game.currentTurnPlayer !== "red" &&
        game.currentTurnPlayer !== "blue"
    ) {

        game.currentTurnPlayer = "red";
    }
}


// ============================================================
// UPDATE ARMAMENT
// ============================================================

app.post(
    "/updateArmament",
    async (req, res) => {

        try {

            const {
                gameId,
                playerId,
                team,
                unit,
                unitId,
                from,
                armament,
                action
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
                playerId !== undefined &&
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


            const requestedTeam =
                team ||
                playerId;


            if (
                requestedTeam !== "red" &&
                requestedTeam !== "blue"
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing or invalid team"
                    });
            }


            if (
                playerId &&
                requestedTeam !== playerId
            ) {

                return res
                    .status(403)
                    .json({

                        status: "error",

                        message:
                            "You can only update your own units."
                    });
            }


            if (
                !unit &&
                !unitId
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing unit or unitId"
                    });
            }


            const validActions = [
                "load",
                "unload",
                "cancelLoad"
            ];


            const resolvedAction =
                action || "load";


            if (
                !validActions.includes(
                    resolvedAction
                )
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Invalid armament action"
                    });
            }


            if (
                armament === undefined ||
                armament === null
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing armament"
                    });
            }


            const armamentId =
                armament.id;


            if (
                armamentId === undefined ||
                armamentId === null
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing armament ID"
                    });
            }


            const game =
                getGame(gameId);


            ensureGameBoard(game);


            const found =
                findUnitOnBoard(
                    game.board,
                    {
                        team:
                            requestedTeam,

                        unit,

                        unitId,

                        from
                    }
                );


            if (!found) {

                return res
                    .status(404)
                    .json({

                        status: "error",

                        message:
                            "Unit not found on the board"
                    });
            }


            const targetUnit =
                found.unit;


            if (
                resolvedAction === "load"
            ) {

                if (
                    targetUnit.armaments.includes(
                        armamentId
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            status: "error",

                            message:
                                "Armament is already loaded on this unit."
                        });
                }


                if (
                    targetUnit.loadingArmaments.includes(
                        armamentId
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            status: "error",

                            message:
                                "Armament is already loading on this unit."
                        });
                }


                targetUnit.loadingArmaments.push(
                    armamentId
                );
            }


            else if (
                resolvedAction === "unload"
            ) {

                const index =
                    targetUnit.armaments.indexOf(
                        armamentId
                    );


                if (index === -1) {

                    return res
                        .status(400)
                        .json({

                            status: "error",

                            message:
                                "Armament is not loaded on this unit."
                        });
                }


                targetUnit.armaments.splice(
                    index,
                    1
                );
            }


            else if (
                resolvedAction === "cancelLoad"
            ) {

                const index =
                    targetUnit.loadingArmaments.indexOf(
                        armamentId
                    );


                if (index === -1) {

                    return res
                        .status(400)
                        .json({

                            status: "error",

                            message:
                                "Armament is not currently loading."
                        });
                }


                targetUnit.loadingArmaments.splice(
                    index,
                    1
                );
            }


            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after armament update:",
                    err.message
                );

                return res
                    .status(500)
                    .json({

                        status: "error",

                        message:
                            "Armament updated in memory but failed to save game state."
                    });
            }


            return res.json({

                status: "ok",

                message:
                    "Armament updated",

                action:
                    resolvedAction,

                gameId,

                unit: {
                    ...targetUnit
                },

                location: {

                    r: found.r,

                    c: found.c
                },

                board:
                    game.board,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

                pendingMoves:
                    game.pendingMoves.length
            });

        } catch (error) {

            console.error(
                "updateArmament error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// SUBMIT MOVE
// ============================================================

app.post(
    "/submitMove",
    async (req, res) => {

        try {

            const {
                gameId,
                playerId,
                move
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


            if (!move) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing move"
                    });
            }


            const game =
                getGame(gameId);


            ensureGameBoard(game);


            if (
                game.turnLocked[playerId]
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            `${playerId} has already submitted this turn`
                    });
            }


            if (
                move.team !== playerId
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "You can only move your own units."
                    });
            }


            // ------------------------------------------------
            // CHECK LOADING UNIT
            // ------------------------------------------------

            const found =
                findUnitOnBoard(
                    game.board,
                    {
                        team:
                            playerId,

                        unit:
                            move.unit,

                        unitId:
                            move.unitId,

                        from:
                            move.from
                    }
                );


            if (
                found &&
                Array.isArray(
                    found.unit.loadingArmaments
                ) &&
                found.unit.loadingArmaments.length > 0
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            `${move.unit} is loading an armament and cannot move this round.`
                    });
            }


            // ------------------------------------------------
            // STORE MOVE
            // ------------------------------------------------

            game.pendingMoves.push({

                playerId,

                move
            });


            game.moveHistory.push({

                playerId,

                move
            });


            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after move:",
                    err.message
                );
            }


            return res.json({

                status: "ok",

                message:
                    "Move stored",

                turnLocked:
                    game.turnLocked,

                pendingMoves:
                    game.pendingMoves.length
            });

        } catch (error) {

            console.error(
                "submitMove error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// SUBMIT TURN
// ============================================================
//
// IMPORTANT:
//
// A player may submit independently.
// The server does NOT require both players.
//
// Red can submit while Blue does nothing.
// Blue can submit while Red does nothing.
//
// Continue Turn is NOT dependent on both
// players being locked.
// ============================================================

app.post(
    "/submitTurn",
    async (req, res) => {

        try {

            const {
                gameId,
                playerId
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


            const game =
                getGame(gameId);


            ensureGameBoard(game);


            if (
                game.turnLocked[playerId]
            ) {

                return res.json({

                    status: "ok",

                    message:
                        `${playerId} already submitted`,

                    turnLocked:
                        game.turnLocked,

                    currentTurnPlayer:
                        game.currentTurnPlayer,

                    pendingMoves:
                        game.pendingMoves.length
                });
            }


            game.turnLocked[playerId] =
                true;


            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after submitTurn:",
                    err.message
                );
            }


            return res.json({

                status: "ok",

                message:
                    `${playerId} submitted turn`,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

                pendingMoves:
                    game.pendingMoves.length
            });

        } catch (error) {

            console.error(
                "submitTurn error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// CONTINUE / RESOLVE TURN
// ============================================================
//
// IMPORTANT:
//
// Continue Turn ALWAYS works.
//
// It does NOT require:
//   red.turnLocked === true
//
// It does NOT require:
//   blue.turnLocked === true
//
// It will resolve whatever moves have been submitted.
//
// Examples:
//
// Red submitted, Blue didn't:
//     -> Red move resolves.
//
// Blue submitted, Red didn't:
//     -> Blue move resolves.
//
// Both submitted:
//     -> Both moves resolve.
//
// Nobody submitted:
//     -> Nothing moves, but the turn still resets.
// ============================================================

app.post(
    "/continueTurn",
    async (req, res) => {

        try {

            const {
                gameId
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


            const game =
                getGame(gameId);


            ensureGameBoard(game);


            console.log(
                "================================================"
            );

            console.log(
                "CONTINUE TURN"
            );

            console.log(
                "Game:",
                gameId
            );

            console.log(
                "Red submitted:",
                game.turnLocked.red
            );

            console.log(
                "Blue submitted:",
                game.turnLocked.blue
            );

            console.log(
                "Pending moves:",
                game.pendingMoves.length
            );

            console.log(
                "================================================"
            );


            // ------------------------------------------------
            // RESOLVE ALL SUBMITTED MOVES
            // ------------------------------------------------

            const pendingMoves =
                Array.isArray(
                    game.pendingMoves
                )
                    ? [
                        ...game.pendingMoves
                    ]
                    : [];


            const results = [];


            for (
                const entry
                of pendingMoves
            ) {

                if (!entry || !entry.move) {
                    continue;
                }


                const success =
                    applyMoveToBoard(
                        game.board,
                        entry.move
                    );


                results.push({

                    playerId:
                        entry.playerId,

                    move:
                        entry.move,

                    success
                });
            }


            // ------------------------------------------------
            // FINISH ARMAMENT LOADING
            // ------------------------------------------------

            resolveLoading(
                game.board
            );


            // ------------------------------------------------
            // CLEAR PENDING MOVES
            // ------------------------------------------------

            game.pendingMoves = [];


            // ------------------------------------------------
            // UNLOCK BOTH SIDES
            // ------------------------------------------------

            game.turnLocked = {

                red: false,

                blue: false
            };


            // ------------------------------------------------
            // NEXT TURN
            // ------------------------------------------------

            game.currentTurnPlayer =
                "red";


            // ------------------------------------------------
            // SAVE
            // ------------------------------------------------

            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after continueTurn:",
                    err.message
                );
            }


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            return res.json({

                status: "ok",

                message:
                    "Turn resolved",

                gameId,

                board:
                    game.board,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

                pendingMoves:
                    0,

                resolvedMoves:
                    results
            });

        } catch (error) {

            console.error(
                "continueTurn error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// RESET GAME
// ============================================================

app.post(
    "/resetGame",
    async (req, res) => {

        try {

            const {
                gameId
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


            delete games[gameId];


            const game =
                getGame(gameId);


            game.board =
                generateEmptyBoard();


            spawnAllUnits(
                game.board
            );


            game.lastMove =
                null;


            game.moveHistory =
                [];


            game.turnLocked = {

                red: false,

                blue: false
            };


            game.currentTurnPlayer =
                "red";


            game.pendingMoves =
                [];


            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after reset:",
                    err.message
                );
            }


            return res.json({

                status: "ok",

                message:
                    "Game reset with units at FOBs",

                board:
                    game.board,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

                pendingMoves:
                    0
            });

        } catch (error) {

            console.error(
                "resetGame error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// GET GAME STATE
// ============================================================

app.get(
    "/gameState",
    (req, res) => {

        try {

            const gameId =
                req.query.gameId;


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing gameId"
                    });
            }


            const game =
                getGame(gameId);


            ensureGameBoard(game);


            return res.json({

                gameId:
                    game.gameId,

                board:
                    game.board,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

                pendingMoves:
                    game.pendingMoves.length
            });

        } catch (error) {

            console.error(
                "gameState error:",
                error
            );

            return res
                .status(500)
                .json({

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// LOAD SAVED GAME
// ============================================================

(async () => {

    try {

        const saved =
            await loadGameStateFromGitHub();


        if (saved) {

            games = saved;

            console.log(
                "✔ Saved games loaded"
            );


            Object.values(
                games
            ).forEach(game => {

                if (!game.gameId) {

                    game.gameId =
                        Object.keys(
                            games
                        ).find(
                            id =>
                                games[id] === game
                        );
                }


                if (!Array.isArray(
                    game.pendingMoves
                )) {

                    game.pendingMoves = [];
                }


                if (!Array.isArray(
                    game.moveHistory
                )) {

                    game.moveHistory = [];
                }


                if (!game.turnLocked) {

                    game.turnLocked = {

                        red: false,

                        blue: false
                    };
                }


                if (
                    game.currentTurnPlayer !== "red" &&
                    game.currentTurnPlayer !== "blue"
                ) {

                    game.currentTurnPlayer =
                        "red";
                }


                if (game.board) {

                    normalizeBoardUnits(
                        game.board
                    );
                }
            });

        } else {

            console.log(
                "ℹ Starting with empty game storage"
            );
        }

    } catch (error) {

        console.error(
            "⚠ Failed to initialize saved games:",
            error
        );
    }

})();


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT ||
    3000;


app.listen(
    PORT,
    () => {

        console.log(
            `HTTP server running on port ${PORT}`
        );

        console.log(
            "✔ Continue Turn does NOT require both players to submit."
        );
    }
);
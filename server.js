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
// SERVER CONFIG
// ============================================================

const PORT =
    process.env.PORT || 3000;


// ============================================================
// GITHUB CONFIG
// ============================================================

const GITHUB_USERNAME =
    process.env.GITHUB_USERNAME;

const GITHUB_REPO =
    process.env.GITHUB_REPO;

const GITHUB_TOKEN =
    process.env.GITHUB_TOKEN;

const GITHUB_FILE =
    "game-state.json";


// ============================================================
// GITHUB API URL
// ============================================================

function getGitHubApiUrl() {

    return (
        `https://api.github.com/repos/` +
        `${GITHUB_USERNAME}/` +
        `${GITHUB_REPO}/contents/` +
        `${GITHUB_FILE}`
    );
}


// ============================================================
// GITHUB HEADERS
// ============================================================

function getGitHubHeaders() {

    const headers = {
        Accept:
            "application/vnd.github+json"
    };

    if (GITHUB_TOKEN) {

        headers.Authorization =
            `Bearer ${GITHUB_TOKEN}`;
    }

    return headers;
}


// ============================================================
// SAVE GAME STATE TO GITHUB
// ============================================================

async function saveGameStateToGitHub() {

    if (
        !GITHUB_USERNAME ||
        !GITHUB_REPO ||
        !GITHUB_TOKEN
    ) {

        console.log(
            "ℹ GitHub persistence not configured."
        );

        return;
    }


    const apiUrl =
        getGitHubApiUrl();


    const jsonString =
        JSON.stringify(
            games,
            null,
            2
        );


    const contentEncoded =
        Buffer
            .from(jsonString)
            .toString("base64");


    let sha = null;


    // --------------------------------------------------------
    // GET EXISTING FILE SHA
    // --------------------------------------------------------

    try {

        const existing =
            await axios.get(
                apiUrl,
                {
                    headers:
                        getGitHubHeaders()
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


    // --------------------------------------------------------
    // CREATE / UPDATE FILE
    // --------------------------------------------------------

    const payload = {

        message:
            "Update game state",

        content:
            contentEncoded
    };


    if (sha) {

        payload.sha =
            sha;
    }


    await axios.put(
        apiUrl,
        payload,
        {
            headers:
                getGitHubHeaders()
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

    if (
        !GITHUB_USERNAME ||
        !GITHUB_REPO ||
        !GITHUB_TOKEN
    ) {

        console.log(
            "ℹ GitHub persistence not configured."
        );

        return null;
    }


    const apiUrl =
        getGitHubApiUrl();


    try {

        const response =
            await axios.get(
                apiUrl,
                {
                    headers:
                        getGitHubHeaders()
                }
            );


        const decoded =
            Buffer
                .from(
                    response.data.content,
                    "base64"
                )
                .toString("utf8");


        const savedGames =
            JSON.parse(
                decoded
            );


        console.log(
            "✔ Game state restored from GitHub"
        );


        return savedGames;

    } catch (err) {

        if (
            err.response &&
            err.response.status === 404
        ) {

            console.log(
                "ℹ No saved game state found on GitHub"
            );

            return null;
        }


        console.error(
            "⚠ Failed loading game state from GitHub:",
            err.message
        );


        return null;
    }
}


// ============================================================
// GAME CREATION
// ============================================================

function createGame(
    gameId
) {

    return {

        gameId,

        board:
            null,

        lastMove:
            null,

        moveHistory:
            [],

        currentTurnPlayer:
            "red",

        unlockTime:
            null,

        turnLocked: {

            red:
                false,

            blue:
                false
        },

        pendingMoves:
            []
    };
}


// ============================================================
// GET / CREATE GAME
// ============================================================

function getGame(
    gameId
) {

    if (
        !games[gameId]
    ) {

        games[gameId] =
            createGame(
                gameId
            );
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
// GENERATE UNIT ID
// ============================================================

function makeUnitId(
    team,
    type,
    index
) {

    return `${team}-${type}-${index}`;
}


// ============================================================
// ADD UNIT
// ============================================================

function addUnit(
    board,
    r,
    c,
    type,
    team,
    index
) {

    if (
        !board?.[r]?.[c]
    ) {

        return;
    }


    board[r][c].push({

        id:
            makeUnitId(
                team,
                type,
                index
            ),

        type,

        team,

        move:
            units[team][type].move,

        armaments:
            [],

        loadingArmaments:
            []
    });
}


// ============================================================
// SPAWN ALL UNITS
// ============================================================

function spawnAllUnits(
    board
) {

    const blueStart =
        startHexes.blue;

    const redStart =
        startHexes.red;


    Object.keys(
        units.blue
    ).forEach(
        (type, index) => {

            addUnit(
                board,

                blueStart.r,
                blueStart.c,

                type,
                "blue",

                index
            );
        }
    );


    Object.keys(
        units.red
    ).forEach(
        (type, index) => {

            addUnit(
                board,

                redStart.r,
                redStart.c,

                type,
                "red",

                index
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
// ENSURE BOARD EXISTS
// ============================================================

function ensureBoard(
    game
) {

    if (
        !game.board
    ) {

        game.board =
            generateEmptyBoard();

        spawnAllUnits(
            game.board
        );
    }


    normalizeBoardUnits(
        game.board
    );


    return game.board;
}


// ============================================================
// NORMALIZE BOARD
// ============================================================

function normalizeBoardUnits(
    board
) {

    if (
        !Array.isArray(board)
    ) {

        return;
    }


    let fallbackCounters = {};


    for (
        let r = 0;
        r < board.length;
        r++
    ) {

        if (
            !Array.isArray(
                board[r]
            )
        ) {

            continue;
        }


        for (
            let c = 0;
            c < board[r].length;
            c++
        ) {

            const stack =
                board[r][c];


            if (
                !Array.isArray(stack)
            ) {

                continue;
            }


            stack.forEach(
                unit => {

                    if (!unit) {
                        return;
                    }


                    if (
                        !Array.isArray(
                            unit.armaments
                        )
                    ) {

                        unit.armaments =
                            [];
                    }


                    if (
                        !Array.isArray(
                            unit.loadingArmaments
                        )
                    ) {

                        unit.loadingArmaments =
                            [];
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


                    // ------------------------------------------------
                    // GIVE OLD UNITS AN ID
                    // ------------------------------------------------

                    if (
                        unit.id === undefined ||
                        unit.id === null ||
                        String(unit.id).trim() === ""
                    ) {

                        const key =
                            `${unit.team}-${unit.type}`;

                        fallbackCounters[key] =
                            (
                                fallbackCounters[key] ||
                                0
                            ) + 1;


                        unit.id =
                            makeUnitId(
                                unit.team,
                                unit.type,
                                fallbackCounters[key]
                            );
                    }
                }
            );
        }
    }
}


// ============================================================
// EXTRACT UNIT TYPE
// ============================================================
//
// Accepts:
//
// "F16"
//
// OR
//
// { type: "F16", ... }
//
// OR
//
// { unitType: "F16", ... }
// ============================================================

function getUnitType(
    unit,
    unitType
) {

    if (
        typeof unit === "string"
    ) {

        return unit;
    }


    if (
        unit &&
        typeof unit === "object"
    ) {

        if (
            unit.type
        ) {

            return unit.type;
        }


        if (
            unit.unitType
        ) {

            return unit.unitType;
        }
    }


    if (
        typeof unitType === "string"
    ) {

        return unitType;
    }


    return null;
}


// ============================================================
// EXTRACT UNIT ID
// ============================================================

function getUnitId(
    unit,
    unitId
) {

    if (
        unitId !== undefined &&
        unitId !== null &&
        String(unitId).trim() !== ""
    ) {

        return String(
            unitId
        );
    }


    if (
        unit &&
        typeof unit === "object"
    ) {

        const id =
            unit.id ??
            unit.unitId ??
            unit.uid;


        if (
            id !== undefined &&
            id !== null &&
            String(id).trim() !== ""
        ) {

            return String(
                id
            );
        }
    }


    return null;
}


// ============================================================
// FIND UNIT ON BOARD
// ============================================================

function findUnitOnBoard(
    board,
    options = {}
) {

    if (
        !board
    ) {

        return null;
    }


    const team =
        options.team;


    const unitType =
        getUnitType(
            options.unit,
            options.unitType
        );


    const requestedUnitId =
        getUnitId(
            options.unit,
            options.unitId
        );


    const from =
        options.from;


    function matches(
        candidate
    ) {

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
            unitType &&
            candidate.type !== unitType
        ) {

            return false;
        }


        if (
            requestedUnitId
        ) {

            const candidateId =
                getUnitId(
                    candidate,
                    null
                );


            if (
                candidateId &&
                String(candidateId) !==
                String(requestedUnitId)
            ) {

                return false;
            }
        }


        return true;
    }


    // --------------------------------------------------------
    // SEARCH SPECIFIED LOCATION FIRST
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
            board[from.r]?.[from.c];


        if (
            Array.isArray(stack)
        ) {

            const index =
                stack.findIndex(
                    matches
                );


            if (
                index !== -1
            ) {

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
                board[r]?.[c];


            if (
                !Array.isArray(stack)
            ) {

                continue;
            }


            const index =
                stack.findIndex(
                    matches
                );


            if (
                index !== -1
            ) {

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
        unitId,
        unitType,
        team
    } = move;


    if (
        !from ||
        !to ||
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

                unitType,

                from
            }
        );


    if (
        !found
    ) {

        console.log(
            "⚠ Unit not found while applying move:",
            {
                team,
                unit,
                unitId,
                unitType,
                from
            }
        );

        return false;
    }


    const movingUnit =
        found.unit;


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
            `⚠ ${team} ${movingUnit.type} ` +
            `cannot move because it is loading.`
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


    // --------------------------------------------------------
    // REMOVE FROM ORIGINAL STACK
    // --------------------------------------------------------

    found.stack.splice(
        found.index,
        1
    );


    // --------------------------------------------------------
    // ADD TO DESTINATION
    // --------------------------------------------------------

    toStack.push(
        movingUnit
    );


    gameLogMove(
        movingUnit,
        from,
        to
    );


    return true;
}


// ============================================================
// LOG MOVE
// ============================================================

function gameLogMove(
    unit,
    from,
    to
) {

    console.log(
        `✔ ${unit.team} ${unit.type} ` +
        `moved from ` +
        `${from.r},${from.c} ` +
        `to ` +
        `${to.r},${to.c}`
    );
}


// ============================================================
// RESOLVE LOADING
// ============================================================

function resolveLoading(
    board
) {

    if (
        !Array.isArray(board)
    ) {

        return;
    }


    for (
        let r = 0;
        r < board.length;
        r++
    ) {

        if (
            !Array.isArray(
                board[r]
            )
        ) {

            continue;
        }


        for (
            let c = 0;
            c < board[r].length;
            c++
        ) {

            const stack =
                board[r][c];


            if (
                !Array.isArray(stack)
            ) {

                continue;
            }


            stack.forEach(
                unit => {

                    if (!unit) {
                        return;
                    }


                    if (
                        !Array.isArray(
                            unit.armaments
                        )
                    ) {

                        unit.armaments =
                            [];
                    }


                    if (
                        !Array.isArray(
                            unit.loadingArmaments
                        )
                    ) {

                        unit.loadingArmaments =
                            [];
                    }


                    if (
                        unit.loadingArmaments.length === 0
                    ) {

                        return;
                    }


                    const loading =
                        [
                            ...unit.loadingArmaments
                        ];


                    loading.forEach(
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
                        `✔ ${unit.team} ` +
                        `${unit.type} finished loading:`,
                        loading
                    );


                    unit.loadingArmaments =
                        [];
                }
            );
        }
    }
}


// ============================================================
// UPDATE ARMAMENT
// ============================================================

app.post(
    "/updateArmament",
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body || {};


            const {
                gameId,
                playerId,
                team,
                unit,
                unitId,
                unitType,
                from,
                armament,
                action
            } = body;


            // ------------------------------------------------
            // VALIDATE GAME
            // ------------------------------------------------

            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing gameId"
                    });
            }


            // ------------------------------------------------
            // VALIDATE PLAYER
            // ------------------------------------------------

            if (
                playerId !== "red" &&
                playerId !== "blue"
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Invalid playerId"
                    });
            }


            // ------------------------------------------------
            // DETERMINE TEAM
            // ------------------------------------------------

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

                        status:
                            "error",

                        message:
                            "Missing or invalid team"
                    });
            }


            if (
                requestedTeam !== playerId
            ) {

                return res
                    .status(403)
                    .json({

                        status:
                            "error",

                        message:
                            "You can only update your own units."
                    });
            }


            // ------------------------------------------------
            // GET UNIT TYPE
            // ------------------------------------------------

            const resolvedUnitType =
                getUnitType(
                    unit,
                    unitType
                );


            const resolvedUnitId =
                getUnitId(
                    unit,
                    unitId
                );


            if (
                !resolvedUnitType &&
                !resolvedUnitId
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing unit or unitId"
                    });
            }


            // ------------------------------------------------
            // VALIDATE ACTION
            // ------------------------------------------------

            const validActions = [
                "load",
                "unload",
                "cancelLoad"
            ];


            const resolvedAction =
                action ||
                "load";


            if (
                !validActions.includes(
                    resolvedAction
                )
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Invalid armament action"
                    });
            }


            // ------------------------------------------------
            // VALIDATE ARMAMENT
            // ------------------------------------------------

            if (
                armament === undefined ||
                armament === null
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

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

                        status:
                            "error",

                        message:
                            "Missing armament ID"
                    });
            }


            // ------------------------------------------------
            // GET GAME
            // ------------------------------------------------

            const game =
                getGame(
                    gameId
                );


            ensureBoard(
                game
            );


            // ------------------------------------------------
            // FIND UNIT
            // ------------------------------------------------

            const found =
                findUnitOnBoard(
                    game.board,
                    {
                        team:
                            requestedTeam,

                        unit,

                        unitId:
                            resolvedUnitId,

                        unitType,

                        from
                    }
                );


            if (
                !found
            ) {

                console.log(
                    "⚠ updateArmament unit lookup failed:",
                    {
                        gameId,
                        playerId,
                        requestedTeam,
                        resolvedUnitType,
                        resolvedUnitId,
                        from
                    }
                );


                return res
                    .status(404)
                    .json({

                        status:
                            "error",

                        message:
                            "Unit not found on the board",

                        debug: {

                            team:
                                requestedTeam,

                            unitType:
                                resolvedUnitType,

                            unitId:
                                resolvedUnitId,

                            from:
                                from || null
                        }
                    });
            }


            const targetUnit =
                found.unit;


            // ------------------------------------------------
            // NORMALIZE ARMAMENT ARRAYS
            // ------------------------------------------------

            if (
                !Array.isArray(
                    targetUnit.armaments
                )
            ) {

                targetUnit.armaments =
                    [];
            }


            if (
                !Array.isArray(
                    targetUnit.loadingArmaments
                )
            ) {

                targetUnit.loadingArmaments =
                    [];
            }


            // ------------------------------------------------
            // LOAD
            // ------------------------------------------------

            if (
                resolvedAction ===
                "load"
            ) {

                if (
                    targetUnit.armaments.includes(
                        armamentId
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            status:
                                "error",

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

                            status:
                                "error",

                            message:
                                "Armament is already loading on this unit."
                        });
                }


                targetUnit.loadingArmaments.push(
                    armamentId
                );
            }


            // ------------------------------------------------
            // UNLOAD
            // ------------------------------------------------

            else if (
                resolvedAction ===
                "unload"
            ) {

                const index =
                    targetUnit.armaments.indexOf(
                        armamentId
                    );


                if (
                    index === -1
                ) {

                    return res
                        .status(400)
                        .json({

                            status:
                                "error",

                            message:
                                "Armament is not loaded on this unit."
                        });
                }


                targetUnit.armaments.splice(
                    index,
                    1
                );
            }


            // ------------------------------------------------
            // CANCEL LOAD
            // ------------------------------------------------

            else if (
                resolvedAction ===
                "cancelLoad"
            ) {

                const index =
                    targetUnit.loadingArmaments.indexOf(
                        armamentId
                    );


                if (
                    index === -1
                ) {

                    return res
                        .status(400)
                        .json({

                            status:
                                "error",

                            message:
                                "Armament is not currently loading."
                        });
                }


                targetUnit.loadingArmaments.splice(
                    index,
                    1
                );
            }


            // ------------------------------------------------
            // SAVE
            // ------------------------------------------------

            try {

                await saveGameStateToGitHub();

            } catch (err) {

                console.error(
                    "⚠ Failed to save after armament update:",
                    err.message
                );

                return res
                    .status(500)
                    .json({

                        status:
                            "error",

                        message:
                            "Armament updated in memory but failed to save game state."
                    });
            }


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            return res.json({

                status:
                    "ok",

                message:
                    "Armament updated",

                action:
                    resolvedAction,

                gameId,

                unit:
                    {
                        ...targetUnit
                    },

                location: {

                    r:
                        found.r,

                    c:
                        found.c
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

                    status:
                        "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// SUBMIT MOVE
// ============================================================
//
// IMPORTANT:
//
// There is intentionally NO check here that:
//
//     playerId === currentTurnPlayer
//
// Both teams may submit their moves independently.
//
// ============================================================

app.post(
    "/submitMove",
    async (
        req,
        res
    ) => {

        try {

            const {
                gameId,
                playerId,
                move
            } =
                req.body || {};


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

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

                        status:
                            "error",

                        message:
                            "Invalid playerId"
                    });
            }


            if (!move) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing move"
                    });
            }


            const game =
                getGame(
                    gameId
                );


            ensureBoard(
                game
            );


            // ------------------------------------------------
            // EACH PLAYER CAN SUBMIT ONCE
            // ------------------------------------------------

            if (
                game.turnLocked[playerId]
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            `${playerId} has already submitted this turn`
                    });
            }


            // ------------------------------------------------
            // PLAYER MUST MOVE OWN TEAM
            // ------------------------------------------------

            if (
                move.team !== playerId
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "You can only move your own units."
                    });
            }


            // ------------------------------------------------
            // FIND UNIT
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

                        unitType:
                            move.unitType,

                        from:
                            move.from
                    }
                );


            if (
                !found
            ) {

                console.log(
                    "⚠ submitMove unit lookup failed:",
                    {
                        playerId,

                        unit:
                            move.unit,

                        unitId:
                            move.unitId,

                        unitType:
                            move.unitType,

                        from:
                            move.from
                    }
                );


                return res
                    .status(404)
                    .json({

                        status:
                            "error",

                        message:
                            "Unit not found on the board",

                        debug: {

                            playerId,

                            unit:
                                move.unit,

                            unitId:
                                move.unitId,

                            unitType:
                                move.unitType,

                            from:
                                move.from
                        }
                    });
            }


            // ------------------------------------------------
            // LOADING UNIT CANNOT MOVE
            // ------------------------------------------------

            if (
                Array.isArray(
                    found.unit.loadingArmaments
                ) &&
                found.unit.loadingArmaments.length > 0
            ) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            `${found.unit.type} is loading an armament and cannot move this round.`
                    });
            }


            // ------------------------------------------------
            // STORE MOVE
            // ------------------------------------------------

            const storedMove = {

                playerId,

                move: {

                    ...move,

                    unit:
                        found.unit.type,

                    unitId:
                        found.unit.id
                }
            };


            game.pendingMoves.push(
                storedMove
            );


            game.moveHistory.push(
                storedMove
            );


            game.lastMove =
                storedMove;


            // ------------------------------------------------
            // LOCK PLAYER
            // ------------------------------------------------

            game.turnLocked[playerId] =
                true;


            // ------------------------------------------------
            // SAVE
            // ------------------------------------------------

            try {

                await saveGameStateToGitHub();

            } catch (err) {

                console.error(
                    "⚠ Failed to save after move:",
                    err.message
                );
            }


            return res.json({

                status:
                    "ok",

                message:
                    "Move stored",

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer,

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

                    status:
                        "error",

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
// This simply marks that side as finished.
//
// It does NOT require it to be that side's "turn".
//
// ============================================================

app.post(
    "/submitTurn",
    async (
        req,
        res
    ) => {

        try {

            const {
                gameId,
                playerId
            } =
                req.body || {};


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

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

                        status:
                            "error",

                        message:
                            "Invalid playerId"
                    });
            }


            const game =
                getGame(
                    gameId
                );


            // ------------------------------------------------
            // DO NOT REQUIRE CURRENT TURN
            // ------------------------------------------------

            game.turnLocked[playerId] =
                true;


            try {

                await saveGameStateToGitHub();

            } catch (err) {

                console.error(
                    "⚠ Failed to save after submitTurn:",
                    err.message
                );
            }


            return res.json({

                status:
                    "ok",

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

                    status:
                        "error",

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
// ANYONE can call this endpoint.
//
// It does NOT require:
//
//     red === locked
//     blue === locked
//
// It simply resolves whatever moves have been submitted.
//
// ============================================================

app.post(
    "/continueTurn",
    async (
        req,
        res
    ) => {

        try {

            const {
                gameId
            } =
                req.body || {};


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing gameId"
                    });
            }


            const game =
                getGame(
                    gameId
                );


            ensureBoard(
                game
            );


            console.log(
                "Continuing turn:",
                {
                    gameId,

                    pendingMoves:
                        game.pendingMoves.length,

                    turnLocked:
                        game.turnLocked
                }
            );


            // ------------------------------------------------
            // RESOLVE ALL PENDING MOVES
            // ------------------------------------------------

            const pendingMoves =
                Array.isArray(
                    game.pendingMoves
                )
                    ? [
                        ...game.pendingMoves
                    ]
                    : [];


            for (
                const entry
                of pendingMoves
            ) {

                if (
                    !entry ||
                    !entry.move
                ) {

                    continue;
                }


                const success =
                    applyMoveToBoard(
                        game.board,
                        entry.move
                    );


                if (!success) {

                    console.log(
                        "⚠ Move failed during turn resolution:",
                        entry.move
                    );
                }
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

            game.pendingMoves =
                [];


            // ------------------------------------------------
            // UNLOCK BOTH PLAYERS
            // ------------------------------------------------

            game.turnLocked = {

                red:
                    false,

                blue:
                    false
            };


            // ------------------------------------------------
            // KEEP TURN INFORMATION SIMPLE
            // ------------------------------------------------
            //
            // Red remains the nominal starting player.
            //
            // More importantly, this value is NOT used to
            // prevent either side from submitting moves.
            //

            game.currentTurnPlayer =
                "red";


            // ------------------------------------------------
            // SAVE
            // ------------------------------------------------

            try {

                await saveGameStateToGitHub();

            } catch (err) {

                console.error(
                    "⚠ Failed to save after continueTurn:",
                    err.message
                );
            }


            return res.json({

                status:
                    "ok",

                message:
                    "Turn resolved",

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
                "continueTurn error:",
                error
            );


            return res
                .status(500)
                .json({

                    status:
                        "error",

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
    async (
        req,
        res
    ) => {

        try {

            const {
                gameId
            } =
                req.body || {};


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing gameId"
                    });
            }


            delete games[gameId];


            const game =
                getGame(
                    gameId
                );


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

                red:
                    false,

                blue:
                    false
            };


            game.currentTurnPlayer =
                "red";


            game.pendingMoves =
                [];


            try {

                await saveGameStateToGitHub();

            } catch (err) {

                console.error(
                    "⚠ Failed to save after reset:",
                    err.message
                );
            }


            return res.json({

                status:
                    "ok",

                message:
                    "Game reset with units at FOBs",

                board:
                    game.board,

                turnLocked:
                    game.turnLocked,

                currentTurnPlayer:
                    game.currentTurnPlayer
            });

        } catch (error) {

            console.error(
                "resetGame error:",
                error
            );


            return res
                .status(500)
                .json({

                    status:
                        "error",

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
    (
        req,
        res
    ) => {

        try {

            const gameId =
                req.query.gameId;


            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status:
                            "error",

                        message:
                            "Missing gameId"
                    });
            }


            const game =
                getGame(
                    gameId
                );


            ensureBoard(
                game
            );


            if (
                !Array.isArray(
                    game.pendingMoves
                )
            ) {

                game.pendingMoves =
                    [];
            }


            if (
                !game.turnLocked
            ) {

                game.turnLocked = {

                    red:
                        false,

                    blue:
                        false
                };
            }


            if (
                !game.currentTurnPlayer
            ) {

                game.currentTurnPlayer =
                    "red";
            }


            const safeGame = {

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
            };


            return res.json(
                safeGame
            );

        } catch (error) {

            console.error(
                "gameState error:",
                error
            );


            return res
                .status(500)
                .json({

                    status:
                        "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/",
    (
        req,
        res
    ) => {

        res.json({

            status:
                "ok",

            message:
                "Turn game server is running",

            games:
                Object.keys(
                    games
                ).length
        });
    }
);


// ============================================================
// LOAD SAVED GAMES
// ============================================================

(async () => {

    try {

        const saved =
            await loadGameStateFromGitHub();


        if (
            saved &&
            typeof saved === "object"
        ) {

            games =
                saved;


            console.log(
                "✔ Saved games loaded"
            );


            Object.entries(
                games
            ).forEach(
                ([gameId, game]) => {

                    if (
                        !game ||
                        typeof game !== "object"
                    ) {

                        games[gameId] =
                            createGame(
                                gameId
                            );

                        return;
                    }


                    if (
                        !game.gameId
                    ) {

                        game.gameId =
                            gameId;
                    }


                    if (
                        !Array.isArray(
                            game.pendingMoves
                        )
                    ) {

                        game.pendingMoves =
                            [];
                    }


                    if (
                        !Array.isArray(
                            game.moveHistory
                        )
                    ) {

                        game.moveHistory =
                            [];
                    }


                    if (
                        !game.turnLocked
                    ) {

                        game.turnLocked = {

                            red:
                                false,

                            blue:
                                false
                        };
                    }


                    if (
                        game.turnLocked.red ===
                        undefined
                    ) {

                        game.turnLocked.red =
                            false;
                    }


                    if (
                        game.turnLocked.blue ===
                        undefined
                    ) {

                        game.turnLocked.blue =
                            false;
                    }


                    if (
                        !game.currentTurnPlayer
                    ) {

                        game.currentTurnPlayer =
                            "red";
                    }


                    if (
                        game.board
                    ) {

                        normalizeBoardUnits(
                            game.board
                        );
                    }
                }
            );

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


    // --------------------------------------------------------
    // START SERVER AFTER LOAD
    // --------------------------------------------------------

    app.listen(
        PORT,
        () => {

            console.log(
                `HTTP server running on port ${PORT}`
            );
        }
    );

})();
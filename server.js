const axios = require("axios");
const express = require("express");
const path = require("path");

const app = express();


// ============================================================
// EXPRESS SETUP
// ============================================================

app.use(
    express.json()
);

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
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
// ARMAMENT PAGE EXCLUDED UNITS
// ============================================================

const ARMAMENT_EXCLUDED_UNITS = new Set([

    "ARG",
    "DDG80",
    "KC135",
    "Type052",
    "Garrison"

]);


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

    const filePath =
        "game-state.json";


    if (
        !username ||
        !repo ||
        !token
    ) {

        console.warn(
            "⚠ GitHub persistence variables are not configured."
        );

        return;

    }


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

        payload.sha =
            sha;

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

    const filePath =
        "game-state.json";


    if (
        !username ||
        !repo ||
        !token
    ) {

        console.warn(
            "⚠ GitHub persistence variables are not configured."
        );

        return null;

    }


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
            JSON.parse(
                decoded
            );


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

    if (
        !games[gameId]
    ) {

        games[gameId] = {

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
// PERMANENT UNIT ID
// ============================================================

function createUnitId(
    team,
    type
) {

    return `${team}-${type}`;

}


// ============================================================
// GET UNIT ID
// ============================================================

function getUnitId(unit) {

    if (!unit) {
        return null;
    }


    if (
        unit.id !== undefined &&
        unit.id !== null &&
        String(unit.id).trim() !== ""
    ) {

        return String(unit.id);

    }


    if (
        unit.unitId !== undefined &&
        unit.unitId !== null &&
        String(unit.unitId).trim() !== ""
    ) {

        return String(unit.unitId);

    }


    if (
        unit.uid !== undefined &&
        unit.uid !== null &&
        String(unit.uid).trim() !== ""
    ) {

        return String(unit.uid);

    }


    return null;

}


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

    if (
        !board?.[r]?.[c]
    ) {

        return;

    }


    if (
        !units[team] ||
        !units[team][type]
    ) {

        console.error(
            `⚠ Cannot spawn unknown unit ${team} ${type}`
        );

        return;

    }


    board[r][c].push({

        id:
            createUnitId(
                team,
                type
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
// NORMALIZE BOARD
// ============================================================

function normalizeBoardUnits(board) {

    if (
        !Array.isArray(board)
    ) {

        return;

    }


    for (
        let r = 0;
        r < ROWS;
        r++
    ) {

        if (
            !Array.isArray(board[r])
        ) {

            board[r] = [];

        }


        for (
            let c = 0;
            c < COLS;
            c++
        ) {

            if (
                !Array.isArray(
                    board[r][c]
                )
            ) {

                board[r][c] = [];

            }


            board[r][c].forEach(
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
                        unit.team &&
                        unit.type &&
                        units[unit.team] &&
                        units[unit.team][unit.type] &&
                        unit.move === undefined
                    ) {

                        unit.move =
                            units[
                                unit.team
                            ][
                                unit.type
                            ].move;

                    }


                    // ------------------------------------------------
                    // ADD PERMANENT ID TO OLD SAVED UNITS
                    // ------------------------------------------------

                    if (
                        !getUnitId(unit) &&
                        unit.team &&
                        unit.type
                    ) {

                        unit.id =
                            createUnitId(
                                unit.team,
                                unit.type
                            );

                    }

                }
            );

        }

    }


    board.length =
        ROWS;

}


// ============================================================
// FIND UNIT ON BOARD
// ============================================================
//
// IMPORTANT:
//
// The client may send:
//
// unit: "F15E"
//
// OR:
//
// unit: {
//     id: "blue-F15E",
//     type: "F15E",
//     team: "blue"
// }
//
// The server supports both.
//
// The permanent unit ID is the primary identifier.
//
// The server searches the actual board to determine the
// unit's real current position.
// ============================================================

function findUnitOnBoard(
    board,
    options
) {

    if (
        !Array.isArray(board) ||
        !options
    ) {

        return null;

    }


    let {
        team,
        unit,
        unitId,
        from
    } = options;


    // --------------------------------------------------------
    // NORMALIZE UNIT
    // --------------------------------------------------------

    let unitType = null;


    if (
        typeof unit === "string"
    ) {

        unitType =
            unit;

    }

    else if (
        unit &&
        typeof unit === "object"
    ) {

        unitType =
            unit.type ||
            null;


        if (
            !unitId
        ) {

            unitId =
                getUnitId(unit);

        }


        if (
            !team &&
            unit.team
        ) {

            team =
                unit.team;

        }

    }


    // --------------------------------------------------------
    // NORMALIZE ID
    // --------------------------------------------------------

    if (
        unitId !== undefined &&
        unitId !== null &&
        String(unitId).trim() !== ""
    ) {

        unitId =
            String(unitId);

    }

    else {

        unitId =
            null;

    }


    // --------------------------------------------------------
    // MATCH FUNCTION
    // --------------------------------------------------------

    function matches(candidate) {

        if (!candidate) {
            return false;
        }


        // ----------------------------------------------------
        // TEAM
        // ----------------------------------------------------

        if (
            team &&
            candidate.team !== team
        ) {

            return false;

        }


        // ----------------------------------------------------
        // PERMANENT ID
        // ----------------------------------------------------

        if (
            unitId
        ) {

            const candidateId =
                getUnitId(candidate);


            if (
                candidateId
            ) {

                return (
                    String(candidateId) ===
                    String(unitId)
                );

            }

        }


        // ----------------------------------------------------
        // FALLBACK TO TYPE
        // ----------------------------------------------------

        if (
            unitType &&
            candidate.type !== unitType
        ) {

            return false;

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
    //
    // This is the authoritative location search.
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
// CHECK UNIT IS AT OWN FOB
// ============================================================

function isUnitAtFOB(
    unit,
    r,
    c
) {

    if (!unit) {
        return false;
    }


    const fob =
        startHexes[
            unit.team
        ];


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

function isUnitAirborne(
    unit,
    r,
    c
) {

    return !isUnitAtFOB(
        unit,
        r,
        c
    );

}


// ============================================================
// APPLY MOVE TO BOARD
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
            "⚠ Unit not found when resolving move:",
            move
        );

        return false;

    }


    const movingUnit =
        found.unit;

    const fromStack =
        found.stack;

    const toStack =
        board[to.r][to.c];


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
            `⚠ ${movingUnit.team} ${movingUnit.type} cannot move because it is loading an armament.`
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
    // REMOVE FROM ACTUAL LOCATION
    // --------------------------------------------------------

    const index =
        fromStack.indexOf(
            movingUnit
        );


    if (
        index === -1
    ) {

        console.log(
            "⚠ Moving unit disappeared before move resolution."
        );

        return false;

    }


    fromStack.splice(
        index,
        1
    );


    // --------------------------------------------------------
    // ADD TO DESTINATION
    // --------------------------------------------------------

    toStack.push(
        movingUnit
    );


    console.log(
        `✔ ${movingUnit.team} ${movingUnit.type} moved ` +
        `from ${found.r},${found.c} ` +
        `to ${to.r},${to.c}`
    );


    return true;

}


// ============================================================
// RESOLVE LOADING
// ============================================================

function resolveLoading(board) {

    if (
        !Array.isArray(board)
    ) {

        return;

    }


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
                        `✔ ${unit.team} ${unit.type} finished loading:`,
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


            // ------------------------------------------------
            // GAME ID
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
            // PLAYER
            // ------------------------------------------------

            if (
                playerId !== undefined &&
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
            // EXTRACT UNIT INFORMATION
            // ------------------------------------------------
            //
            // The client can send either a unit object or a
            // unit type string.
            // ------------------------------------------------

            const requestedTeam =
                team ||
                unit?.team ||
                playerId;


            const requestedUnitType =
                typeof unit === "string"
                    ? unit
                    : unit?.type || null;


            const requestedUnitId =
                unitId ||
                getUnitId(unit) ||
                null;


            // ------------------------------------------------
            // TEAM VALIDATION
            // ------------------------------------------------

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
                playerId &&
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
            // UNIT VALIDATION
            // ------------------------------------------------

            if (
                !requestedUnitType &&
                !requestedUnitId
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
            // ACTION
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
            // ARMAMENT
            // ------------------------------------------------

            if (
                !armament ||
                armament.id === undefined ||
                armament.id === null
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


            const armamentId =
                armament.id;


            // ------------------------------------------------
            // GET GAME
            // ------------------------------------------------

            const game =
                getGame(
                    gameId
                );


            // ------------------------------------------------
            // CREATE BOARD IF NECESSARY
            // ------------------------------------------------

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


            // ------------------------------------------------
            // FIND UNIT
            // ------------------------------------------------
            //
            // IMPORTANT:
            //
            // The server searches the real board.
            //
            // The coordinates from the client are only used
            // as an initial search location. If the unit is
            // not there, the entire board is searched.
            // ------------------------------------------------

            const found =
                findUnitOnBoard(
                    game.board,
                    {

                        team:
                            requestedTeam,

                        unit:
                            requestedUnitType,

                        unitId:
                            requestedUnitId,

                        from

                    }
                );


            if (!found) {

                console.error(
                    "❌ Unit not found on board:",
                    {

                        gameId,

                        playerId,

                        requestedTeam,

                        requestedUnitType,

                        requestedUnitId,

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

                        requestedTeam,

                        requestedUnitType,

                        requestedUnitId

                    });

            }


            // ------------------------------------------------
            // TARGET UNIT
            // ------------------------------------------------

            const targetUnit =
                found.unit;


            // ------------------------------------------------
            // VERIFY PERMANENT ID
            // ------------------------------------------------

            if (
                requestedUnitId
            ) {

                const targetUnitId =
                    getUnitId(
                        targetUnit
                    );


                if (
                    !targetUnitId ||
                    String(targetUnitId) !==
                    String(requestedUnitId)
                ) {

                    return res
                        .status(400)
                        .json({

                            status:
                                "error",

                            message:
                                "Unit ID does not match the unit on the board."

                        });

                }

            }


            // ------------------------------------------------
            // VERIFY TEAM
            // ------------------------------------------------

            if (
                targetUnit.team !==
                requestedTeam
            ) {

                return res
                    .status(403)
                    .json({

                        status:
                            "error",

                        message:
                            "You cannot modify this unit."

                    });

            }


            // ------------------------------------------------
            // EXCLUDED UNITS
            // ------------------------------------------------

            if (
                ARMAMENT_EXCLUDED_UNITS.has(
                    targetUnit.type
                )
            ) {

                return res
                    .status(403)
                    .json({

                        status:
                            "error",

                        message:
                            `${targetUnit.type} cannot load armaments.`

                    });

            }


            // ------------------------------------------------
            // REAL SERVER LOCATION
            // ------------------------------------------------
            //
            // THIS is the important part.
            //
            // found.r / found.c are where the unit actually
            // exists on the server board.
            // ------------------------------------------------

            const actualR =
                found.r;

            const actualC =
                found.c;


            const atFOB =
                isUnitAtFOB(
                    targetUnit,
                    actualR,
                    actualC
                );


            const airborne =
                !atFOB;


            console.log(
                "Armament location check:",
                {

                    unitId:
                        getUnitId(targetUnit),

                    unit:
                        targetUnit.type,

                    team:
                        targetUnit.team,

                    actualR,

                    actualC,

                    fob:
                        startHexes[
                            targetUnit.team
                        ],

                    atFOB,

                    airborne

                }
            );


            // ------------------------------------------------
            // LOAD MUST BE AT FOB
            // ------------------------------------------------

            if (
                resolvedAction === "load" &&
                !atFOB
            ) {

                return res
                    .status(403)
                    .json({

                        status:
                            "error",

                        message:
                            `${targetUnit.type} is airborne and must return to its FOB before loading armaments.`,

                        airborne:
                            true,

                        atFOB:
                            false,

                        location: {

                            r:
                                actualR,

                            c:
                                actualC

                        },

                        fob:
                            startHexes[
                                targetUnit.team
                            ]

                    });

            }


            // ------------------------------------------------
            // LOAD
            // ------------------------------------------------

            if (
                resolvedAction === "load"
            ) {

                if (
                    !Array.isArray(
                        targetUnit.loadingArmaments
                    )
                ) {

                    targetUnit.loadingArmaments =
                        [];

                }


                if (
                    !Array.isArray(
                        targetUnit.armaments
                    )
                ) {

                    targetUnit.armaments =
                        [];

                }


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
                resolvedAction === "unload"
            ) {

                if (
                    !Array.isArray(
                        targetUnit.armaments
                    )
                ) {

                    targetUnit.armaments =
                        [];

                }


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
            // CANCEL LOADING
            // ------------------------------------------------

            else if (
                resolvedAction === "cancelLoad"
            ) {

                if (
                    !Array.isArray(
                        targetUnit.loadingArmaments
                    )
                ) {

                    targetUnit.loadingArmaments =
                        [];

                }


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
            // SAVE GAME
            // ------------------------------------------------

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

                unit: {
                    ...targetUnit
                },

                unitId:
                    getUnitId(
                        targetUnit
                    ),

                location: {

                    r:
                        actualR,

                    c:
                        actualC

                },

                atFOB,

                airborne,

                fob:
                    startHexes[
                        targetUnit.team
                    ],

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
            } = req.body;


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


            // ------------------------------------------------
            // TURN LOCK
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
            // TEAM CHECK
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
            // FIND MOVING UNIT
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


            if (!found) {

                return res
                    .status(404)
                    .json({

                        status:
                            "error",

                        message:
                            "Unit not found on the board."

                    });

            }


            // ------------------------------------------------
            // LOADING UNITS CANNOT MOVE
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

            game.pendingMoves.push({

                playerId,

                move

            });


            game.moveHistory.push({

                playerId,

                move

            });


            game.lastMove =
                move;


            // ------------------------------------------------
            // SAVE
            // ------------------------------------------------

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

                status:
                    "ok",

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
            } = req.body;


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


            if (
                game.turnLocked[playerId]
            ) {

                return res.json({

                    status:
                        "ok",

                    message:
                        `${playerId} already submitted`,

                    turnLocked:
                        game.turnLocked

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

                status:
                    "ok",

                message:
                    `${playerId} submitted turn`,

                turnLocked:
                    game.turnLocked,

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

app.post(
    "/continueTurn",
    async (
        req,
        res
    ) => {

        try {

            const {
                gameId
            } = req.body;


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


            // ------------------------------------------------
            // RESOLVE PENDING MOVES
            // ------------------------------------------------

            if (
                Array.isArray(
                    game.pendingMoves
                ) &&
                game.pendingMoves.length > 0
            ) {

                const pendingMoves =
                    [
                        ...game.pendingMoves
                    ];


                for (
                    const entry
                    of pendingMoves
                ) {

                    applyMoveToBoard(
                        game.board,
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
            // UNLOCK BOTH SIDES
            // ------------------------------------------------

            game.turnLocked = {

                red:
                    false,

                blue:
                    false

            };


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
            } = req.body;


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


            // ------------------------------------------------
            // CREATE NEW BOARD
            // ------------------------------------------------

            if (!game.board) {

                game.board =
                    generateEmptyBoard();


                spawnAllUnits(
                    game.board
                );

            }


            // ------------------------------------------------
            // NORMALIZE GAME
            // ------------------------------------------------

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


            normalizeBoardUnits(
                game.board
            );


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

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
// LOAD SAVED GAME
// ============================================================

(async () => {

    try {

        const saved =
            await loadGameStateFromGitHub();


        if (saved) {

            games =
                saved;


            console.log(
                "✔ Saved games loaded"
            );


            Object.entries(
                games
            ).forEach(
                ([gameId, game]) => {

                    if (!game) {
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

    }
);
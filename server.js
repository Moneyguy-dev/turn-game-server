const axios = require("axios");
const express = require("express");
const path = require("path");

const app = express();


/* ============================================================
   EXPRESS SETUP
============================================================ */

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* ============================================================
   GAME STORAGE
============================================================ */

let games = {};


/* ============================================================
   GITHUB PERSISTENCE
============================================================ */

async function saveGameStateToGitHub(gameState) {

    const username =
        process.env.GITHUB_USERNAME;

    const repo =
        process.env.GITHUB_REPO;

    const token =
        process.env.GITHUB_TOKEN;

    const filePath =
        "game-state.json";

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
                            `token ${token}`
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

                "Content-Type":
                    "application/json"
            }
        }
    );

    console.log(
        "✔ Game state saved to GitHub"
    );
}


/* ============================================================
   LOAD GAME STATE FROM GITHUB
============================================================ */

async function loadGameStateFromGitHub() {

    const username =
        process.env.GITHUB_USERNAME;

    const repo =
        process.env.GITHUB_REPO;

    const token =
        process.env.GITHUB_TOKEN;

    const filePath =
        "game-state.json";

    const apiUrl =
        `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;

    try {

        const res =
            await axios.get(
                apiUrl,
                {
                    headers: {

                        Authorization:
                            `token ${token}`
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


/* ============================================================
   GET / CREATE GAME
============================================================ */

function getGame(gameId) {

    if (!games[gameId]) {

        games[gameId] = {

            gameId,

            board: null,

            lastMove: null,

            moveHistory: [],

            currentTurnPlayer:
                "red",

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


/* ============================================================
   UNIT DEFINITIONS
============================================================ */

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


/* ============================================================
   FOB LOCATIONS
============================================================ */

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


/* ============================================================
   CREATE UNIT ID
============================================================ */

function createUnitId(
    team,
    type,
    r,
    c
) {

    return [
        team,
        type,
        r,
        c
    ].join("-");
}


/* ============================================================
   ADD UNIT
============================================================ */

function addUnit(
    board,
    r,
    c,
    type,
    team
) {

    board[r][c].push({

        id:
            createUnitId(
                team,
                type,
                r,
                c
            ),

        type,

        team,

        move:
            units[team][type].move,

        armaments: [],

        /*
         * Keep the old property for
         * compatibility with older saves.
         */

        armament: {}
    });
}


/* ============================================================
   SPAWN ALL UNITS
============================================================ */

function spawnAllUnits(board) {

    const blueStart =
        startHexes.blue;

    const redStart =
        startHexes.red;


    Object.keys(
        units.blue
    ).forEach(type => {

        addUnit(
            board,
            blueStart.r,
            blueStart.c,
            type,
            "blue"
        );
    });


    Object.keys(
        units.red
    ).forEach(type => {

        addUnit(
            board,
            redStart.r,
            redStart.c,
            type,
            "red"
        );
    });
}


/* ============================================================
   EMPTY BOARD
============================================================ */

function generateEmptyBoard() {

    const rows = 17;

    const cols = 19;

    const board = [];

    for (
        let r = 0;
        r < rows;
        r++
    ) {

        board[r] = [];

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            board[r][c] = [];
        }
    }

    return board;
}


/* ============================================================
   NORMALIZE EXISTING UNITS
============================================================ */

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


                /*
                 * Create a stable ID for old units.
                 */

                if (
                    unit.id === undefined ||
                    unit.id === null ||
                    String(unit.id).trim() === ""
                ) {

                    unit.id =
                        createUnitId(
                            unit.team || "unknown",
                            unit.type || "unknown",
                            r,
                            c
                        );
                }


                /*
                 * Also support unitId.
                 */

                if (
                    unit.unitId === undefined ||
                    unit.unitId === null
                ) {

                    unit.unitId =
                        unit.id;
                }


                /*
                 * Normalize armaments.
                 */

                if (
                    !Array.isArray(
                        unit.armaments
                    )
                ) {

                    /*
                     * Older save may have
                     * one armament object.
                     */

                    if (
                        unit.armament &&
                        typeof unit.armament === "object" &&
                        !Array.isArray(unit.armament) &&
                        Object.keys(unit.armament).length > 0
                    ) {

                        unit.armaments = [
                            unit.armament
                        ];

                    } else {

                        unit.armaments = [];
                    }
                }


                /*
                 * Preserve legacy property.
                 */

                if (
                    unit.armament === undefined ||
                    unit.armament === null
                ) {

                    unit.armament = {};
                }


                /*
                 * Movement value.
                 */

                if (
                    unit.move === undefined &&
                    unit.team &&
                    unit.type &&
                    units[unit.team] &&
                    units[unit.team][unit.type]
                ) {

                    unit.move =
                        units[unit.team][unit.type].move;
                }
            });
        }
    }
}


/* ============================================================
   FIND UNIT ON BOARD
============================================================ */

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


    const team =
        options.team ||
        options.unitTeam ||
        null;


    const unitType =
        options.unit ||
        options.unitType ||
        options.type ||
        null;


    const unitId =
        options.unitId ||
        options.id ||
        null;


    /*
     * Accept BOTH:
     *
     * from: { r, c }
     *
     * and:
     *
     * r / c
     */

    let targetR =
        null;

    let targetC =
        null;


    if (
        options.from &&
        Number.isInteger(
            Number(options.from.r)
        ) &&
        Number.isInteger(
            Number(options.from.c)
        )
    ) {

        targetR =
            Number(options.from.r);

        targetC =
            Number(options.from.c);

    } else if (
        Number.isInteger(
            Number(options.r)
        ) &&
        Number.isInteger(
            Number(options.c)
        )
    ) {

        targetR =
            Number(options.r);

        targetC =
            Number(options.c);
    }


    /*
     * ========================================================
     * FIRST: SEARCH EXACT HEX
     * ========================================================
     */

    if (
        targetR !== null &&
        targetC !== null &&
        targetR >= 0 &&
        targetR < 17 &&
        targetC >= 0 &&
        targetC < 19
    ) {

        const stack =
            board[targetR]?.[targetC];


        if (Array.isArray(stack)) {

            /*
             * First try exact ID.
             */

            if (unitId) {

                const index =
                    stack.findIndex(
                        u =>
                            u &&
                            (
                                String(u.id) ===
                                String(unitId)
                                ||
                                String(u.unitId) ===
                                String(unitId)
                            )
                    );


                if (index !== -1) {

                    return {

                        unit:
                            stack[index],

                        stack,

                        index,

                        r:
                            targetR,

                        c:
                            targetC
                    };
                }
            }


            /*
             * Then try team + type.
             */

            const index =
                stack.findIndex(
                    u => {

                        if (!u) {
                            return false;
                        }

                        if (
                            team &&
                            u.team !== team
                        ) {

                            return false;
                        }

                        if (
                            unitType &&
                            u.type !== unitType
                        ) {

                            return false;
                        }

                        return true;
                    }
                );


            if (index !== -1) {

                return {

                    unit:
                        stack[index],

                    stack,

                    index,

                    r:
                        targetR,

                    c:
                        targetC
                };
            }
        }
    }


    /*
     * ========================================================
     * SECOND: SEARCH BY UNIT ID
     * ========================================================
     */

    if (unitId) {

        for (
            let r = 0;
            r < 17;
            r++
        ) {

            for (
                let c = 0;
                c < 19;
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
                        u =>
                            u &&
                            (
                                String(u.id) ===
                                String(unitId)
                                ||
                                String(u.unitId) ===
                                String(unitId)
                            )
                    );


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
    }


    /*
     * ========================================================
     * THIRD: SEARCH BY TEAM + TYPE
     * ========================================================
     *
     * This is important because multiple older
     * units may not have had IDs.
     */

    if (
        team &&
        unitType
    ) {

        for (
            let r = 0;
            r < 17;
            r++
        ) {

            for (
                let c = 0;
                c < 19;
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
                        u =>
                            u &&
                            u.team === team &&
                            u.type === unitType
                    );


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
    }


    /*
     * No matching unit.
     */

    return null;
}


/* ============================================================
   APPLY MOVE
============================================================ */

function applyMoveToBoard(
    board,
    move
) {

    if (
        !move ||
        move.init
    ) {

        return;
    }


    const {
        from,
        to,
        unit,
        team
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
        from.r >= 17 ||
        from.c < 0 ||
        from.c >= 19 ||
        to.r < 0 ||
        to.r >= 17 ||
        to.c < 0 ||
        to.c >= 19
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


    const idx =
        fromStack.findIndex(
            u =>
                u.type === unit &&
                u.team === team
        );


    if (idx === -1) {

        console.log(
            "⚠ Unit not found:",
            move
        );

        return false;
    }


    if (
        toStack.length >= 4
    ) {

        console.log(
            "⚠ Destination hex is full:",
            move
        );

        return false;
    }


    const u =
        fromStack[idx];

    fromStack.splice(
        idx,
        1
    );

    toStack.push(u);


    /*
     * Update the generated ID so it
     * reflects the new location only
     * when the unit originally used a
     * generated fallback ID.
     *
     * The unit itself remains the same.
     */

    if (
        u.id &&
        String(u.id).startsWith(
            `${u.team}-${u.type}-`
        )
    ) {

        u.id =
            createUnitId(
                u.team,
                u.type,
                to.r,
                to.c
            );

        u.unitId =
            u.id;
    }


    console.log(
        `✔ ${team} ${unit} moved ` +
        `from ${from.r},${from.c} ` +
        `to ${to.r},${to.c}`
    );


    return true;
}


/* ============================================================
   UPDATE ARMAMENT
============================================================ */

app.post(
    "/updateArmament",
    async (req, res) => {

        try {

            console.log(
                "================================================"
            );

            console.log(
                "UPDATE ARMAMENT REQUEST"
            );

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            console.log(
                "================================================"
            );


            const body =
                req.body || {};


            const gameId =
                body.gameId;


            const playerId =
                body.playerId;


            /*
             * Accept all frontend naming
             * conventions.
             */

            const requestedTeam =
                body.team ||
                body.unitTeam ||
                playerId;


            const requestedUnitType =
                body.unit ||
                body.unitType ||
                body.type ||
                body.unit?.type ||
                null;


            const requestedUnitId =
                body.unitId ||
                body.id ||
                body.unit?.id ||
                body.unit?.unitId ||
                null;


            /*
             * Accept r/c or from.
             */

            let requestedR =
                null;

            let requestedC =
                null;


            if (
                body.from &&
                body.from.r !== undefined &&
                body.from.c !== undefined
            ) {

                requestedR =
                    Number(body.from.r);

                requestedC =
                    Number(body.from.c);

            } else if (
                body.r !== undefined &&
                body.c !== undefined
            ) {

                requestedR =
                    Number(body.r);

                requestedC =
                    Number(body.c);
            }


            /*
             * Accept the armament from
             * either armament or armamentId.
             */

            let requestedArmament =
                body.armament;


            if (
                requestedArmament === undefined &&
                body.armamentId !== undefined
            ) {

                requestedArmament =
                    body.armamentId;
            }


            /* =================================================
               VALIDATE GAME
            ================================================= */

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


            /* =================================================
               VALIDATE PLAYER
            ================================================= */

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


            /* =================================================
               VALIDATE TEAM
            ================================================= */

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
                            "You can only update the armament of your own units."
                    });
            }


            /* =================================================
               VALIDATE UNIT
            ================================================= */

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


            /* =================================================
               VALIDATE ARMAMENT
            ================================================= */

            if (
                requestedArmament === undefined ||
                requestedArmament === null
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


            /* =================================================
               GET GAME
            ================================================= */

            const game =
                getGame(gameId);


            /* =================================================
               CREATE BOARD
            ================================================= */

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


            /* =================================================
               FIND UNIT
            ================================================= */

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

                        r:
                            requestedR,

                        c:
                            requestedC,

                        from:
                            (
                                requestedR !== null &&
                                requestedC !== null
                            )
                                ? {
                                    r:
                                        requestedR,

                                    c:
                                        requestedC
                                }
                                : null
                    }
                );


            /*
             * If still not found, log the
             * entire board search information.
             */

            if (!found) {

                console.error(
                    "❌ UNIT NOT FOUND"
                );

                console.error(
                    "Requested team:",
                    requestedTeam
                );

                console.error(
                    "Requested unit type:",
                    requestedUnitType
                );

                console.error(
                    "Requested unit ID:",
                    requestedUnitId
                );

                console.error(
                    "Requested coordinates:",
                    {
                        r:
                            requestedR,

                        c:
                            requestedC
                    }
                );


                /*
                 * Return useful debugging
                 * information to the frontend.
                 */

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
                                requestedUnitType,

                            unitId:
                                requestedUnitId,

                            r:
                                requestedR,

                            c:
                                requestedC
                        }
                    });
            }


            /* =================================================
               UPDATE ARMAMENT
            ================================================= */

            /*
             * The frontend's primary format is
             * an array of armament IDs.
             *
             * Store that array on the unit.
             */

            if (
                Array.isArray(
                    body.armaments
                )
            ) {

                found.unit.armaments =
                    [
                        ...body.armaments
                    ];

            } else {

                /*
                 * If only one armament was
                 * supplied, update the loadout
                 * intelligently.
                 */

                if (
                    !Array.isArray(
                        found.unit.armaments
                    )
                ) {

                    found.unit.armaments =
                        [];
                }


                /*
                 * Load action.
                 */

                if (
                    body.action === "load" ||
                    body.action === undefined
                ) {

                    const armamentId =
                        body.armamentId !== undefined
                            ? body.armamentId
                            : (
                                requestedArmament &&
                                typeof requestedArmament === "object"
                                    ? requestedArmament.id
                                    : requestedArmament
                            );


                    if (
                        armamentId !== undefined &&
                        armamentId !== null
                    ) {

                        if (
                            !found.unit.armaments.includes(
                                armamentId
                            )
                        ) {

                            found.unit.armaments.push(
                                armamentId
                            );
                        }
                    }

                }


                /*
                 * Unload action.
                 */

                else if (
                    body.action === "unload"
                ) {

                    const armamentId =
                        body.armamentId !== undefined
                            ? body.armamentId
                            : (
                                requestedArmament &&
                                typeof requestedArmament === "object"
                                    ? requestedArmament.id
                                    : requestedArmament
                            );


                    const index =
                        found.unit.armaments.indexOf(
                            armamentId
                        );


                    if (
                        index !== -1
                    ) {

                        found.unit.armaments.splice(
                            index,
                            1
                        );
                    }
                }
            }


            /*
             * Maintain legacy property.
             */

            found.unit.armament =
                requestedArmament;


            /* =================================================
               SAVE
            ================================================= */

            try {

                await saveGameStateToGitHub(
                    games
                );

            } catch (err) {

                console.error(
                    "⚠ Failed to save after updateArmament:",
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


            /* =================================================
               RESPONSE
            ================================================= */

            return res.json({

                status:
                    "ok",

                message:
                    "Armament updated",

                gameId,

                unit:
                    {
                        ...found.unit
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
                "❌ updateArmament error:",
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


/* ============================================================
   SUBMIT MOVE
============================================================ */

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
                getGame(gameId);


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


            res.json({

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

            res
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


/* ============================================================
   SUBMIT TURN
============================================================ */

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
                getGame(gameId);


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


            res.json({

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

            res
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


/* ============================================================
   CONTINUE / RESOLVE TURN
============================================================ */

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

                        status:
                            "error",

                        message:
                            "Missing gameId"
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


            normalizeBoardUnits(
                game.board
            );


            if (
                game.pendingMoves &&
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


            game.pendingMoves =
                [];


            game.turnLocked = {

                red:
                    false,

                blue:
                    false
            };


            game.currentTurnPlayer =
                "red";


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


            res.json({

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

            res
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


/* ============================================================
   RESET GAME
============================================================ */

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

                        status:
                            "error",

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


            res.json({

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

            res
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


/* ============================================================
   GET GAME STATE
============================================================ */

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

                        status:
                            "error",

                        message:
                            "Missing gameId"
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


            normalizeBoardUnits(
                game.board
            );


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


            res.json(
                safeGame
            );

        } catch (error) {

            console.error(
                "gameState error:",
                error
            );

            res
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


/* ============================================================
   LOAD SAVED GAME
============================================================ */

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


            Object.values(
                games
            ).forEach(
                game => {

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
                        !game.gameId
                    ) {

                        game.gameId =
                            Object.keys(games)
                                .find(
                                    id =>
                                        games[id] === game
                                );
                    }


                    if (game.board) {

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


/* ============================================================
   START SERVER
============================================================ */

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log(
            `HTTP server running on port ${PORT}`
        );
    }
);
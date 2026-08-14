const axios = require("axios");
const express = require("express");
const path = require("path");

const app = express();

/* =========================
   EXPRESS SETUP
========================= */

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =========================
   GAME STORAGE
========================= */

let games = {};


/* =========================
   GITHUB PERSISTENCE
========================= */

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


/* =========================
   LOAD GAME STATE FROM GITHUB
========================= */

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


/* =========================
   GET / CREATE GAME
========================= */

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


/* =========================
   UNIT DEFINITIONS
========================= */

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


/* =========================
   FOB LOCATIONS
========================= */

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


/* =========================
   ADD UNIT
========================= */

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

        armament: {},

        armaments: []
    });
}


/* =========================
   SPAWN ALL UNITS
========================= */

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


/* =========================
   EMPTY BOARD
========================= */

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


/* =========================
   NORMALIZE EXISTING UNITS
========================= */

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
                    unit.armament === undefined ||
                    unit.armament === null
                ) {

                    unit.armament = {};
                }


                if (
                    !Array.isArray(
                        unit.armaments
                    )
                ) {

                    unit.armaments = [];
                }


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


/* =========================
   FIND UNIT ON BOARD
========================= */

function findUnitOnBoard(
    board,
    options
) {

    if (!board || !options) {
        return null;
    }

    const {
        team,
        unit,
        unitId,
        from
    } = options;


    /*
     * Search exact supplied coordinates
     * first.
     *
     * IMPORTANT:
     * We do NOT require an ID here.
     */

    if (
        from &&
        Number.isInteger(from.r) &&
        Number.isInteger(from.c) &&
        from.r >= 0 &&
        from.r < 17 &&
        from.c >= 0 &&
        from.c < 19
    ) {

        const stack =
            board[from.r][from.c];


        if (Array.isArray(stack)) {

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
                            unit &&
                            u.type !== unit
                        ) {
                            return false;
                        }


                        /*
                         * Only check ID if the
                         * unit actually has one.
                         */

                        if (
                            unitId &&
                            (
                                u.id !== undefined ||
                                u.unitId !== undefined
                            )
                        ) {

                            if (
                                String(
                                    u.id ??
                                    u.unitId
                                ) !==
                                String(unitId)
                            ) {

                                return false;
                            }
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
                        from.r,

                    c:
                        from.c
                };
            }
        }
    }


    /*
     * Search entire board.
     */

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
                board[r][c];


            if (!Array.isArray(stack)) {
                continue;
            }


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
                            unit &&
                            u.type !== unit
                        ) {
                            return false;
                        }


                        if (
                            unitId &&
                            (
                                u.id !== undefined ||
                                u.unitId !== undefined
                            )
                        ) {

                            if (
                                String(
                                    u.id ??
                                    u.unitId
                                ) !==
                                String(unitId)
                            ) {

                                return false;
                            }
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

                    r,

                    c
                };
            }
        }
    }


    return null;
}


/* =========================
   APPLY MOVE
========================= */

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


    console.log(
        `✔ ${team} ${unit} moved ` +
        `from ${from.r},${from.c} ` +
        `to ${to.r},${to.c}`
    );


    return true;
}


/* =========================
   UPDATE ARMAMENT
========================= */

app.post(
    "/updateArmament",
    async (req, res) => {

        try {

            const body =
                req.body || {};


            /*
             * Accept both the old and new
             * frontend payload formats.
             */

            const gameId =
                body.gameId;

            const playerId =
                body.playerId;

            const team =
                body.team ||
                body.unitTeam ||
                playerId;

            const unit =
                body.unit ||
                body.unitType;

            const unitId =
                body.unitId;


            /*
             * Armament may arrive directly
             * as "armament".
             */

            const armament =
                body.armament;


            /*
             * Coordinates may arrive as:
             *
             * from: { r, c }
             *
             * OR:
             *
             * r / c
             */

            let from =
                body.from;


            if (
                !from &&
                Number.isInteger(body.r) &&
                Number.isInteger(body.c)
            ) {

                from = {

                    r:
                        body.r,

                    c:
                        body.c
                };
            }


            /* =========================
               VALIDATE GAME
            ========================= */

            if (!gameId) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing gameId"
                    });
            }


            /* =========================
               VALIDATE PLAYER
            ========================= */

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


            /* =========================
               VALIDATE TEAM
            ========================= */

            if (
                team !== "red" &&
                team !== "blue"
            ) {

                return res
                    .status(400)
                    .json({

                        status: "error",

                        message:
                            "Missing or invalid team"
                    });
            }


            /*
             * A player can only modify
             * their own units.
             */

            if (
                team !== playerId
            ) {

                return res
                    .status(403)
                    .json({

                        status: "error",

                        message:
                            "You can only update the armament of your own units."
                    });
            }


            /* =========================
               VALIDATE UNIT
            ========================= */

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


            /* =========================
               VALIDATE ARMAMENT
            ========================= */

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


            /* =========================
               GET GAME
            ========================= */

            const game =
                getGame(gameId);


            /* =========================
               CREATE BOARD
            ========================= */

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


            /* =========================
               FIND UNIT
            ========================= */

            let found = null;


            /*
             * First try the exact hex.
             *
             * We intentionally match by:
             *
             * team + type
             *
             * instead of requiring unitId.
             */

            if (
                from &&
                Number.isInteger(from.r) &&
                Number.isInteger(from.c) &&
                from.r >= 0 &&
                from.r < 17 &&
                from.c >= 0 &&
                from.c < 19
            ) {

                const stack =
                    game.board[from.r][from.c];


                if (Array.isArray(stack)) {

                    const index =
                        stack.findIndex(
                            candidate => {

                                if (!candidate) {
                                    return false;
                                }


                                if (
                                    candidate.team !==
                                    team
                                ) {

                                    return false;
                                }


                                if (
                                    unit &&
                                    candidate.type !==
                                    unit
                                ) {

                                    return false;
                                }


                                /*
                                 * If the actual unit has
                                 * an ID, honor it.
                                 *
                                 * If it doesn't have one,
                                 * do not reject it.
                                 */

                                if (
                                    unitId &&
                                    (
                                        candidate.id !==
                                            undefined ||
                                        candidate.unitId !==
                                            undefined
                                    )
                                ) {

                                    const candidateId =
                                        candidate.id ??
                                        candidate.unitId;


                                    if (
                                        String(
                                            candidateId
                                        ) !==
                                        String(
                                            unitId
                                        )
                                    ) {

                                        return false;
                                    }
                                }


                                return true;
                            }
                        );


                    if (index !== -1) {

                        found = {

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


            /*
             * If coordinate lookup failed,
             * search the entire board.
             */

            if (!found) {

                found =
                    findUnitOnBoard(
                        game.board,
                        {
                            team,

                            unit,

                            unitId:
                                unitId || null,

                            from:
                                null
                        }
                    );
            }


            /* =========================
               UNIT NOT FOUND
            ========================= */

            if (!found) {

                console.error(
                    "❌ Unit not found for armament update:",
                    {
                        gameId,
                        playerId,
                        team,
                        unit,
                        unitId,
                        from
                    }
                );


                return res
                    .status(404)
                    .json({

                        status: "error",

                        message:
                            "Unit not found on the board"
                    });
            }


            /* =========================
               UPDATE ARMAMENT
            ========================= */

            found.unit.armament =
                armament;


            /*
             * Keep the frontend's armaments
             * array synchronized too.
             */

            if (
                !Array.isArray(
                    found.unit.armaments
                )
            ) {

                found.unit.armaments =
                    [];
            }


            const armamentId =
                body.armamentId !== undefined
                    ? body.armamentId
                    : (
                        typeof armament === "object" &&
                        armament !== null
                            ? armament.id
                            : armament
                    );


            /*
             * Add the armament ID if available.
             */

            if (
                armamentId !== undefined &&
                armamentId !== null
            ) {

                const alreadyLoaded =
                    found.unit.armaments.includes(
                        armamentId
                    );


                if (!alreadyLoaded) {

                    found.unit.armaments.push(
                        armamentId
                    );
                }
            }


            /* =========================
               SAVE STATE
            ========================= */

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

                        status: "error",

                        message:
                            "Armament updated in memory but failed to save game state."
                    });
            }


            /* =========================
               RESPONSE
            ========================= */

            return res.json({

                status: "ok",

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


/* =========================
   SUBMIT MOVE
========================= */

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


/* =========================
   SUBMIT TURN
========================= */

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


            if (
                game.turnLocked[playerId]
            ) {

                return res.json({

                    status: "ok",

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

                status: "ok",

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

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


/* =========================
   CONTINUE / RESOLVE TURN
========================= */

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
                    [...game.pendingMoves];


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

                red: false,

                blue: false
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

                status: "ok",

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

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


/* =========================
   RESET GAME
========================= */

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


            res.json({

                status: "ok",

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

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


/* =========================
   GET GAME STATE
========================= */

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

                    red: false,

                    blue: false
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

                    status: "error",

                    message:
                        "Internal server error"
                });
        }
    }
);


/* =========================
   LOAD SAVED GAME
========================= */

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

                            red: false,

                            blue: false
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


/* =========================
   START SERVER
========================= */

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
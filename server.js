const axios = require("axios");
const express = require("express");
const path = require("path");

const app = express();


/* ============================================================
   EXPRESS SETUP
============================================================ */

app.use(
    express.json()
);

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


/* ============================================================
   GET / CREATE GAME
============================================================ */

function getGame(
    gameId
) {

    if (!games[gameId]) {

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
   CREATE UNIT
============================================================ */

function createUnit(
    type,
    team
) {

    return {

        type,

        team,

        move:
            units[team][type].move,

        /*
         * New armament system.
         *
         * The frontend uses an array of
         * armament IDs.
         */

        armaments:
            [],

        /*
         * Keep the old property for
         * compatibility with old saves.
         */

        armament:
            {}
    };
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

    if (
        !board?.[r]?.[c]
    ) {

        return;
    }


    board[r][c].push(
        createUnit(
            type,
            team
        )
    );
}


/* ============================================================
   SPAWN ALL UNITS
============================================================ */

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


/* ============================================================
   EMPTY BOARD
============================================================ */

function generateEmptyBoard() {

    const rows =
        17;

    const cols =
        19;

    const board =
        [];


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        board[r] =
            [];


        for (
            let c = 0;
            c < cols;
            c++
        ) {

            board[r][c] =
                [];
        }
    }


    return board;
}


/* ============================================================
   NORMALIZE UNITS
============================================================ */

function normalizeBoardUnits(
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


                    /*
                     * Movement compatibility.
                     */

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


                    /*
                     * New armament array.
                     */

                    if (
                        !Array.isArray(
                            unit.armaments
                        )
                    ) {

                        /*
                         * Convert old single
                         * armament format if possible.
                         */

                        if (
                            unit.armament &&
                            typeof unit.armament === "object" &&
                            unit.armament.id !== undefined
                        ) {

                            unit.armaments = [
                                unit.armament.id
                            ];

                        } else {

                            unit.armaments =
                                [];
                        }
                    }


                    /*
                     * Keep old field available.
                     */

                    if (
                        unit.armament === undefined ||
                        unit.armament === null
                    ) {

                        unit.armament =
                            {};
                    }
                }
            );
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
        options.team;


    const unitType =
        options.unit ||
        options.unitType;


    const unitId =
        options.unitId;


    const from =
        options.from;


    const r =
        options.r;


    const c =
        options.c;


    /*
     * Determine coordinates.
     *
     * Accept all formats:
     *
     * from: { r, c }
     * r / c
     */

    let searchR =
        Number.isInteger(
            from?.r
        )
            ? from.r
            : r;


    let searchC =
        Number.isInteger(
            from?.c
        )
            ? from.c
            : c;


    /*
     * FIRST:
     * Search the exact requested hex.
     */

    if (
        Number.isInteger(
            searchR
        ) &&
        Number.isInteger(
            searchC
        ) &&
        searchR >= 0 &&
        searchR < 17 &&
        searchC >= 0 &&
        searchC < 19
    ) {

        const stack =
            board[searchR]?.[searchC];


        if (
            Array.isArray(stack)
        ) {

            for (
                let i = 0;
                i < stack.length;
                i++
            ) {

                const candidate =
                    stack[i];


                if (
                    !candidate
                ) {

                    continue;
                }


                if (
                    team &&
                    candidate.team !== team
                ) {

                    continue;
                }


                if (
                    unitType &&
                    candidate.type !== unitType
                ) {

                    continue;
                }


                /*
                 * If an ID was supplied,
                 * check it.
                 */

                if (
                    unitId
                ) {

                    const candidateId =
                        candidate.id ??
                        candidate.unitId ??
                        candidate.uid;


                    if (
                        candidateId !== undefined &&
                        String(candidateId) !==
                            String(unitId)
                    ) {

                        continue;
                    }
                }


                return {

                    unit:
                        candidate,

                    stack,

                    index:
                        i,

                    r:
                        searchR,

                    c:
                        searchC
                };
            }
        }
    }


    /*
     * SECOND:
     * If exact position didn't work,
     * search the entire board.
     *
     * This is important because a unit
     * may have moved since the frontend
     * selected it.
     */

    for (
        let boardR = 0;
        boardR < 17;
        boardR++
    ) {

        for (
            let boardC = 0;
            boardC < 19;
            boardC++
        ) {

            const stack =
                board[boardR]?.[boardC];


            if (
                !Array.isArray(stack)
            ) {

                continue;
            }


            for (
                let i = 0;
                i < stack.length;
                i++
            ) {

                const candidate =
                    stack[i];


                if (
                    !candidate
                ) {

                    continue;
                }


                if (
                    team &&
                    candidate.team !== team
                ) {

                    continue;
                }


                if (
                    unitType &&
                    candidate.type !== unitType
                ) {

                    continue;
                }


                if (
                    unitId
                ) {

                    const candidateId =
                        candidate.id ??
                        candidate.unitId ??
                        candidate.uid;


                    if (
                        candidateId !== undefined &&
                        String(candidateId) !==
                            String(unitId)
                    ) {

                        continue;
                    }
                }


                return {

                    unit:
                        candidate,

                    stack,

                    index:
                        i,

                    r:
                        boardR,

                    c:
                        boardC
                };
            }
        }
    }


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
        board[
            from.r
        ][
            from.c
        ];


    const toStack =
        board[
            to.r
        ][
            to.c
        ];


    const idx =
        fromStack.findIndex(
            u =>
                u &&
                u.type === unit &&
                u.team === team
        );


    if (
        idx === -1
    ) {

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


    toStack.push(
        u
    );


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
    async (
        req,
        res
    ) => {

        try {

            const body =
                req.body || {};


            console.log(
                "================================================"
            );

            console.log(
                "UPDATE ARMAMENT REQUEST:"
            );

            console.log(
                JSON.stringify(
                    body,
                    null,
                    2
                )
            );

            console.log(
                "================================================"
            );


            /*
             * Accept BOTH the old and new
             * frontend payload formats.
             */

            const gameId =
                body.gameId;


            const playerId =
                body.playerId;


            const requestedTeam =
                body.team ||
                body.unitTeam ||
                playerId;


            const requestedUnit =
                body.unit ||
                body.unitType;


            const requestedUnitId =
                body.unitId ??
                body.unit?.id ??
                body.unit?.unitId ??
                body.unit?.uid;


            const requestedR =
                Number.isInteger(
                    body.r
                )
                    ? body.r
                    : Number.isInteger(
                        body.from?.r
                    )
                        ? body.from.r
                        : null;


            const requestedC =
                Number.isInteger(
                    body.c
                )
                    ? body.c
                    : Number.isInteger(
                        body.from?.c
                    )
                        ? body.from.c
                        : null;


            /*
             * Accept armament from:
             *
             * armament
             * OR
             * armamentId
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


            /*
             * Validate game.
             */

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


            /*
             * Validate player.
             */

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


            /*
             * Validate team.
             */

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


            /*
             * Player can only modify
             * their own team.
             */

            if (
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


            /*
             * We need at least a unit type.
             */

            if (
                !requestedUnit &&
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


            /*
             * We need an armament.
             */

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


            const game =
                getGame(
                    gameId
                );


            /*
             * Make sure board exists.
             */

            if (!game.board) {

                game.board =
                    generateEmptyBoard();


                spawnAllUnits(
                    game.board
                );
            }


            /*
             * Normalize existing saves.
             */

            normalizeBoardUnits(
                game.board
            );


            /*
             * Find the actual unit.
             */

            const found =
                findUnitOnBoard(
                    game.board,
                    {

                        team:
                            requestedTeam,

                        unit:
                            requestedUnit,

                        unitId:
                            requestedUnitId,

                        r:
                            requestedR,

                        c:
                            requestedC,

                        from:
                            body.from
                    }
                );


            if (!found) {

                console.error(
                    "❌ Unit not found on board",
                    {

                        team:
                            requestedTeam,

                        unit:
                            requestedUnit,

                        unitId:
                            requestedUnitId,

                        r:
                            requestedR,

                        c:
                            requestedC
                    }
                );


                return res
                    .status(404)
                    .json({

                        status:
                            "error",

                        message:
                            "Unit not found on the board"
                    });
            }


            /*
             * Determine requested action.
             */

            const action =
                body.action ||
                "load";


            /*
             * Make sure armament array
             * exists.
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
             * LOAD
             */

            if (
                action === "load"
            ) {

                /*
                 * If frontend sent an object
                 * with an ID, use that ID.
                 */

                let armamentId =
                    requestedArmament;


                if (
                    typeof requestedArmament ===
                        "object" &&
                    requestedArmament !== null
                ) {

                    armamentId =
                        requestedArmament.id;
                }


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
                                "Unable to determine armament ID"
                        });
                }


                /*
                 * Don't duplicate.
                 */

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


            /*
             * UNLOAD
             */

            else if (
                action === "unload"
            ) {

                let armamentId =
                    requestedArmament;


                if (
                    typeof requestedArmament ===
                        "object" &&
                    requestedArmament !== null
                ) {

                    armamentId =
                        requestedArmament.id;
                }


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


            /*
             * If the old armament field is
             * being used by an older client,
             * keep it synchronized.
             */

            if (
                typeof requestedArmament ===
                    "object" &&
                requestedArmament !== null
            ) {

                found.unit.armament =
                    requestedArmament;

            } else {

                found.unit.armament = {

                    id:
                        requestedArmament
                };
            }


            /*
             * Save state.
             */

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


            /*
             * Return updated unit.
             */

            const updatedUnit =
                {
                    ...found.unit,

                    armaments:
                        [
                            ...found.unit.armaments
                        ]
                };


            return res.json({

                status:
                    "ok",

                message:
                    "Armament updated",

                gameId,

                unit:
                    updatedUnit,

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
                req.body;


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


            if (
                game.turnLocked[
                    playerId
                ]
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


/* ============================================================
   SUBMIT TURN
============================================================ */

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
                req.body;


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
                game.turnLocked[
                    playerId
                ]
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


            game.turnLocked[
                playerId
            ] =
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


/* ============================================================
   CONTINUE / RESOLVE TURN
============================================================ */

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
                req.body;


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


            if (
                Array.isArray(
                    game.pendingMoves
                )
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


/* ============================================================
   RESET GAME
============================================================ */

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
                req.body;


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


            delete games[
                gameId
            ];


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


/* ============================================================
   GET GAME STATE
============================================================ */

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


            Object.entries(
                games
            ).forEach(
                (
                    [
                        gameId,
                        game
                    ]
                ) => {

                    if (!game.gameId) {

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
                        !game.turnLocked
                    ) {

                        game.turnLocked = {

                            red:
                                false,

                            blue:
                                false
                        };
                    }


                    if (!game.currentTurnPlayer) {

                        game.currentTurnPlayer =
                            "red";
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
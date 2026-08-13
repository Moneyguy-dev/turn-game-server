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

        /*
         * File does not exist yet.
         * That's okay.
         */

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

            /*
             * All moves made during the
             * current turn are stored here.
             *
             * Players can make MULTIPLE
             * moves before submitting.
             */

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
            units[team][type].move
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


    /*
     * Blue units
     */

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


    /*
     * Red units
     */

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


    /*
     * Basic move validation.
     */

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


    /*
     * Check coordinates.
     */

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


    /*
     * Find the unit.
     */

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


    /*
     * Prevent more than 4 units
     * in one hex.
     */

    if (
        toStack.length >= 4
    ) {

        console.log(
            "⚠ Destination hex is full:",
            move
        );

        return false;
    }


    /*
     * Move the unit.
     */

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


            /*
             * Create the initial board
             * if this is a new game.
             */

            if (!game.board) {

                game.board =
                    generateEmptyBoard();

                spawnAllUnits(
                    game.board
                );
            }


            /*
             * IMPORTANT:
             *
             * A player being locked means
             * they have pressed SUBMIT.
             *
             * Simply making a move does NOT
             * lock the player anymore.
             */

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


            /*
             * Make sure the submitted move
             * belongs to the player making it.
             */

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


            /*
             * Store the move.
             *
             * DO NOT lock the player here.
             *
             * This is what allows multiple
             * moves during one turn.
             */

            game.pendingMoves.push({

                playerId,

                move
            });


            game.moveHistory.push({

                playerId,

                move
            });


            /*
             * Save state.
             */

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


            /*
             * Tell the client the move was
             * accepted but the player is
             * still allowed to make more moves.
             */

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


            /*
             * Don't allow submitting twice.
             */

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


            /*
             * Lock this player.
             *
             * Their pending moves remain
             * stored until Continue resolves
             * the turn.
             */

            game.turnLocked[playerId] =
                true;


            /*
             * Save state.
             */

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


            /*
             * Make sure a board exists.
             */

            if (!game.board) {

                game.board =
                    generateEmptyBoard();

                spawnAllUnits(
                    game.board
                );
            }


            /*
             * Resolve every pending move.
             */

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


            /*
             * Clear pending moves.
             */

            game.pendingMoves =
                [];


            /*
             * Unlock both players.
             */

            game.turnLocked = {

                red: false,

                blue: false
            };


            /*
             * Keep red as the current
             * starting player for now.
             */

            game.currentTurnPlayer =
                "red";


            /*
             * Save resolved state.
             */

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


            /*
             * Create fresh board.
             */

            game.board =
                generateEmptyBoard();


            /*
             * Spawn all units.
             */

            spawnAllUnits(
                game.board
            );


            /*
             * Reset game information.
             */

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


            /*
             * Save reset state.
             */

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


            /*
             * Create initial board
             * if necessary.
             */

            if (!game.board) {

                game.board =
                    generateEmptyBoard();

                spawnAllUnits(
                    game.board
                );
            }


            /*
             * Make sure older saved games
             * have pendingMoves.
             */

            if (
                !Array.isArray(
                    game.pendingMoves
                )
            ) {

                game.pendingMoves =
                    [];
            }


            /*
             * Only send information that
             * clients actually need.
             */

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


            /*
             * Compatibility for games saved
             * before pendingMoves existed.
             */

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
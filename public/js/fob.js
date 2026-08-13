import {
    board,
    rows,
    cols,
    startHexes
} from "./grid.js";


/* ============================
   FOB PANEL REFERENCES
============================ */

export let fobPanel = null;
export let fobList = null;


/* ============================
   INITIALIZE FOB UI
============================ */

export function initFOB() {

    fobPanel =
        document.getElementById(
            "fobPanel"
        );

    fobList =
        document.getElementById(
            "fobList"
        );
}


/* ============================
   GET FOB TEAM
============================ */

export function getFobTeamAt(
    r,
    c
) {

    if (
        r === startHexes.blue.r &&
        c === startHexes.blue.c
    ) {

        return "blue";
    }


    if (
        r === startHexes.red.r &&
        c === startHexes.red.c
    ) {

        return "red";
    }


    return null;
}


/* ============================
   IS FOB HEX
============================ */

export function isFobHex(
    r,
    c
) {

    return (
        getFobTeamAt(r, c) !== null
    );
}


/* ============================
   GET FOB UNITS
============================ */

export function getFobUnits(
    team
) {

    const start =
        startHexes[team];


    if (!start) {
        return [];
    }


    if (
        !board[start.r] ||
        !board[start.r][start.c]
    ) {

        return [];
    }


    return board[start.r][start.c];
}


/* ============================
   HEX NEIGHBORS
============================ */

export function getNeighbors(
    r,
    c
) {

    const even = [
        [-1, 0],
        [-1, -1],
        [0, -1],
        [0, 1],
        [1, 0],
        [1, -1]
    ];


    const odd = [
        [-1, 1],
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, 1],
        [1, 0]
    ];


    const dirs =
        (c % 2 === 0)
            ? even
            : odd;


    return dirs
        .map(
            ([dr, dc]) => [
                r + dr,
                c + dc
            ]
        )
        .filter(
            ([nr, nc]) =>
                nr >= 0 &&
                nr < rows &&
                nc >= 0 &&
                nc < cols
        );
}


/* ============================
   VALID MOVEMENT HEXES
============================ */

export function getValidMoves(
    r,
    c,
    range
) {

    const visited =
        new Set();


    const queue = [
        [r, c, 0]
    ];


    const result = [];


    while (
        queue.length
    ) {

        const [
            cr,
            cc,
            distance
        ] = queue.shift();


        const key =
            `${cr},${cc}`;


        if (
            visited.has(key)
        ) {

            continue;
        }


        visited.add(key);


        /*
         * Don't include the
         * starting hex.
         */

        if (
            distance > 0
        ) {

            result.push([
                cr,
                cc
            ]);
        }


        if (
            distance === range
        ) {

            continue;
        }


        for (
            const [
                nr,
                nc
            ]
            of getNeighbors(
                cr,
                cc
            )
        ) {

            queue.push([
                nr,
                nc,
                distance + 1
            ]);
        }
    }


    return result;
}
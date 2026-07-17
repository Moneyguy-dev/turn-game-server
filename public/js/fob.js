import { board, rows, cols } from "./grid.js";
import { updateBoard } from "./units.js";

export let fobPool = { blue: [], red: [] };
export let fobPanel;
export let fobList;

export const startHexes = {
    blue: { r: 0, c: 0 },
    red: { r: rows - 1, c: cols - 1 }
};

export function initFOB() {
    fobPanel = document.getElementById("fobPanel");
    fobList = document.getElementById("fobList");

    initFobPool();
    updateFobList();

    const fobButton = document.getElementById("fobButton");
    fobButton.addEventListener("click", () => {
        fobPanel.classList.toggle("open");
        updateFobList();
    });
}

export function initFobPool() {
    fobPool.blue = [];
    fobPool.red = [];

    const units = {
        blue: { F15E:8, F16:7, F22:8, F35:6, B2:10, B52:11, KC135:12, DDG80:6, ARG:3 },
        red: { J10:7, J11:7, J16:7, J20:8, H6:9, Y20:11, Type052:5, Garrison:0, ARG:3 }
    };

    Object.keys(units.blue).forEach(type => {
        fobPool.blue.push({ type, team:"blue", move:units.blue[type] });
    });

    Object.keys(units.red).forEach(type => {
        fobPool.red.push({ type, team:"red", move:units.red[type] });
    });
}

export function updateFobList() {
    fobList.innerHTML = "";

    ["blue","red"].forEach(team => {
        fobPool[team].forEach(u => {
            const div = document.createElement("div");
            div.className = `fob-unit ${team}`;
            div.textContent = `${u.type} (${team})`;
            div.addEventListener("click", () => onFobUnitClick(u));
            fobList.appendChild(div);
        });
    });
}

export function onFobUnitClick(unit) {
    const start = startHexes[unit.team];

    const validMoves = getValidMoves(start.r, start.c, unit.move);

    window.selectedUnit = {
        r: start.r,
        c: start.c,
        unit,
        fromFob: true
    };

    window.validMoves = validMoves;

    updateBoard();
}

export function getNeighbors(r, c) {
    const even = [
        [-1, 0], [-1, -1],
        [0, -1], [0, 1],
        [1, 0], [1, -1]
    ];

    const odd = [
        [-1, 1], [-1, 0],
        [0, -1], [0, 1],
        [1, 1], [1, 0]
    ];

    const dirs = (c % 2 === 0) ? even : odd;

    return dirs
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) =>
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols
        );
}

export function getValidMoves(r, c, range) {
    const visited = new Set();
    const queue = [[r, c, 0]];
    const result = [];

    while (queue.length) {
        const [cr, cc, d] = queue.shift();
        const key = `${cr},${cc}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (d > 0) result.push([cr, cc]);
        if (d === range) continue;

        for (const [nr, nc] of getNeighbors(cr, cc)) {
            queue.push([nr, nc, d + 1]);
        }
    }

    return result;
}

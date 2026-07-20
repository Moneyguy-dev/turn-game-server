import { board, rows, cols, gameBoard } from "./grid.js";
import { getValidMoves } from "./fob.js";

export let selectedUnit = null;
export let validMoves = [];

export const MAX_UNITS_PER_HEX = 4;

export function initUnits() {
    updateBoard();
}

export function updateBoard() {
    const wrappers = gameBoard.children;
    let i = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const wrapper = wrappers[i++];
            if (!wrapper) return;

            const hex = wrapper.querySelector(".hex");

            hex.innerHTML = "";
            hex.style.background = "";

            if (validMoves.some(([vr, vc]) => vr === r && vc === c)) {
                hex.style.background = "#555";
            }

            const stack = board[r][c];

            if (stack.length) {
                const wrap = document.createElement("div");
                wrap.className = "unit-stack";

                stack.forEach(u => {
                    const d = document.createElement("div");
                    d.className = `unit ${u.team}`;
                    d.textContent = u.type;

                    d.addEventListener("click", (e) => {
                        e.stopPropagation();
                        onUnitClick(r, c, u);
                    });

                    if (selectedUnit && selectedUnit.unit === u && !selectedUnit.fromFob) {
                        d.style.outline = "2px solid yellow";
                    }

                    wrap.appendChild(d);
                });

                hex.appendChild(wrap);
            } else {
                hex.textContent = `${r},${c}`;
            }
        }
    }
}

export function onUnitClick(r, c, unit) {
    selectedUnit = { r, c, unit, fromFob: false };
    validMoves = getValidMoves(r, c, unit.move);
    updateBoard();
}

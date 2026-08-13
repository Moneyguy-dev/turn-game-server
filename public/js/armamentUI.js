// ============================================================
// ARMAMENT UI
// ============================================================

import {
    getUnitsForTeam,
    getCompatibleArmaments,
    getUnitCapacity,
    getAvailableArmamentCount,
    unitHasArmament,
    canLoadArmament,
    loadArmament,
    unloadArmament,
    getUnitCombatPower
} from "./armamentSystem.js";

import {
    getArmament
} from "./armaments.js";

import {
    getPlayerId
} from "./server.js";


let menu = null;

let selectedUnit = null;

let selectedArmament = null;


// ============================================================
// INITIALIZE
// ============================================================

export function initArmamentUI() {

    createMenu();

    attachArmamentButtons();
}


// ============================================================
// ATTACH ARMAMENT BUTTONS
// ============================================================

function attachArmamentButtons() {

    const elements =
        document.querySelectorAll(
            "button, a, .menuBtn"
        );


    elements.forEach(
        element => {

            const text =
                element.textContent
                    .trim()
                    .toLowerCase();


            if (
                text === "armaments" ||
                text.includes("armaments")
            ) {

                if (
                    element.dataset.armamentHandler
                ) {
                    return;
                }


                element.dataset.armamentHandler =
                    "true";


                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();
                        event.stopPropagation();

                        openArmamentMenu();
                    },
                    true
                );
            }
        }
    );
}


// ============================================================
// CREATE MENU
// ============================================================

function createMenu() {

    if (
        document.getElementById(
            "armamentMenu"
        )
    ) {

        menu =
            document.getElementById(
                "armamentMenu"
            );

        return;
    }


    menu =
        document.createElement(
            "div"
        );


    menu.id =
        "armamentMenu";


    menu.innerHTML = `

        <div class="armament-header">

            <div class="armament-title">
                ARMAMENTS
            </div>

            <button
                id="armamentClose"
                class="armament-close"
                type="button">
                ×
            </button>

        </div>


        <div class="armament-body">


            <div class="armament-column armament-units">

                <div class="armament-column-title">
                    YOUR UNITS
                </div>

                <div
                    id="armamentUnitList"
                    class="armament-scroll">
                </div>

            </div>


            <div class="armament-center">

                <div
                    id="armamentSelectedUnit"
                    class="armament-selected-unit">

                    Select a unit

                </div>


                <div
                    id="armamentSelectedDetails"
                    class="armament-selected-details">

                    Select a unit and armament.

                </div>


                <div
                    id="armamentSelectedLoadout"
                    class="armament-loadout">

                </div>

            </div>


            <div class="armament-column armament-list-column">

                <div class="armament-column-title">
                    ARMAMENTS
                </div>

                <div
                    id="armamentList"
                    class="armament-scroll">
                </div>

            </div>

        </div>


        <div class="armament-footer">

            <button
                id="armamentAction"
                class="armament-action"
                type="button"
                disabled>

                SELECT

            </button>

        </div>
    `;


    document.body.appendChild(
        menu
    );


    addArmamentStyles();


    document
        .getElementById(
            "armamentClose"
        )
        .onclick =
            closeArmamentMenu;


    document
        .getElementById(
            "armamentAction"
        )
        .onclick =
            performArmamentAction;
}


// ============================================================
// OPEN
// ============================================================

export function openArmamentMenu() {

    if (!menu) {
        createMenu();
    }


    selectedUnit = null;

    selectedArmament = null;


    renderUnits();

    renderArmaments();

    renderCenter();


    requestAnimationFrame(
        () => {

            menu.classList.add(
                "open"
            );
        }
    );
}


// ============================================================
// CLOSE
// ============================================================

export function closeArmamentMenu() {

    if (!menu) {
        return;
    }


    menu.classList.remove(
        "open"
    );


    selectedUnit = null;

    selectedArmament = null;
}


// ============================================================
// RENDER UNITS
// ============================================================

function renderUnits() {

    const list =
        document.getElementById(
            "armamentUnitList"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    const team =
        getPlayerId();


    if (
        team !== "red" &&
        team !== "blue"
    ) {

        list.innerHTML =
            `<div class="armament-empty">
                Select a team first.
            </div>`;

        return;
    }


    const units =
        getUnitsForTeam(
            team
        );


    if (
        units.length === 0
    ) {

        list.innerHTML =
            `<div class="armament-empty">
                No units available.
            </div>`;

        return;
    }


    units.forEach(
        ({ unit, r, c }) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "armament-unit-button";


            if (
                selectedUnit &&
                selectedUnit.unit === unit
            ) {

                button.classList.add(
                    "selected"
                );
            }


            const capacity =
                getUnitCapacity(
                    unit
                );


            const loaded =
                Array.isArray(
                    unit.armaments
                )
                    ? unit.armaments.length
                    : 0;


            button.innerHTML = `

                <span class="armament-unit-name">
                    ${unit.type}
                </span>

                <span class="armament-unit-info">
                    ${loaded}/${capacity}
                </span>

            `;


            button.onclick =
                () => {

                    selectedUnit = {
                        unit,
                        r,
                        c
                    };

                    selectedArmament = null;

                    renderUnits();
                    renderArmaments();
                    renderCenter();
                };


            list.appendChild(
                button
            );
        }
    );
}


// ============================================================
// RENDER ARMAMENTS
// ============================================================

function renderArmaments() {

    const list =
        document.getElementById(
            "armamentList"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    if (!selectedUnit) {

        list.innerHTML =
            `<div class="armament-empty">
                Select a unit first.
            </div>`;

        return;
    }


    const compatible =
        getCompatibleArmaments(
            selectedUnit.unit
        );


    if (
        compatible.length === 0
    ) {

        list.innerHTML =
            `<div class="armament-empty">
                No compatible armaments.
            </div>`;

        return;
    }


    compatible.forEach(
        armament => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "armament-button";


            if (
                selectedArmament &&
                selectedArmament.id ===
                    armament.id
            ) {

                button.classList.add(
                    "selected"
                );
            }


            const available =
                getAvailableArmamentCount(
                    selectedUnit.unit.team,
                    armament
                );


            const loaded =
                unitHasArmament(
                    selectedUnit.unit,
                    armament.id
                );


            button.innerHTML = `

                <span class="armament-name">
                    ${armament.name}
                </span>

                <span class="armament-info">
                    ${formatCategory(
                        armament.category
                    )}
                    • Power ${armament.combatPower}
                    • ${available}/${armament.maxOnField}
                </span>

            `;


            if (
                available <= 0 &&
                !loaded
            ) {

                button.classList.add(
                    "unavailable"
                );
            }


            button.onclick =
                () => {

                    selectedArmament =
                        armament;

                    renderArmaments();

                    renderCenter();
                };


            list.appendChild(
                button
            );
        }
    );
}


// ============================================================
// CENTER
// ============================================================

function renderCenter() {

    const unitDisplay =
        document.getElementById(
            "armamentSelectedUnit"
        );


    const details =
        document.getElementById(
            "armamentSelectedDetails"
        );


    const loadout =
        document.getElementById(
            "armamentSelectedLoadout"
        );


    const action =
        document.getElementById(
            "armamentAction"
        );


    if (
        !unitDisplay ||
        !details ||
        !loadout ||
        !action
    ) {
        return;
    }


    if (!selectedUnit) {

        unitDisplay.textContent =
            "Select a unit";

        details.textContent =
            "Select a unit and armament.";

        loadout.innerHTML =
            "";

        action.disabled =
            true;

        action.textContent =
            "SELECT";

        return;
    }


    const unit =
        selectedUnit.unit;


    const capacity =
        getUnitCapacity(
            unit
        );


    const loaded =
        Array.isArray(
            unit.armaments
        )
            ? unit.armaments.length
            : 0;


    const combat =
        getUnitCombatPower(
            unit
        );


    unitDisplay.textContent =
        unit.type;


    details.innerHTML = `

        <div>
            Location:
            ${selectedUnit.r},
            ${selectedUnit.c}
        </div>

        <div>
            Armaments:
            ${loaded}/${capacity}
        </div>

        <div>
            Air Combat:
            ${combat.air}
        </div>

        <div>
            Ground Combat:
            ${combat.ground}
        </div>

    `;


    loadout.innerHTML =
        "";


    if (
        loaded === 0
    ) {

        loadout.innerHTML =
            `<div class="armament-none-loaded">
                No armaments loaded
            </div>`;

    } else {

        unit.armaments.forEach(
            id => {

                const armament =
                    getArmament(
                        id
                    );


                if (!armament) {
                    return;
                }


                const tag =
                    document.createElement(
                        "div"
                    );


                tag.className =
                    "loaded-armament";


                tag.textContent =
                    armament.name;


                loadout.appendChild(
                    tag
                );
            }
        );
    }


    if (!selectedArmament) {

        action.disabled =
            true;

        action.textContent =
            "SELECT";

        return;
    }


    const loadedAlready =
        unitHasArmament(
            unit,
            selectedArmament.id
        );


    if (loadedAlready) {

        action.disabled =
            false;

        action.textContent =
            "UNLOAD";

        action.className =
            "armament-action unload";

        return;
    }


    const check =
        canLoadArmament(
            unit,
            selectedArmament
        );


    action.disabled =
        !check.allowed;


    action.textContent =
        check.allowed
            ? "LOAD"
            : "CANNOT LOAD";


    action.className =
        "armament-action";


    if (!check.allowed) {

        details.innerHTML += `

            <div class="armament-warning">
                ${check.reason}
            </div>

        `;
    }
}


// ============================================================
// ACTION
// ============================================================

async function performArmamentAction() {

    if (
        !selectedUnit ||
        !selectedArmament
    ) {
        return;
    }


    const button =
        document.getElementById(
            "armamentAction"
        );


    if (!button) {
        return;
    }


    const unit =
        selectedUnit.unit;


    const armament =
        selectedArmament;


    const isLoaded =
        unitHasArmament(
            unit,
            armament.id
        );


    button.disabled =
        true;


    button.textContent =
        isLoaded
            ? "UNLOADING..."
            : "LOADING...";


    try {

        if (isLoaded) {

            await unloadArmament(
                unit,
                armament
            );

        } else {

            await loadArmament(
                unit,
                armament
            );
        }


        renderUnits();

        renderArmaments();

        renderCenter();

    }

    catch (error) {

        console.error(
            "Armament action failed:",
            error
        );


        alert(
            error.message ||
            "Armament operation failed."
        );


        renderCenter();
    }
}


// ============================================================
// CATEGORY DISPLAY
// ============================================================

function formatCategory(
    category
) {

    if (
        category ===
        "air"
    ) {
        return "AIR";
    }


    if (
        category ===
        "ground"
    ) {
        return "GROUND";
    }


    return "AIR + GROUND";
}


// ============================================================
// CSS
// ============================================================

function addArmamentStyles() {

    if (
        document.getElementById(
            "armamentStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "armamentStyles";


    style.textContent = `

        #armamentMenu {

            position: fixed;

            left: 0;
            right: 0;
            bottom: 0;

            height: 92vh;

            background:
                rgba(15,15,15,0.98);

            border-top:
                3px solid #555;

            box-shadow:
                0 -10px 40px
                rgba(0,0,0,0.8);

            z-index: 10000;

            transform:
                translateY(100%);

            transition:
                transform 0.3s ease;

            display:
                flex;

            flex-direction:
                column;

            color: white;

            font-family:
                Arial, sans-serif;
        }


        #armamentMenu.open {

            transform:
                translateY(0);
        }


        .armament-header {

            height: 65px;

            flex-shrink: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            position: relative;

            background: #222;

            border-bottom:
                2px solid #444;
        }


        .armament-title {

            font-size: 24px;

            font-weight: bold;

            letter-spacing: 2px;
        }


        .armament-close {

            position: absolute;

            right: 15px;

            top: 12px;

            width: 40px;
            height: 40px;

            border: 0;

            border-radius: 7px;

            background: #444;

            color: white;

            font-size: 28px;

            cursor: pointer;
        }


        .armament-close:hover {

            background: #666;
        }


        .armament-body {

            flex: 1;

            min-height: 0;

            display: grid;

            grid-template-columns:
                28% 44% 28%;

            gap: 2px;

            background: #111;
        }


        .armament-column {

            min-width: 0;

            display: flex;

            flex-direction: column;

            background: #1c1c1c;
        }


        .armament-column-title {

            flex-shrink: 0;

            padding: 14px;

            text-align: center;

            font-size: 16px;

            font-weight: bold;

            background: #292929;

            border-bottom:
                2px solid #444;
        }


        .armament-scroll {

            overflow-y: auto;

            padding: 10px;
        }


        .armament-unit-button,
        .armament-button {

            width: 100%;

            margin-bottom: 8px;

            padding: 13px;

            border:
                2px solid #444;

            border-radius: 7px;

            background: #303030;

            color: white;

            cursor: pointer;

            text-align: left;
        }


        .armament-unit-button:hover,
        .armament-button:hover {

            background: #444;
        }


        .armament-unit-button.selected,
        .armament-button.selected {

            border-color: yellow;

            box-shadow:
                0 0 8px
                rgba(255,255,0,0.35);
        }


        .armament-unit-name,
        .armament-name {

            display: block;

            font-weight: bold;

            font-size: 15px;
        }


        .armament-unit-info,
        .armament-info {

            display: block;

            margin-top: 5px;

            color: #aaa;

            font-size: 11px;
        }


        .armament-button.unavailable {

            opacity: 0.45;
        }


        .armament-center {

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            padding: 25px;

            text-align: center;

            background: #151515;
        }


        .armament-selected-unit {

            font-size: 34px;

            font-weight: bold;

            margin-bottom: 20px;
        }


        .armament-selected-details {

            color: #ccc;

            line-height: 1.8;

            font-size: 15px;
        }


        .armament-warning {

            margin-top: 15px;

            color: #ff7777;

            font-weight: bold;
        }


        .armament-loadout {

            margin-top: 25px;

            display: flex;

            flex-wrap: wrap;

            justify-content: center;

            gap: 7px;
        }


        .loaded-armament {

            padding: 7px 10px;

            border:
                1px solid #666;

            border-radius: 5px;

            background: #292929;

            font-size: 12px;
        }


        .armament-none-loaded {

            color: #777;

            font-style: italic;
        }


        .armament-empty {

            padding: 25px 10px;

            color: #777;

            text-align: center;
        }


        .armament-footer {

            height: 95px;

            flex-shrink: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #202020;

            border-top:
                2px solid #444;
        }


        .armament-action {

            width: 320px;

            max-width: 80%;

            height: 62px;

            border: 0;

            border-radius: 9px;

            background: #155cff;

            color: white;

            font-size: 22px;

            font-weight: bold;

            cursor: pointer;
        }


        .armament-action:hover:not(:disabled) {

            filter: brightness(1.2);
        }


        .armament-action.unload {

            background: #b30000;
        }


        .armament-action:disabled {

            opacity: 0.35;

            cursor: not-allowed;
        }


        @media (max-width: 800px) {

            #armamentMenu {

                height: 95vh;
            }


            .armament-body {

                grid-template-columns:
                    32% 36% 32%;
            }


            .armament-selected-unit {

                font-size: 22px;
            }


            .armament-selected-details {

                font-size: 12px;
            }


            .armament-action {

                width: 250px;

                height: 55px;

                font-size: 18px;
            }
        }

    `;


    document.head.appendChild(
        style
    );
}
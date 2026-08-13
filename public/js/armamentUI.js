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
                ARMAMENT LOADOUT
            </div>

            <button
                id="armamentClose"
                class="armament-close"
                type="button">

                ×

            </button>

        </div>


        <div class="armament-body">


            <!-- =================================================
                 LEFT — UNITS
            ================================================== -->

            <section class="armament-panel">

                <div class="armament-panel-header">

                    <div class="armament-panel-title">
                        YOUR UNITS
                    </div>

                    <div
                        id="armamentUnitCount"
                        class="armament-panel-count">

                        0

                    </div>

                </div>


                <div
                    id="armamentUnitList"
                    class="armament-scroll">

                </div>

            </section>


            <!-- =================================================
                 CENTER — SELECTION
            ================================================== -->

            <section class="armament-center">

                <div class="armament-center-content">


                    <div
                        id="armamentSelectedUnit"
                        class="armament-selected-unit">

                        SELECT A UNIT

                    </div>


                    <div
                        id="armamentSelectedUnitInfo"
                        class="armament-selected-unit-info">

                        Choose an aircraft from the left.

                    </div>


                    <div class="armament-divider"></div>


                    <div class="armament-selection-label">

                        SELECTED ARMAMENT

                    </div>


                    <div
                        id="armamentSelectedArmament"
                        class="armament-selected-armament">

                        NONE

                    </div>


                    <div
                        id="armamentSelectedArmamentInfo"
                        class="armament-selected-armament-info">

                        Choose an armament from the right.

                    </div>


                    <div
                        id="armamentSelectedWarning"
                        class="armament-warning">

                    </div>


                    <button
                        id="armamentAction"
                        class="armament-action"
                        type="button"
                        disabled>

                        SELECT UNIT + ARMAMENT

                    </button>


                    <div class="armament-loadout-title">

                        CURRENT LOADOUT

                    </div>


                    <div
                        id="armamentSelectedLoadout"
                        class="armament-loadout">

                        NONE

                    </div>

                </div>

            </section>


            <!-- =================================================
                 RIGHT — ARMAMENTS
            ================================================== -->

            <section class="armament-panel">

                <div class="armament-panel-header">

                    <div class="armament-panel-title">
                        ARMAMENTS
                    </div>

                    <div
                        id="armamentAvailableCount"
                        class="armament-panel-count">

                        0

                    </div>

                </div>


                <div
                    id="armamentList"
                    class="armament-scroll">

                </div>

            </section>


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


    const count =
        document.getElementById(
            "armamentUnitCount"
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

        list.innerHTML = `
            <div class="armament-empty">
                Select a team first.
            </div>
        `;

        if (count) {
            count.textContent = "0";
        }

        return;
    }


    const units =
        getUnitsForTeam(
            team
        );


    if (count) {
        count.textContent =
            units.length;
    }


    if (
        units.length === 0
    ) {

        list.innerHTML = `
            <div class="armament-empty">
                No units available.
            </div>
        `;

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


            const combat =
                getUnitCombatPower(
                    unit
                );


            button.innerHTML = `

                <div class="unit-button-top">

                    <span class="armament-unit-name">
                        ${unit.type}
                    </span>

                    <span class="armament-unit-load">
                        ${loaded}/${capacity}
                    </span>

                </div>


                <div class="armament-unit-location">

                    POSITION
                    ${r}, ${c}

                </div>


                <div class="armament-unit-combat">

                    AIR ${combat.air}
                    &nbsp; • &nbsp;
                    GROUND ${combat.ground}

                </div>

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


    const count =
        document.getElementById(
            "armamentAvailableCount"
        );


    if (!list) {
        return;
    }


    list.innerHTML =
        "";


    if (!selectedUnit) {

        if (count) {
            count.textContent =
                "—";
        }


        list.innerHTML = `
            <div class="armament-empty">

                <div class="armament-empty-large">
                    SELECT A UNIT
                </div>

                Compatible armaments will appear here.

            </div>
        `;

        return;
    }


    const compatible =
        getCompatibleArmaments(
            selectedUnit.unit
        );


    if (count) {
        count.textContent =
            compatible.length;
    }


    if (
        compatible.length === 0
    ) {

        list.innerHTML = `
            <div class="armament-empty">
                No compatible armaments.
            </div>
        `;

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


            if (
                available <= 0 &&
                !loaded
            ) {

                button.classList.add(
                    "unavailable"
                );
            }


            if (loaded) {

                button.classList.add(
                    "loaded"
                );
            }


            button.innerHTML = `

                <div class="armament-button-top">

                    <span class="armament-name">
                        ${armament.name}
                    </span>

                    ${
                        loaded
                            ? `
                                <span class="armament-loaded-badge">
                                    LOADED
                                </span>
                              `
                            : ""
                    }

                </div>


                <div class="armament-info">

                    <span>
                        ${formatCategory(
                            armament.category
                        )}
                    </span>

                    <span>
                        POWER ${armament.combatPower}
                    </span>

                </div>


                <div class="armament-stock">

                    AVAILABLE

                    <strong>
                        ${available}/${armament.maxOnField}
                    </strong>

                </div>

            `;


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
// RENDER CENTER
// ============================================================

function renderCenter() {

    const unitDisplay =
        document.getElementById(
            "armamentSelectedUnit"
        );


    const unitInfo =
        document.getElementById(
            "armamentSelectedUnitInfo"
        );


    const armamentDisplay =
        document.getElementById(
            "armamentSelectedArmament"
        );


    const armamentInfo =
        document.getElementById(
            "armamentSelectedArmamentInfo"
        );


    const warning =
        document.getElementById(
            "armamentSelectedWarning"
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
        !unitInfo ||
        !armamentDisplay ||
        !armamentInfo ||
        !warning ||
        !loadout ||
        !action
    ) {

        return;
    }


    warning.textContent =
        "";


    // ========================================================
    // NO UNIT
    // ========================================================

    if (!selectedUnit) {

        unitDisplay.textContent =
            "SELECT A UNIT";


        unitInfo.textContent =
            "Choose an aircraft from the left.";


        armamentDisplay.textContent =
            "NONE";


        armamentInfo.textContent =
            "Choose an armament from the right.";


        loadout.innerHTML = `
            <span class="armament-none-loaded">
                NONE
            </span>
        `;


        action.disabled =
            true;


        action.textContent =
            "SELECT UNIT + ARMAMENT";


        action.className =
            "armament-action";


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


    // ========================================================
    // UNIT
    // ========================================================

    unitDisplay.textContent =
        unit.type;


    unitInfo.innerHTML = `

        <span>
            POSITION
            ${selectedUnit.r},
            ${selectedUnit.c}
        </span>

        <span>
            LOADOUT
            ${loaded}/${capacity}
        </span>

        <span>
            AIR
            ${combat.air}
        </span>

        <span>
            GROUND
            ${combat.ground}
        </span>

    `;


    // ========================================================
    // CURRENT LOADOUT
    // ========================================================

    loadout.innerHTML =
        "";


    if (
        loaded === 0
    ) {

        loadout.innerHTML = `
            <span class="armament-none-loaded">
                NO ARMAMENTS LOADED
            </span>
        `;

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


    // ========================================================
    // NO ARMAMENT
    // ========================================================

    if (!selectedArmament) {

        armamentDisplay.textContent =
            "NONE";


        armamentInfo.textContent =
            "Choose an armament from the right.";


        action.disabled =
            true;


        action.textContent =
            "SELECT ARMAMENT";


        action.className =
            "armament-action";


        return;
    }


    // ========================================================
    // SELECTED ARMAMENT
    // ========================================================

    armamentDisplay.textContent =
        selectedArmament.name;


    const available =
        getAvailableArmamentCount(
            unit.team,
            selectedArmament
        );


    armamentInfo.innerHTML = `

        <div>
            ${formatCategory(
                selectedArmament.category
            )}
            ARMAMENT
        </div>

        <div>
            COMBAT POWER:
            ${selectedArmament.combatPower}
        </div>

        <div>
            AVAILABLE:
            ${available}/${selectedArmament.maxOnField}
        </div>

    `;


    // ========================================================
    // UNLOAD
    // ========================================================

    const loadedAlready =
        unitHasArmament(
            unit,
            selectedArmament.id
        );


    if (loadedAlready) {

        action.disabled =
            false;


        action.textContent =
            "UNLOAD ARMAMENT";


        action.className =
            "armament-action unload";


        return;
    }


    // ========================================================
    // LOAD
    // ========================================================

    const check =
        canLoadArmament(
            unit,
            selectedArmament
        );


    action.disabled =
        !check.allowed;


    action.textContent =
        check.allowed
            ? "LOAD ARMAMENT"
            : "CANNOT LOAD";


    action.className =
        "armament-action";


    if (!check.allowed) {

        warning.textContent =
            check.reason;
    }
}


// ============================================================
// PERFORM LOAD / UNLOAD
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

function formatCategory(category) {

    if (
        category === "air"
    ) {

        return "AIR";
    }


    if (
        category === "ground"
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

        /* =====================================================
           MAIN MENU
        ====================================================== */

        #armamentMenu {

            position: fixed;

            left: 3vw;
            right: 3vw;

            top: 4vh;
            bottom: 4vh;

            background:
                rgba(12, 12, 12, 0.99);

            border:
                2px solid #555;

            border-radius:
                10px;

            box-shadow:
                0 20px 70px
                rgba(0,0,0,0.85);

            z-index:
                10000;

            transform:
                translateY(110%);

            transition:
                transform 0.3s ease;

            display:
                flex;

            flex-direction:
                column;

            overflow:
                hidden;

            color:
                white;

            font-family:
                Arial, sans-serif;
        }


        #armamentMenu.open {

            transform:
                translateY(0);
        }


        /* =====================================================
           HEADER
        ====================================================== */

        .armament-header {

            height:
                70px;

            flex-shrink:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            position:
                relative;

            background:
                #202020;

            border-bottom:
                2px solid #444;
        }


        .armament-title {

            font-size:
                25px;

            font-weight:
                bold;

            letter-spacing:
                4px;
        }


        .armament-close {

            position:
                absolute;

            right:
                15px;

            top:
                15px;

            width:
                40px;

            height:
                40px;

            border:
                1px solid #666;

            border-radius:
                6px;

            background:
                #333;

            color:
                white;

            font-size:
                28px;

            cursor:
                pointer;
        }


        .armament-close:hover {

            background:
                #555;
        }


        /* =====================================================
           THREE PANELS
        ====================================================== */

        .armament-body {

            flex:
                1;

            min-height:
                0;

            display:
                grid;

            grid-template-columns:
                minmax(240px, 30%)
                minmax(320px, 40%)
                minmax(240px, 30%);

            gap:
                2px;

            background:
                #080808;
        }


        .armament-panel {

            min-width:
                0;

            min-height:
                0;

            display:
                flex;

            flex-direction:
                column;

            background:
                #181818;
        }


        /* =====================================================
           PANEL HEADERS
        ====================================================== */

        .armament-panel-header {

            height:
                58px;

            flex-shrink:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            padding:
                0 16px;

            background:
                #252525;

            border-bottom:
                2px solid #444;
        }


        .armament-panel-title {

            font-size:
                15px;

            font-weight:
                bold;

            letter-spacing:
                2px;
        }


        .armament-panel-count {

            min-width:
                28px;

            height:
                26px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border:
                1px solid #555;

            border-radius:
                4px;

            background:
                #111;

            color:
                #aaa;

            font-size:
                12px;
        }


        /* =====================================================
           SCROLLING
        ====================================================== */

        .armament-scroll {

            flex:
                1;

            min-height:
                0;

            overflow-y:
                auto;

            overflow-x:
                hidden;

            padding:
                12px;
        }


        .armament-scroll::-webkit-scrollbar {

            width:
                8px;
        }


        .armament-scroll::-webkit-scrollbar-track {

            background:
                #111;
        }


        .armament-scroll::-webkit-scrollbar-thumb {

            background:
                #444;

            border-radius:
                4px;
        }


        .armament-scroll::-webkit-scrollbar-thumb:hover {

            background:
                #666;
        }


        /* =====================================================
           UNIT BUTTONS
        ====================================================== */

        .armament-unit-button {

            width:
                100%;

            margin-bottom:
                8px;

            padding:
                14px;

            border:
                1px solid #444;

            border-radius:
                6px;

            background:
                #292929;

            color:
                white;

            cursor:
                pointer;

            text-align:
                left;
        }


        .armament-unit-button:hover {

            background:
                #363636;

            border-color:
                #666;
        }


        .armament-unit-button.selected {

            background:
                #303830;

            border:
                2px solid #e6d94c;

            box-shadow:
                0 0 12px
                rgba(230,217,76,0.15);
        }


        .unit-button-top {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;
        }


        .armament-unit-name {

            font-size:
                16px;

            font-weight:
                bold;
        }


        .armament-unit-load {

            padding:
                3px 7px;

            border-radius:
                4px;

            background:
                #111;

            color:
                #bbb;

            font-size:
                12px;
        }


        .armament-unit-location {

            margin-top:
                8px;

            color:
                #888;

            font-size:
                11px;
        }


        .armament-unit-combat {

            margin-top:
                5px;

            color:
                #aaa;

            font-size:
                11px;
        }


        /* =====================================================
           ARMAMENT BUTTONS
        ====================================================== */

        .armament-button {

            width:
                100%;

            margin-bottom:
                8px;

            padding:
                14px;

            border:
                1px solid #444;

            border-radius:
                6px;

            background:
                #292929;

            color:
                white;

            cursor:
                pointer;

            text-align:
                left;
        }


        .armament-button:hover {

            background:
                #363636;

            border-color:
                #666;
        }


        .armament-button.selected {

            border:
                2px solid #e6d94c;

            background:
                #303830;

            box-shadow:
                0 0 12px
                rgba(230,217,76,0.15);
        }


        .armament-button.unavailable {

            opacity:
                0.45;
        }


        .armament-button.loaded {

            border-color:
                #477c4c;
        }


        .armament-button-top {

            display:
                flex;

            justify-content:
                space-between;

            gap:
                8px;
        }


        .armament-name {

            font-size:
                14px;

            font-weight:
                bold;
        }


        .armament-loaded-badge {

            padding:
                3px 6px;

            border-radius:
                3px;

            background:
                #315a35;

            color:
                #bce5bf;

            font-size:
                9px;

            font-weight:
                bold;
        }


        .armament-info {

            display:
                flex;

            gap:
                15px;

            margin-top:
                8px;

            color:
                #999;

            font-size:
                10px;
        }


        .armament-stock {

            margin-top:
                8px;

            color:
                #777;

            font-size:
                10px;
        }


        .armament-stock strong {

            color:
                #ccc;

            margin-left:
                5px;
        }


        /* =====================================================
           CENTER
        ====================================================== */

        .armament-center {

            min-width:
                0;

            min-height:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            background:
                #101010;

            border-left:
                1px solid #333;

            border-right:
                1px solid #333;

            overflow:
                hidden;
        }


        .armament-center-content {

            width:
                90%;

            max-width:
                500px;

            text-align:
                center;
        }


        .armament-selected-unit {

            font-size:
                34px;

            font-weight:
                bold;

            letter-spacing:
                2px;
        }


        .armament-selected-unit-info {

            margin-top:
                12px;

            display:
                flex;

            justify-content:
                center;

            flex-wrap:
                wrap;

            gap:
                10px;

            color:
                #999;

            font-size:
                11px;
        }


        .armament-selected-unit-info span {

            padding:
                5px 8px;

            background:
                #1e1e1e;

            border:
                1px solid #333;

            border-radius:
                4px;
        }


        .armament-divider {

            width:
                80%;

            height:
                1px;

            margin:
                28px auto;

            background:
                #444;
        }


        .armament-selection-label {

            color:
                #777;

            font-size:
                11px;

            font-weight:
                bold;

            letter-spacing:
                2px;
        }


        .armament-selected-armament {

            min-height:
                38px;

            margin-top:
                10px;

            font-size:
                23px;

            font-weight:
                bold;
        }


        .armament-selected-armament-info {

            min-height:
                45px;

            margin-top:
                8px;

            color:
                #aaa;

            font-size:
                12px;

            line-height:
                1.8;
        }


        .armament-warning {

            min-height:
                20px;

            margin-top:
                8px;

            color:
                #ff7777;

            font-size:
                12px;

            font-weight:
                bold;
        }


        /* =====================================================
           ACTION BUTTON
        ====================================================== */

        .armament-action {

            width:
                100%;

            height:
                62px;

            margin-top:
                20px;

            border:
                1px solid #527ee8;

            border-radius:
                6px;

            background:
                #174bc7;

            color:
                white;

            font-size:
                17px;

            font-weight:
                bold;

            letter-spacing:
                1px;

            cursor:
                pointer;
        }


        .armament-action:hover:not(:disabled) {

            background:
                #2861e5;
        }


        .armament-action.unload {

            border-color:
                #a84c4c;

            background:
                #8d1717;
        }


        .armament-action.unload:hover:not(:disabled) {

            background:
                #aa2020;
        }


        .armament-action:disabled {

            opacity:
                0.3;

            cursor:
                not-allowed;
        }


        /* =====================================================
           LOADOUT
        ====================================================== */

        .armament-loadout-title {

            margin-top:
                28px;

            color:
                #777;

            font-size:
                10px;

            font-weight:
                bold;

            letter-spacing:
                2px;
        }


        .armament-loadout {

            display:
                flex;

            justify-content:
                center;

            flex-wrap:
                wrap;

            gap:
                6px;

            margin-top:
                10px;

            max-height:
                100px;

            overflow-y:
                auto;
        }


        .loaded-armament {

            padding:
                6px 9px;

            border:
                1px solid #555;

            border-radius:
                4px;

            background:
                #252525;

            color:
                #ccc;

            font-size:
                10px;
        }


        .armament-none-loaded {

            color:
                #555;

            font-size:
                10px;

            font-style:
                italic;
        }


        /* =====================================================
           EMPTY STATES
        ====================================================== */

        .armament-empty {

            padding:
                40px 15px;

            color:
                #666;

            text-align:
                center;

            font-size:
                12px;

            line-height:
                1.8;
        }


        .armament-empty-large {

            margin-bottom:
                5px;

            color:
                #888;

            font-size:
                13px;

            font-weight:
                bold;

            letter-spacing:
                1px;
        }


        /* =====================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 900px) {

            #armamentMenu {

                left:
                    1vw;

                right:
                    1vw;

                top:
                    2vh;

                bottom:
                    2vh;
            }


            .armament-body {

                grid-template-columns:
                    28% 44% 28%;
            }


            .armament-selected-unit {

                font-size:
                    25px;
            }


            .armament-selected-armament {

                font-size:
                    18px;
            }


            .armament-action {

                height:
                    55px;

                font-size:
                    14px;
            }
        }


        @media (max-width: 650px) {

            .armament-body {

                grid-template-columns:
                    30% 40% 30%;
            }


            .armament-title {

                font-size:
                    18px;
            }


            .armament-panel-title {

                font-size:
                    11px;
            }


            .armament-unit-name,
            .armament-name {

                font-size:
                    12px;
            }


            .armament-selected-unit {

                font-size:
                    20px;
            }


            .armament-selected-armament {

                font-size:
                    15px;
            }
        }

    `;


    document.head.appendChild(
        style
    );
}
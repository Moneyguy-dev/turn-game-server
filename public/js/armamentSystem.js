// ============================================================
// ARMAMENT SYSTEM
// ============================================================

import {
    board,
    rows,
    cols
} from "./grid.js";

import {
    getArmament,
    getArmamentsForTeam,
    getUnitCombatData
} from "./armaments.js";

import {
    saveArmamentLoadout,
    getUnitId
} from "./server.js";


// ============================================================
// ARMAMENT PAGE EXCLUSIONS
// ============================================================
//
// These units cannot load armaments and therefore do not
// appear on the Armaments page.
//

const ARMAMENT_PAGE_EXCLUDED_UNITS = new Set([
    "ARG",
    "DDG80",
    "KC135",
    "Type052",
    "Garrison"
]);


// ============================================================
// FOB LOCATIONS
// ============================================================
//
// IMPORTANT:
//
// These coordinates use the same zero-based row/column
// coordinates used by the game board.
//
// BLUE FOB:
//     row 15
//     column 15
//
// RED FOB:
//     row 3
//     column 10
//

const FOB_LOCATIONS = {

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
// GET FOB LOCATION
// ============================================================

export function getFOBLocation(team) {

    if (!team) {
        return null;
    }

    return FOB_LOCATIONS[team] || null;
}


// ============================================================
// FIND UNIT POSITION ON BOARD
// ============================================================
//
// Searches the live board using the unit's permanent ID.
//
// Returns:
//     { r, c }
//
// or:
//     null
//
// This is only used when explicit coordinates are not already
// available.
//

export function findUnitPosition(unit) {

    if (!unit) {
        return null;
    }

    const unitId =
        getUnitId(unit);

    if (!unitId) {
        return null;
    }


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            const stack =
                board[r]?.[c] || [];


            for (const boardUnit of stack) {

                if (!boardUnit) {
                    continue;
                }


                const boardUnitId =
                    getUnitId(boardUnit);


                if (!boardUnitId) {
                    continue;
                }


                if (
                    String(boardUnitId) ===
                    String(unitId)
                ) {

                    return {
                        r,
                        c
                    };

                }

            }

        }

    }


    return null;
}


// ============================================================
// GET UNIT POSITION
// ============================================================
//
// IMPORTANT:
//
// If the caller already knows the unit's board position,
// those coordinates are authoritative.
//
// This prevents a stale unit object or stale board copy from
// incorrectly causing a unit on the FOB to be considered
// airborne.
//

export function getUnitPosition(
    unit,
    r = null,
    c = null
) {

    if (!unit) {
        return null;
    }


    // --------------------------------------------------------
    // EXPLICIT POSITION
    // --------------------------------------------------------
    //
    // The Armaments page normally already knows where the
    // unit was found on the board.
    //

    if (
        Number.isInteger(r) &&
        Number.isInteger(c)
    ) {

        return {
            r,
            c
        };

    }


    // --------------------------------------------------------
    // SEARCH LIVE BOARD
    // --------------------------------------------------------

    return findUnitPosition(unit);
}


// ============================================================
// CHECK UNIT IS AT FOB
// ============================================================
//
// This is the important FOB check.
//
// Priority:
//
// 1. Explicit r/c supplied by caller
// 2. Actual unit position found on board
//
// The unit is at the FOB if its current coordinates match
// its team's FOB coordinates.
//

export function isUnitAtFOB(
    unit,
    r = null,
    c = null
) {

    if (!unit) {
        return false;
    }


    const fob =
        getFOBLocation(
            unit.team
        );


    if (!fob) {
        return false;
    }


    const position =
        getUnitPosition(
            unit,
            r,
            c
        );


    if (!position) {
        return false;
    }


    return (
        position.r === fob.r &&
        position.c === fob.c
    );
}


// ============================================================
// CHECK UNIT IS AIRBORNE
// ============================================================
//
// A unit is considered airborne only when it is NOT currently
// sitting on its team's FOB.
//
// NOTE:
// This does not mean the unit is literally an aircraft.
// It is simply the movement/loadout state used by the
// armament system.
//

export function isUnitAirborne(
    unit,
    r = null,
    c = null
) {

    if (!unit) {
        return false;
    }


    return !isUnitAtFOB(
        unit,
        r,
        c
    );
}


// ============================================================
// CHECK ARMAMENT PAGE EXCLUSION
// ============================================================

export function canAppearOnArmamentsPage(
    unit
) {

    if (!unit) {
        return false;
    }


    return !ARMAMENT_PAGE_EXCLUDED_UNITS.has(
        unit.type
    );
}


// ============================================================
// FIND ALL UNITS FOR TEAM
// ============================================================
//
// Returns units together with their CURRENT board position.
//
// IMPORTANT:
//
// The r/c values discovered while iterating the board are
// passed directly into the FOB check.
//
// Therefore, if the unit is sitting at:
//
//     blue FOB = 15,15
//
// it will correctly be recognized as being at the FOB.
//

export function getUnitsForTeam(
    team
) {

    const result = [];


    for (
        let r = 0;
        r < rows;
        r++
    ) {

        for (
            let c = 0;
            c < cols;
            c++
        ) {

            const stack =
                board[r]?.[c] || [];


            stack.forEach(
                unit => {

                    if (!unit) {
                        return;
                    }


                    const belongsToTeam =
                        unit.team === team ||
                        unit.team === "both";


                    if (!belongsToTeam) {
                        return;
                    }


                    // ------------------------------------------------
                    // ARMAMENT PAGE EXCLUSION
                    // ------------------------------------------------

                    if (
                        !canAppearOnArmamentsPage(
                            unit
                        )
                    ) {

                        return;
                    }


                    ensureUnitLoadout(
                        unit
                    );

                    ensureUnitLoading(
                        unit
                    );


                    // ------------------------------------------------
                    // FOB STATUS
                    // ------------------------------------------------
                    //
                    // Use the coordinates we KNOW are the unit's
                    // current board coordinates.
                    //

                    const atFOB =
                        isUnitAtFOB(
                            unit,
                            r,
                            c
                        );


                    result.push({

                        unit,

                        r,

                        c,

                        atFOB,

                        airborne:
                            !atFOB

                    });

                }
            );

        }

    }


    return result;
}


// ============================================================
// ENSURE LOADOUT
// ============================================================

export function ensureUnitLoadout(
    unit
) {

    if (!unit) {
        return [];
    }


    if (
        !Array.isArray(
            unit.armaments
        )
    ) {

        unit.armaments = [];

    }


    return unit.armaments;
}


// ============================================================
// ENSURE LOADING STATE
// ============================================================

export function ensureUnitLoading(
    unit
) {

    if (!unit) {
        return [];
    }


    if (
        !Array.isArray(
            unit.loadingArmaments
        )
    ) {

        unit.loadingArmaments = [];

    }


    return unit.loadingArmaments;
}


// ============================================================
// UNIT IS LOADING
// ============================================================

export function unitIsLoading(
    unit
) {

    if (!unit) {
        return false;
    }


    return (
        ensureUnitLoading(
            unit
        ).length > 0
    );
}


// ============================================================
// UNIT HAS LOADING ARMAMENT
// ============================================================

export function unitHasLoadingArmament(
    unit,
    armamentId
) {

    ensureUnitLoading(
        unit
    );


    return unit.loadingArmaments.includes(
        armamentId
    );
}


// ============================================================
// UNIT CAPACITY
// ============================================================

export function getUnitCapacity(
    unit
) {

    const data =
        getUnitCombatData(
            unit?.type
        );


    return (
        data?.maxArmaments ||
        0
    );
}


// ============================================================
// UNIT CLASS
// ============================================================

export function getUnitClass(
    unit
) {

    const data =
        getUnitCombatData(
            unit?.type
        );


    return (
        data?.unitClass ||
        "unknown"
    );
}


// ============================================================
// CHECK ARMAMENT COMPATIBILITY
// ============================================================

export function canUnitUseArmament(
    unit,
    armament
) {

    if (
        !unit ||
        !armament
    ) {

        return false;
    }


    // --------------------------------------------------------
    // TEAM
    // --------------------------------------------------------

    if (
        unit.team !== armament.team &&
        unit.team !== "both"
    ) {

        return false;
    }


    // --------------------------------------------------------
    // COMPATIBLE UNITS
    // --------------------------------------------------------

    if (
        !Array.isArray(
            armament.compatibleUnits
        )
    ) {

        return false;
    }


    return armament.compatibleUnits.includes(
        unit.type
    );
}


// ============================================================
// COUNT LOADED ARMAMENTS
// ============================================================

export function countTeamArmament(
    team,
    armamentId
) {

    let count = 0;


    const units =
        getUnitsForTeam(
            team
        );


    units.forEach(
        ({ unit }) => {

            ensureUnitLoadout(
                unit
            );


            count +=
                unit.armaments.filter(
                    id =>
                        id === armamentId
                ).length;

        }
    );


    return count;
}


// ============================================================
// COUNT LOADING ARMAMENTS
// ============================================================

export function countTeamLoadingArmament(
    team,
    armamentId
) {

    let count = 0;


    const units =
        getUnitsForTeam(
            team
        );


    units.forEach(
        ({ unit }) => {

            ensureUnitLoading(
                unit
            );


            count +=
                unit.loadingArmaments.filter(
                    id =>
                        id === armamentId
                ).length;

        }
    );


    return count;
}


// ============================================================
// AVAILABLE ARMAMENT COUNT
// ============================================================
//
// Loading armaments reserve inventory.
//

export function getAvailableArmamentCount(
    team,
    armament
) {

    if (!armament) {
        return 0;
    }


    const loaded =
        countTeamArmament(
            team,
            armament.id
        );


    const loading =
        countTeamLoadingArmament(
            team,
            armament.id
        );


    return Math.max(
        0,
        armament.maxOnField -
        loaded -
        loading
    );
}


// ============================================================
// UNIT HAS ARMAMENT
// ============================================================

export function unitHasArmament(
    unit,
    armamentId
) {

    ensureUnitLoadout(
        unit
    );


    return unit.armaments.includes(
        armamentId
    );
}


// ============================================================
// CAN LOAD ARMAMENT
// ============================================================
//
// A unit can load an armament ONLY if:
//
// 1. It exists
// 2. It is allowed on the Armaments page
// 3. It belongs to the correct team
// 4. It is physically at its team's FOB
// 5. The armament is compatible
// 6. The unit has capacity
// 7. The unit does not already have it
// 8. The unit is not already loading it
// 9. Inventory is available
//

export function canLoadArmament(
    unit,
    armament,
    r = null,
    c = null
) {

    // --------------------------------------------------------
    // UNIT
    // --------------------------------------------------------

    if (!unit) {

        return {
            allowed: false,
            reason:
                "No unit selected."
        };

    }


    // --------------------------------------------------------
    // ARMAMENT
    // --------------------------------------------------------

    if (!armament) {

        return {
            allowed: false,
            reason:
                "No armament selected."
        };

    }


    // --------------------------------------------------------
    // ARMAMENT PAGE EXCLUSION
    // --------------------------------------------------------

    if (
        !canAppearOnArmamentsPage(
            unit
        )
    ) {

        return {
            allowed: false,
            reason:
                `${unit.type} cannot load armaments.`
        };

    }


    // --------------------------------------------------------
    // TEAM
    // --------------------------------------------------------

    if (
        unit.team !== armament.team &&
        unit.team !== "both"
    ) {

        return {
            allowed: false,
            reason:
                "Wrong team."
        };

    }


    // --------------------------------------------------------
    // DETERMINE CURRENT POSITION
    // --------------------------------------------------------

    const position =
        getUnitPosition(
            unit,
            r,
            c
        );


    // --------------------------------------------------------
    // UNIT MUST HAVE A KNOWN POSITION
    // --------------------------------------------------------

    if (!position) {

        return {
            allowed: false,
            reason:
                "Unable to determine the unit's current board position."
        };

    }


    // --------------------------------------------------------
    // FOB CHECK
    // --------------------------------------------------------

    if (
        !isUnitAtFOB(
            unit,
            position.r,
            position.c
        )
    ) {

        const fob =
            getFOBLocation(
                unit.team
            );


        if (fob) {

            return {
                allowed: false,
                reason:
                    `${unit.type} is not at its FOB. Return to the FOB at row ${fob.r}, column ${fob.c} before loading armaments.`
            };

        }


        return {
            allowed: false,
            reason:
                `${unit.type} cannot load armaments because its FOB location is unknown.`
        };

    }


    // --------------------------------------------------------
    // COMPATIBILITY
    // --------------------------------------------------------

    if (
        !canUnitUseArmament(
            unit,
            armament
        )
    ) {

        return {
            allowed: false,
            reason:
                `${armament.name} is not compatible with ${unit.type}.`
        };

    }


    // --------------------------------------------------------
    // CAPACITY
    // --------------------------------------------------------

    const capacity =
        getUnitCapacity(
            unit
        );


    const loaded =
        ensureUnitLoadout(
            unit
        ).length;


    const loading =
        ensureUnitLoading(
            unit
        ).length;


    if (
        loaded + loading >= capacity
    ) {

        return {
            allowed: false,
            reason:
                `${unit.type} is already carrying or loading its maximum of ${capacity} armaments.`
        };

    }


    // --------------------------------------------------------
    // ALREADY LOADED
    // --------------------------------------------------------

    if (
        unitHasArmament(
            unit,
            armament.id
        )
    ) {

        return {
            allowed: false,
            reason:
                `${unit.type} already has ${armament.name}.`
        };

    }


    // --------------------------------------------------------
    // ALREADY LOADING
    // --------------------------------------------------------

    if (
        unitHasLoadingArmament(
            unit,
            armament.id
        )
    ) {

        return {
            allowed: false,
            reason:
                `${unit.type} is already loading ${armament.name}.`
        };

    }


    // --------------------------------------------------------
    // INVENTORY
    // --------------------------------------------------------

    const available =
        getAvailableArmamentCount(
            unit.team,
            armament
        );


    if (
        available <= 0
    ) {

        return {
            allowed: false,
            reason:
                `All ${armament.name} are already deployed or loading.`
        };

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return {
        allowed: true,
        reason: ""
    };
}


// ============================================================
// LOAD ARMAMENT
// ============================================================
//
// The real current board position is determined before the
// load is sent to the server.
//
// Explicit r/c are preferred because they represent the
// position from which the Armaments page selected the unit.
//

export async function loadArmament(
    unit,
    r,
    c,
    armament
) {

    if (!unit) {
        throw new Error(
            "No unit was provided."
        );
    }


    if (!armament) {
        throw new Error(
            "No armament was provided."
        );
    }


    // --------------------------------------------------------
    // RESOLVE CURRENT POSITION
    // --------------------------------------------------------

    const position =
        getUnitPosition(
            unit,
            r,
            c
        );


    if (!position) {

        throw new Error(
            "Unable to determine the unit's current board position."
        );

    }


    r =
        position.r;

    c =
        position.c;


    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    const check =
        canLoadArmament(
            unit,
            armament,
            r,
            c
        );


    if (!check.allowed) {

        throw new Error(
            check.reason
        );

    }


    // --------------------------------------------------------
    // PREPARE LOADOUT
    // --------------------------------------------------------

    ensureUnitLoadout(
        unit
    );

    ensureUnitLoading(
        unit
    );


    // --------------------------------------------------------
    // RESERVE ARMAMENT LOCALLY
    // --------------------------------------------------------

    unit.loadingArmaments.push(
        armament.id
    );


    try {

        await saveArmamentLoadout(
            unit,
            r,
            c,
            armament,
            "load"
        );

    } catch (error) {

        // ----------------------------------------------------
        // ROLLBACK LOCAL RESERVATION
        // ----------------------------------------------------

        const index =
            unit.loadingArmaments.lastIndexOf(
                armament.id
            );


        if (
            index !== -1
        ) {

            unit.loadingArmaments.splice(
                index,
                1
            );

        }


        throw error;
    }


    return true;
}


// ============================================================
// UNLOAD / CANCEL ARMAMENT
// ============================================================

export async function unloadArmament(
    unit,
    r,
    c,
    armament
) {

    if (
        !unit ||
        !armament
    ) {

        throw new Error(
            "Invalid unit or armament."
        );

    }


    // --------------------------------------------------------
    // RESOLVE CURRENT POSITION
    // --------------------------------------------------------

    const position =
        getUnitPosition(
            unit,
            r,
            c
        );


    if (!position) {

        throw new Error(
            "Unable to determine the unit's current board position."
        );

    }


    r =
        position.r;

    c =
        position.c;


    // --------------------------------------------------------
    // PREPARE ARRAYS
    // --------------------------------------------------------

    ensureUnitLoadout(
        unit
    );

    ensureUnitLoading(
        unit
    );


    // --------------------------------------------------------
    // CANCEL LOADING
    // --------------------------------------------------------

    const loadingIndex =
        unit.loadingArmaments.indexOf(
            armament.id
        );


    if (
        loadingIndex !== -1
    ) {

        unit.loadingArmaments.splice(
            loadingIndex,
            1
        );


        try {

            await saveArmamentLoadout(
                unit,
                r,
                c,
                armament,
                "cancelLoad"
            );

        } catch (error) {

            unit.loadingArmaments.splice(
                loadingIndex,
                0,
                armament.id
            );


            throw error;
        }


        return true;
    }


    // --------------------------------------------------------
    // UNLOAD COMPLETED ARMAMENT
    // --------------------------------------------------------

    const index =
        unit.armaments.indexOf(
            armament.id
        );


    if (
        index === -1
    ) {

        throw new Error(
            `${armament.name} is not loaded.`
        );

    }


    unit.armaments.splice(
        index,
        1
    );


    try {

        await saveArmamentLoadout(
            unit,
            r,
            c,
            armament,
            "unload"
        );

    } catch (error) {

        // ----------------------------------------------------
        // ROLLBACK
        // ----------------------------------------------------

        unit.armaments.splice(
            index,
            0,
            armament.id
        );


        throw error;
    }


    return true;
}


// ============================================================
// GET COMPATIBLE ARMAMENTS
// ============================================================

export function getCompatibleArmaments(
    unit
) {

    if (!unit) {
        return [];
    }


    return getArmamentsForTeam(
        unit.team
    ).filter(
        armament =>
            canUnitUseArmament(
                unit,
                armament
            )
    );
}


// ============================================================
// GET UNIT COMBAT POWER
// ============================================================
//
// Loading armaments do NOT contribute to combat power until
// they finish loading / the turn resolves.
//

export function getUnitCombatPower(
    unit
) {

    if (!unit) {

        return {
            air: 0,
            ground: 0,
            total: 0
        };

    }


    const data =
        getUnitCombatData(
            unit.type
        );


    let air =
        data?.baseAirCombat ||
        0;


    let ground =
        data?.baseGroundCombat ||
        0;


    ensureUnitLoadout(
        unit
    );


    unit.armaments.forEach(
        id => {

            const armament =
                getArmament(
                    id
                );


            if (!armament) {
                return;
            }


            if (
                armament.category ===
                "air"
            ) {

                air +=
                    armament.combatPower;

            }

            else if (
                armament.category ===
                "ground"
            ) {

                ground +=
                    armament.combatPower;

            }

            else if (
                armament.category ===
                "both"
            ) {

                air +=
                    armament.combatPower;

                ground +=
                    armament.combatPower;

            }

        }
    );


    return {

        air,

        ground,

        total:
            air + ground

    };
}
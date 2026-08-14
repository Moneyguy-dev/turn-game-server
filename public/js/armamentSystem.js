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
    saveArmamentLoadout
} from "./server.js";


// ============================================================
// ARMAMENT PAGE RULES
// ============================================================
//
// These units should NEVER appear on the Armaments page.
//
// They do not have the ability to load armaments.
// ============================================================

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
// A unit can only load armaments while sitting on
// its own team's FOB.
//
// Blue FOB:
//     r 15
//     c 15
//
// Red FOB:
//     r 3
//     c 10
// ============================================================

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
// FIND FOB FOR TEAM
// ============================================================

export function getFOBLocation(
    team
) {

    return (
        FOB_LOCATIONS[team] ||
        null
    );

}


// ============================================================
// CHECK UNIT IS AT FOB
// ============================================================

export function isUnitAtFOB(
    unit,
    r,
    c
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


    return (

        r === fob.r &&
        c === fob.c

    );

}


// ============================================================
// CHECK UNIT IS AIRBORNE
// ============================================================
//
// Anything away from its own FOB is considered airborne.
//
// This applies to aircraft that have left the FOB.
// ============================================================

export function isUnitAirborne(
    unit,
    r,
    c
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
// CHECK UNIT CAN APPEAR ON ARMAMENTS PAGE
// ============================================================

export function canAppearOnArmamentsPage(
    unit
) {

    if (!unit) {

        return false;

    }


    if (
        ARMAMENT_PAGE_EXCLUDED_UNITS.has(
            unit.type
        )
    ) {

        return false;

    }


    return true;

}


// ============================================================
// FIND ALL UNITS FOR TEAM
// ============================================================
//
// Only units that can actually use armaments are returned.
//
// Each result also includes:
//
//     atFOB
//     airborne
//     r
//     c
//
// This allows the Armaments page to display:
//     "AIRBORNE"
// and disable loading.
// ============================================================

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
                    // DO NOT SHOW NON-ARMAMENT UNITS
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


                    result.push({

                        unit,

                        r,

                        c,

                        atFOB:
                            isUnitAtFOB(
                                unit,
                                r,
                                c
                            ),

                        airborne:
                            isUnitAirborne(
                                unit,
                                r,
                                c
                            )

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


    const loading =
        ensureUnitLoading(
            unit
        );


    return (
        loading.length > 0
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
// CHECK COMPATIBILITY
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


    if (
        unit.team !== armament.team &&
        unit.team !== "both"
    ) {

        return false;

    }


    if (
        !Array.isArray(
            armament.compatibleUnits
        )
    ) {

        return false;

    }


    if (
        !armament.compatibleUnits.includes(
            unit.type
        )
    ) {

        return false;

    }


    return true;

}


// ============================================================
// COUNT TEAM ARMAMENT
// ============================================================
//
// Only completely loaded armaments count.
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
// COUNT LOADING ARMAMENT
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
// ============================================================

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
// UNIT ALREADY HAS ARMAMENT
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
// IMPORTANT:
//
// r and c are required here because loading is only
// allowed while the unit is physically on its FOB.
// ============================================================

export function canLoadArmament(
    unit,
    armament,
    r,
    c
) {

    if (!unit) {

        return {

            allowed: false,

            reason:
                "No unit selected."

        };

    }


    if (!armament) {

        return {

            allowed: false,

            reason:
                "No armament selected."

        };

    }


    // --------------------------------------------------------
    // EXCLUDED UNITS
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
    // MUST BE AT FOB
    // --------------------------------------------------------

    if (
        !isUnitAtFOB(
            unit,
            r,
            c
        )
    ) {

        return {

            allowed: false,

            reason:
                `${unit.type} is airborne and must return to its FOB before loading armaments.`

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


    return {

        allowed: true,

        reason: ""

    };

}


// ============================================================
// LOAD ARMAMENT
// ============================================================
//
// Loading takes the current round.
// The armament enters loadingArmaments.
//
// The server independently verifies the FOB as well.
// ============================================================

export async function loadArmament(
    unit,
    r,
    c,
    armament
) {

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


    ensureUnitLoadout(
        unit
    );


    ensureUnitLoading(
        unit
    );


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
// UNLOAD ARMAMENT
// ============================================================
//
// Unloading can happen for loaded armaments.
// Loading can also be cancelled.
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
// GET COMBAT POWER
// ============================================================
//
// Loading armaments do not contribute until the turn resolves.
// ============================================================

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
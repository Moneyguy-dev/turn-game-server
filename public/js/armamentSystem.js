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
// FIND ALL UNITS FOR TEAM
// ============================================================

export function getUnitsForTeam(team) {

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

                    /*
                     * ARG is shared by both sides.
                     * Include it for either team.
                     */

                    const belongsToTeam =
                        unit.team === team ||
                        unit.team === "both";


                    if (
                        belongsToTeam
                    ) {

                        ensureUnitLoadout(
                            unit
                        );


                        result.push({
                            unit,
                            r,
                            c
                        });
                    }
                }
            );
        }
    }


    return result;
}


// ============================================================
// ENSURE LOADOUT
// ============================================================

export function ensureUnitLoadout(unit) {

    if (
        !unit
    ) {

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
// UNIT CAPACITY
// ============================================================

export function getUnitCapacity(unit) {

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

export function getUnitClass(unit) {

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


    /*
     * "both" units are allowed to use
     * their applicable armaments.
     */

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
// AVAILABLE AMOUNT
// ============================================================

export function getAvailableArmamentCount(
    team,
    armament
) {

    if (!armament) {
        return 0;
    }


    const used =
        countTeamArmament(
            team,
            armament.id
        );


    return Math.max(
        0,
        armament.maxOnField - used
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
// CAN LOAD
// ============================================================

export function canLoadArmament(
    unit,
    armament
) {

    if (!unit) {

        return {
            allowed: false,
            reason: "No unit selected."
        };
    }


    if (!armament) {

        return {
            allowed: false,
            reason: "No armament selected."
        };
    }


    if (
        unit.team !== armament.team &&
        unit.team !== "both"
    ) {

        return {
            allowed: false,
            reason: "Wrong team."
        };
    }


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


    const current =
        ensureUnitLoadout(
            unit
        ).length;


    if (
        current >= capacity
    ) {

        return {
            allowed: false,
            reason:
                `${unit.type} is already carrying its maximum of ${capacity} armaments.`
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
                `All ${armament.name} are already deployed.`
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


    return {
        allowed: true,
        reason: ""
    };
}


// ============================================================
// LOAD
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
            armament
        );


    if (!check.allowed) {

        throw new Error(
            check.reason
        );
    }


    ensureUnitLoadout(
        unit
    );


    unit.armaments.push(
        armament.id
    );


    try {

        await saveArmamentLoadout(
            unit,
            r,
            c
        );

    } catch (error) {

        /*
         * Roll back local state if server
         * rejected the change.
         */

        const index =
            unit.armaments.lastIndexOf(
                armament.id
            );


        if (
            index !== -1
        ) {

            unit.armaments.splice(
                index,
                1
            );
        }


        throw error;
    }


    return true;
}


// ============================================================
// UNLOAD
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
            c
        );

    } catch (error) {

        /*
         * Restore local loadout if the
         * server rejected the change.
         */

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

export function getCompatibleArmaments(unit) {

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

export function getUnitCombatPower(unit) {

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
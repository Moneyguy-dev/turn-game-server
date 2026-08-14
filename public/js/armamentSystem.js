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

            stack.forEach(unit => {

                const belongsToTeam =
                    unit.team === team ||
                    unit.team === "both";

                if (belongsToTeam) {

                    ensureUnitLoadout(unit);

                    ensureUnitLoading(unit);

                    result.push({
                        unit,
                        r,
                        c
                    });
                }
            });
        }
    }

    return result;
}


// ============================================================
// ENSURE LOADOUT
// ============================================================

export function ensureUnitLoadout(unit) {

    if (!unit) {
        return [];
    }

    if (!Array.isArray(unit.armaments)) {

        unit.armaments = [];
    }

    return unit.armaments;
}


// ============================================================
// ENSURE LOADING STATE
// ============================================================

export function ensureUnitLoading(unit) {

    if (!unit) {
        return [];
    }

    if (!Array.isArray(unit.loadingArmaments)) {

        unit.loadingArmaments = [];
    }

    return unit.loadingArmaments;
}


// ============================================================
// UNIT IS LOADING
// ============================================================

export function unitIsLoading(unit) {

    if (!unit) {
        return false;
    }

    const loading =
        ensureUnitLoading(unit);

    return loading.length > 0;
}


// ============================================================
// UNIT HAS LOADING ARMAMENT
// ============================================================

export function unitHasLoadingArmament(
    unit,
    armamentId
) {

    ensureUnitLoading(unit);

    return unit.loadingArmaments.includes(
        armamentId
    );
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
// Only COMPLETELY LOADED armaments count
// against the field inventory.
//
// Armaments that are currently loading are
// not yet considered deployed.
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
// AVAILABLE AMOUNT
// ============================================================
//
// Loading armaments DO reserve inventory,
// so two units cannot simultaneously begin
// loading the final available copy.
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
// The armament is placed into loadingArmaments,
// NOT armaments.
//
// This also marks the unit as unable to move.
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
// Fully loaded armament can be unloaded.
// A loading armament can also be cancelled.
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
//
// Loading armaments do NOT contribute to combat
// power until the turn resolves.
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
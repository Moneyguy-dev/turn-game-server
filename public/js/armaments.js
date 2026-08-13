// ============================================================
// ARMAMENT DEFINITIONS + UNIT COMBAT DEFINITIONS
// ============================================================


// ============================================================
// UNIT DEFINITIONS
// ============================================================

export const unitCombatData = {

    // --------------------------------------------------------
    // BLUE
    // --------------------------------------------------------

    F15E: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 3,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    F16: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    F22: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    F35: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 3,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    B2: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    B52: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 4,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    KC135: {
        team: "blue",
        unitClass: "air",
        maxArmaments: 0,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    DDG80: {
        team: "blue",
        unitClass: "ground",
        maxArmaments: 0,
        baseAirCombat: 8,
        baseGroundCombat: 8
    },

    ARG: {
        team: "both",
        unitClass: "ground",
        maxArmaments: 0,
        baseAirCombat: 0,
        baseGroundCombat: 10
    },


    // --------------------------------------------------------
    // RED
    // --------------------------------------------------------

    J10: {
        team: "red",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    J11: {
        team: "red",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    J16: {
        team: "red",
        unitClass: "air",
        maxArmaments: 3,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    J20: {
        team: "red",
        unitClass: "air",
        maxArmaments: 2,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    H6: {
        team: "red",
        unitClass: "air",
        maxArmaments: 3,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    Y20: {
        team: "red",
        unitClass: "air",
        maxArmaments: 0,
        baseAirCombat: 0,
        baseGroundCombat: 0
    },

    Type052: {
        team: "red",
        unitClass: "ground",
        maxArmaments: 0,
        baseAirCombat: 8,
        baseGroundCombat: 8
    },

    Garrison: {
        team: "red",
        unitClass: "ground",
        maxArmaments: 0,
        baseAirCombat: 8,
        baseGroundCombat: 8
    }
};


// ============================================================
// ARMAMENT DEFINITIONS
// ============================================================

export const armaments = {

    // ========================================================
    // BLUE
    // ========================================================

    "AIM-9X Sidewinder": {

        id: "AIM-9X",

        name: "AIM-9X Sidewinder",

        team: "blue",

        category: "air",

        combatPower: 2,

        maxOnField: 8,

        compatibleUnits: [
            "F15E",
            "F16",
            "F22",
            "F35"
        ]
    },


    "AIM-120D AMRAAM": {

        id: "AIM-120D",

        name: "AIM-120D AMRAAM",

        team: "blue",

        category: "air",

        combatPower: 3,

        maxOnField: 7,

        compatibleUnits: [
            "F15E",
            "F16",
            "F22",
            "F35"
        ]
    },


    "Mk-84": {

        id: "MK84",

        name: "Mk-84",

        team: "blue",

        category: "ground",

        combatPower: 2,

        maxOnField: 7,

        compatibleUnits: [
            "F15E",
            "F16",
            "B2"
        ]
    },


    "GBU-31 JDAM": {

        id: "GBU31",

        name: "GBU-31 JDAM",

        team: "blue",

        category: "ground",

        combatPower: 3,

        maxOnField: 5,

        compatibleUnits: [
            "F15E",
            "F16",
            "F35",
            "B2",
            "B52"
        ]
    },


    "AGM-158B JASSM-ER": {

        id: "JASSMER",

        name: "AGM-158B JASSM-ER",

        team: "blue",

        category: "both",

        combatPower: 4,

        maxOnField: 3,

        compatibleUnits: [
            "F15E",
            "B2",
            "B52"
        ]
    },


    "AGM-158C LRASM": {

        id: "LRASM",

        name: "AGM-158C LRASM",

        team: "blue",

        category: "ground",

        combatPower: 4,

        maxOnField: 3,

        compatibleUnits: [
            "F35",
            "B2",
            "B52"
        ]
    },


    // ========================================================
    // RED
    // ========================================================

    "PL-10": {

        id: "PL10",

        name: "PL-10",

        team: "red",

        category: "air",

        combatPower: 2,

        maxOnField: 8,

        compatibleUnits: [
            "J10",
            "J11",
            "J16",
            "J20"
        ]
    },


    "PL-15": {

        id: "PL15",

        name: "PL-15",

        team: "red",

        category: "air",

        combatPower: 3,

        maxOnField: 7,

        compatibleUnits: [
            "J10",
            "J11",
            "J16",
            "J20"
        ]
    },


    "LS-6": {

        id: "LS6",

        name: "LS-6",

        team: "red",

        category: "ground",

        combatPower: 2,

        maxOnField: 7,

        compatibleUnits: [
            "J10",
            "J16",
            "H6"
        ]
    },


    "FT-2": {

        id: "FT2",

        name: "FT-2",

        team: "red",

        category: "ground",

        combatPower: 3,

        maxOnField: 5,

        compatibleUnits: [
            "J16",
            "H6"
        ]
    },


    "CJ-20": {

        id: "CJ20",

        name: "CJ-20",

        team: "red",

        category: "both",

        combatPower: 4,

        maxOnField: 3,

        compatibleUnits: [
            "J16",
            "H6"
        ]
    },


    "YJ-12": {

        id: "YJ12",

        name: "YJ-12",

        team: "red",

        category: "ground",

        combatPower: 4,

        maxOnField: 3,

        compatibleUnits: [
            "J16",
            "H6"
        ]
    }
};


// ============================================================
// GET ARMAMENT BY ID
// ============================================================

export function getArmament(id) {

    return Object.values(
        armaments
    ).find(
        armament =>
            armament.id === id
    ) || null;
}


// ============================================================
// GET ARMAMENTS FOR TEAM
// ============================================================

export function getArmamentsForTeam(team) {

    return Object.values(
        armaments
    ).filter(
        armament =>
            armament.team === team
    );
}


// ============================================================
// GET UNIT DATA
// ============================================================

export function getUnitCombatData(type) {

    return (
        unitCombatData[type] ||
        null
    );
}
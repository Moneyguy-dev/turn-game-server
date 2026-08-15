// ============================================================
// INDIVIDUAL UNIT DISPLAY CONTROL
// ============================================================
//
// This file ONLY controls the individual-unit display toggle.
//
// Actual unit rendering is handled by units.js.
// ============================================================

import {
    setIndividualUnitView,
    isIndividualUnitViewEnabled
} from "./js/units.js";


// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEY =
    "turnGameIndividualUnitView";


// ============================================================
// INITIALIZE
// ============================================================

function initializeIndividualUnits() {

    const toggle =
        document.getElementById(
            "individualUnitsToggle"
        );


    if (!toggle) {

        console.warn(
            "Individual unit toggle was not found."
        );

        return;
    }


    // --------------------------------------------------------
    // LOAD CURRENT STATE
    // --------------------------------------------------------

    const savedValue =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (savedValue !== null) {

        setIndividualUnitView(
            savedValue === "true"
        );

    } else {

        setIndividualUnitView(
            false
        );
    }


    // --------------------------------------------------------
    // UPDATE SWITCH
    // --------------------------------------------------------

    toggle.checked =
        isIndividualUnitViewEnabled();


    // --------------------------------------------------------
    // HANDLE SWITCH
    // --------------------------------------------------------

    toggle.addEventListener(
        "change",
        () => {

            const enabled =
                toggle.checked;


            localStorage.setItem(
                STORAGE_KEY,
                String(enabled)
            );


            setIndividualUnitView(
                enabled
            );
        }
    );

}


// ============================================================
// START
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeIndividualUnits,
        {
            once: true
        }
    );

} else {

    initializeIndividualUnits();

}
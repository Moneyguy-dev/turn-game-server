// ============================================================
// GAME SETTINGS
// ============================================================
//
// IMPORTANT:
// These settings are MEMORY ONLY.
//
// They are NOT saved to:
// - cookies
// - localStorage
// - sessionStorage
// - server
// - database
//
// Refreshing the page resets everything to DEFAULT_SETTINGS.
//
// Other game files can import:
//     getSetting()
//     setSetting()
//     getAllSettings()
//     resetSettings()
//
// ============================================================


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const DEFAULT_SETTINGS = {

    // --------------------------------------------------------
    // DISPLAY
    // --------------------------------------------------------

    showCoordinates: true,

    showUnitIds: false,

    showMovementRanges: true,

    showFOBs: true,

    showUnitLabels: true,

    animations: true,


    // --------------------------------------------------------
    // GAMEPLAY
    // --------------------------------------------------------

    confirmMove: true,

    confirmArmamentLoad: true,

    confirmArmamentUnload: true,

    showCombatInformation: true,

    showTurnNotifications: true,


    // --------------------------------------------------------
    // INTERFACE
    // --------------------------------------------------------

    compactUnits: false,

    boardZoom: 100,

    uiScale: 100,


    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    soundEffects: true

};


// ============================================================
// CURRENT SETTINGS
// ============================================================
//
// Create a completely separate copy so changing settings
// never modifies DEFAULT_SETTINGS.
//

let currentSettings = {
    ...DEFAULT_SETTINGS
};


// ============================================================
// GET ONE SETTING
// ============================================================

export function getSetting(
    name
) {

    if (
        !Object.prototype.hasOwnProperty.call(
            currentSettings,
            name
        )
    ) {

        return undefined;

    }


    return currentSettings[name];

}


// ============================================================
// SET ONE SETTING
// ============================================================

export function setSetting(
    name,
    value
) {

    if (
        !Object.prototype.hasOwnProperty.call(
            currentSettings,
            name
        )
    ) {

        console.warn(
            `Unknown setting: ${name}`
        );

        return false;

    }


    currentSettings[name] =
        value;


    // --------------------------------------------------------
    // Notify the rest of the game.
    //
    // This does NOT save anything.
    // --------------------------------------------------------

    window.dispatchEvent(
        new CustomEvent(
            "gameSettingsChanged",
            {
                detail: {
                    name,
                    value,
                    settings:
                        getAllSettings()
                }
            }
        )
    );


    return true;

}


// ============================================================
// GET ALL SETTINGS
// ============================================================
//
// Returns a copy rather than the actual object.
//

export function getAllSettings() {

    return {
        ...currentSettings
    };

}


// ============================================================
// RESET ALL SETTINGS
// ============================================================

export function resetSettings() {

    currentSettings = {
        ...DEFAULT_SETTINGS
    };


    window.dispatchEvent(
        new CustomEvent(
            "gameSettingsReset",
            {
                detail: {
                    settings:
                        getAllSettings()
                }
            }
        )
    );


    return getAllSettings();

}


// ============================================================
// GET DEFAULT SETTINGS
// ============================================================

export function getDefaultSettings() {

    return {
        ...DEFAULT_SETTINGS
    };

}


// ============================================================
// CHECK WHETHER SETTINGS ARE DEFAULT
// ============================================================

export function settingsAreDefault() {

    const keys =
        Object.keys(
            DEFAULT_SETTINGS
        );


    return keys.every(
        key =>
            currentSettings[key] ===
            DEFAULT_SETTINGS[key]
    );

}


// ============================================================
// SETTINGS PAGE HELPER
// ============================================================
//
// Automatically connects controls on a settings page.
//
// Any element with:
//
//     data-setting="showCoordinates"
//
// will be connected automatically.
//
// Checkboxes:
//     <input type="checkbox" data-setting="showCoordinates">
//
// Range sliders:
//     <input type="range" data-setting="boardZoom">
//
// Selects:
//     <select data-setting="...">
//
// ============================================================

export function bindSettingsControls(
    root = document
) {

    const controls =
        root.querySelectorAll(
            "[data-setting]"
        );


    controls.forEach(
        control => {

            const settingName =
                control.dataset.setting;


            if (
                !Object.prototype.hasOwnProperty.call(
                    currentSettings,
                    settingName
                )
            ) {

                console.warn(
                    `Unknown setting control: ${settingName}`
                );

                return;

            }


            // ------------------------------------------------
            // INITIAL VALUE
            // ------------------------------------------------

            updateControlFromSetting(
                control,
                settingName
            );


            // ------------------------------------------------
            // CHANGE EVENT
            // ------------------------------------------------

            control.addEventListener(
                "change",
                () => {

                    const value =
                        getControlValue(
                            control
                        );


                    setSetting(
                        settingName,
                        value
                    );

                }
            );


            // ------------------------------------------------
            // RANGE INPUT
            // ------------------------------------------------

            if (
                control.type === "range"
            ) {

                control.addEventListener(
                    "input",
                    () => {

                        const value =
                            getControlValue(
                                control
                            );


                        setSetting(
                            settingName,
                            value
                        );

                    }
                );

            }

        }
    );

}


// ============================================================
// UPDATE CONTROL FROM SETTING
// ============================================================

function updateControlFromSetting(
    control,
    settingName
) {

    const value =
        currentSettings[
            settingName
        ];


    if (
        control.type === "checkbox"
    ) {

        control.checked =
            Boolean(value);

        return;

    }


    if (
        control.type === "range" ||
        control.type === "number"
    ) {

        control.value =
            value;

        return;

    }


    control.value =
        value;

}


// ============================================================
// GET CONTROL VALUE
// ============================================================

function getControlValue(
    control
) {

    if (
        control.type === "checkbox"
    ) {

        return control.checked;

    }


    if (
        control.type === "range" ||
        control.type === "number"
    ) {

        return Number(
            control.value
        );

    }


    return control.value;

}


// ============================================================
// REFRESH ALL SETTINGS CONTROLS
// ============================================================

export function refreshSettingsControls(
    root = document
) {

    const controls =
        root.querySelectorAll(
            "[data-setting]"
        );


    controls.forEach(
        control => {

            updateControlFromSetting(
                control,
                control.dataset.setting
            );

        }
    );

}


// ============================================================
// EXPORT DEFAULT SETTINGS
// ============================================================

export {
    DEFAULT_SETTINGS
};
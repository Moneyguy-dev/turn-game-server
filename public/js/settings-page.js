// ============================================================
// SETTINGS PAGE
// ============================================================

import {
    bindSettingsControls,
    resetSettings,
    getSetting
} from "./settings.js";


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        bindSettingsControls();

        updateSliderDisplays();

        applyInterfacePreview();

        setupButtons();

    }
);


// ============================================================
// BUTTONS
// ============================================================

function setupButtons() {

    const resetButton =
        document.getElementById(
            "resetSettingsButton"
        );


    const doneButton =
        document.getElementById(
            "doneButton"
        );


    const backButton =
        document.getElementById(
            "backButton"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                resetSettings();

                updateControls();

                updateSliderDisplays();

                applyInterfacePreview();

                showStatus(
                    "Settings reset to defaults."
                );

            }
        );

    }


    if (doneButton) {

        doneButton.addEventListener(
            "click",
            () => {

                goBackToGame();

            }
        );

    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                goBackToGame();

            }
        );

    }


    // --------------------------------------------------------
    // Slider display updates
    // --------------------------------------------------------

    const boardZoom =
        document.getElementById(
            "boardZoom"
        );


    const uiScale =
        document.getElementById(
            "uiScale"
        );


    if (boardZoom) {

        boardZoom.addEventListener(
            "input",
            updateSliderDisplays
        );

    }


    if (uiScale) {

        uiScale.addEventListener(
            "input",
            updateSliderDisplays
        );

    }


    // --------------------------------------------------------
    // Listen for setting changes
    // --------------------------------------------------------

    window.addEventListener(
        "gameSettingsChanged",
        () => {

            updateSliderDisplays();

            applyInterfacePreview();

        }
    );


    window.addEventListener(
        "gameSettingsReset",
        () => {

            updateSliderDisplays();

            applyInterfacePreview();

        }
    );

}


// ============================================================
// UPDATE CONTROLS
// ============================================================

function updateControls() {

    document
        .querySelectorAll(
            "[data-setting]"
        )
        .forEach(
            control => {

                const name =
                    control.dataset.setting;

                const value =
                    getSetting(
                        name
                    );


                if (
                    control.type ===
                    "checkbox"
                ) {

                    control.checked =
                        Boolean(
                            value
                        );

                }

                else {

                    control.value =
                        value;

                }

            }
        );

}


// ============================================================
// UPDATE SLIDER LABELS
// ============================================================

function updateSliderDisplays() {

    const boardZoom =
        document.getElementById(
            "boardZoom"
        );


    const boardZoomValue =
        document.getElementById(
            "boardZoomValue"
        );


    if (
        boardZoom &&
        boardZoomValue
    ) {

        boardZoomValue.textContent =
            `${boardZoom.value}%`;

    }


    const uiScale =
        document.getElementById(
            "uiScale"
        );


    const uiScaleValue =
        document.getElementById(
            "uiScaleValue"
        );


    if (
        uiScale &&
        uiScaleValue
    ) {

        uiScaleValue.textContent =
            `${uiScale.value}%`;

    }

}


// ============================================================
// APPLY INTERFACE PREVIEW
// ============================================================

function applyInterfacePreview() {

    const uiScale =
        Number(
            getSetting(
                "uiScale"
            )
        );


    if (
        Number.isFinite(
            uiScale
        )
    ) {

        document.documentElement.style
            .setProperty(
                "--settings-ui-scale",
                uiScale / 100
            );

    }


    const animations =
        getSetting(
            "animations"
        );


    document.body.classList.toggle(
        "animations-disabled",
        animations === false
    );

}


// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(
    message
) {

    const status =
        document.getElementById(
            "settingsStatus"
        );


    if (!status) {
        return;
    }


    status.textContent =
        message;


    status.classList.add(
        "visible"
    );


    window.clearTimeout(
        showStatus.timeout
    );


    showStatus.timeout =
        window.setTimeout(
            () => {

                status.classList.remove(
                    "visible"
                );

            },
            2500
        );

}


// ============================================================
// RETURN TO GAME
// ============================================================

function goBackToGame() {

    // --------------------------------------------------------
    // Preserve the current gameId and mode when returning.
    // --------------------------------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );


    const gameId =
        params.get(
            "gameId"
        );


    const mode =
        params.get(
            "mode"
        );


    let gameUrl =
        "./index.html";


    const gameParams =
        new URLSearchParams();


    if (gameId) {

        gameParams.set(
            "gameId",
            gameId
        );

    }


    if (mode) {

        gameParams.set(
            "mode",
            mode
        );

    }


    const query =
        gameParams.toString();


    if (query) {

        gameUrl +=
            `?${query}`;

    }


    window.location.href =
        gameUrl;

}
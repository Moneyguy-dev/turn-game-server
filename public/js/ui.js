import { updateBoard } from "./units.js";

export function initUI() {
    const unitPanel = document.getElementById("unitPanel");
    const toggleUnits = document.getElementById("toggleUnits");
    const mapContainer = document.getElementById("mapContainer");

    /* ============================
       UNIT PANEL TOGGLE (RIGHT SIDE)
       ============================ */
    if (toggleUnits && unitPanel && mapContainer) {
        toggleUnits.addEventListener("click", () => {
            const isOpen = unitPanel.classList.toggle("open");

            // Update arrow text
            toggleUnits.textContent = isOpen ? "Units ◂" : "Units ▸";

            // Shift map only when unit panel is open
            mapContainer.style.marginRight = isOpen ? "300px" : "0px";
        });
    }

    /* ============================
       DIAGNOSTIC OVERLAY
       ============================ */
    createDiagnosticOverlay();
}

/* ============================
   DIAGNOSTIC OVERLAY (UNCHANGED)
   ============================ */
export function createDiagnosticOverlay() {
    const diag = document.createElement("div");
    diag.id = "diagOverlay";

    Object.assign(diag.style, {
        position: "fixed",
        top: "10px",
        left: "10px",
        padding: "10px 14px",
        background: "rgba(0,0,0,0.75)",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: "9999",
        border: "1px solid #0f0",
        borderRadius: "6px"
    });

    diag.textContent = "Diagnostic Overlay Active";

    document.body.appendChild(diag);
}

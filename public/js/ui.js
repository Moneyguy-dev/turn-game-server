import { updateBoard } from "./units.js";

export function initUI() {
    const unitPanel = document.getElementById("unitPanel");
    const fobPanel = document.getElementById("fobPanel");
    const mapContainer = document.getElementById("mapContainer");

    const unitsBtn = document.getElementById("unitsBtn");
    const fobBtn = document.getElementById("fobButton");

    /* ============================
       UNITS PANEL BUTTON (RIGHT SIDE)
       ============================ */
    if (unitsBtn && unitPanel) {
        unitsBtn.addEventListener("click", () => {
            const isOpen = unitPanel.classList.toggle("open");
            unitsBtn.textContent = isOpen ? "Units ◂" : "Units ▸";
            mapContainer.style.marginRight = isOpen ? "300px" : "0px";
        });
    }

    /* ============================
       FOB PANEL BUTTON (LEFT SIDE)
       ============================ */
    if (fobBtn && fobPanel) {
        fobBtn.addEventListener("click", () => {
            const isOpen = fobPanel.classList.toggle("open");
            fobBtn.textContent = isOpen ? "FOB ◂" : "FOB ▸";
            mapContainer.style.marginLeft = isOpen ? "260px" : "0px";
        });
    }

    /* ============================
       DIAGNOSTIC OVERLAY
       ============================ */
    createDiagnosticOverlay();
}

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

import { updateBoard } from "./units.js";

export function initUI() {
    const unitPanel = document.getElementById("unitPanel");
    const toggleUnits = document.getElementById("toggleUnits");
    const mapContainer = document.getElementById("mapContainer");

    toggleUnits.addEventListener("click", () => {
        const isOpen = unitPanel.classList.toggle("open");
        toggleUnits.textContent = isOpen ? "Units ◂" : "Units ▸";
        mapContainer.style.marginRight = isOpen ? "300px" : "0px";
    });

    createDiagnosticOverlay();
}

export function createDiagnosticOverlay() {
    const diag = document.createElement("div");
    diag.id = "diagOverlay";
    diag.style.position = "fixed";
    diag.style.top = "10px";
    diag.style.left = "10px";
    diag.style.padding = "10px 14px";
    diag.style.background = "rgba(0,0,0,0.75)";
    diag.style.color = "#0f0";
    diag.style.fontFamily = "monospace";
    diag.style.fontSize = "12px";
    diag.style.zIndex = "9999";
    diag.style.border = "1px solid #0f0";
    diag.style.borderRadius = "6px";

    diag.textContent = "Diagnostic Overlay Active";

    document.body.appendChild(diag);
}

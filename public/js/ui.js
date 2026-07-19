import { updateBoard } from "./units.js";

let currentZoom = 1;

export function initUI() {
    const unitPanel = document.getElementById("unitPanel");
    const fobPanel = document.getElementById("fobPanel");
    const mapContainer = document.getElementById("mapContainer");

    const unitsBtn = document.getElementById("unitsBtn");
    const fobBtn = document.getElementById("fobButton");

    const zoomInBtn = document.getElementById("zoomIn");
    const zoomOutBtn = document.getElementById("zoomOut");
    const zoomUnitsBtn = document.getElementById("zoomUnits");

    /* ============================
       UNITS PANEL BUTTON
       ============================ */
    unitsBtn.addEventListener("click", () => {
        const isOpen = unitPanel.classList.toggle("open");
        unitsBtn.textContent = isOpen ? "Units ◂" : "Units ▸";
        mapContainer.style.marginRight = isOpen ? "300px" : "0px";
    });

    /* ============================
       FOB PANEL BUTTON
       ============================ */
    fobBtn.addEventListener("click", () => {
        const isOpen = fobPanel.classList.toggle("open");
        fobBtn.textContent = isOpen ? "FOB ◂" : "FOB ▸";
        mapContainer.style.marginLeft = isOpen ? "260px" : "0px";
    });

    /* ============================
       ZOOM IN
       ============================ */
    zoomInBtn.addEventListener("click", () => {
        currentZoom += 0.1;
        applyZoom();
    });

    /* ============================
       ZOOM OUT
       ============================ */
    zoomOutBtn.addEventListener("click", () => {
        currentZoom = Math.max(0.3, currentZoom - 0.1);
        applyZoom();
    });

    /* ============================
       ZOOM TO UNITS
       ============================ */
    zoomUnitsBtn.addEventListener("click", () => {
        zoomToUnits();
    });

    createDiagnosticOverlay();
}

function applyZoom() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.style.transform = `scale(${currentZoom})`;
}

function zoomToUnits() {
    const gameBoard = document.getElementById("gameBoard");

    const units = gameBoard.querySelectorAll(".unit");
    if (units.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    units.forEach(u => {
        const rect = u.getBoundingClientRect();
        minX = Math.min(minX, rect.left);
        maxX = Math.max(maxX, rect.right);
        minY = Math.min(minY, rect.top);
        maxY = Math.max(maxY, rect.bottom);
    });

    const width = maxX - minX;
    const height = maxY - minY;

    const zoomX = window.innerWidth / width;
    const zoomY = (window.innerHeight - 50) / height;

    currentZoom = Math.min(zoomX, zoomY) * 0.8;
    applyZoom();
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

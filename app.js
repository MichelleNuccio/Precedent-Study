"use strict";

const desktop = document.getElementById("desktop");
const windows = [...document.querySelectorAll("[data-window]")];
const icons = [...document.querySelectorAll(".desktop-icon")];
const shelf = document.getElementById("shelf-items");
let topZ = 20;
let selectedIcon = null;
let dragState = null;
let resizeState = null;

function bringToFront(win) {
  topZ += 1;
  windows.forEach(item => item.classList.remove("is-active"));
  win.classList.add("is-active");
  win.style.zIndex = topZ;
  updateShelf();
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.hidden = false;
  win.classList.add("is-open");
  win.classList.remove("is-minimized");
  bringToFront(win);
  const title = win.querySelector(".title-bar h2");
  if (title) title.setAttribute("tabindex", "-1");
  win.focus({ preventScroll: true });
}

function closeWindow(win) {
  win.hidden = true;
  win.classList.remove("is-open", "is-active", "is-minimized", "is-maximized");
  updateShelf();
}

function toggleMaximize(win) {
  if (!win.classList.contains("is-maximized")) {
    win.dataset.previousStyle = win.getAttribute("style") || "";
    win.classList.add("is-maximized");
  } else {
    win.classList.remove("is-maximized");
  }
  bringToFront(win);
}

function toggleMinimize(win) {
  win.classList.toggle("is-minimized");
  bringToFront(win);
}

function updateShelf() {
  shelf.replaceChildren();
  windows.filter(win => !win.hidden).forEach(win => {
    const button = document.createElement("button");
    button.className = "shelf-button" + (win.classList.contains("is-active") ? " is-active" : "");
    button.type = "button";
    button.textContent = win.querySelector(".title-bar h2")?.textContent || win.id;
    button.addEventListener("click", () => {
      if (win.classList.contains("is-minimized")) win.classList.remove("is-minimized");
      else if (win.classList.contains("is-active")) win.classList.add("is-minimized");
      bringToFront(win);
    });
    shelf.appendChild(button);
  });
}

icons.forEach(icon => {
  icon.addEventListener("click", event => {
    if (selectedIcon) selectedIcon.classList.remove("is-selected");
    selectedIcon = icon;
    icon.classList.add("is-selected");
    if (matchMedia("(pointer: coarse)").matches || event.detail >= 2) openWindow(icon.dataset.open);
  });
  icon.addEventListener("dblclick", () => openWindow(icon.dataset.open));
  icon.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWindow(icon.dataset.open);
    }
  });
});

document.querySelectorAll("[data-open]:not(.desktop-icon)").forEach(button => {
  button.addEventListener("click", () => openWindow(button.dataset.open));
});

const manualTriggers = [...document.querySelectorAll("[data-manual]")];
const manualPanels = [...document.querySelectorAll("[data-manual-panel]")];

function closeManualPanels(except = "") {
  manualPanels.forEach(panel => { panel.hidden = panel.dataset.manualPanel !== except; });
  manualTriggers.forEach(trigger => {
    trigger.setAttribute("aria-expanded", String(trigger.dataset.manual === except));
  });
}

manualTriggers.forEach(trigger => {
  trigger.addEventListener("click", event => {
    event.stopPropagation();
    const name = trigger.dataset.manual;
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    closeManualPanels(isOpen ? "" : name);
  });
});

document.addEventListener("click", event => {
  if (!event.target.closest("[data-manual-panel]")) closeManualPanels();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeManualPanels();
});

windows.forEach(win => {
  win.setAttribute("tabindex", "-1");
  win.addEventListener("pointerdown", () => bringToFront(win));
  win.querySelector('[data-action="close"]')?.addEventListener("click", event => {
    event.stopPropagation();
    closeWindow(win);
  });
  win.querySelector('[data-action="maximize"]')?.addEventListener("click", event => {
    event.stopPropagation();
    toggleMaximize(win);
  });
  win.querySelector(".title-bar")?.addEventListener("dblclick", event => {
    if (!event.target.closest("button")) toggleMaximize(win);
  });
  win.querySelector(".resize-corner")?.addEventListener("pointerdown", event => {
    if (win.classList.contains("is-maximized")) return;
    event.preventDefault();
    event.stopPropagation();
    resizeState = {
      win,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: win.offsetWidth,
      startHeight: win.offsetHeight
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    bringToFront(win);
  });
});

document.addEventListener("pointerdown", event => {
  const handle = event.target.closest("[data-drag-handle]");
  if (!handle || event.target.closest("button")) return;
  const win = handle.closest(".window");
  if (!win || win.classList.contains("is-maximized")) return;
  const rect = win.getBoundingClientRect();
  dragState = { win, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
  handle.setPointerCapture?.(event.pointerId);
  bringToFront(win);
});

document.addEventListener("pointermove", event => {
  if (resizeState) {
    const maxWidth = desktop.clientWidth - resizeState.win.offsetLeft;
    const maxHeight = desktop.clientHeight - resizeState.win.offsetTop;
    const nextWidth = Math.max(280, Math.min(maxWidth, resizeState.startWidth + event.clientX - resizeState.startX));
    const nextHeight = Math.max(190, Math.min(maxHeight, resizeState.startHeight + event.clientY - resizeState.startY));
    resizeState.win.style.width = `${nextWidth}px`;
    resizeState.win.style.height = `${nextHeight}px`;
    return;
  }
  if (!dragState) return;
  const maxX = desktop.clientWidth - Math.min(120, dragState.win.offsetWidth);
  const maxY = desktop.clientHeight - 28;
  const x = Math.max(0, Math.min(maxX, event.clientX - dragState.dx));
  const y = Math.max(0, Math.min(maxY, event.clientY - desktop.getBoundingClientRect().top - dragState.dy));
  dragState.win.style.left = `${x}px`;
  dragState.win.style.top = `${y}px`;
});

document.addEventListener("pointerup", () => {
  dragState = null;
  resizeState = null;
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const active = windows.find(win => win.classList.contains("is-active") && !win.hidden);
    if (active) closeWindow(active);
  }
  if (event.key.toLowerCase() === "m" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    const active = windows.find(win => win.classList.contains("is-active") && !win.hidden);
    if (active) toggleMinimize(active);
  }
});

function updateClock() {
  document.getElementById("menu-clock").textContent = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

updateClock();
setInterval(updateClock, 30000);
bringToFront(document.getElementById("project-window"));

(() => {
  const canvas = document.getElementById("archive-field");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function randomGrid(row, column, side) {
    const value = Math.sin(row * 12.9898 + column * 78.233 + side * 41.17) * 43758.5453;
    return value - Math.floor(value);
  }

  function resizeField() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawField(performance.now());
  }

  function drawMass(side, time) {
    const centerX = width * (side < 0 ? 0.25 : 0.75);
    const centerY = height * 0.51;
    const radiusX = Math.min(width * 0.25, 360);
    const radiusY = Math.min(height * 0.38, 260);
    const columns = Math.max(28, Math.floor(radiusX * 2 / 8));
    const rows = Math.max(28, Math.floor(radiusY * 2 / 8));
    const phase = time * 0.00028;

    for (let row = 0; row <= rows; row += 1) {
      const v = row / rows * 2 - 1;
      for (let column = 0; column <= columns; column += 1) {
        const u = column / columns * 2 - 1;
        const seed = randomGrid(row, column, side);
        const ripple = Math.sin(v * 6.2 + phase * 2.1 + side) * 0.13;
        const contour = u * u + v * v;
        const boundary = 1 + ripple + Math.sin(u * 4 - phase) * 0.06;
        if (contour > boundary) continue;

        const density = Math.max(0, 1 - contour / boundary);
        const interference = (Math.sin(row * 0.72 + phase * 3 + u * 2.4) + 1) * 0.5;
        if (seed > 0.17 + density * 0.58 * interference) continue;

        const fold = Math.sin(v * 7 + phase * 1.7) * radiusX * 0.055;
        const breathe = 1 + Math.sin(phase + v * 2.5) * 0.025;
        const x = centerX + u * radiusX * breathe + fold * side + pointerX * (0.2 + density * 0.8);
        const y = centerY + v * radiusY + Math.sin(u * 5 + phase * 2) * 7 + pointerY * (0.2 + density * 0.8);
        const opacity = 0.1 + density * 0.52;
        const dotWidth = 0.7 + density * 2.4 + interference * 1.2;
        const dotHeight = seed > 0.72 ? 1.5 : 1;

        context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        context.fillRect(x, y, dotWidth, dotHeight);
      }
    }
  }

  function drawField(time) {
    context.clearRect(0, 0, width, height);
    drawMass(-1, time);
    drawMass(1, time);

    context.strokeStyle = "rgba(255, 255, 255, 0.18)";
    context.lineWidth = 0.6;
    context.beginPath();
    context.moveTo(width * 0.1, height * 0.51 + pointerY * 0.2);
    context.bezierCurveTo(width * 0.34, height * 0.42, width * 0.66, height * 0.6, width * 0.9, height * 0.49);
    context.stroke();
  }

  function animate(time) {
    drawField(time);
    frame = requestAnimationFrame(animate);
  }

  desktop.addEventListener("pointermove", event => {
    const bounds = desktop.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width * 16 - 8;
    pointerY = (event.clientY - bounds.top) / bounds.height * 12 - 6;
  }, { passive: true });

  window.addEventListener("resize", resizeField);
  reducedMotion.addEventListener?.("change", () => {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) drawField(performance.now());
    else frame = requestAnimationFrame(animate);
  });

  resizeField();
  if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
})();

"use strict";

// ---------- State and constants ----------
const WORLD_WIDTH = 1440;
const WORLD_HEIGHT = 900;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.4;
const PAPER = "#f3f0e8";
const INK = "#111111";
const MUTED = "#68655f";
const RED = "#b32025";
const VIEW_MODES = new Set(["all", "personal", "original"]);

let diagramData = { nodes: [], edges: [] };
let nodeById = new Map();
let dataLoaded = false;
let dataError = "";
let canvas;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let hoveredNodeId = null;
let selectedNodeId = null;
let keyboardNodeIndex = -1;
let isDraggingCanvas = false;
let dragMoved = false;
let lastPointer = { x: 0, y: 0 };
let viewMode = "all";

// ---------- Data loading ----------
function preloadData() {
  loadJSON(
    "data.json",
    data => {
      diagramData = validateData(data);
      dataLoaded = true;
    },
    error => {
      console.error("Could not load data.json", error);
      dataError = "DATA COULD NOT BE LOADED. RUN THIS PROJECT THROUGH A LOCAL WEB SERVER.";
    }
  );
}

function preload() { preloadData(); }

function validateData(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const nodes = Array.isArray(safe.nodes) ? safe.nodes.filter(n => n && typeof n.id === "string") : [];
  const ids = new Set(nodes.map(n => n.id));
  const edges = Array.isArray(safe.edges)
    ? safe.edges.filter(e => {
        const valid = e && ids.has(e.source) && ids.has(e.target);
        if (!valid) console.warn("Ignoring malformed edge", e);
        return valid;
      })
    : [];
  return { meta: safe.meta || {}, nodes, edges };
}

// ---------- Setup and drawing ----------
function setup() {
  const container = document.getElementById("canvas-container");
  canvas = createCanvas(container.clientWidth, container.clientHeight);
  canvas.parent(container);
  canvas.attribute("aria-label", "Interactive UML-style diagram of the Calculating Empires precedent study");
  canvas.attribute("tabindex", "0");
  canvas.elt.addEventListener("contextmenu", event => event.preventDefault());
  textFont("Arial");
  resetView();

  nodeById = new Map(diagramData.nodes.map(node => [node.id, node]));
  bindHTMLControls();
  buildIndex();
  updateDataState();
  setViewMode(window.__diagramViewMode || "all");
}

function draw() {
  // Legge lo stato direttamente dall'elemento HTML a ogni fotogramma.
  // In questo modo il grande spazio quadrettato cambia anche se il click
  // è stato gestito prima del completamento dell'inizializzazione di p5.js.
  viewMode = getActiveViewMode();
  background(getCanvasBackground());
  drawReferenceGrid();
  if (dataError) {
    fill(RED); noStroke(); textAlign(CENTER, CENTER); textSize(14); text(dataError, width / 2, height / 2);
    return;
  }
  if (!dataLoaded) return;
  drawEdges();
  drawNodes();
}

function drawReferenceGrid() {
  push();
  if (viewMode === "personal") stroke(179, 32, 37, 18);
  else stroke(17, 17, 17, viewMode === "original" ? 24 : 16);
  strokeWeight(1);
  const spacing = 48 * zoomLevel;
  if (spacing > 8) {
    const ox = ((panX % spacing) + spacing) % spacing;
    const oy = ((panY % spacing) + spacing) % spacing;
    for (let x = ox; x < width; x += spacing) line(x, 0, x, height);
    for (let y = oy; y < height; y += spacing) line(0, y, width, y);
  }
  pop();
}

function drawEdges() {
  for (const edge of diagramData.edges) {
    if (!isEdgeVisibleInMode(edge)) continue;
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) continue;

    const related = isEdgeRelated(edge);
    const hasFocus = Boolean(hoveredNodeId || selectedNodeId);
    const alpha = hasFocus && !related ? 48 : 220;
    const isInterpretive = edge.type === "interpretive";
    const edgeInk = viewMode === "personal" ? RED : (isInterpretive ? RED : INK);
    const color = colorWithAlpha(edgeInk, alpha);
    const a = nodeCenter(source);
    const b = nodeCenter(target);

    push();
    stroke(color);
    strokeWeight(related ? 2.2 : 1.15);
    if (edge.type === "inferred") drawingContext.setLineDash([8, 6]);
    else drawingContext.setLineDash([]);
    line(a.x, a.y, b.x, b.y);
    drawArrowhead(a, b, color, related ? 9 : 7);
    drawingContext.setLineDash([]);
    drawEdgeLabel(edge, a, b, color, hasFocus && !related);
    pop();
  }
}

function drawEdgeLabel(edge, a, b, edgeColor, dimmed) {
  const label = typeof edge.label === "string" ? edge.label.toUpperCase() : "";
  if (!label) return;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  push();
  textSize(max(8, 9 * zoomLevel));
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  const tw = textWidth(label) + 10;
  noStroke();
  const labelBackground = getCanvasBackground();
  fill(dimmed ? colorWithAlpha(labelBackground, 150) : colorWithAlpha(labelBackground, 238));
  rectMode(CENTER);
  rect(mx, my, tw, 18 * zoomLevel);
  fill(edgeColor);
  text(label, mx, my + 0.5);
  pop();
}

function drawNodes() {
  for (const node of diagramData.nodes) {
    if (isNodeVisibleInMode(node)) drawNode(node);
  }
}

function drawNode(node) {
  const rect = getNodeScreenRect(node);
  const activeId = selectedNodeId || hoveredNodeId;
  const related = !activeId || node.id === activeId || areNodesConnected(activeId, node.id);
  const dimmed = Boolean(activeId && !related);
  const interpretive = node.group === "interpretive" || node.group === "output";
  const central = node.group === "core";
  const selected = node.id === selectedNodeId;
  const hovered = node.id === hoveredNodeId;
  const outline = viewMode === "personal" ? RED : (interpretive ? RED : INK);

  push();
  rectMode(CORNER);
  noFill();
  stroke(colorWithAlpha(outline, dimmed ? 55 : 255));
  strokeWeight((central ? 3 : 1.4) + (selected ? 2 : hovered ? 1 : 0));
  if (node.group === "inferred") drawingContext.setLineDash([8, 5]);
  else drawingContext.setLineDash([]);
  rect(rect.x, rect.y, rect.w, rect.h);
  drawingContext.setLineDash([]);

  const textColor = colorWithAlpha(outline, dimmed ? 65 : 255);
  noStroke();
  fill(textColor);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(clamp(9 * zoomLevel, 8, 12));
  text(safeString(node.code, "--"), rect.x + 10, rect.y + 8);

  textSize(clamp((central ? 18 : 14) * zoomLevel, central ? 12 : 10, central ? 23 : 17));
  const titleY = rect.y + rect.h * 0.39;
  text(safeString(node.label, "UNTITLED"), rect.x + 10, titleY, rect.w - 20, rect.h * 0.42);

  textStyle(NORMAL);
  textSize(clamp(8 * zoomLevel, 7, 10));
  text(safeString(node.category, node.group).toUpperCase(), rect.x + 10, rect.y + rect.h - 18);
  pop();
}

// ---------- Geometry and interaction state ----------
function getNodeScreenRect(node) {
  const mobileScale = width < 760 ? 0.82 : 1;
  const w = Math.max(118, Number(node.width) || 180) * zoomLevel * mobileScale;
  const h = Math.max(64, Number(node.height) || 76) * zoomLevel * mobileScale;
  const cx = panX + clamp(Number(node.x), 0, 1) * WORLD_WIDTH * zoomLevel;
  const cy = panY + clamp(Number(node.y), 0, 1) * WORLD_HEIGHT * zoomLevel;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

function nodeCenter(node) {
  const r = getNodeScreenRect(node);
  return { x: r.cx, y: r.cy };
}

function getNodeAtPointer(px = mouseX, py = mouseY) {
  for (let i = diagramData.nodes.length - 1; i >= 0; i--) {
    const node = diagramData.nodes[i];
    if (!isNodeVisibleInMode(node)) continue;
    const r = getNodeScreenRect(node);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return node;
  }
  return null;
}

function updateHoverState() {
  if (isDraggingCanvas) return;
  const node = getNodeAtPointer();
  const nextId = node ? node.id : null;
  if (nextId !== hoveredNodeId) {
    hoveredNodeId = nextId;
    updateStatus(node);
    canvas.style("cursor", node ? "pointer" : "grab");
  }
}

function mouseMoved() { updateHoverState(); }

function isEdgeRelated(edge) {
  const id = selectedNodeId || hoveredNodeId;
  return !id || edge.source === id || edge.target === id;
}

function isEdgeVisibleInMode(edge) {
  const mode = getActiveViewMode();
  if (mode === "personal") return edge.type === "interpretive";
  if (mode === "original") return edge.type === "documented";
  return true;
}

function isNodeVisibleInMode(node) {
  const mode = getActiveViewMode();
  if (mode === "all") return true;
  if (mode === "original") return ["core", "documented", "source"].includes(node.group);
  if (node.group === "interpretive" || node.group === "output") return true;
  return diagramData.edges.some(edge =>
    edge.type === "interpretive" && (edge.source === node.id || edge.target === node.id)
  );
}

function getCanvasBackground() {
  const mode = getActiveViewMode();
  if (mode === "personal") return INK;
  if (mode === "original") return RED;
  return PAPER;
}

function getActiveViewMode() {
  const region = document.getElementById("canvas-region");
  const htmlMode = region && region.dataset ? region.dataset.viewMode : "";
  if (VIEW_MODES.has(htmlMode)) return htmlMode;
  if (VIEW_MODES.has(window.__diagramViewMode)) return window.__diagramViewMode;
  return VIEW_MODES.has(viewMode) ? viewMode : "all";
}

function areNodesConnected(a, b) {
  return diagramData.edges.some(edge => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a));
}

// ---------- Selection and HTML panel ----------
function selectNode(nodeOrId) {
  const node = typeof nodeOrId === "string" ? nodeById.get(nodeOrId) : nodeOrId;
  if (!node) {
    console.warn("Cannot select missing node", nodeOrId);
    return;
  }
  selectedNodeId = node.id;
  keyboardNodeIndex = diagramData.nodes.findIndex(item => item.id === node.id);
  openPanel(node);
  updateStatus(node, true);
}

function openPanel(node) {
  renderPanelContent(node);
  const panel = document.getElementById("info-panel");
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  document.getElementById("panel-close").focus();
}

function closePanel(returnFocus = true) {
  const panel = document.getElementById("info-panel");
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  selectedNodeId = null;
  updateStatus(hoveredNodeId ? nodeById.get(hoveredNodeId) : null);
  if (returnFocus && canvas) canvas.elt.focus();
}

function renderPanelContent(node) {
  const content = node && node.content && typeof node.content === "object" ? node.content : {};
  setText("panel-eyebrow", safeString(content.eyebrow, `${node.code || "--"} / ${node.label || "SECTION"}`));
  setText("panel-title", safeString(content.title, node.label || "Untitled section"));
  setText("panel-subtitle", safeString(content.subtitle, node.summary || ""));

  const paragraphs = document.getElementById("panel-paragraphs");
  paragraphs.replaceChildren();
  const paragraphItems = Array.isArray(content.paragraphs) ? content.paragraphs : [];
  for (const value of paragraphItems) {
    if (typeof value !== "string") continue;
    const p = document.createElement("p");
    p.textContent = value;
    paragraphs.appendChild(p);
  }

  const keywords = document.getElementById("panel-keywords");
  keywords.replaceChildren();
  for (const value of Array.isArray(content.keywords) ? content.keywords : []) {
    if (typeof value !== "string") continue;
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent = value;
    keywords.appendChild(span);
  }

  const sources = document.getElementById("panel-sources");
  sources.replaceChildren();
  const sourceItems = Array.isArray(content.sources) ? content.sources : [];
  if (!sourceItems.length) {
    const li = document.createElement("li");
    li.textContent = "No sources assigned yet.";
    sources.appendChild(li);
  }
  for (const source of sourceItems) {
    if (!source || typeof source.label !== "string" || typeof source.url !== "string") continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = source.label;
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    sources.appendChild(li);
  }
}

// ---------- HTML controls and accessible index ----------
function bindHTMLControls() {
  document.getElementById("reset-button").addEventListener("click", resetView);
  document.getElementById("panel-close").addEventListener("click", () => closePanel());
  document.getElementById("index-button").addEventListener("click", openIndex);
  document.getElementById("index-close").addEventListener("click", closeIndex);
  document.getElementById("index-dialog").addEventListener("click", event => {
    if (event.target === event.currentTarget) closeIndex();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (document.getElementById("index-dialog").open) closeIndex();
      else if (document.getElementById("info-panel").classList.contains("is-open")) closePanel();
    }
  });
}

function setViewMode(mode) {
  if (!VIEW_MODES.has(mode)) return;
  viewMode = mode;
  window.__diagramViewMode = mode;
  hoveredNodeId = null;
  keyboardNodeIndex = -1;

  if (selectedNodeId) {
    const selected = nodeById.get(selectedNodeId);
    if (!selected || !isNodeVisibleInMode(selected)) closePanel(false);
  }

  document.querySelectorAll(".mode-dot").forEach(button => {
    const active = button.dataset.mode === viewMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const region = document.getElementById("canvas-region");
  if (region) region.dataset.viewMode = viewMode;

  const labels = {
    all: "COMPLETE VIEW — documented and interpretive relations are intertwined.",
    personal: "PERSONAL VIEW — only the red critical interpretation remains visible.",
    original: "ORIGINAL VIEW — only documented project relations remain visible."
  };
  setText("diagram-status", labels[viewMode]);
}

function buildIndex() {
  const list = document.getElementById("index-list");
  list.replaceChildren();
  for (const node of diagramData.nodes) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = "";
    const code = document.createElement("span");
    const label = document.createElement("span");
    const category = document.createElement("span");
    code.className = "index-code";
    label.className = "index-label";
    category.className = "index-category";
    code.textContent = safeString(node.code, "--");
    label.textContent = safeString(node.label, "UNTITLED");
    category.textContent = safeString(node.category, node.group).toUpperCase();
    button.append(code, label, category);
    button.addEventListener("click", () => {
      closeIndex();
      selectNode(node);
    });
    li.appendChild(button);
    list.appendChild(li);
  }
}

function openIndex() {
  const dialog = document.getElementById("index-dialog");
  if (!dialog.open) dialog.showModal();
}

function closeIndex() {
  const dialog = document.getElementById("index-dialog");
  if (dialog.open) dialog.close();
}

function updateStatus(node, selected = false) {
  const status = document.getElementById("diagram-status");
  if (!node) status.textContent = "Select a node to inspect the precedent study.";
  else status.textContent = `${selected ? "SELECTED — " : ""}${safeString(node.code, "--")} ${safeString(node.label, "SECTION")}: ${safeString(node.summary, "No summary available.")}`;
}

function updateDataState() {
  setText("data-state", dataError ? "DATA ERROR" : `${diagramData.nodes.length} SECTIONS / ${diagramData.edges.length} RELATIONS`);
}

// ---------- View control and pointer events ----------
function resetView() {
  const fitX = width / WORLD_WIDTH;
  const fitY = height / WORLD_HEIGHT;
  zoomLevel = clamp(Math.min(fitX, fitY) * (width < 760 ? 1.12 : 0.92), MIN_ZOOM, 1.1);
  panX = (width - WORLD_WIDTH * zoomLevel) / 2;
  panY = (height - WORLD_HEIGHT * zoomLevel) / 2;
}

function windowResized() {
  const container = document.getElementById("canvas-container");
  resizeCanvas(container.clientWidth, container.clientHeight);
  resetView();
}

function mousePressed() {
  if (!pointerInsideCanvas()) return;
  lastPointer = { x: mouseX, y: mouseY };
  dragMoved = false;
  if (!getNodeAtPointer()) {
    isDraggingCanvas = true;
    canvas.style("cursor", "grabbing");
  }
}

function mouseDragged() {
  if (!isDraggingCanvas) return;
  const dx = mouseX - lastPointer.x;
  const dy = mouseY - lastPointer.y;
  if (Math.abs(dx) + Math.abs(dy) > 1) dragMoved = true;
  panX += dx;
  panY += dy;
  lastPointer = { x: mouseX, y: mouseY };
}

function mouseReleased() {
  if (!pointerInsideCanvas()) {
    isDraggingCanvas = false;
    return;
  }
  const node = getNodeAtPointer();
  if (!dragMoved && node) selectNode(node);
  isDraggingCanvas = false;
  updateHoverState();
}

function mouseWheel(event) {
  if (!pointerInsideCanvas()) return true;
  const previous = zoomLevel;
  const factor = event.delta > 0 ? 0.9 : 1.1;
  zoomLevel = clamp(zoomLevel * factor, MIN_ZOOM, MAX_ZOOM);
  const ratio = zoomLevel / previous;
  panX = mouseX - (mouseX - panX) * ratio;
  panY = mouseY - (mouseY - panY) * ratio;
  return false;
}

function keyPressed() {
  if (!diagramData.nodes.length) return;
  if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW) focusAdjacentNode(1);
  else if (keyCode === LEFT_ARROW || keyCode === UP_ARROW) focusAdjacentNode(-1);
  else if (keyCode === ENTER && keyboardNodeIndex >= 0) selectNode(diagramData.nodes[keyboardNodeIndex]);
  else if (key === "r" || key === "R") resetView();
}

function focusAdjacentNode(direction) {
  const visibleNodes = diagramData.nodes.filter(isNodeVisibleInMode);
  if (!visibleNodes.length) return;
  const currentId = keyboardNodeIndex >= 0 && diagramData.nodes[keyboardNodeIndex]
    ? diagramData.nodes[keyboardNodeIndex].id
    : null;
  let visibleIndex = visibleNodes.findIndex(node => node.id === currentId);
  visibleIndex = (visibleIndex + direction + visibleNodes.length) % visibleNodes.length;
  const node = visibleNodes[visibleIndex];
  keyboardNodeIndex = diagramData.nodes.findIndex(item => item.id === node.id);
  hoveredNodeId = node.id;
  updateStatus(node);
}

// ---------- Small utilities ----------
function drawArrowhead(a, b, strokeColor, size) {
  const angle = atan2(b.y - a.y, b.x - a.x);
  push();
  translate(b.x, b.y);
  rotate(angle);
  noStroke();
  fill(strokeColor);
  triangle(0, 0, -size, size * 0.55, -size, -size * 0.55);
  pop();
}

function pointerInsideCanvas() { return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height; }
function clamp(value, minValue, maxValue) { return Math.min(maxValue, Math.max(minValue, Number.isFinite(value) ? value : minValue)); }
function safeString(value, fallback = "") { return typeof value === "string" && value.trim() ? value : fallback; }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }

function colorWithAlpha(hex, alpha) {
  const c = color(hex);
  c.setAlpha(alpha);
  return c;
}

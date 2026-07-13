// ------------------------------------------------------------
// FILTER GROUPS
// ------------------------------------------------------------
// These objects create the layer filter buttons in the sidebar.
// - id: internal name used by nodes in their "theme" field.
// - label: visible button text.
// - color: currently white because the design is black and white.
const themes = [
  { id: "all", label: "All", color: "#ffffff" },
  { id: "genealogy", label: "Genealogy", color: "#ffffff" },
  { id: "practice", label: "Practice", color: "#ffffff" },
  { id: "method", label: "Methodology", color: "#ffffff" },
  { id: "structure", label: "Structure", color: "#ffffff" },
  { id: "rhetoric", label: "Rhetoric", color: "#ffffff" },
  { id: "critical", label: "Critical reading", color: "#ffffff" },
  { id: "theory", label: "Theory", color: "#ffffff" },
];

// These values create the section filter buttons above the map.
// To add a new section, add it here and use the same text in a node's "period" field.
const periods = ["All", "Origins", "Core", "Analysis", "Reading"];

// ------------------------------------------------------------
// INTRO STATE MACHINE
// ------------------------------------------------------------
// The site starts closed: only the HTML square is visible.
// After activation, D3 reveals the central node and the first-level clusters.
const APP_STATES = {
  CLOSED: "closed",
  HOVERED: "hovered",
  UNFOLDING: "unfolding",
  OPEN: "open",
};

const INTRO_CONFIG = {
  replayOnReload: true,
};

const INTRO_ROOT_RADIUS = {
  closed: 11,
  hovered: 13,
};

const INTRO_TIMING = {
  edgeDuration: 500,
  nodeDuration: 350,
  stagger: 150,
  controlsDelay: 250,
};

// These are the nodes revealed during the opening sequence.
// The current data uses "shared-practice" as the genealogy/origin cluster.
const INTRO_CLUSTER_IDS = [
  "shared-practice",
  "wider-practice",
  "methodology",
  "structure",
  "rhetorical-analysis",
  "critical-reading",
];

let appState = APP_STATES.CLOSED;
let introLocked = false;
let visibleNodeIds = new Set(["root"]);
let expandedNodeIds = new Set();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------------------------
// MAP CONTENT
// ------------------------------------------------------------
// This is the main place to edit the diagram.
//
// Each node has:
// - id: unique internal name. Use this when connecting nodes.
// - label: visible text next to the square.
// - parent: the main structural relationship.
//   Example: parent: "shared-practice" means Shared Practice -> this node.
// - period: controls the top filter.
// - theme: controls the sidebar layer filter.
// - type: appears in the information panel when clicked.
// - radius: controls square size. Bigger radius = more important node.
//   Nodes with radius <= 10 automatically get dotted outlines and dotted links.
// - note: appears in the information panel when clicked.
const nodes = [
  {
    id: "root",
    label: "Calculating Empires",
    period: "Core",
    theme: "all",
    type: "Nodo centrale",
    radius: 25,
    note: "A Genealogy of Power and Technology from 1500 to the Present. Tutti i cluster si leggono in relazione a questo nodo centrale.",
  },
  { id: "shared-practice", label: "SHARED PRACTICE", parent: "root", period: "Origins", theme: "genealogy", type: "Research Practice", radius: 18, note: "This node represents the convergence of Kate Crawford's critical AI research and Vladan Joler's investigative mapping practice. Before Calculating Empires, their collaboration developed a shared methodology that combines historical research, critical theory and diagrammatic visualization to investigate technological infrastructures." },

  { id: "kate-crawford", label: "Kate Crawford", parent: "shared-practice", period: "Origins", theme: "genealogy", type: "Autrice", radius: 14, note: "Uno dei due poli autoriali da cui nasce il progetto." },
  { id: "kate-academic", label: "Academic Background", parent: "kate-crawford", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Formazione e contesto accademico di Kate Crawford." },
  { id: "kate-works", label: "Previous Works", parent: "kate-crawford", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Lavori precedenti che preparano il terreno per Calculating Empires." },
  { id: "kate-themes", label: "Research Themes", parent: "kate-crawford", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Temi ricorrenti: AI, potere, estrazione, lavoro, classificazione." },
  { id: "kate-methods", label: "Methods & Practice", parent: "kate-crawford", period: "Origins", theme: "genealogy", type: "Contributo metodologico", radius: 9, note: "Metodi di ricerca, scrittura critica, visualizzazione e analisi dei sistemi: questo contributo confluisce in Shared Practice." },

  { id: "vladan-joler", label: "Vladan Joler", parent: "shared-practice", period: "Origins", theme: "genealogy", type: "Autore", radius: 14, note: "L'altro polo autoriale: cartografia critica, investigazione infrastrutturale e visual research." },
  { id: "vladan-academic", label: "Academic Background", parent: "vladan-joler", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Formazione e contesto accademico di Vladan Joler." },
  { id: "vladan-works", label: "Previous Works", parent: "vladan-joler", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Progetti precedenti legati a reti, piattaforme, dati e infrastrutture." },
  { id: "vladan-themes", label: "Research Themes", parent: "vladan-joler", period: "Origins", theme: "genealogy", type: "Sotto-nodo", radius: 9, note: "Temi ricorrenti: mappatura, sorveglianza, estrazione, anatomia dei sistemi tecnici." },
  { id: "vladan-methods", label: "Methods & Practice", parent: "vladan-joler", period: "Origins", theme: "genealogy", type: "Contributo metodologico", radius: 9, note: "Pratica visiva e investigativa basata su mappe, diagrammi e sistemi complessi: questo contributo confluisce in Shared Practice." },
  
  { id: "wider-practice", label: "Wider Practice", parent: "shared-practice", period: "Core", theme: "practice", type: "Cluster", radius: 14, note: "Uno dei due rami che nasce da Shared Practice: mostra come Calculating Empires si inserisce nella pratica piu' ampia dei due autori." },
  { id: "atlas-ai", label: "Atlas of AI", parent: "wider-practice", period: "Core", theme: "practice", type: "Progetto/libro", radius: 10, note: "Riferimento alla lettura critica dell'intelligenza artificiale come sistema materiale e politico." },
  { id: "excavating-ai", label: "Excavating AI", parent: "wider-practice", period: "Core", theme: "practice", type: "Progetto", radius: 10, note: "Lavora sull'estrazione e sulla materialita' nascosta dei dataset e dell'AI." },
  { id: "training-humans", label: "Training Humans", parent: "wider-practice", period: "Core", theme: "practice", type: "Mostra/progetto", radius: 10, note: "Interroga la storia visiva dei dataset e della classificazione dei soggetti umani." },
  { id: "facebook-factory", label: "Facebook Algorithmic Factory", parent: "wider-practice", period: "Core", theme: "practice", type: "Progetto", radius: 10, note: "Mappa piattaforme, lavoro, dati e produzione algoritmica." },
  { id: "new-extractivism", label: "New Extractivism", parent: "wider-practice", period: "Core", theme: "practice", type: "Tema/progetto", radius: 10, note: "Colloca tecnologia e dati dentro logiche estrattive contemporanee." },

  { id: "methodology", label: "METHODOLOGY", parent: "root", period: "Analysis", theme: "method", type: "Cluster", radius: 18, note: "Descrive come il progetto viene prodotto: raccolta, selezione, classificazione e traduzione visuale." },
  { id: "historical-research", label: "Historical Research", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Ricostruzione storica di lungo periodo, dal 1500 a oggi." },
  { id: "source-collection", label: "Source Collection", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Raccolta di materiali, fonti, esempi, apparati e casi." },
  { id: "selection", label: "Selection", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Scelta di cosa includere e cosa lasciare fuori dalla mappa." },
  { id: "classification-method", label: "Classification", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Trasformazione delle fonti in categorie leggibili." },
  { id: "taxonomy-method", label: "Taxonomy", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Organizzazione sistematica delle categorie e dei livelli del progetto." },
  { id: "visual-encoding", label: "Visual Encoding", parent: "methodology", period: "Analysis", theme: "method", type: "Metodo", radius: 10, note: "Traduzione delle relazioni in posizione, densita', scala, connessioni e navigazione visiva." },

  { id: "structure", label: "STRUCTURE", parent: "root", period: "Analysis", theme: "structure", type: "Cluster", radius: 18, note: "Descrive come e' costruita la mappa come oggetto visivo e interfaccia." },
  { id: "grid", label: "Structural Grid", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "La griglia organizza il sapere e rende comparabili elementi diversi." },
  { id: "timeline", label: "Timeline", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "La linea temporale costruisce la lettura genealogica di lunga durata." },
  { id: "categories", label: "Categories", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "Le categorie rendono leggibile la complessita', ma producono anche gerarchie." },
  { id: "nodes-structure", label: "Nodes", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "I nodi condensano eventi, tecnologie, istituzioni, concetti e pratiche." },
  { id: "relationships", label: "Relationships", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "Le connessioni mostrano continuita', dipendenze e risonanze." },
  { id: "navigation", label: "Navigation", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "La navigazione guida il modo in cui il pubblico attraversa la complessita'." },
  { id: "zoom", label: "Zoom", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "Lo zoom permette passaggi tra visione totale e dettaglio." },
  { id: "interface", label: "Interface", parent: "structure", period: "Analysis", theme: "structure", type: "Elemento", radius: 10, note: "Qui l'interfaccia ha senso: e' parte della struttura, non della metodologia." },

  { id: "rhetorical-analysis", label: "RHETORICAL ANALYSIS", parent: "root", period: "Analysis", theme: "rhetoric", type: "Cluster", radius: 18, note: "Risponde alla domanda: What is the project arguing?" },
  { id: "long-duration", label: "Long Duration", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Argomento", radius: 10, note: "Il progetto sostiene che potere e tecnologia vadano letti su una durata storica lunga." },
  { id: "accumulation", label: "Accumulation", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Argomento", radius: 10, note: "L'accumulo visivo rende percepibile la crescita dei sistemi di controllo e classificazione." },
  { id: "comparison", label: "Comparison", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Argomento", radius: 10, note: "La comparazione mette in relazione periodi, tecnologie e forme di potere." },
  { id: "critical-position", label: "Narrative", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Argomento", radius: 10, note: "Il progetto non e' neutrale: costruisce una posizione critica e narrativa." },
  { id: "simultaneity", label: "Simultaneity", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Possibile sotto-nodo", radius: 9, note: "Mostra come fenomeni diversi possano coesistere e risuonare nella stessa superficie visiva." },
  { id: "density", label: "Density", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Possibile sotto-nodo", radius: 9, note: "La densita' diventa strategia retorica: il pubblico sente la scala del sistema." },
  { id: "juxtaposition", label: "Juxtaposition", parent: "rhetorical-analysis", period: "Analysis", theme: "rhetoric", type: "Possibile sotto-nodo", radius: 9, note: "L'accostamento produce significato senza dover spiegare ogni relazione in modo lineare." },

  { id: "critical-reading", label: "CRITICAL READING", parent: "root", period: "Reading", theme: "critical", type: "Cluster", radius: 18, note: "Questo e' il tuo layer: la tua lettura critica del progetto come apparato." },
  { id: "grid-apparatus", label: "Grid as Apparatus", parent: "critical-reading", period: "Reading", theme: "critical", type: "Tesi", radius: 13, note: "La griglia non e' solo forma grafica: funziona come apparato di organizzazione, visibilita' e controllo." },
  { id: "classification-critical", label: "Classification", parent: "grid-apparatus", period: "Reading", theme: "critical", type: "Concetto", radius: 10, note: "Classificare permette di ordinare, ma anche di produrre gerarchie e confini." },
  { id: "visibility", label: "Visibility", parent: "grid-apparatus", period: "Reading", theme: "critical", type: "Concetto", radius: 10, note: "La mappa decide cosa diventa visibile e cosa resta laterale o invisibile." },
  { id: "access", label: "Access", parent: "grid-apparatus", period: "Reading", theme: "critical", type: "Concetto", radius: 10, note: "L'accesso riguarda come il pubblico entra nel sapere: panoramica, dettaglio, navigazione." },
  { id: "control", label: "Control", parent: "grid-apparatus", period: "Reading", theme: "critical", type: "Concetto", radius: 10, note: "La struttura visuale puo' essere letta come forma di controllo dell'informazione." },
  { id: "archive", label: "Archive", parent: "critical-reading", period: "Reading", theme: "critical", type: "Concetto ponte", radius: 11, note: "Archivio e griglia si incontrano: raccolgono, ordinano, autorizzano e rendono consultabile il sapere." },
  { id: "theoretical-references", label: "Theoretical References", parent: "grid-apparatus", period: "Reading", theme: "theory", type: "Quadro teorico", radius: 13, note: "Rappresenta il quadro teorico della tua lettura, non necessariamente quello dichiarato dagli autori." },
  { id: "agamben", label: "Agamben", parent: "theoretical-references", period: "Reading", theme: "theory", type: "Riferimento", radius: 9, note: "Possibile riferimento per pensare apparato, governo e dispositivo." },
  { id: "foucault", label: "Foucault", parent: "theoretical-references", period: "Reading", theme: "theory", type: "Riferimento", radius: 9, note: "Possibile riferimento per potere, sapere, archivi, classificazione e visibilita'." },
  { id: "glissant", label: "Glissant", parent: "theoretical-references", period: "Reading", theme: "theory", type: "Riferimento", radius: 9, note: "Possibile riferimento per opacita', relazione e resistenza alla trasparenza totale." },
  { id: "other-references", label: "Other References", parent: "theoretical-references", period: "Reading", theme: "theory", type: "Riferimento", radius: 9, note: "Spazio per altri riferimenti teorici che emergeranno dalla tua analisi." },
];

// ------------------------------------------------------------
// EXTRA / CROSS CONNECTIONS
// ------------------------------------------------------------
// Use this only for secondary relationships that are NOT the main hierarchy.
// Format:
//   ["source-node-id", "target-node-id"]
//
// Example:
//   ["grid", "grid-apparatus"]
// means an additional dotted connection from Grid to Grid as Apparatus.
//
// If you want to change the main tree structure, edit the "parent" field
// inside the node object instead of adding a crossLink here.
const crossLinks = [
  ["grid", "grid-apparatus"],
  ["classification-method", "foucault"],
  ["classification-method", "classification-critical"],
  ["nodes-structure", "archive"],
];

// Converts the filter list into a lookup table.
// In the current design this is mostly used for button borders.
const colorByTheme = Object.fromEntries(themes.map((theme) => [theme.id, theme.color]));

// Current UI state. These values change when the user clicks filters,
// nodes, reset, or the cross-links button.
let activeTheme = "all";
let activePeriod = "All";
let selectedId = null;
let showCrossLinks = false;

// Main DOM references used by D3.
const svg = d3.select("#empire-map");
const details = d3.select("#node-details");
const graphWrap = document.querySelector(".graph-wrap");
let graphWidth = 900;
let graphHeight = 620;

// Main links are generated automatically from each node's "parent" field.
// You do not need to manually add these links anywhere else.
const links = nodes.filter((node) => node.parent).map((node) => ({ source: node.parent, target: node.id }));
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const simulationLinks = links.map((link) => ({ ...link }));
const simulationNodes = nodes.map((node) => ({ ...node }));

// Derive depth from each node's parent chain.
// depth 0 = central node, depth 1 = first-level cluster, depth 2+ = child nodes.
nodes.forEach((node) => {
  let depth = 0;
  let current = node;
  while (current.parent && nodeById.has(current.parent)) {
    depth += 1;
    current = nodeById.get(current.parent);
  }
  node.depth = depth;
});

simulationNodes.forEach((node) => {
  node.depth = nodeById.get(node.id)?.depth || 0;
});

// Builds the sidebar layer filter buttons.
const themeButtons = d3
  .select("#theme-filters")
  .selectAll("button")
  .data(themes)
  .join("button")
  .attr("type", "button")
  .style("border-color", (theme) => theme.color)
  .text((theme) => theme.label)
  .on("click", (_, theme) => {
    activeTheme = theme.id;
    updateFilters();
  });

// Builds the top period/section filter buttons.
const periodButtons = d3
  .select("#timeline")
  .selectAll("button")
  .data(periods)
  .join("button")
  .attr("type", "button")
  .text((period) => period)
  .on("click", (_, period) => {
    activePeriod = period;
    updateFilters();
  });

// Shows or hides the secondary dotted cross-links.
d3.select("#toggle-links").on("click", () => {
  showCrossLinks = !showCrossLinks;
  d3.select("#toggle-links").classed("is-active", showCrossLinks);
  svg.classed("show-cross-links", showCrossLinks);
});

// Restores the default view and filter state.
d3.select("#reset-view").on("click", () => {
  selectedId = null;
  activeTheme = "all";
  activePeriod = "All";
  visibleNodeIds = new Set(["root", ...INTRO_CLUSTER_IDS]);
  expandedNodeIds.clear();
  expandedNodeIds.add("root");
  simulation.alpha(0.65).restart();
  clearDetails();
  updateFilters();
});

// SVG layers. Keeping them separate controls stacking order:
// links behind nodes, cross-links behind nodes, nodes on top.
const linkLayer = svg.append("g").attr("class", "links");
const crossLinkLayer = svg.append("g").attr("class", "cross-links");
const nodeLayer = svg.append("g").attr("class", "nodes");

// Draws main hierarchy links.
// Minor target nodes receive the "is-minor-link" class, which makes the line dotted in CSS.
const linkSelection = linkLayer
  .selectAll("line")
  .data(simulationLinks)
  .join("line")
  .attr("class", (link) => {
    const target = nodeById.get(link.target);
    return target?.radius <= 10 ? "link is-minor-link" : "link";
  });

// Draws optional cross-links from the crossLinks array.
const crossSelection = crossLinkLayer
  .selectAll("path")
  .data(crossLinks)
  .join("path")
  .attr("class", "cross-link");

// Draws one SVG group for every node.
// Minor nodes receive the "is-minor-node" class, which gives the square a dotted outline in CSS.
const nodeSelection = nodeLayer
  .selectAll("g")
  .data(simulationNodes)
  .join("g")
  .attr("class", (node) => {
    const classes = ["node"];
    if (node.radius <= 10) classes.push("is-minor-node");
    if (node.id === "root") classes.push("is-root-node");
    return classes.join(" ");
  })
  .call(
    d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended),
  )
  .on("click", (_, node) => {
    if (appState !== APP_STATES.OPEN) return;
    selectedId = node.id;
    toggleBranch(node.id);
    updateDetails(node);
    updateFilters();
    simulation.alpha(0.42).restart();
  });

// Draws the square for each node.
// Square size comes from radius: width = radius * 2 and height = radius * 2.
nodeSelection
  .append("rect")
  .attr("width", (node) => getDisplayRadius(node) * 2)
  .attr("height", (node) => getDisplayRadius(node) * 2)
  .attr("x", (node) => -getDisplayRadius(node))
  .attr("y", (node) => -getDisplayRadius(node))
  .attr("fill", "#050505");

// Draws the visible label next to each square.
nodeSelection
  .append("text")
  .attr("x", (node) => getDisplayRadius(node) + 7)
  .attr("y", 5)
  .text((node) => node.label);

// ------------------------------------------------------------
// FORCE LAYOUT
// ------------------------------------------------------------
// This controls how the map physically arranges itself.
// - link distance controls spacing between connected nodes.
// - charge controls how strongly nodes repel each other.
// - collide prevents nodes from sitting directly on top of each other.
const simulation = d3
  .forceSimulation(simulationNodes)
  .force("link", d3.forceLink(simulationLinks).id((node) => node.id).distance((link) => (link.source.id === "root" ? 142 : 104)))
  .force("charge", d3.forceManyBody().strength(-520))
  .force("collide", d3.forceCollide().radius((node) => node.radius + 32))
  .on("tick", ticked);

// Recalculates the SVG size when the browser window changes.
function resize() {
  const bounds = graphWrap.getBoundingClientRect();
  const introMode = appState === APP_STATES.CLOSED || appState === APP_STATES.HOVERED || appState === APP_STATES.UNFOLDING;
  graphWidth = introMode ? window.innerWidth : Math.max(bounds.width, 320);
  graphHeight = introMode ? window.innerHeight : Math.max(bounds.height, 520);
  svg.attr("viewBox", [0, 0, graphWidth, graphHeight]);
  pinIntroRoot();
  simulation
    .force("center", d3.forceCenter(graphWidth / 2, graphHeight / 2))
    .force("x", d3.forceX(graphWidth / 2).strength(0.035))
    .force("y", d3.forceY(graphHeight / 2).strength(0.035));
  simulation.alpha(0.4).restart();
}

function getDisplayRadius(node) {
  if (node.id !== "root") return node.radius;
  if (appState === APP_STATES.CLOSED) return INTRO_ROOT_RADIUS.closed;
  if (appState === APP_STATES.HOVERED) return INTRO_ROOT_RADIUS.hovered;
  return node.radius;
}

function updateNodeGeometry() {
  nodeSelection
    .select("rect")
    .attr("width", (node) => getDisplayRadius(node) * 2)
    .attr("height", (node) => getDisplayRadius(node) * 2)
    .attr("x", (node) => -getDisplayRadius(node))
    .attr("y", (node) => -getDisplayRadius(node));

  nodeSelection
    .select("text")
    .attr("x", (node) => getDisplayRadius(node) + 7);
}

function pinIntroRoot() {
  const root = simulationNodes.find((node) => node.id === "root");
  if (!root) return;

  if (appState === APP_STATES.CLOSED || appState === APP_STATES.HOVERED || appState === APP_STATES.UNFOLDING) {
    root.x = graphWidth / 2;
    root.y = graphHeight / 2;
    root.fx = graphWidth / 2;
    root.fy = graphHeight / 2;
    return;
  }

  root.fx = null;
  root.fy = null;
}

// Runs many times per second while the force simulation settles.
// This updates link positions, cross-link curves, node positions, and label alignment.
function ticked() {
  simulationNodes.forEach((node) => {
    node.x = Math.max(34, Math.min(graphWidth - 160, node.x));
    node.y = Math.max(34, Math.min(graphHeight - 34, node.y));
  });

  linkSelection
    .attr("x1", (link) => link.source.x)
    .attr("y1", (link) => link.source.y)
    .attr("x2", (link) => link.target.x)
    .attr("y2", (link) => link.target.y);

  crossSelection.attr("d", ([sourceId, targetId]) => {
    const source = simulationNodes.find((node) => node.id === sourceId);
    const target = simulationNodes.find((node) => node.id === targetId);
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2 - 72;
    return `M${source.x},${source.y} Q${mx},${my} ${target.x},${target.y}`;
  });

  nodeSelection.attr("transform", (node) => `translate(${node.x},${node.y})`);

  nodeSelection
    .select("text")
    .attr("x", (node) => (node.x > graphWidth * 0.72 ? -(getDisplayRadius(node) + 9) : getDisplayRadius(node) + 9))
    .attr("text-anchor", (node) => (node.x > graphWidth * 0.72 ? "end" : "start"));
}

// Updates the left information panel when a node is clicked.
function updateDetails(node) {
  details.html(`
    <span class="node-type">${node.type} / ${node.period}</span>
    <h3>${node.label}</h3>
    <p>${node.note}</p>
  `);
}

// Clears the information panel so no node is preselected after the intro.
function clearDetails() {
  details.html(`
    <span class="node-type">No selection</span>
    <h3>Select a node</h3>
    <p>Click a square to read its note and reveal direct child nodes.</p>
  `);
}

// Returns true when a node should remain visually active under the current filters.
function nodeMatches(node) {
  const themeMatch = activeTheme === "all" || node.theme === activeTheme || node.id === "root";
  const periodMatch = activePeriod === "All" || node.period === activePeriod || node.id === "root";
  return themeMatch && periodMatch;
}

// Returns true when the node belongs to the currently revealed part of the diagram.
function nodeIsRevealed(node) {
  return visibleNodeIds.has(node.id);
}

function getLinkSourceId(link) {
  return typeof link.source === "object" ? link.source.id : link.source;
}

function getLinkTargetId(link) {
  return typeof link.target === "object" ? link.target.id : link.target;
}

function linkIsRevealed(link) {
  return visibleNodeIds.has(getLinkSourceId(link)) && visibleNodeIds.has(getLinkTargetId(link));
}

function getDirectChildren(nodeId) {
  return nodes.filter((node) => node.parent === nodeId);
}

function getDescendantIds(nodeId) {
  const descendants = new Set();
  const pending = getDirectChildren(nodeId).map((node) => node.id);

  while (pending.length) {
    const currentId = pending.pop();
    if (descendants.has(currentId)) continue;
    descendants.add(currentId);
    getDirectChildren(currentId).forEach((node) => pending.push(node.id));
  }

  return descendants;
}

function expandBranch(nodeId) {
  const children = getDirectChildren(nodeId);
  if (!children.length) return;
  expandedNodeIds.add(nodeId);
  children.forEach((node) => visibleNodeIds.add(node.id));
}

function collapseBranch(nodeId) {
  expandedNodeIds.delete(nodeId);
  getDescendantIds(nodeId).forEach((descendantId) => {
    visibleNodeIds.delete(descendantId);
    expandedNodeIds.delete(descendantId);
  });
}

function toggleBranch(nodeId) {
  if (!getDirectChildren(nodeId).length) return;
  if (expandedNodeIds.has(nodeId)) collapseBranch(nodeId);
  else expandBranch(nodeId);
}

// Applies filter and selected-node styling.
function updateFilters() {
  themeButtons.classed("is-active", (theme) => theme.id === activeTheme);
  periodButtons.classed("is-active", (period) => period === activePeriod);

  nodeSelection
    .classed("is-selected", (node) => node.id === selectedId)
    .classed("is-expanded", (node) => expandedNodeIds.has(node.id))
    .classed("is-dimmed", (node) => nodeIsRevealed(node) && !nodeMatches(node))
    .style("opacity", (node) => (nodeIsRevealed(node) && nodeMatches(node) ? 1 : 0))
    .style("pointer-events", (node) => (appState === APP_STATES.OPEN && nodeIsRevealed(node) && nodeMatches(node) ? "auto" : "none"));

  linkSelection
    .classed("is-dimmed", (link) => linkIsRevealed(link) && (!nodeMatches(link.source) || !nodeMatches(link.target)))
    .style("opacity", (link) => (linkIsRevealed(link) && nodeMatches(link.source) && nodeMatches(link.target) ? 1 : 0));

  crossSelection
    .classed("is-dimmed", ([sourceId, targetId]) => {
      return !nodeMatches(nodeById.get(sourceId)) || !nodeMatches(nodeById.get(targetId));
    })
    .style("opacity", ([sourceId, targetId]) => {
      const visible = showCrossLinks && visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      return visible && nodeMatches(nodeById.get(sourceId)) && nodeMatches(nodeById.get(targetId)) ? 1 : 0;
    });
}

// Drag behavior: while dragging, pin the node to the pointer.
function dragstarted(event, node) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  node.fx = node.x;
  node.fy = node.y;
}

// Drag behavior: update the pinned node position.
function dragged(event, node) {
  node.fx = event.x;
  node.fy = event.y;
}

// Drag behavior: release the node back into the force simulation.
function dragended(event, node) {
  if (!event.active) simulation.alphaTarget(0);
  node.fx = null;
  node.fy = null;
}

function setBodyState(state) {
  document.body.classList.toggle("intro-closed", state === APP_STATES.CLOSED);
  document.body.classList.toggle("intro-hovered", state === APP_STATES.HOVERED);
  document.body.classList.toggle("intro-unfolding", state === APP_STATES.UNFOLDING);
  document.body.classList.toggle("intro-open", state === APP_STATES.OPEN);
  updateNodeGeometry();
  pinIntroRoot();
}

function revealIntroNode(nodeId, delay) {
  window.setTimeout(() => {
    const node = simulationNodes.find((item) => item.id === nodeId);
    const link = simulationLinks.find((item) => getLinkTargetId(item) === nodeId);
    if (!node) return;

    visibleNodeIds.add(nodeId);

    const nodeToReveal = nodeSelection.filter((item) => item.id === nodeId);
    nodeToReveal
      .style("opacity", 0)
      .style("pointer-events", "none")
      .transition()
      .duration(INTRO_TIMING.nodeDuration)
      .ease(d3.easeCubicOut)
      .style("opacity", 1);

    if (link) {
      const source = link.source;
      const target = link.target;
      linkSelection
        .filter((item) => getLinkTargetId(item) === nodeId)
        .style("opacity", 1)
        .attr("x1", source.x)
        .attr("y1", source.y)
        .attr("x2", source.x)
        .attr("y2", source.y)
        .transition()
        .duration(INTRO_TIMING.edgeDuration)
        .ease(d3.easeCubicOut)
        .attr("x2", target.x)
        .attr("y2", target.y);
    }
  }, delay);
}

function showCuratorialStatement() {
  const statement = document.querySelector("#curatorial-statement");
  const dismiss = document.querySelector("#dismiss-statement");
  if (!statement || sessionStorage.getItem("curatorialStatementDismissed") === "true") return;

  statement.hidden = false;
  dismiss?.addEventListener("click", () => {
    sessionStorage.setItem("curatorialStatementDismissed", "true");
    statement.hidden = true;
  });
}

function finishIntro() {
  appState = APP_STATES.OPEN;
  introLocked = false;
  setBodyState(appState);
  visibleNodeIds = new Set(["root", ...INTRO_CLUSTER_IDS]);
  expandedNodeIds.clear();
  expandedNodeIds.add("root");
  clearDetails();
  updateFilters();
  showCuratorialStatement();
  resize();
  simulation.alpha(0.35).restart();
}

function openImmediately() {
  visibleNodeIds = new Set(["root", ...INTRO_CLUSTER_IDS]);
  finishIntro();
}

function startIntro() {
  if (introLocked || (appState !== APP_STATES.CLOSED && appState !== APP_STATES.HOVERED)) return;

  introLocked = true;
  appState = APP_STATES.UNFOLDING;
  setBodyState(appState);
  clearDetails();

  simulation.stop();
  visibleNodeIds = new Set(["root"]);
  expandedNodeIds.clear();
  pinIntroRoot();
  updateFilters();

  nodeSelection.filter((node) => node.id === "root").style("opacity", 1);

  if (prefersReducedMotion) {
    openImmediately();
    return;
  }

  INTRO_CLUSTER_IDS.forEach((nodeId, index) => {
    revealIntroNode(nodeId, index * INTRO_TIMING.stagger);
  });

  const totalDuration =
    (INTRO_CLUSTER_IDS.length - 1) * INTRO_TIMING.stagger +
    Math.max(INTRO_TIMING.edgeDuration, INTRO_TIMING.nodeDuration) +
    INTRO_TIMING.controlsDelay;

  window.setTimeout(finishIntro, totalDuration);
}

function setupIntroGate() {
  const introSquare = document.querySelector("#intro-square");
  if (!introSquare) return;

  introSquare.addEventListener("mouseenter", () => {
    if (appState === APP_STATES.CLOSED) {
      appState = APP_STATES.HOVERED;
      setBodyState(appState);
    }
  });

  introSquare.addEventListener("mouseleave", () => {
    if (appState === APP_STATES.HOVERED) {
      appState = APP_STATES.CLOSED;
      setBodyState(appState);
    }
  });

  introSquare.addEventListener("click", startIntro);
  introSquare.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    startIntro();
  });
}

// Initial setup.
window.addEventListener("resize", resize);
if (typeof ResizeObserver !== "undefined") {
  const graphResizeObserver = new ResizeObserver(resize);
  const graphWrap = document.querySelector(".graph-wrap");
  if (graphWrap) graphResizeObserver.observe(graphWrap);
}
resize();
setupIntroGate();
clearDetails();
updateFilters();

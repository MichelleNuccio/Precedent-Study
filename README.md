# Precedent Website — Calculating Empires

A graphic trial of the spatial archive with inverted black-and-white contrast, a rounder type system, larger text, translucent dark records, and a white animated halftone field.

The desktop folders are: `00_Metadata`, `01_Genealogy`, `02_Context`, `03_Visual System`, `04_Methodology`, `05_Relational Diagram`, `06_Critical Reading`, and `07_Sources`.

## Run

Keep the complete `Precedent Website` folder intact, then open the root `index.html` directly or use VS Code Live Server. No installation or build step is required.

## Interaction

- Double-click a folder to open it. On touch screens, tap once.
- Press Enter or Space while a folder has keyboard focus.
- Drag a record header to move the window.
- Double-click the title bar or use the upper-right square to maximize/restore.
- Use the upper-left square to close.
- Use the bottom shelf to bring open windows forward or minimize the active one.
- Resize desktop windows using the browser-native bottom-right corner.
- Press Escape to close the active window.

## Files

- `index.html`: desktop, folders, windows, and study content.
- `style.css`: spatial monochrome archive system and responsive layout.
- `app.js`: window behavior, keyboard controls, clock, and the responsive animated dot field.
- `diagram/`: interactive D3 relational diagram embedded in `05_Relational Diagram`.
  Its branches expand and collapse recursively when their nodes are clicked.

All internal paths are relative to this folder. The diagram uses `diagram/index.html`, `diagram/styles.css`, and `diagram/d3.js`; images are loaded from `assets/`.

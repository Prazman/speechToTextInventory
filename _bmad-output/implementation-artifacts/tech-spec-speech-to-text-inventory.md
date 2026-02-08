---
title: 'Speech-to-Text Inventory App'
slug: 'speech-to-text-inventory'
created: '2026-02-08'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Web Speech API']
files_to_modify: ['index.html', 'css/style.css', 'js/app.js', 'js/storage.js', 'js/speech.js', 'js/export.js']
code_patterns: ['ES6 modules', 'Mobile-first CSS', 'Single page DOM toggling', 'localStorage JSON persistence']
test_patterns: ['Manual testing on mobile Chrome']
---

# Tech-Spec: Speech-to-Text Inventory App

**Created:** 2026-02-08

## Overview

### Problem Statement

Moving out of an apartment requires inventorying all belongings across every room. Manually typing each item on a phone is slow and tedious. Voice dictation is 10x faster and hands-free, letting the user walk around and catalog items naturally.

### Solution

A simple, static-hostable webapp (HTML/CSS/JS) that lets users create rooms/storage areas, dictate items via speech-to-text (Web Speech API on Chrome), edit entries inline, and export the full inventory as a CSV file.

### Scope

**In Scope:**
- Create / manage rooms and storage areas manually
- Voice dictation to add items (Web Speech API on Chrome/Edge)
- Each dictated phrase = 1 item (brut — no field parsing)
- Manual inline editing of items (Item, Category, Notes fields)
- Manual item addition (without mic)
- Item deletion
- CSV export with columns: Room | Item | Category | Notes
- localStorage persistence
- Mobile-friendly / responsive design
- Static hosting compatible (no backend)

**Out of Scope:**
- Whisper / local STT engine (deferred to V2)
- Value estimation / insurance
- User accounts / authentication
- Backend / database
- App store publication
- Multi-user sharing / collaboration
- Intelligent speech parsing of Category/Notes fields
- Firefox / Safari support for speech recognition (V2 via Whisper)

## Context for Development

### Codebase Patterns

Greenfield project — confirmed clean slate. No legacy constraints.

**Architecture:**
- Static webapp, no build step, no framework
- ES6 modules with `<script type="module">`
- Single page with DOM-based view toggling (no router library)
- Mobile-first responsive CSS
- localStorage for all persistence (JSON structure)

**File Structure:**
```
/
├── index.html          # Single page app - all views
├── css/
│   └── style.css       # Mobile-first responsive styles
├── js/
│   ├── app.js          # Entry point, init, view management
│   ├── storage.js      # localStorage CRUD (rooms & items)
│   ├── speech.js       # Speech-to-text (Web Speech API)
│   └── export.js       # CSV generation & download
└── readme.md           # Project documentation (updated throughout dev)
```

**Data Model (localStorage):**
```json
{
  "rooms": [
    {
      "id": "uuid",
      "name": "Salon",
      "items": [
        { "id": "uuid", "item": "Canapé bleu", "category": "", "notes": "" }
      ]
    }
  ]
}
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `index.html` | New — single page app shell, all views |
| `css/style.css` | New — mobile-first responsive styles |
| `js/app.js` | New — entry point, view management, event wiring |
| `js/storage.js` | New — localStorage CRUD for rooms and items |
| `js/speech.js` | New — Web Speech API wrapper (recognition lifecycle, fr-FR) |
| `js/export.js` | New — CSV generation and file download |

### Technical Decisions

- **Web Speech API only (V1)**: Use `SpeechRecognition` / `webkitSpeechRecognition` on Chrome/Edge. Continuous mode stays active until user stops. Language set to `fr-FR`. Firefox/Safari not supported for STT in V1.
- **No Whisper in V1**: Investigated whisper.cpp WASM — too heavy for mobile. Whisper server fallback deferred to V2.
- **Browser requirement**: Chrome or Edge on mobile. App will show a clear message if SpeechRecognition API is not available.
- **Option A dictation flow**: Each recognized phrase = 1 new item row. Category and Notes filled manually post-dictation.
- **localStorage**: All data persisted as JSON in localStorage. No backend needed.
- **CSV export**: Client-side generation using `Blob` + download link. Comma-delimited with proper escaping.
- **README updates**: README.md will be updated throughout spec and dev to reflect setup instructions, architecture, and usage.
- **Note on Chrome Speech API**: Audio is sent to Google servers for processing — requires internet connection. Not fully offline.

## Implementation Plan

### Tasks

- [x] Task 1: Create storage module
  - File: `js/storage.js`
  - Action: Implement localStorage CRUD module with the following exports:
    - `loadRooms()` — returns rooms array from localStorage (or empty array if none)
    - `saveRooms(rooms)` — writes rooms array to localStorage
    - `addRoom(name)` — creates a new room object with `{ id: crypto.randomUUID(), name, items: [] }`, appends to rooms, saves, returns the new room
    - `deleteRoom(roomId)` — removes room by id, saves
    - `renameRoom(roomId, newName)` — updates room name, saves
    - `addItem(roomId, itemName)` — creates `{ id: crypto.randomUUID(), item: itemName, category: '', notes: '' }`, appends to room's items, saves, returns new item
    - `updateItem(roomId, itemId, fields)` — merges fields into existing item, saves
    - `deleteItem(roomId, itemId)` — removes item from room, saves
  - Notes: All functions operate on the single localStorage key `inventory-data`. Use JSON.parse/stringify. Handle missing/corrupt data gracefully (return defaults).

- [x] Task 2: Create speech module
  - File: `js/speech.js`
  - Action: Implement Web Speech API wrapper with the following exports:
    - `isSupported()` — returns boolean for SpeechRecognition API availability
    - `startListening(lang, onResult, onError)` — creates SpeechRecognition instance, sets `continuous: true`, `interimResults: false`, `lang` param (default `fr-FR`). On each `result` event (isFinal), calls `onResult(transcript)`. On `error`, calls `onError(errorEvent)`. Auto-restarts on `end` event if not explicitly stopped.
    - `stopListening()` — calls `recognition.stop()`, sets flag to prevent auto-restart
  - Notes: Use `webkitSpeechRecognition || SpeechRecognition` for cross-compat. Handle the `no-speech` and `network` error types specifically. The auto-restart on `end` is needed because Chrome kills recognition after silence — we want continuous mode until user presses stop.

- [x] Task 3: Create CSV export module
  - File: `js/export.js`
  - Action: Implement CSV generation and download with the following exports:
    - `generateCSV(rooms)` — iterates all rooms and their items, produces CSV string with header row `Room,Item,Category,Notes`. Escapes fields containing commas, quotes, or newlines (RFC 4180 compliant). Returns CSV string.
    - `downloadCSV(csvString, filename)` — creates Blob with `text/csv` type, generates object URL, creates temporary `<a>` element with `download` attribute, triggers click, revokes URL.
  - Notes: Default filename format: `inventory-YYYY-MM-DD.csv`. UTF-8 BOM prefix (`\uFEFF`) for Excel compatibility with French characters (accents).

- [x] Task 4: Create HTML structure
  - File: `index.html`
  - Action: Build single-page app shell with these views (all in one file, toggled via CSS classes):
    - **View: Room List** (default view)
      - App title/header
      - "Add Room" input + button
      - List of rooms, each with: room name, item count badge, tap to enter room, delete button
      - "Export CSV" button (bottom)
      - Browser compatibility warning (shown if speech not supported)
    - **View: Room Detail**
      - Back button to room list
      - Room name (editable)
      - Large mic button (🎤 start / ⏹ stop)
      - Dictation status indicator ("Listening...", "Stopped")
      - Item list: each item shows item name, category, notes — tap to edit inline
      - "Add item manually" button
      - "Delete item" swipe/button per row
  - Notes: Use `<script type="module" src="js/app.js">`. Use semantic HTML. All views are `<section>` elements toggled with `.active` class. Include `<meta name="viewport" content="width=device-width, initial-scale=1">` for mobile.

- [x] Task 5: Create mobile-first CSS
  - File: `css/style.css`
  - Action: Implement responsive styles:
    - Mobile-first base styles (no media query needed for primary use case)
    - Large touch targets (min 44px height for buttons/list items)
    - Prominent mic button (centered, large, with visual state change for recording)
    - Recording state: mic button pulses/changes color (red) when active
    - Clean list styling for rooms and items
    - Inline edit styles (fields become editable on tap)
    - View toggling: `.view { display: none; } .view.active { display: block; }`
    - Optional: desktop max-width constraint (480px centered) for readability
  - Notes: Keep it simple and functional. No CSS framework. Use CSS custom properties for colors if needed.

- [x] Task 6: Create app entry point and wire everything together
  - File: `js/app.js`
  - Action: Main application module that imports and orchestrates all other modules:
    - On DOMContentLoaded: load rooms from storage, render room list view
    - **Room List view logic:**
      - Render rooms with item counts
      - "Add Room" — prompt/input for name, call `storage.addRoom()`, re-render
      - "Delete Room" — confirm dialog, call `storage.deleteRoom()`, re-render
      - Tap room → switch to Room Detail view
      - "Export CSV" → call `export.generateCSV()` then `export.downloadCSV()`
    - **Room Detail view logic:**
      - Render room name + items list
      - Mic button → if supported, toggle `speech.startListening()` / `speech.stopListening()`. On each result, call `storage.addItem(roomId, transcript)`, append to DOM.
      - Inline edit → on tap, make item/category/notes fields editable. On blur/enter, call `storage.updateItem()`.
      - Delete item → call `storage.deleteItem()`, remove from DOM.
      - "Add manually" → show input field, on submit call `storage.addItem()`.
      - Back button → switch to Room List view, re-render (counts may have changed).
    - **Speech availability check:**
      - On init, call `speech.isSupported()`. If false, hide mic button, show warning message.
  - Notes: Use event delegation on list containers for performance. Avoid full re-renders where possible — update DOM incrementally when adding/removing items.

- [x] Task 7: Update README
  - File: `readme.md`
  - Action: Update with project description, features, usage instructions, browser requirements (Chrome/Edge), and how to host (just serve static files). Note V2 roadmap for Whisper support.

### Acceptance Criteria

**Room Management:**
- [ ] AC 1: Given the app is loaded for the first time, when the user views the room list, then an empty list with an "Add Room" input is displayed.
- [ ] AC 2: Given the room list is displayed, when the user types "Salon" and taps Add, then "Salon" appears in the room list with 0 items.
- [ ] AC 3: Given a room "Salon" exists, when the user taps delete on "Salon" and confirms, then "Salon" is removed from the list and from localStorage.
- [ ] AC 4: Given rooms exist, when the user closes and reopens the browser, then all rooms and their items are still present (localStorage persistence).

**Voice Dictation:**
- [ ] AC 5: Given the user is in a room detail view on Chrome mobile, when they tap the mic button, then dictation starts and the button visually indicates "recording" state.
- [ ] AC 6: Given dictation is active, when the user says "canapé bleu", then a new item "canapé bleu" appears in the item list with empty Category and Notes.
- [ ] AC 7: Given dictation is active, when the user says multiple phrases in sequence, then each phrase creates a separate item row.
- [ ] AC 8: Given dictation is active, when the user taps the mic button again, then dictation stops and the button returns to normal state.
- [ ] AC 9: Given the app is opened on Firefox, when the room detail view loads, then the mic button is hidden and a message indicates speech recognition requires Chrome/Edge.

**Item Management:**
- [ ] AC 10: Given items exist in a room, when the user taps on an item's Category field, then the field becomes editable and the user can type a category.
- [ ] AC 11: Given items exist in a room, when the user taps on an item's Notes field, then the field becomes editable and the user can type notes.
- [ ] AC 12: Given an item exists, when the user taps delete on that item, then the item is removed from the list and from localStorage.
- [ ] AC 13: Given a room is displayed, when the user taps "Add item manually" and types "lampe de bureau", then "lampe de bureau" is added as a new item.

**CSV Export:**
- [ ] AC 14: Given rooms with items exist, when the user taps "Export CSV", then a file `inventory-YYYY-MM-DD.csv` is downloaded.
- [ ] AC 15: Given the exported CSV, when opened in Excel/Google Sheets, then columns Room, Item, Category, Notes are correctly separated and French characters (accents) display properly.
- [ ] AC 16: Given an item name contains a comma (e.g., "table, petite"), when the CSV is exported, then the field is properly quoted per RFC 4180 and imports correctly.

**Browser Compatibility:**
- [ ] AC 17: Given the app is opened on a mobile phone in Chrome, when interacting with buttons and lists, then all touch targets are at least 44px and easily tappable.

## Additional Context

### Dependencies

None — pure vanilla HTML/CSS/JS with browser-native APIs. No npm, no build tools. No external libraries.

### Testing Strategy

**Manual testing on Chrome mobile (primary):**
1. Room CRUD: create, rename, delete rooms — verify localStorage via DevTools
2. Voice dictation: test in French, verify each phrase → 1 item, test start/stop cycle, test after silence (auto-restart)
3. Item editing: tap to edit, verify fields save on blur, test delete
4. CSV export: download and open in Google Sheets / Excel, verify French characters, verify comma-in-field escaping
5. Persistence: close browser tab, reopen, verify all data intact
6. Browser compat: open on Firefox, verify graceful degradation (no mic button, warning shown)

**Edge cases to test:**
- Empty rooms in CSV export (should still list room name with no items)
- Very long item names from dictation
- Rapid start/stop of dictation
- localStorage full (unlikely but handle gracefully)

### Notes

- Primary use case is mobile (phone in hand, walking through apartment)
- Requires internet connection (Chrome Speech API sends audio to Google for processing)
- User language for dictation: French (fr-FR)
- V2 roadmap: Whisper.cpp server fallback for Firefox/Safari/offline support
- Task order is dependency-driven: storage first (no deps), then speech + export (no deps on each other), then HTML structure, then CSS, then app.js wires everything

## Review Notes
- Adversarial review completed
- Findings: 13 total, 0 fixed, 13 skipped
- Resolution approach: skip

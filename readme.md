SpeechToText Inventory App

A mobile-friendly web app for inventorying belongings by voice. Walk through your apartment, dictate items room by room, then export everything as CSV.

## Features

- Create and manage rooms/storage areas
- Voice dictation via Web Speech API (Chrome/Edge) — speak in French (fr-FR)
- Each spoken phrase becomes one inventory item
- Inline editing of Item, Category, and Notes fields
- Manual item entry (no mic required)
- CSV export with proper French character support (accents)
- All data saved locally in the browser (localStorage)
- Mobile-first responsive design

## Browser Requirements

- **Chrome or Edge** (desktop or mobile) for voice dictation
- Other browsers: full functionality except speech recognition (warning displayed)
- Requires internet connection (Chrome sends audio to Google servers for processing)

## Getting Started

No build tools required — just serve the static files:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Or just open index.html via any local server
```

Then open `http://localhost:8000` on your phone's Chrome browser.

## Usage

1. **Add a room** — type the room name and tap "Ajouter"
2. **Enter the room** — tap on a room to open it
3. **Dictate items** — tap the mic button and start speaking. Each phrase creates one item.
4. **Edit details** — tap any item field to edit the name, category, or notes
5. **Export** — tap "Exporter CSV" from the room list to download your full inventory

## File Structure

```
├── index.html          # Single page app
├── css/style.css       # Mobile-first responsive styles
├── js/app.js           # Entry point, view management
├── js/storage.js       # localStorage CRUD
├── js/speech.js        # Web Speech API wrapper
└── js/export.js        # CSV generation & download
```

## V2 Roadmap

- Whisper.cpp server fallback for Firefox/Safari/offline support
- Intelligent speech parsing (auto-detect category from dictation)
- Value estimation / insurance features

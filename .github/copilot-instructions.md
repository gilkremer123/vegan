# AI Coding Assistant Instructions

## Project Overview
A bilingual (Hebrew/English) web application that displays vegan restaurants and cafes in Israel with two viewing modes: list view and interactive map view. The application reads location data from a CSV file and provides search functionality. Hebrew is the default language with RTL support.

## Architecture & Patterns
- **Single-page application** with vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Bilingual interface** - Hebrew (default) and English with RTL/LTR support
- **CSV-based data storage** - all restaurant data in `places.csv` with columns: name, address, link
- **Dual view modes** - toggle between list cards and Leaflet.js interactive map
- **Client-side filtering** - real-time search without server requests
- **Responsive design** - mobile-first CSS with grid layouts and direction-aware styling

## Key Files & Directories
- `index.html` - Main application structure with Hebrew default and language toggle
- `script.js` - Core application logic, CSV parsing, map integration, i18n system
- `styles.css` - Responsive styling with CSS Grid, RTL/LTR support
- `places.csv` - Restaurant data in Hebrew (name, address, website link)

## Internationalization System
- **Language state** managed in `currentLanguage` variable ('he'/'en')
- **Translation object** in `translations` with Hebrew and English strings
- **Dynamic updates** via `data-key` attributes and `updateLanguage()` function
- **RTL/LTR switching** through `dir` attribute and CSS direction rules
- **Map popup localization** with direction-aware styling

## Data Management
- CSV format: `"name","address","link"` with Hebrew content by default
- Coordinate mapping supports both Hebrew and English city names
- Search filters by name and address fields (case-insensitive, both languages)

## Dependencies & Integration
- **Leaflet.js** (CDN) for interactive maps and markers
- **OpenStreetMap** tiles for map rendering
- No build process required - runs directly in browser

## Development Workflow
- Edit `places.csv` to add/modify restaurant data (Hebrew preferred)
- Test locally with a simple HTTP server: `python -m http.server` or VS Code Live Server
- Add new cities to `locationMap` in both Hebrew and English for proper geocoding

---

**Note**: This is a template file for a new project. Please analyze the actual codebase and update these instructions once development begins. See https://aka.ms/vscode-instructions-docs for detailed guidance on writing effective AI coding instructions.
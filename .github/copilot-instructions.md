# AI Coding Assistant Instructions

## Project Overview
A simple web application that displays vegan restaurants and cafes in Israel with two viewing modes: list view and interactive map view. The application reads location data from a CSV file and provides search functionality.

## Architecture & Patterns
- **Single-page application** with vanilla HTML/CSS/JavaScript (no framework dependencies)
- **CSV-based data storage** - all restaurant data in `places.csv` with columns: name, address, link
- **Dual view modes** - toggle between list cards and Leaflet.js interactive map
- **Client-side filtering** - real-time search without server requests
- **Responsive design** - mobile-first CSS with grid layouts

## Key Files & Directories
- `index.html` - Main application structure and layout
- `script.js` - Core application logic, CSV parsing, map integration
- `styles.css` - Responsive styling with CSS Grid and Flexbox
- `places.csv` - Restaurant data (name, address, website link)

## Data Management
- CSV format: `"name","address","link"` with quoted fields
- Coordinate mapping uses approximate city locations (demo-level geocoding)
- Search filters by name and address fields (case-insensitive)

## Dependencies & Integration
- **Leaflet.js** (CDN) for interactive maps and markers
- **OpenStreetMap** tiles for map rendering
- No build process required - runs directly in browser

## Development Workflow
- Edit `places.csv` to add/modify restaurant data
- Test locally with a simple HTTP server: `python -m http.server` or VS Code Live Server
- Map coordinates use city-name matching for demo purposes (consider geocoding API for production)

---

**Note**: This is a template file for a new project. Please analyze the actual codebase and update these instructions once development begins. See https://aka.ms/vscode-instructions-docs for detailed guidance on writing effective AI coding instructions.
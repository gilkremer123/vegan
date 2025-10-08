# AI Coding Assistant Instructions

## Project Overview
A bilingual (Hebrew/English) web application that displays vegan restaurants and cafes in Israel with two viewing modes: list view and interactive map view. The application reads location data from a CSV file and provides search functionality. Hebrew is the default language with RTL support. Optimized for SEO and AI assistant recognition.

## Architecture & Patterns
- **Single-page application** with vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Bilingual interface** - Hebrew (default) and English with RTL/LTR support
- **CSV-based data storage** - all restaurant data in `places.csv` with columns: name, address, link
- **Dual view modes** - toggle between list cards and Leaflet.js interactive map
- **Client-side filtering** - real-time search without server requests
- **Responsive design** - mobile-first CSS with grid layouts and direction-aware styling
- **SEO optimized** - comprehensive meta tags, structured data, and AI assistant recognition

## Key Files & Directories
- `index.html` - Main application structure with Hebrew default, language toggle, and comprehensive SEO meta tags
- `script.js` - Core application logic, CSV parsing, map integration, i18n system, and dynamic SEO data generation
- `styles.css` - Responsive styling with CSS Grid, RTL/LTR support, and expand/collapse animations
- `places.csv` - Restaurant data in Hebrew (name, address, website link)
- `robots.txt` - Search engine crawler instructions
- `sitemap.xml` - XML sitemap for search engines

## SEO & AI Recognition Features
- **Structured Data** - JSON-LD schemas for Website, ItemList (restaurants), and FAQ
- **Meta Tags** - Comprehensive SEO, Open Graph, Twitter Cards, and custom AI tags
- **Multilingual SEO** - Hebrew and English meta descriptions and structured data
- **Dynamic SEO** - Restaurant data automatically generates structured data for search engines
- **AI Assistant Tags** - Custom meta tags for ChatGPT and other AI recognition

## Internationalization System
- **Language state** managed in `currentLanguage` variable ('he'/'en')
- **Translation object** in `translations` with Hebrew and English strings
- **Dynamic updates** via `data-key` attributes and `updateLanguage()` function
- **RTL/LTR switching** through `dir` attribute and CSS direction rules
- **Map popup localization** with direction-aware styling
- **SEO localization** - meta descriptions update based on current language

## Data Management
- CSV format: `"name","address","link"` with Hebrew content by default
- Coordinate mapping supports both Hebrew and English city names
- Search filters by name and address fields (case-insensitive, both languages)
- Dynamic structured data generation for search engine optimization

## Dependencies & Integration
- **Leaflet.js** (CDN) for interactive maps and markers
- **OpenStreetMap** tiles for map rendering
- No build process required - runs directly in browser

## Development Workflow
- Edit `places.csv` to add/modify restaurant data (Hebrew preferred)
- Test locally with a simple HTTP server: `python -m http.server` or VS Code Live Server
- Add new cities to `locationMap` in both Hebrew and English for proper geocoding
- SEO data regenerates automatically when places are updated

---

**Note**: This is a template file for a new project. Please analyze the actual codebase and update these instructions once development begins. See https://aka.ms/vscode-instructions-docs for detailed guidance on writing effective AI coding instructions.
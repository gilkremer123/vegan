# 🌱 Vegan Places Israel

A simple web application to discover vegan restaurants and cafes across Israel. View locations in an organized list or explore them on an interactive map.

## Features

- **Dual View Modes**: Switch between list and map views
- **Search Functionality**: Filter places by name or address
- **Interactive Map**: Explore locations with markers and popups
- **Responsive Design**: Works on desktop and mobile devices
- **CSV Data Source**: Easy to update restaurant information

## Quick Start

1. Clone or download this repository
2. Open `index.html` in a web browser, or
3. Serve locally with: `python -m http.server 8000` (or use VS Code Live Server)
4. Navigate to `http://localhost:8000`

## Adding New Places

Edit the `places.csv` file with the following format:
```csv
name,address,link
"Restaurant Name","Full Address, City","https://website.com"
```

## Technology Stack

- Vanilla HTML/CSS/JavaScript
- Leaflet.js for interactive maps
- OpenStreetMap for map tiles
- CSV for data storage

## Project Structure

```
├── index.html          # Main application
├── script.js           # Application logic
├── styles.css          # Styling
├── places.csv          # Restaurant data
└── README.md           # This file
```

## Contributing

1. Add new vegan places to `places.csv`
2. Improve the UI/UX in `styles.css`
3. Enhance functionality in `script.js`
4. Test on different devices and browsers
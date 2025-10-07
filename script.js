// Global variables
let places = [];
let map;
let markers = [];

// DOM elements
const listModeBtn = document.getElementById('listMode');
const mapModeBtn = document.getElementById('mapMode');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPlaces();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    listModeBtn.addEventListener('click', () => switchMode('list'));
    mapModeBtn.addEventListener('click', () => switchMode('map'));
    searchInput.addEventListener('input', filterPlaces);
}

// Switch between list and map modes
function switchMode(mode) {
    if (mode === 'list') {
        listModeBtn.classList.add('active');
        mapModeBtn.classList.remove('active');
        listView.classList.add('active');
        mapView.classList.remove('active');
    } else {
        mapModeBtn.classList.add('active');
        listModeBtn.classList.remove('active');
        mapView.classList.add('active');
        listView.classList.remove('active');
        
        // Initialize map if not already done
        if (!map) {
            initializeMap();
        }
    }
}

// Load places from CSV file
async function loadPlaces() {
    try {
        placesList.innerHTML = '<div class="loading">Loading vegan places...</div>';
        
        const response = await fetch('places.csv');
        if (!response.ok) {
            throw new Error('Failed to load places data');
        }
        
        const csvText = await response.text();
        places = parseCSV(csvText);
        
        displayPlaces(places);
    } catch (error) {
        console.error('Error loading places:', error);
        placesList.innerHTML = '<div class="error">Failed to load vegan places. Please try again later.</div>';
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const places = [];
    
    // Skip header row and process data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            // Simple CSV parsing (assumes no commas in quoted fields for this demo)
            const [name, address, link] = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
            if (name && address) {
                places.push({ name, address, link: link || '' });
            }
        }
    }
    
    return places;
}

// Display places in list view
function displayPlaces(placesToDisplay) {
    if (placesToDisplay.length === 0) {
        placesList.innerHTML = '<div class="error">No vegan places found matching your search.</div>';
        return;
    }
    
    const placesHTML = placesToDisplay.map(place => `
        <div class="place-card">
            <div class="place-name">${escapeHtml(place.name)}</div>
            <div class="place-address">${escapeHtml(place.address)}</div>
            ${place.link ? `<a href="${escapeHtml(place.link)}" target="_blank" class="place-link">Visit Website</a>` : ''}
        </div>
    `).join('');
    
    placesList.innerHTML = placesHTML;
}

// Filter places based on search input
function filterPlaces() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayPlaces(places);
        return;
    }
    
    const filteredPlaces = places.filter(place => 
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
    );
    
    displayPlaces(filteredPlaces);
}

// Initialize map
function initializeMap() {
    // Center map on Israel (approximate center)
    map = L.map('map').setView([31.5, 34.8], 8);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add places to map
    addMarkersToMap();
}

// Add markers to map for all places
async function addMarkersToMap() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    for (const place of places) {
        try {
            // For demo purposes, we'll use approximate coordinates for Israeli cities
            // In a real app, you'd geocode the addresses or store coordinates in your data
            const coordinates = getApproximateCoordinates(place.address);
            
            if (coordinates) {
                const marker = L.marker(coordinates).addTo(map);
                
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h3 style="margin: 0 0 8px 0; color: #2E7D32;">${escapeHtml(place.name)}</h3>
                        <p style="margin: 0 0 8px 0; color: #666;">${escapeHtml(place.address)}</p>
                        ${place.link ? `<a href="${escapeHtml(place.link)}" target="_blank" style="color: #4CAF50; text-decoration: none;">Visit Website →</a>` : ''}
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markers.push(marker);
            }
        } catch (error) {
            console.warn(`Could not add marker for ${place.name}:`, error);
        }
    }
}

// Get approximate coordinates for Israeli locations (for demo purposes)
function getApproximateCoordinates(address) {
    const addressLower = address.toLowerCase();
    
    // Simple mapping for demo - in a real app, use a geocoding service
    const locationMap = {
        'tel aviv': [32.0853, 34.7818],
        'jerusalem': [31.7683, 35.2137],
        'haifa': [32.7940, 34.9896],
        'beer sheva': [31.2518, 34.7915],
        'netanya': [32.3215, 34.8532],
        'ashdod': [31.8044, 34.6553],
        'petah tikva': [32.0878, 34.8873],
        'rishon lezion': [31.9730, 34.7925]
    };
    
    for (const [city, coords] of Object.entries(locationMap)) {
        if (addressLower.includes(city)) {
            // Add some random offset to avoid overlapping markers
            return [
                coords[0] + (Math.random() - 0.5) * 0.02,
                coords[1] + (Math.random() - 0.5) * 0.02
            ];
        }
    }
    
    // Default to center of Israel with random offset if no city match
    return [
        31.5 + (Math.random() - 0.5) * 2,
        34.8 + (Math.random() - 0.5) * 2
    ];
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
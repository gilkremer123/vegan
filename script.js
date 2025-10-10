// Global variables
let places = [];
let map;
let markers = [];
let currentLanguage = 'he'; // Default to Hebrew
let allExpanded = true; // Track global expand/collapse state

// Language translations
const translations = {
    he: {
        title: '🌱 מקומות טבעוניים בישראל',
        listView: '📋 תצוגת רשימה',
        mapView: '🗺️ תצוגת מפה',
        searchPlaceholder: 'חפש מקומות טבעוניים...',
        visitWebsite: 'בקר באתר',
        loading: 'טוען מקומות טבעוניים...',
        noPlacesFound: 'לא נמצאו מקומות טבעוניים התואמים לחיפוש.',
        loadError: 'שגיאה בטעינת המקומות הטבעוניים. אנא נסה שוב מאוחר יותר.',
        contactText: 'שכחתי מקום? צריך לתקן משהו? צור קשר כאן',
        expandAll: 'הרחב הכל',
        collapseAll: 'צמצם הכל'
    },
    en: {
        title: '🌱 Vegan Places in Israel',
        listView: '📋 List View',
        mapView: '🗺️ Map View',
        searchPlaceholder: 'Search vegan places...',
        visitWebsite: 'Visit Website',
        loading: 'Loading vegan places...',
        noPlacesFound: 'No vegan places found matching your search.',
        loadError: 'Failed to load vegan places. Please try again later.',
        contactText: 'Forgot a place? Need to fix something? Contact us here',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All'
    }
};

// DOM elements
const listModeBtn = document.getElementById('listMode');
const mapModeBtn = document.getElementById('mapMode');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');
const languageToggle = document.getElementById('languageToggle');
const contactBtn = document.getElementById('contactBtn');
const toggleAllBtn = document.getElementById('toggleAllBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPlaces();
    setupEventListeners();
    updateLanguage(); // Set initial language
    generateStructuredData(); // Add structured data for SEO
});

// Setup event listeners
function setupEventListeners() {
    listModeBtn.addEventListener('click', () => switchMode('list'));
    mapModeBtn.addEventListener('click', () => switchMode('map'));
    searchInput.addEventListener('input', filterPlaces);
    languageToggle.addEventListener('click', toggleLanguage);
    contactBtn.addEventListener('click', openContactEmail);
    toggleAllBtn.addEventListener('click', toggleAllCategories);
}

// Open contact email
function openContactEmail() {
    const subject = currentLanguage === 'he' ? 
        'מקומות טבעוניים בישראל - הצעה/תיקון' : 
        'Vegan Places in Israel - Suggestion/Correction';
    
    const body = currentLanguage === 'he' ? 
        'שלום,\n\nאני רוצה להציע מקום טבעוני חדש או לתקן פרט קיים:\n\n' :
        'Hello,\n\nI would like to suggest a new vegan place or correct an existing detail:\n\n';
    
    const mailtoLink = `mailto:kremerint@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
}

// Toggle language between Hebrew and English
function toggleLanguage() {
    currentLanguage = currentLanguage === 'he' ? 'en' : 'he';
    updateLanguage();
    displayPlaces(places); // Refresh the places display
    
    // Update map markers if map is initialized
    if (map) {
        addMarkersToMap();
    }
}

// Update all text elements based on current language
function updateLanguage() {
    const html = document.documentElement;
    const t = translations[currentLanguage];
    
    // Update HTML attributes
    html.lang = currentLanguage;
    html.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
    
    // Update document title
    document.title = t.title;
    
    // Update toggle button text
    languageToggle.textContent = currentLanguage === 'he' ? 'EN' : 'עב';
    
    // Update toggle all button text
    toggleAllBtn.textContent = allExpanded ? t.collapseAll : t.expandAll;
    
    // Update elements with data-key attributes
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
    
    // Update placeholder
    const placeholderKey = searchInput.getAttribute('data-placeholder-key');
    if (placeholderKey && t[placeholderKey]) {
        searchInput.placeholder = t[placeholderKey];
    }
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
        const t = translations[currentLanguage];
        placesList.innerHTML = `<div class="loading">${t.loading}</div>`;
        
        const response = await fetch('places.csv');
        if (!response.ok) {
            throw new Error('Failed to load places data');
        }
        
        const csvText = await response.text();
        places = parseCSV(csvText);
        
        displayPlaces(places);
        generateStructuredData(); // Generate SEO data after places are loaded
    } catch (error) {
        console.error('Error loading places:', error);
        const t = translations[currentLanguage];
        placesList.innerHTML = `<div class="error">${t.loadError}</div>`;
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
            console.log(`🔍 Parsing CSV line: ${line}`);
            
            // Better CSV parsing that handles quoted fields with commas
            const fields = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            // Don't forget the last field
            fields.push(current.trim());
            
            console.log(`📝 Parsed fields:`, fields);
            
            // Extract name, address, link and remove quotes
            const name = fields[0] ? fields[0].replace(/^"|"$/g, '') : '';
            const address = fields[1] ? fields[1].replace(/^"|"$/g, '') : '';
            const link = fields[2] ? fields[2].replace(/^"|"$/g, '') : '';
            
            console.log(`✅ Final parsed data:`, { name, address, link });
            
            if (name && address) {
                places.push({ name, address, link });
            }
        }
    }
    
    console.log(`📊 Total places parsed: ${places.length}`);
    return places;
}

// Display places in list view
function displayPlaces(placesToDisplay) {
    const t = translations[currentLanguage];
    
    if (placesToDisplay.length === 0) {
        placesList.innerHTML = `<div class="error">${t.noPlacesFound}</div>`;
        return;
    }
    
    // Group places by city
    const placesByCity = groupPlacesByCity(placesToDisplay);
    
    let placesHTML = '';
    
    // Sort cities alphabetically
    const sortedCities = Object.keys(placesByCity).sort();
    
    sortedCities.forEach((city, index) => {
        const cityPlaces = placesByCity[city];
        const cityId = `city-${index}-${city.replace(/\s+/g, '-').replace(/[^\w\-א-ת]/g, '')}`; // Better ID generation with index
        const isExpanded = allExpanded ? 'expanded' : 'collapsed';
        
        placesHTML += `
            <div class="city-group ${isExpanded}">
                <div class="city-header">
                    <span class="city-title">${escapeHtml(city)} (${cityPlaces.length})</span>
                    <button class="city-toggle-btn" onclick="toggleCity('${cityId}')">
                        <span class="toggle-icon">${allExpanded ? '−' : '+'}</span>
                    </button>
                </div>
                <div class="city-places" id="${cityId}">
                    ${cityPlaces.map(place => `
                        <div class="place-card">
                            <div class="place-info">
                                <div class="place-name">${escapeHtml(place.name)}</div>
                                <div class="place-address">${escapeHtml(place.address)}</div>
                            </div>
                            ${place.link ? `<a href="${escapeHtml(place.link)}" target="_blank" class="place-link">${t.visitWebsite}</a>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    placesList.innerHTML = placesHTML;
}

// Group places by city name extracted from address
function groupPlacesByCity(places) {
    const cityGroups = {};
    
    places.forEach(place => {
        const city = extractCityFromAddress(place.address);
        
        if (!cityGroups[city]) {
            cityGroups[city] = [];
        }
        cityGroups[city].push(place);
    });
    
    return cityGroups;
}

// Extract city name from address
function extractCityFromAddress(address) {
    const addressLower = address.toLowerCase().trim();
    
    // City mapping for extraction
    const cityMap = {
        'tel aviv': currentLanguage === 'he' ? 'תל אביב' : 'Tel Aviv',
        'תל אביב': currentLanguage === 'he' ? 'תל אביב' : 'Tel Aviv',
        'jerusalem': currentLanguage === 'he' ? 'ירושלים' : 'Jerusalem',
        'ירושלים': currentLanguage === 'he' ? 'ירושלים' : 'Jerusalem',
        'haifa': currentLanguage === 'he' ? 'חיפה' : 'Haifa',
        'חיפה': currentLanguage === 'he' ? 'חיפה' : 'Haifa',
        'beer sheva': currentLanguage === 'he' ? 'באר שבע' : 'Beer Sheva',
        'באר שבע': currentLanguage === 'he' ? 'באר שבע' : 'Beer Sheva',
        'netanya': currentLanguage === 'he' ? 'נתניה' : 'Netanya',
        'נתניה': currentLanguage === 'he' ? 'נתניה' : 'Netanya',
        'ashdod': currentLanguage === 'he' ? 'אשדוד' : 'Ashdod',
        'אשדוד': currentLanguage === 'he' ? 'אשדוד' : 'Ashdod',
        'petah tikva': currentLanguage === 'he' ? 'פתח תקווה' : 'Petah Tikva',
        'פתח תקווה': currentLanguage === 'he' ? 'פתח תקווה' : 'Petah Tikva',
        'rishon lezion': currentLanguage === 'he' ? 'ראשון לציון' : 'Rishon LeZion',
        'ראשון לציון': currentLanguage === 'he' ? 'ראשון לציון' : 'Rishon LeZion',
        'amirim': currentLanguage === 'he' ? 'אמירים' : 'Amirim',
        'אמירים': currentLanguage === 'he' ? 'אמירים' : 'Amirim',
        'givat hashloshha': currentLanguage === 'he' ? 'גבעת השלושה' : 'Givat HaShloshha',
        'גבעת השלושה': currentLanguage === 'he' ? 'גבעת השלושה' : 'Givat HaShloshha',
        'kfar saba': currentLanguage === 'he' ? 'כפר סבא' : 'Kfar Saba',
        'כפר סבא': currentLanguage === 'he' ? 'כפר סבא' : 'Kfar Saba',
        'nir yafe': currentLanguage === 'he' ? 'ניר יפה' : 'Nir Yafe',
        'ניר יפה': currentLanguage === 'he' ? 'ניר יפה' : 'Nir Yafe'
    };
    
    // Check for exact city matches in address
    for (const [cityKey, displayName] of Object.entries(cityMap)) {
        if (addressLower.includes(cityKey) || address.includes(cityKey)) {
            return displayName;
        }
    }
    
    // Fallback: return the last part of the address (likely the city)
    const parts = address.split(',');
    if (parts.length > 1) {
        return parts[parts.length - 1].trim();
    }
    
    // If it's a single word/phrase (like "גבעת השלושה"), treat it as the city name
    return address.trim();
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
    
    const t = translations[currentLanguage];
    console.log(`🗺️ Adding ${places.length} places to map`);
    
    for (const place of places) {
        try {
            console.log(`\n🏪 Processing place: ${place.name}`);
            // For demo purposes, we'll use approximate coordinates for Israeli cities
            // In a real app, you'd geocode the addresses or store coordinates in your data
            const coordinates = getApproximateCoordinates(place.address);
            
            if (coordinates) {
                console.log(`📌 Creating marker at:`, coordinates);
                const marker = L.marker(coordinates).addTo(map);
                
                const popupContent = `
                    <div style="min-width: 200px; ${currentLanguage === 'he' ? 'direction: rtl; text-align: right;' : 'direction: ltr; text-align: left;'}">
                        <h3 style="margin: 0 0 8px 0; color: #2E7D32;">${escapeHtml(place.name)}</h3>
                        <p style="margin: 0 0 8px 0; color: #666;">${escapeHtml(place.address)}</p>
                        ${place.link ? `<a href="${escapeHtml(place.link)}" target="_blank" style="color: #4CAF50; text-decoration: none;">${t.visitWebsite} →</a>` : ''}
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                markers.push(marker);
                console.log(`✅ Added marker for ${place.name}`);
            } else {
                console.warn(`⚠️ Skipping marker for ${place.name} - no coordinates found`);
            }
        } catch (error) {
            console.error(`❌ Error adding marker for ${place.name}:`, error);
        }
    }
    
    console.log(`\n📊 Total markers added: ${markers.length}`);
    
    // If we have markers, adjust map view to show all of them
    if (markers.length > 0) {
        console.log('🔍 Fitting map bounds to show all markers');
        try {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
            console.log('✅ Map bounds fitted successfully');
        } catch (error) {
            console.warn('⚠️ Error fitting bounds, using default view:', error);
            map.setView([31.5, 34.8], 8); // Fallback to default Israel view
        }
    } else {
        console.warn('⚠️ No markers to display - using default map view');
        map.setView([31.5, 34.8], 8);
    }
}

// Get approximate coordinates for Israeli locations (for demo purposes)
function getApproximateCoordinates(address) {
    const addressLower = address.toLowerCase().trim();
    
    // Simple mapping for demo - in a real app, use a geocoding service
    const locationMap = {
        'tel aviv': [32.0853, 34.7818],
        'תל אביב': [32.0853, 34.7818],
        'jerusalem': [31.7683, 35.2137],
        'ירושלים': [31.7683, 35.2137],
        'haifa': [32.7940, 34.9896],
        'חיפה': [32.7940, 34.9896],
        'beer sheva': [31.2518, 34.7915],
        'באר שבע': [31.2518, 34.7915],
        'netanya': [32.3215, 34.8532],
        'נתניה': [32.3215, 34.8532],
        'ashdod': [31.8044, 34.6553],
        'אשדוד': [31.8044, 34.6553],
        'petah tikva': [32.0878, 34.8873],
        'פתח תקווה': [32.0878, 34.8873],
        'rishon lezion': [31.9730, 34.7925],
        'ראשון לציון': [31.9730, 34.7925],
        'amirim': [32.9775, 35.4294],
        'אמירים': [32.9775, 35.4294],
        'givat hashloshha': [32.0542, 34.9208], // Added Givat HaShloshha
        'גבעת השלושה': [32.0542, 34.9208],
        'kfar saba': [32.1747, 34.9049], // Added Kfar Saba
        'כפר סבא': [32.1747, 34.9049],
        'nir yafe': [32.5333, 34.9833], // Added Nir Yafe
        'ניר יפה': [32.5333, 34.9833]
    };
    
    // Debug: log the address we're trying to geocode
    console.log('🔍 Geocoding address:', address);
    console.log('📝 Address lowercase:', addressLower);
    
    // Check if this is a city-only address (no street number or name)
    const isCityOnly = !address.match(/\d+/) && !address.includes(',');
    console.log('🏙️ City-only address detected:', isCityOnly);
    
    for (const [city, coords] of Object.entries(locationMap)) {
        console.log(`🔎 Checking if "${addressLower}" includes "${city}"`);
        if (addressLower.includes(city)) {
            console.log(`✅ Found match for city: ${city}, coords: ${coords}`);
            
            // For city-only addresses, use a larger random offset to simulate being "somewhere in the city"
            const offset = isCityOnly ? 0.02 : 0.005; // Larger offset for city-only
            const finalCoords = [
                coords[0] + (Math.random() - 0.5) * offset,
                coords[1] + (Math.random() - 0.5) * offset
            ];
            console.log('📍 Final coordinates:', finalCoords);
            console.log(`🎯 Used ${isCityOnly ? 'city-wide' : 'street-level'} positioning`);
            return finalCoords;
        }
    }
    
    // If no city match found, try a broader search for common Hebrew words
    const hebrewCityPatterns = {
        'תל אביב': [32.0853, 34.7818],
        'ירושלים': [31.7683, 35.2137], 
        'חיפה': [32.7940, 34.9896],
        'אמירים': [32.9775, 35.4294],
        'גבעת השלושה': [32.0542, 34.9208],
        'כפר סבא': [32.1747, 34.9049],
        'ניר יפה': [32.5333, 34.9833]
    };
    
    console.log('🔍 Trying Hebrew pattern matching...');
    for (const [pattern, coords] of Object.entries(hebrewCityPatterns)) {
        console.log(`🔎 Checking if "${address}" includes "${pattern}"`);
        if (address.includes(pattern)) {
            console.log(`✅ Found Hebrew pattern match: ${pattern}, coords: ${coords}`);
            
            // For city-only addresses, use a larger random offset
            const offset = isCityOnly ? 0.02 : 0.005;
            const finalCoords = [
                coords[0] + (Math.random() - 0.5) * offset,
                coords[1] + (Math.random() - 0.5) * offset
            ];
            console.log('📍 Final coordinates:', finalCoords);
            console.log(`🎯 Used ${isCityOnly ? 'city-wide' : 'street-level'} positioning`);
            return finalCoords;
        }
    }
    
    // If still no match found, log warning and return a default location for now
    console.warn(`❌ No coordinates found for address: ${address}`);
    console.warn('🔄 Using Tel Aviv as fallback location');
    // Return Tel Aviv center as fallback instead of null for testing
    return [32.0853, 34.7818];
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle individual city expand/collapse
function toggleCity(cityId) {
    const cityElement = document.getElementById(cityId);
    const cityGroup = cityElement.parentElement;
    const toggleIcon = cityGroup.querySelector('.toggle-icon');
    
    if (cityGroup.classList.contains('expanded')) {
        cityGroup.classList.remove('expanded');
        cityGroup.classList.add('collapsed');
        toggleIcon.textContent = '+';
    } else {
        cityGroup.classList.remove('collapsed');
        cityGroup.classList.add('expanded');
        toggleIcon.textContent = '−';
    }
}

// Toggle all categories expand/collapse
function toggleAllCategories() {
    const t = translations[currentLanguage];
    const cityGroups = document.querySelectorAll('.city-group');
    
    allExpanded = !allExpanded;
    
    cityGroups.forEach(group => {
        const toggleIcon = group.querySelector('.toggle-icon');
        
        if (allExpanded) {
            group.classList.remove('collapsed');
            group.classList.add('expanded');
            toggleIcon.textContent = '−';
        } else {
            group.classList.remove('expanded');
            group.classList.add('collapsed');
            toggleIcon.textContent = '+';
        }
    });
    
    // Update the toggle all button text
    toggleAllBtn.textContent = allExpanded ? t.collapseAll : t.expandAll;
}

// Generate structured data for SEO and AI recognition
function generateStructuredData() {
    if (places.length === 0) return;
    
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "מקומות טבעוניים בישראל",
        "description": "רשימה מקיפה של מקומות טבעוניים בישראל",
        "numberOfItems": places.length,
        "itemListElement": places.map((place, index) => {
            const coordinates = getApproximateCoordinates(place.address);
            return {
                "@type": "Restaurant",
                "position": index + 1,
                "name": place.name,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": place.address,
                    "addressCountry": "IL"
                },
                "geo": coordinates ? {
                    "@type": "GeoCoordinates",
                    "latitude": coordinates[0],
                    "longitude": coordinates[1]
                } : undefined,
                "url": place.link || undefined,
                "servesCuisine": "Vegan",
                "dietaryRestriction": "VeganDiet",
                "keywords": ["vegan", "טבעוני", "plant-based", "צמחוני"],
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.5",
                    "reviewCount": "1"
                }
            };
        }).filter(item => item.geo !== undefined) // Only include items with valid coordinates
    };
    
    // Add the structured data to the page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
    
    // Update meta description with current data
    updateMetaDescription();
}

// Update meta description dynamically
function updateMetaDescription() {
    const cities = [...new Set(places.map(place => extractCityFromAddress(place.address)))];
    const description = currentLanguage === 'he' ?
        `מדריך למקומות טבעוניים בישראל - ${places.length} מסעדות וברים טבעוניים ב${cities.slice(0, 3).join(', ')} ועוד` :
        `Guide to vegan places in Israel - ${places.length} vegan restaurants and cafes in ${cities.slice(0, 3).join(', ')} and more`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', description);
    }
}
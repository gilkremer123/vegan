// Global variables
let places = [];
let map;
let baseLayer; // current base tile layer
let markers = [];
let userLocationMarker = null; // Track user location marker
let currentLanguage = 'he'; // Default to Hebrew
let allExpanded = false; // Track global expand/collapse state - start collapsed
// Precise coordinate overrides (key: normalized address). Start with Tel Aviv sample entries.
const preciseOverrides = {
    // Format: 'normalized key': [lat, lng]
    // Add entries like 'דיזינגוף 50 תל אביב': [32.08085, 34.77480]
};

// Attempt to load external overrides JSON (optional). Non-blocking.
fetch('telaviv_overrides.json').then(r => {
    if (!r.ok) return;
    return r.json();
}).then(data => {
    if (data && typeof data === 'object') {
        Object.assign(preciseOverrides, data);
        console.log('🔄 Loaded Tel Aviv override coordinates:', Object.keys(data).length);
    }
}).catch(()=>{});

// Language translations
const translations = {
    he: {
        title: 'מקומות טבעוניים בישראל',
        listView: '📋 תצוגת רשימה',
        mapView: '🗺️ תצוגת מפה',
        searchPlaceholder: 'חפש מקומות טבעוניים...',
    visitWebsite: 'בקרו באתר',
        loading: 'טוען מקומות טבעוניים...',
        noPlacesFound: 'לא נמצאו מקומות טבעוניים התואמים לחיפוש.',
        loadError: 'שגיאה בטעינת המקומות הטבעוניים. אנא נסה שוב מאוחר יותר.',
    contactText: 'צרו קשר',
        expandAll: 'הרחב הכל',
        collapseAll: 'צמצם הכל',
        addPlaceTitle: 'הוספת מקום טבעוני',
        contactOptions: 'תוכלו גם לפנות אלינו באימייל במקום למלא את הטופס:',
    emailContact: 'צרו קשר באימייל',
        orText: 'או מלאו את הטופס:',
        placeNameLabel: 'שם המקום *',
        placeAddressLabel: 'כתובת *',
        placeLinkLabel: 'קישור לאתר או פרופיל של המקום *',
        submitForm: 'שלח הצעה',
    cancel: 'ביטול',
    subscribeButton: 'אני רוצה לקבל מייל כשמקום חדש נפתח',
    subscribeTitle: 'הצטרפות לעדכונים',
    subscribeDescription: 'קבלו עדכון במייל בכל פעם שמקום טבעוני חדש מתווסף לרשימה.',
    subscriberNameLabel: 'שם *',
    subscriberEmailLabel: 'אימייל *',
    subscribeSubmit: 'הרשמה',
    subscribeSuccess: 'נרשמתם בהצלחה! תודה.',
    subscribeExists: 'אתם כבר רשומים לקבלת עדכונים.',
    subscribeError: 'אירעה שגיאה בהרשמה. נסו שוב או פנו אלינו.',
    openingHours: 'שעות פתיחה',
    openNow: 'פתוח עכשיו',
    closedNow: 'סגור עכשיו',
    filterOpenNow: 'פתוח עכשיו',
    showOnlyOpen: 'פתוח עכשיו',
    showAllPlaces: 'הצג הכל',
    footerRecommendedLink: 'אתר מומלץ להזמנת אוכל טבעוני ועוד מיצרנים ביתיים בעבודת יד',
    showMyLocation: 'הצג מיקומי',
    myLocation: 'המיקום שלי',
    locationError: 'שגיאה בהשגת המיקום',
    locationNotSupported: 'הדפדפן לא תומך בשירותי מיקום',
    locationPermissionDenied: 'הגישה למיקום נדחתה'
    },
    en: {
        title: 'Vegan Places in Israel',
        listView: '📋 List View',
        mapView: '🗺️ Map View',
        searchPlaceholder: 'Search vegan places...',
        visitWebsite: 'Visit Website',
        loading: 'Loading vegan places...',
        noPlacesFound: 'No vegan places found matching your search.',
        loadError: 'Failed to load vegan places. Please try again later.',
        contactText: 'Contact',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        addPlaceTitle: 'Add Vegan Place',
        contactOptions: 'You can also contact us via email instead of filling the form:',
        emailContact: 'Contact via Email',
        orText: 'Or fill out the form:',
        placeNameLabel: 'Place Name *',
        placeAddressLabel: 'Address *',
        placeLinkLabel: 'Website or Profile Link *',
        submitForm: 'Submit Suggestion',
        cancel: 'Cancel',
        subscribeButton: 'Email me when a new place is added',
        subscribeTitle: 'Subscribe to Updates',
        subscribeDescription: 'Get an email whenever a new vegan place is added to the list.',
        subscriberNameLabel: 'Name *',
        subscriberEmailLabel: 'Email *',
        subscribeSubmit: 'Subscribe',
        subscribeSuccess: 'You are subscribed. Thank you!',
        subscribeExists: 'You are already subscribed.',
        subscribeError: 'There was an error subscribing. Please try again or contact us.',
        openingHours: 'Hours',
        openNow: 'Open now',
        closedNow: 'Closed now',
        filterOpenNow: 'Open now',
        showOnlyOpen: 'Only open now',
        showAllPlaces: 'Show all',
        footerRecommendedLink: 'Recommended site for ordering vegan food and more from home producers',
        showMyLocation: 'Show my location',
        myLocation: 'My Location',
        locationError: 'Error getting location',
        locationNotSupported: 'Browser does not support location services',
        locationPermissionDenied: 'Location access denied'
    }
};

// DOM elements
const modeToggleBtn = document.getElementById('modeToggle');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const placesList = document.getElementById('placesList');
const searchInput = document.getElementById('searchInput');
const languageToggle = document.getElementById('languageToggle');
const contactBtn = document.getElementById('contactBtn');
const toggleAllBtn = document.getElementById('toggleAllBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const subscribeModal = document.getElementById('subscribeModal');
const filterOpenBtn = document.getElementById('filterOpenBtn');
const locationBtn = document.getElementById('locationBtn');
let subscriptionSending = false;
let filterOpenOnly = false; // Track if filter is active

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Clear any cached service workers to prevent stale content
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    // Initialize EmailJS
    try {
        emailjs.init("ZS8tiM0rUEIcKH_3m");
        console.log('EmailJS initialized successfully');
        
        // Test EmailJS configuration
        console.log('Testing EmailJS configuration...');
        testEmailJSConfig();
    } catch (error) {
        console.error('EmailJS initialization failed:', error);
    }
    
    loadPlaces();
    setupEventListeners();
    updateLanguage(); // Set initial language
    generateStructuredData(); // Add structured data for SEO
    // Apply initial view from URL parameter (?view=map)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'map') {
        // Force map mode after initial render tick
        setTimeout(() => { if (typeof toggleMode === 'function' && currentMode === 'list') toggleMode(); }, 50);
    }
    
    // Update open/closed status every minute
    setInterval(updateOpenClosedStatus, 60000);
    
    // Also refresh data every 5 minutes to catch new places or hour changes
    setInterval(async function() {
        console.log('🔄 Auto-refreshing places data...');
        await loadPlaces();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Add keyboard shortcut for manual refresh (Ctrl+R or Cmd+R)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            console.log('🔄 Manual refresh triggered...');
            e.preventDefault();
            loadPlaces();
        }
    });
});

// Function to update only the open/closed status without full re-render
function updateOpenClosedStatus() {
    const now = new Date();
    document.querySelectorAll('.place-card').forEach(card => {
        const name = card.getAttribute('data-place-name');
        const placeObj = places.find(p => p.name === name);
        if (!placeObj || !placeObj.schedule) return;
        
        const statusEl = card.querySelector('.open-status');
        if (!statusEl) return;
        
        const status = isPlaceOpenNow(placeObj.schedule, now);
        const t = translations[currentLanguage];
        
        if (status === null) {
            statusEl.style.display = 'none';
            return;
        }
        
        // Update class and content
        statusEl.className = 'open-status';
        if (status) {
            statusEl.classList.add('open');
            statusEl.innerHTML = `<span class="dot"></span>${t.openNow}`;
        } else {
            statusEl.classList.add('closed');
            statusEl.innerHTML = `<span class="dot"></span>${t.closedNow}`;
        }
        statusEl.style.display = 'flex';
    });
}

// Setup event listeners
function setupEventListeners() {
    modeToggleBtn.addEventListener('click', toggleMode);
    searchInput.addEventListener('input', filterPlaces);
    languageToggle.addEventListener('click', toggleLanguage);
    contactBtn.addEventListener('click', openContactModal);
    toggleAllBtn.addEventListener('click', toggleAllCategories);
    if (subscribeBtn) subscribeBtn.addEventListener('click', openSubscribeModal);
    if (filterOpenBtn) filterOpenBtn.addEventListener('click', toggleOpenFilter);
    if (locationBtn) locationBtn.addEventListener('click', handleLocationButtonClick);
    
    // Add event listener for email contact button in modal
    document.getElementById('emailContactBtn').addEventListener('click', openContactEmail);
    
    // Add event listener for form submission
    document.getElementById('addPlaceForm').addEventListener('submit', handleFormSubmission);
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

// Open contact modal
function openContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close contact modal
function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    
    // Reset form
    document.getElementById('addPlaceForm').reset();
}

// Handle form submission
function handleFormSubmission(event) {
    event.preventDefault();
    
    // Show loading state
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = currentLanguage === 'he' ? 'שולח...' : 'Sending...';
    submitBtn.disabled = true;
    
    const formData = new FormData(event.target);
    
    // Normalize URL - add https:// if it starts with www
    let placeLink = formData.get('placeLink');
    if (placeLink && placeLink.toLowerCase().startsWith('www.')) {
        placeLink = 'https://' + placeLink;
    }
    
    // Prepare template parameters for EmailJS
    const templateParams = {
        place_name: formData.get('placeName'),
        place_address: formData.get('placeAddress'),
        place_link: placeLink
    };
    
    console.log('Sending email with params:', templateParams); // Debug log
    
    // Send email via EmailJS
    emailjs.send('service_r8kfvfn', 'template_gr0l29r', templateParams)
        .then(function(response) {
            console.log('Email sent successfully:', response);
            showSuccessMessage();
            closeContactModal();
        })
        .catch(function(error) {
            console.error('Email failed to send:', error);
            console.error('Error details:', error.text, error.status);
            showErrorMessage(error);
        })
        .finally(function() {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// Show success message
function showSuccessMessage() {
    const message = currentLanguage === 'he' ? 
        'תודה! ההצעה נשלחה בהצלחה. נבדוק אותה ונוסיף למאגר בהקדם.' :
        'Thank you! Your suggestion has been sent successfully. We\'ll review it and add it to our database soon.';
    
    alert(message);
}

// Show error message  
function showErrorMessage(error) {
    console.error('EmailJS Error:', error);
    
    let message;
    if (error && error.status === 422) {
        message = currentLanguage === 'he' ?
            'שגיאה: נתונים שגויים. אנא בדקו שכל השדות מלאים כראוי.' :
            'Error: Invalid data. Please check that all fields are filled correctly.';
    } else if (error && error.status === 400) {
        message = currentLanguage === 'he' ?
            'שגיאה: בעיה בהגדרות EmailJS. צרו קשר באימייל.' :
            'Error: EmailJS configuration issue. Please contact via email.';
    } else {
        message = currentLanguage === 'he' ?
            'אופס! הייתה שגיאה בשליחה. אנא נסו שוב או צרו קשר באימייל.' :
            'Oops! There was an error sending your suggestion. Please try again or contact us via email.';
    }
    
    alert(message);
}

// Make modal functions globally available
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.openSubscribeModal = openSubscribeModal;
window.closeSubscribeModal = closeSubscribeModal;

// Toggle language between Hebrew and English
function toggleLanguage() {
    currentLanguage = currentLanguage === 'he' ? 'en' : 'he';
    updateLanguage();
    displayPlaces(places); // Refresh the places display
    
    // Update map markers if map is initialized
    if (map) {
        // Switch base tiles to appropriate language style then redraw markers
        setBaseLayer();
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
    
    // Update language toggle button text
    languageToggle.textContent = currentLanguage === 'he' ? 'EN' : 'עב';

    // Update single mode toggle button label depending on current view
    updateModeToggleLabel();
    
    // Update toggle all button text
    toggleAllBtn.textContent = allExpanded ? t.collapseAll : t.expandAll;
    
    // Update filter button text based on current state
    if (filterOpenBtn) {
        if (filterOpenOnly) {
            filterOpenBtn.textContent = t.showAllPlaces;
        } else {
            filterOpenBtn.textContent = t.showOnlyOpen;
        }
    }
    
    // Update elements with data-key attributes
    document.querySelectorAll('[data-key]').forEach(element => {
        // Skip filter button as it has custom text logic
        if (element === filterOpenBtn) return;
        
        const key = element.getAttribute('data-key');
        if (t[key]) {
            // Special handling for title to preserve logo
            if (key === 'title') {
                const logo = element.querySelector('.site-logo');
                if (logo) {
                    // Keep the logo and update only the text content
                    element.innerHTML = '';
                    element.appendChild(logo);
                    element.appendChild(document.createTextNode(' ' + t[key]));
                } else {
                    element.textContent = t[key];
                }
            } else {
                element.textContent = t[key];
            }
        }
    });
    
    // Update placeholder
    const placeholderKey = searchInput.getAttribute('data-placeholder-key');
    if (placeholderKey && t[placeholderKey]) {
        searchInput.placeholder = t[placeholderKey];
    }
    
    // Update URL input placeholder and title
    const urlInput = document.getElementById('placeLink');
    if (urlInput) {
        if (currentLanguage === 'he') {
            urlInput.placeholder = 'https://example.com או www.example.com';
            urlInput.title = 'הזינו כתובת אתר תקינה המתחילה ב-https:// או www.';
        } else {
            urlInput.placeholder = 'https://example.com or www.example.com';
            urlInput.title = 'Enter a valid website URL starting with https:// or www.';
        }
    }
    updateWazeStyleLabel();
}

// ===== Subscription Feature =====
function openSubscribeModal() {
    if (!subscribeModal) return;
    subscribeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    const nameInput = document.getElementById('subscriberName');
    if (nameInput) nameInput.focus();
    const form = document.getElementById('subscribeForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleSubscribeSubmit);
        form.dataset.bound = 'true';
    }
}

function closeSubscribeModal() {
    if (!subscribeModal) return;
    subscribeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    const form = document.getElementById('subscribeForm');
    if (form) form.reset();
}

function handleSubscribeSubmit(e) {
    e.preventDefault();
    if (subscriptionSending) return;
    const t = translations[currentLanguage];
    const name = document.getElementById('subscriberName').value.trim();
    const email = document.getElementById('subscriberEmail').value.trim().toLowerCase();
    if (!name || !email) return;
    // Local CSV-like storage simulation
    const existing = JSON.parse(localStorage.getItem('subscribers') || '[]');
    if (existing.some(s => s.email === email)) {
        alert(t.subscribeExists);
        closeSubscribeModal();
        return;
    }
    subscriptionSending = true;
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = currentLanguage === 'he' ? 'שולח...' : 'Sending...';
    submitBtn.disabled = true;
    const entry = { name, email, ts: Date.now() };
    existing.push(entry);
    localStorage.setItem('subscribers', JSON.stringify(existing));
    // Send via EmailJS (reuse template) - you receive an email per subscription
    const templateParams = {
        place_name: '[SUBSCRIPTION]',
        place_address: name,
        place_link: email
    };
    emailjs.send('service_r8kfvfn', 'template_gr0l29r', templateParams)
        .then(resp => {
            console.log('Subscription email sent', resp);
            alert(t.subscribeSuccess);
            closeSubscribeModal();
        })
        .catch(err => {
            console.error('Subscription failed', err);
            alert(t.subscribeError);
        })
        .finally(() => {
            subscriptionSending = false;
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function updateWazeStyleLabel() {
    const label = document.getElementById('wazeStyleLabel');
    const toggle = document.getElementById('wazeStyleToggle');
    if (!label || !toggle) return;
    const isOn = toggle.checked;
    if (currentLanguage === 'he') {
        label.textContent = isOn ? 'מצב Waze (חשוך)' : 'מפה רגילה';
    } else {
        label.textContent = isOn ? 'Waze Dark Mode' : 'Standard Map';
    }
}

// Switch between list and map modes
let currentMode = 'list'; // 'list' or 'map'
function toggleMode() {
    if (currentMode === 'list') {
        // Switch to map
        currentMode = 'map';
        listView.classList.remove('active');
        mapView.classList.add('active');
        if (!map) initializeMap();
        document.body.classList.add('map-mode-active');
    } else {
        // Switch to list
        currentMode = 'list';
        mapView.classList.remove('active');
        listView.classList.add('active');
        document.body.classList.remove('map-mode-active');
    }
    updateModeToggleLabel();
}

function updateModeToggleLabel() {
    if (!modeToggleBtn) return;
    const t = translations[currentLanguage];
    // Button should show the OTHER view it will switch to
    if (currentMode === 'list') {
        modeToggleBtn.dataset.mode = 'list';
        modeToggleBtn.textContent = (currentLanguage === 'he' ? '🗺️ תצוגת מפה' : '🗺️ Map View');
    } else {
        modeToggleBtn.dataset.mode = 'map';
        modeToggleBtn.textContent = (currentLanguage === 'he' ? '📋 תצוגת רשימה' : '📋 List View');
    }
}

// Load places from CSV file
async function loadPlaces() {
    try {
        const t = translations[currentLanguage];
        placesList.innerHTML = `<div class="loading">${t.loading}</div>`;
        
        // Add cache-busting timestamp to ensure fresh data
        const cacheBuster = new Date().getTime();
        const response = await fetch(`places.csv?t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
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
            
            // Extract name, address, link, region, lat, lng, hours and remove quotes
            const name = fields[0] ? fields[0].replace(/^"|"$/g, '') : '';
            const address = fields[1] ? fields[1].replace(/^"|"$/g, '') : '';
            const link = fields[2] ? fields[2].replace(/^"|"$/g, '') : '';
            const region = fields[3] ? fields[3].replace(/^"|"$/g, '') : (currentLanguage === 'he' ? 'כללי' : 'General');
            const latRaw = fields[4] ? fields[4].replace(/^"|"$/g, '') : '';
            const lngRaw = fields[5] ? fields[5].replace(/^"|"$/g, '') : '';
            const hoursRaw = fields[6] ? fields[6].replace(/^"|"$/g, '') : '';
            const lat = latRaw && !isNaN(parseFloat(latRaw)) ? parseFloat(latRaw) : null;
            const lng = lngRaw && !isNaN(parseFloat(lngRaw)) ? parseFloat(lngRaw) : null;
            
            console.log(`✅ Final parsed data:`, { name, address, link, region });
            
            if (name && address) {
                const schedule = parseOpeningHoursSchedule(hoursRaw);
                places.push({ name, address, link, region, lat, lng, hours: hoursRaw, schedule });
            }
        }
    }
    
    console.log(`📊 Total places parsed: ${places.length}`);
    return places;
}

// Parse Google-style opening hours string into structured schedule
// Expected examples:
// "Mon-Fri 09:00-17:00; Sat 10:00-14:00; Sun Closed"
// "Mon-Thu 11:00-23:00; Fri 11:00-15:00; Sat 19:00-23:30; Sun 11:00-23:00"
// Returns: { Mon:[{opens:'09:00',closes:'17:00'}], Tue:[...], ... }
function parseOpeningHoursSchedule(hoursString) {
    if (!hoursString) return null;
    // Fallback: unlabeled single range like "10:00-22:00" => apply to all days
    const simpleRangeMatch = hoursString.trim().match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (simpleRangeMatch) {
        const [_, openT, closeT] = simpleRangeMatch;
        const dayKeysAll = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const sched = {};
        dayKeysAll.forEach(d => sched[d] = [{ opens: openT, closes: closeT }]);
        return sched;
    }
    if (!/[A-Za-z]{3}/.test(hoursString)) return null;
    const dayKeys = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const schedule = {};
    dayKeys.forEach(d => schedule[d] = []);
    // Split by semicolons
    const parts = hoursString.split(';').map(p => p.trim()).filter(Boolean);
    const dayPattern = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:-(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?/;
    parts.forEach(part => {
        const match = part.match(dayPattern);
        if (!match) return;
        const startDay = match[1];
        const endDay = match[2] || startDay;
        // Extract time range or Closed
        const rest = part.replace(dayPattern, '').trim();
        if (!rest) return;
        // Determine included days sequence
        const startIndex = dayKeys.indexOf(startDay);
        const endIndex = dayKeys.indexOf(endDay);
        let targetDays = [];
        
        // Special handling for Sun-Thu, Sun-Fri, etc.
        if (startDay === 'Sun' && ['Mon','Tue','Wed','Thu','Fri'].includes(endDay)) {
            // For Sun-Thu: Sunday + Mon through Thu
            const endIdx = dayKeys.indexOf(endDay);
            targetDays = ['Sun'].concat(dayKeys.slice(0, endIdx + 1));
        } else if (startIndex <= endIndex) {
            targetDays = dayKeys.slice(startIndex, endIndex + 1);
        } else { // wrap-around case (e.g., Fri-Mon)
            targetDays = dayKeys.slice(startIndex).concat(dayKeys.slice(0, endIndex + 1));
        }
        if (/closed/i.test(rest)) {
            // Explicit closed: ensure empty array (already default)
            return;
        }
        // A part could contain multiple comma separated ranges (rare). Split by ','
        rest.split(',').map(r => r.trim()).forEach(range => {
            const times = range.split('-').map(x => x.trim());
            if (times.length === 2 && /^\d{1,2}:\d{2}$/.test(times[0]) && /^\d{1,2}:\d{2}$/.test(times[1])) {
                targetDays.forEach(d => schedule[d].push({ opens: times[0], closes: times[1] }));
            }
        });
    });
    // If every day empty -> return null to fallback
    const any = Object.values(schedule).some(arr => arr.length);
    return any ? schedule : null;
}

function buildOpeningHoursSpecification(schedule) {
    const spec = [];
    const weekMap = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' };
    Object.entries(schedule).forEach(([day, ranges]) => {
        if (!ranges || ranges.length === 0) return; // closed
        ranges.forEach(r => {
            spec.push({
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": weekMap[day],
                "opens": r.opens,
                "closes": r.closes
            });
        });
    });
    return spec.length ? spec : undefined;
}

// Determine if a place is open now given its schedule
function isPlaceOpenNow(schedule, now = new Date()) {
    if (!schedule) return null; // unknown
    // Map JS day (0=Sun) to schedule key
    const dayKeys = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const key = dayKeys[now.getDay()];
    const ranges = schedule[key] || [];
    if (!ranges.length) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const r of ranges) {
        const [oh, om] = r.opens.split(':').map(Number);
        const [ch, cm] = r.closes.split(':').map(Number);
        const start = oh * 60 + om;
        const end = ch * 60 + cm;
        if (end > start) {
            if (currentMinutes >= start && currentMinutes < end) return true;
        } else { // overnight (rare; treat spans midnight)
            if (currentMinutes >= start || currentMinutes < end) return true;
        }
    }
    return false;
}

function buildOpenStatusElement(schedule) {
    const status = isPlaceOpenNow(schedule);
    const t = translations[currentLanguage];
    const span = document.createElement('div');
    span.className = 'open-status';
    
    // Always show status if we have a schedule
    if (status === null) {
        span.style.display = 'none';
        return span;
    }
    
    if (status) {
        span.classList.add('open');
        span.innerHTML = `<span class="dot"></span>${t.openNow}`;
    } else {
        span.classList.add('closed');
        span.innerHTML = `<span class="dot"></span>${t.closedNow}`;
    }
    return span;
}

// Display places in list view
function displayPlaces(placesToDisplay) {
    const t = translations[currentLanguage];
    
    if (placesToDisplay.length === 0) {
        placesList.innerHTML = `<div class="error">${t.noPlacesFound}</div>`;
        return;
    }
    
    // Group places by region first, then by city
    const placesByRegion = groupPlacesByRegion(placesToDisplay);
    
    let placesHTML = '';
    
    // Sort regions by number of places (descending order)
    const sortedRegions = Object.keys(placesByRegion).sort((a, b) => {
        return placesByRegion[b].length - placesByRegion[a].length;
    });
    
    sortedRegions.forEach((region, regionIndex) => {
        const regionPlaces = placesByRegion[region];
        const regionId = `region-${regionIndex}-${region.replace(/\s+/g, '-').replace(/[^\w\-א-ת]/g, '')}`;
        const isExpanded = allExpanded ? 'expanded' : 'collapsed';
        
        // Group places within this region by city
        const placesByCity = groupPlacesByCity(regionPlaces);
        
        // Sort cities by number of places (descending order)
        const sortedCities = Object.keys(placesByCity).sort((a, b) => {
            return placesByCity[b].length - placesByCity[a].length;
        });
        
        let regionCitiesHTML = '';
        sortedCities.forEach((city, cityIndex) => {
            const cityPlaces = placesByCity[city];
            const cityId = `city-${regionIndex}-${cityIndex}-${city.replace(/\s+/g, '-').replace(/[^\w\-א-ת]/g, '')}`;
            
            regionCitiesHTML += `
                <div class="city-group ${isExpanded}">
                    <div class="city-header" role="button" tabindex="0" aria-expanded="${allExpanded}" onclick="toggleCity('${cityId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); toggleCity('${cityId}');}">
                        <span class="city-title">${escapeHtml(city)} (${cityPlaces.length})</span>
                        <button class="city-toggle-btn" onclick="event.stopPropagation(); toggleCity('${cityId}')" aria-label="Toggle city">
                            <span class="toggle-icon">${allExpanded ? '−' : '+'}</span>
                        </button>
                    </div>
                    <div class="city-places" id="${cityId}">
                        ${cityPlaces.map(place => {
                            const condensed = place.schedule ? getCondensedWeeklyLabel(place.schedule) : null;
                            const displayLabel = condensed || getTodayHoursLabel(place);
                            const fullTitle = place.schedule ? formatFullScheduleTooltip(place) : (place.hours || '');
                            
                            // Split address into street and city
                            const addressParts = place.address.split(', ');
                            const street = addressParts[0] || '';
                            const city = addressParts.slice(1).join(', ') || '';
                            
                            return `
                            <div class="place-card" data-place-name="${escapeHtml(place.name)}">
                                <div class="place-info">
                                    <div class="place-name">${escapeHtml(place.name)}</div>
                                    <div class="place-address">
                                        <div class="place-street">${escapeHtml(street)}</div>
                                        ${city ? `<div class="place-city">${escapeHtml(city)}</div>` : ''}
                                    </div>
                                    <div class="place-bottom">
                                        <div class="open-status" data-open-status></div>
                                        ${place.link ? `<a href="${escapeHtml(place.link)}" target="_blank" class="place-link">${t.visitWebsite}</a>` : ''}
                                    </div>
                                </div>
                                ${displayLabel ? `<div class="place-hours" title="${escapeHtml(fullTitle)}">${displayLabel}</div>` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        placesHTML += `
            <div class="region-group ${isExpanded}">
                <div class="region-header" role="button" tabindex="0" aria-expanded="${allExpanded}" onclick="toggleRegion('${regionId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); toggleRegion('${regionId}');}">
                    <span class="region-title">${escapeHtml(region)} (${regionPlaces.length})</span>
                    <button class="region-toggle-btn" onclick="event.stopPropagation(); toggleRegion('${regionId}')" aria-label="Toggle region">
                        <span class="toggle-icon">${allExpanded ? '−' : '+'}</span>
                    </button>
                </div>
                <div class="region-cities" id="${regionId}">
                    ${regionCitiesHTML}
                </div>
            </div>
        `;
    });
    
    placesList.innerHTML = placesHTML;
    
    // After injecting HTML, populate open/closed statuses
    requestAnimationFrame(() => {
        const now = new Date();
        document.querySelectorAll('.place-card').forEach(card => {
            const name = card.getAttribute('data-place-name');
            const placeObj = places.find(p => p.name === name);
            if (!placeObj) return;
            const container = card.querySelector('[data-open-status]');
            if (!container) return;
            const statusEl = buildOpenStatusElement(placeObj.schedule);
            container.replaceWith(statusEl);
        });
    });
}

// Group places by region
function groupPlacesByRegion(places) {
    const regionGroups = {};
    
    places.forEach(place => {
        const region = place.region || (currentLanguage === 'he' ? 'כללי' : 'General');
        
        if (!regionGroups[region]) {
            regionGroups[region] = [];
        }
        regionGroups[region].push(place);
    });
    
    return regionGroups;
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

// Helpers for opening hours rendering
const dayOrder = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const dayNames = {
    he: { Mon:'שני', Tue:'שלישי', Wed:'רביעי', Thu:'חמישי', Fri:'שישי', Sat:'שבת', Sun:'ראשון' },
    en: { Mon:'Mon', Tue:'Tue', Wed:'Wed', Thu:'Thu', Fri:'Fri', Sat:'Sat', Sun:'Sun' }
};

function getTodayHoursLabel(place) {
    if (!place) return '';
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun
    const map = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const todayKey = map[jsDay];
    const hebrewDay = dayNames.he[todayKey];
    if (place.schedule && place.schedule[todayKey] && place.schedule[todayKey].length) {
        const ranges = place.schedule[todayKey].map(r => `${r.opens}-${r.closes}`).join(', ');
        return `${hebrewDay} ${ranges}`;
    }
    if (place.schedule) return `${hebrewDay} סגור`;
    if (place.hours) {
        return `${hebrewDay} ${place.hours}`;
    }
    return '';
}

function formatFullScheduleTooltip(place) {
    if (!place.schedule) return place.hours || '';
    const lines = [];
    dayOrder.forEach(d => {
        const name = dayNames.he[d];
        const entries = place.schedule[d];
        if (!entries || entries.length === 0) {
            lines.push(`${name}: סגור`);
        } else {
            lines.push(`${name}: ${entries.map(r => `${r.opens}-${r.closes}`).join(', ')}`);
        }
    });
    return lines.join('\n');
}

// Build condensed weekly label like: "א-ה 08:00-23:00; ו 08:00-15:00; ש 09:30-23:30"
function getCondensedWeeklyLabel(schedule) {
    if (!schedule) return null;
    // Convert schedule into array of {dayKey, nameHe, ranges:["HH:MM-HH:MM", ...] or 'סגור'}
    // Use Sunday-first order to properly group Sun-Thu patterns
    const daySeq = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const items = daySeq.map(k => {
        const ranges = schedule[k];
        if (!ranges || ranges.length === 0) return { k, status: 'closed', label: 'סגור' };
        return { k, status: 'open', label: ranges.map(r => `${r.opens}-${r.closes}`).join(',') };
    });
    // Group consecutive days with identical label, but keep Fri/Sat separate
    const groups = [];
    let current = null;
    items.forEach(it => {
        const sig = it.status + '|' + it.label;
        // Always break grouping for Friday and Saturday - they should be separate
        const shouldBreakGroup = !current || current.sig !== sig || it.k === 'Fri' || it.k === 'Sat';
        
        if (shouldBreakGroup) {
            if (current) groups.push(current);
            current = { sig, label: it.label, status: it.status, days: [it.k] };
        } else {
            current.days.push(it.k);
        }
    });
    if (current) groups.push(current);
    // Map day key to Hebrew short letter(s):
    const hebShort = { Mon:'ב', Tue:'ג', Wed:'ד', Thu:'ה', Fri:'ו', Sat:'ש', Sun:'א' }; // Use first letter (Hebrew week often starts Sunday א)
    const hebOrder = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const partStrings = groups.map(g => {
        // Sort days according to hebOrder just in case
        g.days.sort((a,b)=>hebOrder[a]-hebOrder[b]);
        const first = g.days[0];
        const last = g.days[g.days.length-1];
        const rangeStr = g.days.length > 1 ? `${hebShort[first]}-${hebShort[last]}` : hebShort[first];
        if (g.status === 'closed') return `<span class="ph-day">${rangeStr}</span> <span class="ph-time ph-closed">סגור</span>`;
        // Replace commas between multiple ranges with ' / '
        const label = g.label.replace(/,/g,' / ');
        return `<span class="ph-day">${rangeStr}</span> <span class="ph-time">${label}</span>`;
    });
    return partStrings.join('<br>');
}

// Toggle open filter
function toggleOpenFilter() {
    filterOpenOnly = !filterOpenOnly;
    const t = translations[currentLanguage];
    
    if (filterOpenOnly) {
        // Button is now active - showing only open places
        filterOpenBtn.textContent = t.showAllPlaces;
        filterOpenBtn.classList.add('active');
    } else {
        // Button is inactive - showing all places
        filterOpenBtn.textContent = t.showOnlyOpen;
        filterOpenBtn.classList.remove('active');
    }
    
    filterPlaces(); // Re-apply filtering
}

// Filter places based on search input
function filterPlaces() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    let filteredPlaces = places;
    
    // Apply search filter
    if (searchTerm) {
        filteredPlaces = filteredPlaces.filter(place => 
            place.name.toLowerCase().includes(searchTerm) ||
            place.address.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply open filter
    if (filterOpenOnly) {
        filteredPlaces = filteredPlaces.filter(place => {
            if (!place.schedule) return false; // No hours = can't determine if open
            return isPlaceOpenNow(place.schedule);
        });
    }
    
    displayPlaces(filteredPlaces);
}

// Initialize map
function initializeMap() {
    // Center map on Israel (approximate center)
    map = L.map('map').setView([31.5, 34.8], 8);
    // Add correct base layer for current language
    setBaseLayer();
    // Add places to map
    addMarkersToMap();
    // Try to get user location after map is initialized
    requestUserLocation();
}

// Request user's current location
function requestUserLocation() {
    if (!navigator.geolocation) {
        console.log('Geolocation not supported by browser');
        return;
    }

    // Request location with high accuracy
    navigator.geolocation.getCurrentPosition(
        showUserLocation,
        handleLocationError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

// Show user location on map
function showUserLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    const t = translations[currentLanguage];
    
    // Remove existing user location marker if it exists
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
    }
    
    // Create custom icon for user location (blue dot)
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-location-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Add user location marker
    userLocationMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<strong>${t.myLocation}</strong><br>דיוק: ${Math.round(accuracy)}מ`);
    
    // Add accuracy circle
    L.circle([lat, lng], {
        radius: accuracy,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        weight: 1
    }).addTo(map);
    
    // Remove loading state from button
    if (locationBtn) {
        locationBtn.classList.remove('loading');
        locationBtn.disabled = false;
    }
    
    console.log(`User location: ${lat}, ${lng} (accuracy: ${accuracy}m)`);
}

// Handle geolocation errors
function handleLocationError(error) {
    const t = translations[currentLanguage];
    let message = t.locationError;
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = t.locationPermissionDenied;
            console.log('Location permission denied');
            break;
        case error.POSITION_UNAVAILABLE:
            message = t.locationError;
            console.log('Location information unavailable');
            break;
        case error.TIMEOUT:
            message = t.locationError;
            console.log('Location request timeout');
            break;
        default:
            message = t.locationError;
            console.log('Unknown location error');
            break;
    }
    
    // Remove loading state from button
    if (locationBtn) {
        locationBtn.classList.remove('loading');
        locationBtn.disabled = false;
    }
}

// Handle location button click
function handleLocationButtonClick() {
    if (!locationBtn) return;
    
    // Add loading state
    locationBtn.classList.add('loading');
    locationBtn.disabled = true;
    
    // Request location
    requestUserLocation();
    
    // Remove loading state after timeout if no response
    setTimeout(() => {
        if (locationBtn) {
            locationBtn.classList.remove('loading');
            locationBtn.disabled = false;
        }
    }, 10000);
}

// Choose a base tile layer depending on language (Hebrew prefers local names)
function setBaseLayer() {
    if (!map) return;
    // Remove existing base layer if present
    if (baseLayer) {
        map.removeLayer(baseLayer);
    }
    if (currentLanguage === 'he') {
        // Standard OpenStreetMap raster tiles usually display local (Hebrew) names inside Israel
        // (If you want even more Hebrew coverage you can explore Israeli community tiles.)
        baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
        console.log('🗺️ Base layer set: OpenStreetMap (expected Hebrew labels)');
    } else {
        // English-friendly clean light style
        baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            maxZoom: 19
        });
        console.log('🗺️ Base layer set: CARTO light (English-oriented)');
    }
    baseLayer.addTo(map);
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
            // Prefer explicit coordinates if available
            let coordinates = null;
            if (place.lat != null && place.lng != null) {
                coordinates = [place.lat, place.lng];
            } else {
                coordinates = getApproximateCoordinates(place.address);
            }
            
            if (coordinates) {
                console.log(`📌 Creating marker at:`, coordinates);
                const marker = L.marker(coordinates, {
                    icon: L.divIcon({
                        className: 'custom-vegan-pin',
                        html: `<div class="pin-shell"><span class="pin-emoji">🌱</span></div>`,
                        iconSize: [26, 26],
                        iconAnchor: [13, 26],
                        popupAnchor: [0, -24]
                    })
                }).addTo(map);
                
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
    const normKey = normalizeFullAddress(address);
    if (preciseOverrides[normKey]) {
        return preciseOverrides[normKey];
    }
    // First try improved Tel Aviv specific logic
    const telAvivImproved = getImprovedTelAvivCoordinates(address);
    if (telAvivImproved) {
        return telAvivImproved;
    }
    
    // First check for specific Tel Aviv street addresses with more accurate coordinates
    const telAvivStreets = {
        'פרישמן 54': [32.0867, 34.7749], // Beach area
        'דיזינגוף 130': [32.0842, 34.7748], // Central Dizengoff
        'פלורנטין 40': [32.0577, 34.7667], // Florentin neighborhood
        'המלך ג\'ורג 32': [32.0667, 34.7667], // King George area
        'אחד העם 11': [32.0667, 34.7725], // Central Tel Aviv
        'לבונטין 7': [32.0577, 34.7667], // Levontin area
        'אבן גבירול 88': [32.0808, 34.7801], // Ibn Gvirol
        'אבן גבירול 129': [32.0842, 34.7801], // Ibn Gvirol north
        'אלנבי 78': [32.0642, 34.7692], // Allenby area
        'ירמיהו 17': [32.0892, 34.7825], // North Tel Aviv
        'אחד העם 8': [32.0667, 34.7725], // Central Tel Aviv
        'דרך שלמה 3': [32.0667, 34.7667], // Central area
        'החלוצים 8': [32.0808, 34.7875], // North Tel Aviv
        'צ\'לנוב 27': [32.0692, 34.7667], // Central area
        'דיזינגוף 140': [32.0842, 34.7748], // Central Dizengoff
        'שדרות וושינגטון 30': [32.0642, 34.7692], // Washington area
        'המסגר 38': [32.0667, 34.7725], // Central Tel Aviv
        'דיזינגוף 50': [32.0808, 34.7748] // Central Dizengoff
    };
    
    // Check for specific Tel Aviv streets first
    for (const [street, coords] of Object.entries(telAvivStreets)) {
        if (address.includes(street)) {
            console.log(`🎯 Found specific Tel Aviv street: ${street}, coords: ${coords}`);
            return coords;
        }
    }
    
    // Check for other specific city addresses
    const specificAddresses = {
        'הרצל 173, רחובות': [31.8947, 34.8134],
        'כצנלסון 49, גבעתיים': [32.0719, 34.8106],
        'ויצמן 140, כפר סבא': [32.1747, 34.9049],
        'נבטים 28, כרכור': [32.5000, 34.9333],
        'המייסדים 26, פרדס חנה': [32.4700, 34.9583],
        'דרך המצפה 5, קציר': [32.4500, 35.0167],
        'המייסדים 41, זכרון יעקב': [32.5700, 34.9383],
        'נתנזון 22, חיפה': [32.7940, 34.9896],
        'נחל צינה 41, מצפה רמון': [30.6094, 34.8017],
        'דרך העצמאות 74, בנימינה': [32.5217, 34.9600],
        'שדרות מוריה 105, חיפה': [32.7940, 34.9896],
        'עמל 1, רעננה': [32.1847, 34.8783],
        'ביאליק 76, רמת גן': [32.0719, 34.8225],
        'כצנלסון 14, כפר סבא': [32.1747, 34.9049],
        'הנחשול 30, ראשון לציון': [31.9730, 34.7925]
    };
    
    // Check for specific addresses
    for (const [fullAddress, coords] of Object.entries(specificAddresses)) {
        if (address.includes(fullAddress.split(',')[0])) { // Match the street part
            console.log(`🎯 Found specific address: ${fullAddress}, coords: ${coords}`);
            return coords;
        }
    }
    
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
        'ניר יפה': [32.5333, 34.9833],
        'רחובות': [31.8947, 34.8134],
        'גבעתיים': [32.0719, 34.8106],
        'כרכור': [32.5000, 34.9333],
        'פרדס חנה': [32.4700, 34.9583],
        'קציר': [32.4500, 35.0167],
        'זכרון יעקב': [32.5700, 34.9383],
        'אשדות יעקב מאוחד': [32.6833, 35.6167],
        'מצפה רמון': [30.6094, 34.8017],
        'בנימינה': [32.5217, 34.9600],
        'רעננה': [32.1847, 34.8783],
        'רמת גן': [32.0719, 34.8225],
        'ראשון לציון': [31.9730, 34.7925]
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

// ===== Improved Tel Aviv Geocoding =====
// We attempt to place Tel Aviv addresses more accurately by modeling major streets with an origin point,
// a bearing (approximate direction of the street), and generating an offset based on the street number.
// This is still approximate but removes random jitter and gives consistent, more plausible positions.

const telAvivStreetModels = (() => {
    // Central reference points (rough midpoints of streets) with approximate bearings (degrees from East counter‑clockwise)
    // bearing 0 = East-West (increasing lng), 90 = North-South (increasing lat)
    return [
        { names: ['דיזינגוף','dizengoff','דיזנגוף'], lat:32.0809, lng:34.7736, bearing: 5, base:1 },
        { names: ['אבן גבירול','ibn gvirol','אבן גבריאל','ibn gabirol'], lat:32.0799, lng:34.7813, bearing: 1, base:1 },
        { names: ['אלנבי','allenby','אלנבי'], lat:32.0676, lng:34.7702, bearing: -5, base:1 },
        { names: ['המלך ג׳ורג','המלך ג\'ורג','king george','מלך ג׳ורג'], lat:32.0707, lng:34.7741, bearing: -10, base:1 },
        { names: ['רוטשילד','rothschild'], lat:32.0648, lng:34.7767, bearing: -15, base:1 },
        { names: ['פרישמן','frishman'], lat:32.0803, lng:34.7728, bearing: -85, base:1 },
        { names: ['בוגרשוב','bograshov'], lat:32.0773, lng:34.7705, bearing: -85, base:1 },
        { names: ['בן יהודה','ben yehuda'], lat:32.0815, lng:34.7682, bearing: 4, base:1 },
        { names: ['שינקין','sheinkin','שינקיין'], lat:32.0685, lng:34.7725, bearing: -80, base:1 },
        { names: ['ירמיהו','yirmiyahu'], lat:32.0900, lng:34.7821, bearing: 0, base:1 },
        { names: ['באזל','basel'], lat:32.0895, lng:34.7779, bearing: 100, base:1 },
        { names: ['לוונטין','levontin','לבונטין'], lat:32.0615, lng:34.7754, bearing: -70, base:1 },
        { names: ['נחלת בנימין','nahalat benyamin','nahalat benjamin'], lat:32.0662, lng:34.7706, bearing: -10, base:1 },
        { names: ['הארבעה','haarbaa','ha\'arbaa'], lat:32.0717, lng:34.7869, bearing: 90, base:1 },
        { names: ['ארלוזורוב','arlozorov'], lat:32.0884, lng:34.7827, bearing: 90, base:1 },
        { names: ['וושינגטון','washington'], lat:32.0568, lng:34.7702, bearing: 100, base:1 },
        { names: ['המסגר','hamasguer','המסגר'], lat:32.0617, lng:34.7811, bearing: 15, base:1 }
    ];
})();

// Higher precision per-street segment interpolation (subset of key arteries)
// Each segment: street canonical name array, minHouse, maxHouse, start(lat,lng), end(lat,lng)
// We map the house number proportionally along the segment line.
const telAvivStreetSegments = [
    { names:['אבן גבירול','ibn gvirol'], min:1, max:200, start:[32.0719,34.7799], end:[32.0942,34.7825] },
    { names:['דיזינגוף','dizengoff','דיזנגוף'], min:1, max:300, start:[32.0639,34.7710], end:[32.0960,34.7749] },
    { names:['אלנבי','allenby'], min:1, max:150, start:[32.0614,34.7700], end:[32.0729,34.7677] },
    { names:['רוטשילד','rothschild'], min:1, max:200, start:[32.0590,34.7721], end:[32.0738,34.7802] },
    { names:['בן יהודה','ben yehuda'], min:1, max:250, start:[32.0667,34.7660], end:[32.1000,34.7691] },
    { names:['פרישמן','frishman'], min:1, max:120, start:[32.0803,34.7681], end:[32.0806,34.7769] },
    { names:['בוגרשוב','bograshov'], min:1, max:120, start:[32.0773,34.7679], end:[32.0775,34.7758] }
];

function normalizeStreet(str) {
    return str
        .replace(/["׳'’]/g,'')
        .replace(/\s+/g,' ')
        .trim()
        .toLowerCase();
}

function extractStreetNumber(address) {
    // Match patterns like "דיזינגוף 120" or "דיזינגוף 120, תל אביב"
    // Hebrew letters, spaces, apostrophes, then number
    const streetNumberRegex = /([\u0590-\u05FFa-zA-Z\s"׳'’\.\-]+?)\s+(\d{1,4})/;
    const match = address.match(streetNumberRegex);
    if (match) {
        return { street: match[1].trim(), number: parseInt(match[2], 10) };
    }
    return null;
}

function getImprovedTelAvivCoordinates(address) {
    if (!address) return null;
    // Detect Tel Aviv (various forms) in address
    const telAvivPatterns = ['תל אביב','tel aviv'];
    const lower = address.toLowerCase();
    if (!telAvivPatterns.some(p => lower.includes(p))) return null;

    // Try extracting street + number
    const sn = extractStreetNumber(address);
    if (!sn) return null; // fallback to legacy logic
    const normStreet = normalizeStreet(sn.street);

    const number = sn.number;
    // 1) Try segment interpolation first
    for (const seg of telAvivStreetSegments) {
        if (seg.names.some(n => normStreet.includes(normalizeStreet(n)))) {
            if (number >= seg.min && number <= seg.max) {
                const ratio = (number - seg.min) / (seg.max - seg.min);
                const lat = seg.start[0] + (seg.end[0] - seg.start[0]) * ratio;
                const lng = seg.start[1] + (seg.end[1] - seg.start[1]) * ratio;
                const pos = [lat, lng];
                console.debug('ℹ️ TA segment result', { address, pos });
                return pos;
            }
        }
    }

    // 2) Fallback to older bearing model (coarser)
    let model = null;
    for (const m of telAvivStreetModels) {
        if (m.names.some(n => normStreet.includes(normalizeStreet(n)))) { model = m; break; }
    }
    if (!model) return null;
    if (number > 800 || number < 1) return null;
    const diff = (number - model.base);
    const stepDeg = 0.000012;
    const distance = diff * stepDeg;
    const rad = model.bearing * Math.PI / 180;
    const dx = Math.cos(rad) * distance;
    const dy = Math.sin(rad) * distance;
    const scaleLon = Math.cos(model.lat * Math.PI / 180);
    const final = [model.lat + dy, model.lng + dx / (scaleLon || 1)];
    console.debug('ℹ️ TA bearing model result', { address, final });
    return final;
}

function normalizeFullAddress(address) {
    return address
        .replace(/["'׳’]/g,'')
        .replace(/\s+/g,' ') 
        .trim()
        .toLowerCase();
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
    const header = cityGroup.querySelector('.city-header');
    
    if (cityGroup.classList.contains('expanded')) {
        cityGroup.classList.remove('expanded');
        cityGroup.classList.add('collapsed');
        toggleIcon.textContent = '+';
        if (header) header.setAttribute('aria-expanded', 'false');
    } else {
        cityGroup.classList.remove('collapsed');
        cityGroup.classList.add('expanded');
        toggleIcon.textContent = '−';
        if (header) header.setAttribute('aria-expanded', 'true');
    }
}

// Toggle individual region expand/collapse
function toggleRegion(regionId) {
    const regionElement = document.getElementById(regionId);
    const regionGroup = regionElement.parentElement;
    const toggleIcon = regionGroup.querySelector('.toggle-icon');
    const header = regionGroup.querySelector('.region-header');
    
    if (regionGroup.classList.contains('expanded')) {
        regionGroup.classList.remove('expanded');
        regionGroup.classList.add('collapsed');
        toggleIcon.textContent = '+';
        if (header) header.setAttribute('aria-expanded', 'false');
        
        // Also collapse all cities within this region
        const cityGroups = regionElement.querySelectorAll('.city-group');
        cityGroups.forEach(cityGroup => {
            cityGroup.classList.remove('expanded');
            cityGroup.classList.add('collapsed');
            const cityToggleIcon = cityGroup.querySelector('.toggle-icon');
            if (cityToggleIcon) {
                cityToggleIcon.textContent = '+';
            }
            const cityHeader = cityGroup.querySelector('.city-header');
            if (cityHeader) cityHeader.setAttribute('aria-expanded', 'false');
        });
    } else {
        regionGroup.classList.remove('collapsed');
        regionGroup.classList.add('expanded');
        toggleIcon.textContent = '−';
        if (header) header.setAttribute('aria-expanded', 'true');
        
        // Also expand all cities within this region if allExpanded is true
        if (allExpanded) {
            const cityGroups = regionElement.querySelectorAll('.city-group');
            cityGroups.forEach(cityGroup => {
                cityGroup.classList.remove('collapsed');
                cityGroup.classList.add('expanded');
                const cityToggleIcon = cityGroup.querySelector('.toggle-icon');
                if (cityToggleIcon) {
                    cityToggleIcon.textContent = '−';
                }
                const cityHeader = cityGroup.querySelector('.city-header');
                if (cityHeader) cityHeader.setAttribute('aria-expanded', 'true');
            });
        }
    }
}

// Make functions globally available
window.toggleRegion = toggleRegion;
window.toggleCity = toggleCity;

// Toggle all categories expand/collapse
function toggleAllCategories() {
    const t = translations[currentLanguage];
    const regionGroups = document.querySelectorAll('.region-group');
    const cityGroups = document.querySelectorAll('.city-group');
    
    allExpanded = !allExpanded;
    
    // Toggle all regions
    regionGroups.forEach(group => {
        const toggleIcon = group.querySelector('.toggle-icon');
            const header = group.querySelector('.region-header');
        
        if (allExpanded) {
            group.classList.remove('collapsed');
            group.classList.add('expanded');
                if (toggleIcon) toggleIcon.textContent = '−';
                if (header) header.setAttribute('aria-expanded', 'true');
        } else {
            group.classList.remove('expanded');
            group.classList.add('collapsed');
                if (toggleIcon) toggleIcon.textContent = '+';
                if (header) header.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Toggle all cities
    cityGroups.forEach(group => {
            const toggleIcon = group.querySelector('.toggle-icon');
            const header = group.querySelector('.city-header');
        
        if (allExpanded) {
            group.classList.remove('collapsed');
            group.classList.add('expanded');
                if (toggleIcon) toggleIcon.textContent = '−';
                if (header) header.setAttribute('aria-expanded', 'true');
        } else {
            group.classList.remove('expanded');
            group.classList.add('collapsed');
                if (toggleIcon) toggleIcon.textContent = '+';
                if (header) header.setAttribute('aria-expanded', 'false');
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
                },
                // Basic opening hours fallback to a generic daily specification if provided
                "openingHours": place.hours || undefined,
                "openingHoursSpecification": place.schedule ? buildOpeningHoursSpecification(place.schedule) : (place.hours ? undefined : undefined)
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

// Test EmailJS configuration
function testEmailJSConfig() {
    // Verify EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS library not loaded');
        return;
    }
    
    console.log('EmailJS library loaded successfully');
    console.log('Service ID: service_r8kfvfn');
    console.log('Template ID: template_gr0l29r');
    console.log('Public Key: ZS8tiM0rUEIcKH_3m');
    
    // You can uncomment the next line to test sending an actual email
    // sendTestEmail();
}

// Test email sending (uncomment to use)
function sendTestEmail() {
    const testParams = {
        place_name: 'Test Restaurant',
        place_address: 'Test Address, Tel Aviv',
        place_link: 'https://test-restaurant.com'
    };
    
    console.log('Sending test email with params:', testParams);
    
    emailjs.send('service_r8kfvfn', 'template_gr0l29r', testParams)
        .then(function(response) {
            console.log('✅ Test email sent successfully!', response);
            alert('Test email sent successfully!');
        })
        .catch(function(error) {
            console.error('❌ Test email failed:', error);
            console.error('Error status:', error.status);
            console.error('Error text:', error.text);
            alert('Test email failed: ' + error.text);
        });
}

// Developer helper: list places lacking explicit coordinates
window.listPlacesNeedingCoords = function() {
    const needing = places.filter(p => p.lat == null || p.lng == null).map(p => p.name + ' | ' + p.address);
    console.table(needing);
    console.log(`${needing.length} places still rely on heuristic geocoding.`);
};
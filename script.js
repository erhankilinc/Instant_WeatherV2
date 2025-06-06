/**
 * WeatherGrid - Interface météorologique révolutionnaire
 * Layout: Bento Box + Timeline
 */

// Configuration de l'API
const API_CONFIG = {
    TOKEN: '40cb912aff2f7792bb9ecd409d50ed4e2dca5e462e8e7ae2643237298e6198be',
    GEO_API: 'https://geo.api.gouv.fr/communes',
    METEO_API: 'https://api.meteo-concept.com/api/forecast/daily'
};

// Éléments DOM 
const elements = {
    form: document.getElementById('weather-form'),
    codePostalInput: document.getElementById('code-postal'),
    communeSelect: document.getElementById('commune-select'),
    daysSlider: document.getElementById('days-slider'),
    daysValue: document.getElementById('days-value'),
    submitBtn: document.getElementById('submit-btn'),
    checkboxes: document.querySelectorAll('input[name="options"]'),
    
    // Nouveaux éléments pour le layout Bento
    statusBar: document.getElementById('status-bar'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    weatherBento: document.getElementById('weather-bento'),
    
    // Carte météo principale
    currentTemp: document.getElementById('current-temp'),
    currentCondition: document.getElementById('current-condition'),
    tempMin: document.getElementById('temp-min'),
    tempMax: document.getElementById('temp-max'),
    rainProb: document.getElementById('rain-prob'),
    sunHours: document.getElementById('sun-hours'),
    
    // Carte de localisation
    locationTitle: document.getElementById('location-title'),
    locationCoords: document.getElementById('location-coords'),
    locationMap: document.getElementById('location-map'),
    
    // Cartes métriques
    windCard: document.getElementById('wind-card'),
    windSpeed: document.getElementById('wind-speed'),
    windDirection: document.getElementById('wind-direction'),
    rainCard: document.getElementById('rain-card'),
    rainAmount: document.getElementById('rain-amount'),
    coordsCard: document.getElementById('coords-card'),
    coordinatesDisplay: document.getElementById('coordinates-display'),
    
    // Cartes de prévisions
    forecastCards: document.getElementById('forecast-cards'),
    forecastGrid: document.getElementById('forecast-grid'),
    
    darkModeBtn: document.getElementById('dark-mode-btn')
};

// Variables globales
let currentCommunes = [];
let currentCityData = null;
let currentMap = null;

/**
 * Initialisation de l'application
 */
function initApp() {
    setupEventListeners();
    initDarkMode();
    updateStatusBar('Prêt pour l\'analyse météorologique');
}

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.codePostalInput.addEventListener('input', handleCodePostalInput);
    elements.communeSelect.addEventListener('change', handleCommuneChange);
    elements.daysSlider.addEventListener('input', updateDaysValue);
    elements.darkModeBtn.addEventListener('click', toggleDarkMode);
    
    // Redimensionner la carte quand la fenêtre change de taille
    window.addEventListener('resize', () => {
        if (currentMap) {
            setTimeout(() => {
                currentMap.invalidateSize();
            }, 100);
        }
    });
}

/**
 * Mise à jour de la barre de statut
 */
function updateStatusBar(message) {
    elements.statusBar.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
}

/**
 * Gestion de la saisie du code postal
 */
async function handleCodePostalInput() {
    const codePostal = elements.codePostalInput.value.trim();
    
    // Reset les sélections et les messages d'erreur
    elements.communeSelect.innerHTML = '<option value="">Sélectionnez...</option>';
    elements.communeSelect.disabled = true;
    elements.submitBtn.disabled = true;
    hideError();

    // Valider le format du code postal (5 chiffres)
    if (!/^\d{5}$/.test(codePostal)) {
        if (codePostal.length > 0) {
            updateStatusBar('Code postal invalide');
            showError('Format: 5 chiffres requis');
        } else {
            updateStatusBar('Prêt pour l\'analyse météorologique');
        }
        return;
    }

    try {
        updateStatusBar('Recherche des communes...');
        showLoading(true);
        // Appel à l'API pour récupérer les communes
        const communes = await fetchCommunesByCodePostal(codePostal);
        displayCommunes(communes);
        updateStatusBar(`${communes.length} commune(s) trouvée(s)`);
    } catch (error) {
        updateStatusBar('Erreur de recherche');
        showError('Erreur lors de la recherche des communes');
    } finally {
        showLoading(false);
    }
}

/**
 * Récupération des communes par code postal
 */
async function fetchCommunesByCodePostal(codePostal) {
    const response = await fetch(`${API_CONFIG.GEO_API}?codePostal=${codePostal}&format=geojson&geometry=centre`);
    if (!response.ok) throw new Error("Erreur réseau");
    
    const geoJsonData = await response.json();
    // Mapper les données GeoJSON pour extraire les informations pertinentes des communes
    const communes = geoJsonData.features?.map(feature => ({
        code: feature.properties.code,
        nom: feature.properties.nom,
        codesPostaux: feature.properties.codesPostaux,
        centre: feature.geometry
    })) || [];
    
    return communes;
}

/**
 * Affichage des communes dans le select
 */
function displayCommunes(communes) {
    currentCommunes = communes;
    
    if (communes.length === 0) {
        showError("Aucune commune trouvée");
        return;
    }

    // Ajouter chaque commune comme option dans le sélecteur
    communes.forEach(commune => {
        const option = document.createElement("option");
        option.value = commune.code;
        option.textContent = commune.nom;
        elements.communeSelect.appendChild(option);
    });

    elements.communeSelect.disabled = false;
}

/**
 * Gestion du changement de commune
 */
function handleCommuneChange() {
    const selectedCode = elements.communeSelect.value;
    elements.submitBtn.disabled = !selectedCode; // Activer le bouton de soumission si une commune est sélectionnée
    
    if (selectedCode) {
        currentCityData = currentCommunes.find(c => c.code === selectedCode);
        updateStatusBar(`Commune sélectionnée: ${currentCityData.nom}`);
    }
}

/**
 * Gestion de la soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Empêcher le rechargement de la page
    
    const selectedCommune = elements.communeSelect.value;
    const daysCount = parseInt(elements.daysSlider.value);
    const selectedOptions = getSelectedOptions();
    
    if (!selectedCommune) {
        showError('Veuillez sélectionner une commune');
        return;
    }

    try {
        showLoading(true);
        hideError();
        updateStatusBar('Récupération des données météorologiques...');
        
        // Récupérer les données météo pour la commune sélectionnée
        const meteoData = await fetchMeteoByCommune(selectedCommune, daysCount);
        updateStatusBar('Affichage des résultats');
        
        displayWeatherData(currentCityData, meteoData.forecasts, selectedOptions);
        
    } catch (error) {
        console.error('Erreur:', error);
        updateStatusBar('Erreur lors de la récupération');
        showError(error.message || 'Erreur lors de la récupération des données météo');
    } finally {
        showLoading(false);
    }
}

/**
 * Récupération des données météo
 */
async function fetchMeteoByCommune(selectedCommune, numberOfDays = 1) {
    const response = await fetch(
        `${API_CONFIG.METEO_API}?token=${API_CONFIG.TOKEN}&insee=${selectedCommune}`
    );
    
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('Token API invalide ou expiré');
        }
        throw new Error(`Erreur API météo: ${response.status}`);
    }

    const data = await response.json();
    
    // Gérer les différentes structures de réponse de l'API
    let forecasts = null;
    if (data.forecast && Array.isArray(data.forecast)) {
        forecasts = data.forecast;
    } else if (data.forecasts && Array.isArray(data.forecasts)) {
        forecasts = data.forecasts;
    } else if (Array.isArray(data)) {
        forecasts = data;
    }
    
    if (!forecasts || forecasts.length === 0) {
        throw new Error("Aucune donnée météorologique disponible");
    }

    return {
        city: data.city || { name: 'Commune sélectionnée' },
        forecasts: forecasts.slice(0, numberOfDays) // Limiter le nombre de jours de prévisions
    };
}

/**
 * Affichage des données météo dans le layout Bento
 */
function displayWeatherData(cityData, forecasts, selectedOptions) {
    const todayWeather = forecasts[0]; // La première prévision est pour aujourd'hui
    
    // Affichage de la carte météo principale
    displayMainWeatherCard(todayWeather);
    
    // Affichage de la carte de localisation
    displayLocationCard(cityData, selectedOptions);
    
    // Affichage des cartes métriques optionnelles en fonction des sélections
    displayMetricCards(todayWeather, selectedOptions);
    
    // Affichage des cartes de prévisions
    displayForecastCards(forecasts);
    
    // Afficher la grille Bento
    elements.weatherBento.style.display = 'grid';
    elements.forecastCards.style.display = 'block';
    
    // Redimensionner la carte après affichage pour s'assurer qu'elle s'affiche correctement
    setTimeout(() => {
        if (currentMap) {
            currentMap.invalidateSize();
        }
    }, 300);
    
    updateStatusBar(`Données affichées pour ${cityData.nom}`);
}

/**
 * Affichage de la carte météo principale
 */
function displayMainWeatherCard(weather) {
    elements.currentTemp.textContent = `${Math.round(weather.tmax)}°`;
    elements.currentCondition.textContent = getWeatherDescription(weather.weather);
    elements.tempMin.textContent = `${Math.round(weather.tmin)}°`;
    elements.tempMax.textContent = `${Math.round(weather.tmax)}°`;
    elements.rainProb.textContent = `${weather.probarain || 0}%`;
    elements.sunHours.textContent = `${weather.sun_hours || 0}h`;
}

/**
 * Affichage de la carte de localisation
 */
function displayLocationCard(cityData, selectedOptions) {
    elements.locationTitle.textContent = cityData.nom;
    
    // Coordonnées
    let latitude = null;
    let longitude = null;
    
    if (cityData.centre && cityData.centre.coordinates) {
        longitude = cityData.centre.coordinates[0];
        latitude = cityData.centre.coordinates[1];
        elements.locationCoords.textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
    }
    
    // Initialiser la carte si les coordonnées sont disponibles
    if (latitude && longitude) {
        initLocationMap(latitude, longitude, cityData.nom);
    }
}

/**
 * Initialisation de la carte de localisation
 */
function initLocationMap(latitude, longitude, cityName) {
    // Nettoyer la carte existante pour éviter les problèmes de superposition
    if (currentMap) {
        currentMap.remove();
        currentMap = null;
    }
    
    // Attendre que le conteneur soit visible et ait une taille définie
    setTimeout(() => {
        try {
            // Créer la nouvelle carte Leaflet
            currentMap = L.map('location-map', {
                center: [latitude, longitude],
                zoom: 13,
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                dragging: true
            });

            // Ajouter les tuiles OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors'
            }).addTo(currentMap);

            // Ajouter un marqueur à la position de la ville
            L.marker([latitude, longitude])
                .addTo(currentMap)
                .bindPopup(`<strong>${cityName}</strong><br>${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
                .openPopup();
            
            // Forcer le redimensionnement de l carte après son affichage
            setTimeout(() => {
                if (currentMap) {
                    currentMap.invalidateSize();
                }
            }, 100);
            
            console.log('Carte initialisée avec succès');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);
        }
    }, 200);
}

/**
 * Affichage des carte optionnelles
 */
function displayMetricCards(weather, selectedOptions) {
    console.log('Options sélectionnées:', selectedOptions);
    console.log('Données météo pour les métriques:', weather);
    
    // Gérer l'affichage de la carte Vent
    if (selectedOptions.includes('wind') || selectedOptions.includes('wind-direction')) {
        elements.windSpeed.textContent = `${Math.round(weather.wind10m || 0)} km/h`;
        
        // Vérifier toutes les propriétés possibles pour la direction du vent de l'API
        let windDirection = weather.dirwind10m || weather.dirwind || weather.wind_direction || weather.dir_wind;
        
        if (windDirection !== undefined && windDirection !== null && windDirection !== '') {
            const direction = getWindDirection(windDirection);
            elements.windDirection.textContent = `${direction} (${windDirection}°)`;
            console.log(`Direction du vent trouvée: ${windDirection}° = ${direction}`);
        } else {
            elements.windDirection.textContent = 'Direction non disponible';
            console.log('Aucune donnée de direction du vent trouvée');
            console.log('Propriétés disponibles:', Object.keys(weather));
        }
        
        elements.windCard.style.display = 'block';
    } else {
        elements.windCard.style.display = 'none'; // Masquer la carte si non sélectionnée
    }
    
    // Gérer l'affichage de la carte Pluie
    if (selectedOptions.includes('rain')) {
        elements.rainAmount.textContent = `${weather.rr10 || 0} mm`;
        elements.rainCard.style.display = 'block';
    } else {
        elements.rainCard.style.display = 'none'; // Masquer la carte si non sélectionnée
    }
    
    // Gérer l'affichage de la carte Coordonnées
    if (selectedOptions.includes('latitude') || selectedOptions.includes('longitude')) {
        let coordText = '';
        if (currentCityData.centre && currentCityData.centre.coordinates) {
            const lat = currentCityData.centre.coordinates[1];
            const lon = currentCityData.centre.coordinates[0];
            
            if (selectedOptions.includes('latitude') && selectedOptions.includes('longitude')) {
                coordText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            } else if (selectedOptions.includes('latitude')) {
                coordText = `${lat.toFixed(4)}° N`;
            } else {
                coordText = `${lon.toFixed(4)}° E`;
            }
        }
        elements.coordinatesDisplay.textContent = coordText;
        elements.coordsCard.style.display = 'block';
    } else {
        elements.coordsCard.style.display = 'none'; // Masquer la carte si non sélectionnée
    }
}

/**
 * Affichage des cartes de prévisions
 */
function displayForecastCards(forecasts) {
    elements.forecastGrid.innerHTML = ''; // Nettoyer les prévisions précédentes
    
    // Créer et ajouter une carte pour chaque jour de prévision
    forecasts.forEach((forecast, index) => {
        const forecastCard = createForecastCard(forecast, index);
        elements.forecastGrid.appendChild(forecastCard);
    });
}

/**
 * Création d'une carte de prévision
 */
function createForecastCard(forecast, index) {
    const card = document.createElement('div');
    card.className = index === 0 ? 'forecast-card current-day' : 'forecast-card'; // Style spécial pour aujourd'hui
    
    const date = new Date(forecast.datetime);
    const dateStr = index === 0 ? "Aujourd'hui" : formatDate(date);
    const icon = getWeatherIcon(forecast.weather);
    const description = getWeatherDescription(forecast.weather);
    
    // Debug pour voir les données disponibles
    console.log('Données météo pour', dateStr, ':', forecast);
    console.log('Propriétés disponibles:', Object.keys(forecast));
    
    // Détails supplémentaires avec les données disponibles
    const rainProb = forecast.probarain || 0;
    const sunHours = forecast.sun_hours || 0;
    const windSpeed = Math.round(forecast.wind10m || 0);
    const rainAmount = forecast.rr10 || 0;
    
    // Direction du vent - vérifier plusieurs propriétés possibles de l'API
    let windDisplay = `${windSpeed} km/h`;
    let windDirection = forecast.dirwind10m || forecast.dirwind || forecast.wind_direction || forecast.dir_wind;
    
    if (windDirection !== undefined && windDirection !== null && windDirection !== '') {
        const direction = getWindDirection(windDirection);
        windDisplay = `${windSpeed} km/h ${direction}`;
        console.log(`Direction du vent pour ${dateStr}: ${windDirection}° = ${direction}`);
    } else {
        console.log(`Pas de données de direction du vent pour ${dateStr}`);
    }
    
    card.innerHTML = `
        ${index === 0 ? '<div class="current-day-badge">Aujourd\'hui</div>' : ''}
        
        <div class="forecast-card-header">
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-icon">
                <i class="${icon}"></i>
            </div>
        </div>
        
        <div class="forecast-temp-main">
            <div class="forecast-temp-max">${Math.round(forecast.tmax)}°</div>
            <div class="forecast-temp-min">${Math.round(forecast.tmin)}°</div>
        </div>
        
        <div class="forecast-condition">${description}</div>
        
        <div class="forecast-details">
            <div class="forecast-detail">
                <div class="forecast-detail-label">Pluie</div>
                <div class="forecast-detail-value">${rainProb}%</div>
            </div>
            <div class="forecast-detail">
                <div class="forecast-detail-label">Soleil</div>
                <div class="forecast-detail-value">${sunHours}h</div>
            </div>
            <div class="forecast-detail">
                <div class="forecast-detail-label">Vent</div>
                <div class="forecast-detail-value">${windDisplay}</div>
            </div>
            <div class="forecast-detail">
                <div class="forecast-detail-label">Cumul</div>
                <div class="forecast-detail-value">${rainAmount} mm</div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Obtention de l'icône météorologique en fonction du code météo
 */
function getWeatherIcon(weatherCode) {
    const iconMap = {
        0: 'fas fa-sun', // Ensoleillé
        1: 'fas fa-cloud-sun', // Peu nuageux
        2: 'fas fa-cloud-sun', // Ciel voilé
        3: 'fas fa-cloud', // Nuageux
        4: 'fas fa-cloud', // Très nuageux
        5: 'fas fa-cloud', // Couvert
        6: 'fas fa-cloud-rain', // Bruine
        7: 'fas fa-cloud-rain', // Bruine verglaçante
        10: 'fas fa-cloud-rain', // Pluie faible
        11: 'fas fa-cloud-rain', // Pluie modérée
        12: 'fas fa-cloud-rain', // Pluie forte
        13: 'fas fa-cloud-rain', // Pluie verglaçante
        16: 'fas fa-snowflake', // Neige faible
        20: 'fas fa-cloud-bolt', // Averses
        30: 'fas fa-cloud-bolt', // Orage
        40: 'fas fa-smog', // Brouillard
        100: 'fas fa-moon', // Clair (nuit)
        101: 'fas fa-cloud-moon' // Peu nuageux (nuit)
    };
    
    return iconMap[weatherCode] || 'fas fa-question'; // Icône par défaut si le code est inconnu
}

/**
 * Obtention de la description météorologique en fonction du code météo
 */
function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Ensoleillé',
        1: 'Peu nuageux',
        2: 'Ciel voilé',
        3: 'Nuageux',
        4: 'Très nuageux',
        5: 'Couvert',
        6: 'Bruine',
        7: 'Bruine verglaçante',
        10: 'Pluie faible',
        11: 'Pluie modérée',
        12: 'Pluie forte',
        13: 'Pluie verglaçante',
        16: 'Neige faible',
        20: 'Averses',
        30: 'Orage',
        40: 'Brouillard',
        100: 'Clair',
        101: 'Peu nuageux'
    };
    
    return descriptions[weatherCode] || 'Conditions inconnues'; // Description par défaut
}

/**
 * Conversion de la direction du vent (degrés en points cardinaux)
 */
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    const direction = directions[index];
    console.log(`Conversion: ${degrees}° -> index ${index} -> ${direction}`);
    return direction;
}

/**
 * Formatage de la date en un format lisible (ex: "lundi 3 juin")
 */
function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Récupération des options de checkbox sélectionnées
 */
function getSelectedOptions() {
    return Array.from(elements.checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
}

/**
 * Mise à jour de la valeur affichée du slider de jours
 */
function updateDaysValue() {
    elements.daysValue.textContent = elements.daysSlider.value;
}

/**
 * Affichage/masquage de l'indicateur de chargement
 */
function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
    if (show) {
        // Masquer les résultats précédents pendant le chargement
        elements.weatherBento.style.display = 'none';
        elements.forecastCards.style.display = 'none';
    }
}

/**
 * Affichage d'un message d'erreur temporaire
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
    // Masquer les résultats en cas d'erreur
    elements.weatherBento.style.display = 'none';
    elements.forecastCards.style.display = 'none';
    
    setTimeout(hideError, 5000); // Masquer l'erreur après 5 secondes
}

/**
 * Masquage du message d'erreur
 */
function hideError() {
    elements.errorMessage.style.display = 'none';
}

/**
 * Initialisation du mode sombre en fonction des préférences de l'utilisateur ou du stockage local
 */
function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    }
}

/**
 * Basculement entre le mode clair et le mode sombre
 */
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

/**
 * Application du thème (clair ou sombre) et stockage de la préférence
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = elements.darkModeBtn.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'; // Changer l'icône du bouton
    
    updateStatusBar(`Thème ${theme === 'dark' ? 'sombre' : 'clair'} activé`);
}

/**
 * Initialisation de l'application lorsque le DOM est entièrement chargé
 */
document.addEventListener('DOMContentLoaded', initApp);
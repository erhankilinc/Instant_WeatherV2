/**
 * Instant Weather V2 - Application météorologique avec recherche par code postal
 */

// Configuration de l'API
const API_CONFIG = {
    TOKEN: '40cb912aff2f7792bb9ecd409d50ed4e2dca5e462e8e7ae2643237298e6198be',
    GEO_API: 'https://geo.api.gouv.fr/communes',
    METEO_API: 'https://api.meteo-concept.com/api/forecast/daily'
};

// Elements DOM
const elements = {
    form: document.getElementById('weather-form'),
    codePostalInput: document.getElementById('code-postal'),
    communeSelect: document.getElementById('commune-select'),
    daysSlider: document.getElementById('days-slider'),
    daysValue: document.getElementById('days-value'),
    submitBtn: document.getElementById('submit-btn'),
    checkboxes: document.querySelectorAll('input[name="options"]'),
    resultsSection: document.getElementById('results-section'),
    cityName: document.getElementById('city-name'),
    locationInfo: document.getElementById('location-info'),
    weatherGrid: document.getElementById('weather-grid'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    darkModeBtn: document.getElementById('dark-mode-btn')
};

// Variables globales
let currentCommunes = [];
let currentCityData = null;

/**
 * Initialisation de l'application
 */
function initApp() {
    setupEventListeners();
    initDarkMode();
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
}

/**
 * Gestion de la saisie du code postal
 */
async function handleCodePostalInput() {
    const codePostal = elements.codePostalInput.value.trim();
    
    // Reset des éléments
    elements.communeSelect.innerHTML = '<option value="">-- Sélectionnez une commune --</option>';
    elements.communeSelect.disabled = true;
    elements.submitBtn.disabled = true;
    hideError();

    // Validation du code postal
    if (!/^\d{5}$/.test(codePostal)) {
        if (codePostal.length > 0) {
            showError('Veuillez entrer un code postal valide (5 chiffres)');
        }
        return;
    }

    try {
        showLoading(true);
        const communes = await fetchCommunesByCodePostal(codePostal);
        displayCommunes(communes);
    } catch (error) {
        showError('Erreur lors de la recherche des communes');
    } finally {
        showLoading(false);
    }
}

/**
 * Récupération des communes par code postal
 */
async function fetchCommunesByCodePostal(codePostal) {
    const response = await fetch(`${API_CONFIG.GEO_API}?codePostal=${codePostal}`);
    if (!response.ok) throw new Error("Erreur réseau");
    return await response.json();
}

/**
 * Affichage des communes dans le select
 */
function displayCommunes(communes) {
    currentCommunes = communes;
    
    if (communes.length === 0) {
        showError("Aucune commune trouvée pour ce code postal");
        return;
    }

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
    elements.submitBtn.disabled = !selectedCode;
    
    if (selectedCode) {
        currentCityData = currentCommunes.find(c => c.code === selectedCode);
        console.log('Commune sélectionnée:', currentCityData); // Debug pour voir la structure
    }
}

/**
 * Gestion de la soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
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
        
        console.log('Début de la recherche météo...');
        const meteoData = await fetchMeteoByCommune(selectedCommune, daysCount);
        console.log('Données météo reçues:', meteoData);
        
        displayResults(currentCityData, meteoData.forecasts, selectedOptions);
        
    } catch (error) {
        console.error('Erreur complète:', error);
        const errorMessage = error.message || 'Erreur lors de la récupération des données météo';
        showError(errorMessage);
    } finally {
        showLoading(false);
    }
}

/**
 * Récupération des données météo
 */
async function fetchMeteoByCommune(selectedCommune, numberOfDays = 1) {
    try {
        console.log('Récupération météo pour INSEE:', selectedCommune, 'Jours:', numberOfDays);
        
        const response = await fetch(
            `${API_CONFIG.METEO_API}?token=${API_CONFIG.TOKEN}&insee=${selectedCommune}`
        );
        
        console.log('Statut de la réponse météo:', response.status);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token API invalide ou expiré. Vérifiez votre token Météo Concept.');
            }
            throw new Error(`Erreur API météo: ${response.status}`);
        }

        const data = await response.json();
        console.log('Données météo complètes reçues:', data);
        
        // Vérifier les différents formats possibles de réponse
        let forecasts = null;
        
        if (data.forecast && Array.isArray(data.forecast)) {
            forecasts = data.forecast;
        } else if (data.forecasts && Array.isArray(data.forecasts)) {
            forecasts = data.forecasts;
        } else if (Array.isArray(data)) {
            forecasts = data;
        } else if (data.city && data.city.forecast && Array.isArray(data.city.forecast)) {
            forecasts = data.city.forecast;
        }
        
        console.log('Forecasts extraits:', forecasts);
        
        if (!forecasts || forecasts.length === 0) {
            throw new Error("Aucune donnée météorologique disponible pour cette commune");
        }

        return {
            city: data.city || { name: 'Commune sélectionnée' },
            forecasts: forecasts.slice(0, numberOfDays)
        };
        
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération météo:', error);
        throw error;
    }
}

/**
 * Affichage des résultats
 */
function displayResults(cityData, forecast, selectedOptions) {
    elements.cityName.textContent = `Prévisions pour ${cityData.nom}`;
    displayLocationInfo(cityData, selectedOptions);
    generateWeatherCards(forecast, selectedOptions);
    
    elements.resultsSection.style.display = 'block';
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Affichage des informations de localisation
 */
function displayLocationInfo(cityData, selectedOptions) {
    let locationHTML = `<strong>${cityData.nom}</strong>`;
    
    // Ajouter le code postal si disponible
    if (cityData.codesPostaux && cityData.codesPostaux.length > 0) {
        locationHTML += ` (${cityData.codesPostaux[0]})`;
    }
    
    // Gérer les coordonnées de manière sécurisée
    if (selectedOptions.includes('latitude')) {
        let latitude = 'Non disponible';
        
        // Essayer différentes structures possibles pour la latitude
        if (cityData.centre && cityData.centre.coordinates && cityData.centre.coordinates[1]) {
            latitude = cityData.centre.coordinates[1].toFixed(4) + '°';
        } else if (cityData.latitude) {
            latitude = parseFloat(cityData.latitude).toFixed(4) + '°';
        } else if (cityData.lat) {
            latitude = parseFloat(cityData.lat).toFixed(4) + '°';
        }
        
        locationHTML += ` • Latitude: ${latitude}`;
    }
    
    if (selectedOptions.includes('longitude')) {
        let longitude = 'Non disponible';
        
        // Essayer différentes structures possibles pour la longitude
        if (cityData.centre && cityData.centre.coordinates && cityData.centre.coordinates[0]) {
            longitude = cityData.centre.coordinates[0].toFixed(4) + '°';
        } else if (cityData.longitude) {
            longitude = parseFloat(cityData.longitude).toFixed(4) + '°';
        } else if (cityData.lon) {
            longitude = parseFloat(cityData.lon).toFixed(4) + '°';
        }
        
        locationHTML += ` • Longitude: ${longitude}`;
    }
    
    elements.locationInfo.innerHTML = locationHTML;
}

/**
 * Génération des cartes météorologiques
 */
function generateWeatherCards(forecast, selectedOptions) {
    elements.weatherGrid.innerHTML = '';
    
    if (!Array.isArray(forecast)) {
        showError('Erreur dans le format des données météorologiques.');
        return;
    }
    
    forecast.forEach((day, index) => {
        const card = createWeatherCard(day, selectedOptions, index);
        if (card) {
            elements.weatherGrid.appendChild(card);
        }
    });
}

/**
 * Création d'une carte météorologique
 */
function createWeatherCard(dayData, selectedOptions, index) {
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Date formatée
    const date = new Date(dayData.datetime);
    const dateStr = formatDate(date, index);
    
    // Icône météo basée sur le code weather
    const weatherIcon = getWeatherIcon(dayData.weather);
    const weatherDescription = getWeatherDescription(dayData.weather);
    
    // Construction de la carte
    card.innerHTML = `
        <div class="weather-card-header">
            <div class="weather-card-date">${dateStr}</div>
            <div class="weather-icon">
                <i class="${weatherIcon}"></i>
            </div>
        </div>
        
        <div class="weather-temp">
            ${Math.round(dayData.tmax)}°C
        </div>
        
        <div class="weather-description">
            ${weatherDescription}
        </div>
        
        <div class="weather-details">
            <div class="weather-detail">
                <i class="fas fa-thermometer-half"></i>
                Min: ${Math.round(dayData.tmin)}°C
            </div>
            <div class="weather-detail">
                <i class="fas fa-eye"></i>
                Ensoleillement: ${dayData.sun_hours || 0}h
            </div>
            <div class="weather-detail">
                <i class="fas fa-cloud-rain"></i>
                Pluie: ${dayData.probarain || 0}%
            </div>
            ${generateAdditionalDetails(dayData, selectedOptions)}
        </div>
    `;
    
    return card;
}

/**
 * Génération des détails supplémentaires selon les options sélectionnées
 */
function generateAdditionalDetails(dayData, selectedOptions) {
    let detailsHTML = '';
    
    if (selectedOptions.includes('rain')) {
        detailsHTML += `
            <div class="weather-detail">
                <i class="fas fa-tint"></i>
                Cumul: ${dayData.rr10 || 0} mm
            </div>
        `;
    }
    
    if (selectedOptions.includes('wind')) {
        detailsHTML += `
            <div class="weather-detail">
                <i class="fas fa-wind"></i>
                Vent: ${Math.round(dayData.wind10m || 0)} km/h
            </div>
        `;
    }
    
    if (selectedOptions.includes('wind-direction')) {
        const windDirection = getWindDirection(dayData.dirwind10m || 0);
        detailsHTML += `
            <div class="weather-detail">
                <i class="fas fa-compass"></i>
                Direction: ${windDirection} (${dayData.dirwind10m || 0}°)
            </div>
        `;
    }
    
    return detailsHTML;
}

/**
 * Obtention de l'icône météorologique selon le code weather
 */
function getWeatherIcon(weatherCode) {
    const iconMap = {
        0: 'fas fa-sun',           // Soleil
        1: 'fas fa-cloud-sun',     // Peu nuageux
        2: 'fas fa-cloud-sun',     // Ciel voilé
        3: 'fas fa-cloud',         // Nuageux
        4: 'fas fa-cloud',         // Très nuageux
        5: 'fas fa-cloud',         // Couvert
        6: 'fas fa-cloud-rain',    // Bruine
        7: 'fas fa-cloud-rain',    // Bruine verglaçante
        10: 'fas fa-cloud-rain',   // Pluie faible
        11: 'fas fa-cloud-rain',   // Pluie modérée
        12: 'fas fa-cloud-rain',   // Pluie forte
        13: 'fas fa-cloud-rain',   // Pluie faible verglaçante
        16: 'fas fa-snowflake',    // Neige faible
        20: 'fas fa-cloud-bolt',   // Averses de pluie faible
        30: 'fas fa-cloud-bolt',   // Orage
        40: 'fas fa-smog',         // Brouillard
        100: 'fas fa-moon',        // Clair (nuit)
        101: 'fas fa-cloud-moon'   // Peu nuageux (nuit)
    };
    
    return iconMap[weatherCode] || 'fas fa-question';
}

/**
 * Obtention de la description météorologique
 */
function getWeatherDescription(weatherCode) {
    const descriptionMap = {
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
    
    return descriptionMap[weatherCode] || 'Conditions inconnues';
}

/**
 * Conversion de la direction du vent en texte
 */
function getWindDirection(degrees) {
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSO', 'SO', 'OSO',
        'O', 'ONO', 'NO', 'NNO'
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Formatage de la date
 */
function formatDate(date, index) {
    if (index === 0) {
        return "Aujourd'hui";
    }
    
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    };
    
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Récupération des options sélectionnées
 */
function getSelectedOptions() {
    return Array.from(elements.checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
}

/**
 * Mise à jour de la valeur du slider
 */
function updateDaysValue() {
    elements.daysValue.textContent = elements.daysSlider.value;
}

/**
 * Affichage/masquage du loading
 */
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
    if (show) {
        elements.resultsSection.style.display = 'none';
    }
}

/**
 * Affichage d'un message d'erreur
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    
    // Masquer l'erreur après 5 secondes
    setTimeout(hideError, 5000);
}

/**
 * Masquage du message d'erreur
 */
function hideError() {
    elements.errorMessage.style.display = 'none';
}

/**
 * Initialisation du mode sombre
 */
function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * Basculement du mode sombre
 */
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

/**
 * Application du thème
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = elements.darkModeBtn.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', initApp);
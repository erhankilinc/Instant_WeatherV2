

// Configuration de l'API
const API_CONFIG = {
    // IMPORTANT: Remplacez par votre token personnel Météo Concept
    TOKEN: 'e6b36aed76f96c8ceeb7e5fc66f152212842558af6cd3806b86720eda59c66ed',
    BASE_URL: 'https://api.meteo-concept.com/api',
    ENDPOINTS: {
        CITIES: '/location/cities',
        FORECAST: '/forecast/daily'
    }
};

// Variables globales
let currentCityData = null;
let weatherData = [];

// Elements DOM
const elements = {
    form: document.getElementById('weather-form'),
    cityInput: document.getElementById('city-input'),
    daysSlider: document.getElementById('days-slider'),
    daysValue: document.getElementById('days-value'),
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

/**
 * Initialisation de l'application
 */
function initApp() {
    setupEventListeners();
    initDarkMode();
    validateApiToken();
}

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
    // Formulaire de recherche
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Slider pour le nombre de jours
    elements.daysSlider.addEventListener('input', updateDaysValue);
    
    // Mode sombre
    elements.darkModeBtn.addEventListener('click', toggleDarkMode);
    
    // Validation en temps réel du champ ville
    elements.cityInput.addEventListener('input', debounce(validateCityInput, 300));
}

/**
 * Gestion de la soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const cityName = elements.cityInput.value.trim();
    const daysCount = parseInt(elements.daysSlider.value);
    const selectedOptions = getSelectedOptions();
    
    if (!cityName) {
        showError('Veuillez saisir le nom d\'une commune.');
        return;
    }
    
    try {
        showLoading(true);
        hideError();
        
        // Recherche de la ville
        const cityData = await searchCity(cityName);
        if (!cityData) {
            throw new Error('Commune non trouvée. Vérifiez l\'orthographe.');
        }
        
        currentCityData = cityData;
        
        // Récupération des données météo
        const forecast = await getWeatherForecast(cityData.insee, daysCount);
        weatherData = forecast;
        
        // Affichage des résultats
        displayResults(cityData, forecast, selectedOptions);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        showError(error.message || 'Une erreur est survenue lors de la récupération des données météorologiques.');
    } finally {
        showLoading(false);
    }
}

/**
 * Recherche d'une ville via l'API
 */
async function searchCity(cityName) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CITIES}?token=${API_CONFIG.TOKEN}&search=${encodeURIComponent(cityName)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.cities || data.cities.length === 0) {
            return null;
        }
        
        // Retourne la première ville trouvée
        return data.cities[0];
        
    } catch (error) {
        throw new Error('Erreur lors de la recherche de la commune.');
    }
}

/**
 * Récupération des prévisions météorologiques
 */
async function getWeatherForecast(inseeCode, days) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FORECAST}/${days}?token=${API_CONFIG.TOKEN}&insee=${inseeCode}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.forecast || data.forecast.length === 0) {
            throw new Error('Aucune donnée météorologique disponible.');
        }
        
        return data.forecast;
        
    } catch (error) {
        throw new Error('Erreur lors de la récupération des prévisions météorologiques.');
    }
}

/**
 * Affichage des résultats météorologiques
 */
function displayResults(cityData, forecast, selectedOptions) {
    // Mise à jour du nom de la ville
    elements.cityName.textContent = `Prévisions pour ${cityData.name}`;
    
    // Affichage des informations de localisation si demandées
    displayLocationInfo(cityData, selectedOptions);
    
    // Génération des cartes météo
    generateWeatherCards(forecast, selectedOptions);
    
    // Affichage de la section résultats
    elements.resultsSection.style.display = 'block';
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Affichage des informations de localisation
 */
function displayLocationInfo(cityData, selectedOptions) {
    let locationHTML = `<strong>${cityData.name}</strong>`;
    
    if (selectedOptions.includes('latitude')) {
        locationHTML += ` • Latitude: ${cityData.latitude.toFixed(4)}°`;
    }
    
    if (selectedOptions.includes('longitude')) {
        locationHTML += ` • Longitude: ${cityData.longitude.toFixed(4)}°`;
    }
    
    elements.locationInfo.innerHTML = locationHTML;
}

/**
 * Génération des cartes météorologiques
 */
function generateWeatherCards(forecast, selectedOptions) {
    elements.weatherGrid.innerHTML = '';
    
    forecast.forEach((day, index) => {
        const card = createWeatherCard(day, selectedOptions, index);
        elements.weatherGrid.appendChild(card);
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
    const dateStr = formatDate(date);
    
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
                Max: ${Math.round(dayData.tmax)}°C
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
                <i class="fas fa-cloud-rain"></i>
                Pluie: ${dayData.rr10 || 0} mm
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
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
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
 * Validation du champ ville
 */
function validateCityInput() {
    const value = elements.cityInput.value.trim();
    const isValid = value.length >= 2;
    
    elements.cityInput.style.borderColor = isValid ? '' : 'var(--error-color)';
    
    return isValid;
}

/**
 * Affichage/masquage du loading
 */
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
    elements.resultsSection.style.display = show ? 'none' : elements.resultsSection.style.display;
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
 * Validation du token API
 */
function validateApiToken() {
    if (API_CONFIG.TOKEN === 'VOTRE_TOKEN_ICI') {
        showError('⚠️ Token API manquant ! Veuillez configurer votre token Météo Concept dans le fichier script.js');
    }
}

/**
 * Initialisation du mode sombre
 */
function initDarkMode() {
    // Vérifier la préférence système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    }
    
    // Écouter les changements de préférence système
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
    
    // Mise à jour de l'icône du bouton
    const icon = elements.darkModeBtn.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/**
 * Fonction de debounce pour limiter les appels
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fonctionnalité créative : Comparaison météo
 * Permet de comparer les conditions météo entre plusieurs villes
 */
class WeatherComparison {
    constructor() {
        this.cities = [];
        this.setupComparisonUI();
    }
    
    setupComparisonUI() {
        // Ajouter un bouton de comparaison après la première recherche
        if (currentCityData && !document.getElementById('compare-btn')) {
            const compareBtn = document.createElement('button');
            compareBtn.id = 'compare-btn';
            compareBtn.className = 'submit-btn';
            compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Comparer avec une autre ville';
            compareBtn.onclick = () => this.showComparisonModal();
            
            elements.resultsSection.appendChild(compareBtn);
        }
    }
    
    showComparisonModal() {
        // Créer une modal simple pour la comparaison
        const modal = document.createElement('div');
        modal.className = 'comparison-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Comparer avec une autre ville</h3>
                <input type="text" id="compare-city" placeholder="Nom de la ville à comparer">
                <div class="modal-buttons">
                    <button onclick="weatherComparison.compare()" class="submit-btn">Comparer</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="cancel-btn">Annuler</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async compare() {
        const cityName = document.getElementById('compare-city').value.trim();
        if (!cityName) return;
        
        try {
            const cityData = await searchCity(cityName);
            if (!cityData) {
                alert('Ville non trouvée');
                return;
            }
            
            const forecast = await getWeatherForecast(cityData.insee, 1);
            this.displayComparison(currentCityData, weatherData[0], cityData, forecast[0]);
            
            document.querySelector('.comparison-modal').remove();
            
        } catch (error) {
            alert('Erreur lors de la comparaison');
        }
    }
    
    displayComparison(city1, weather1, city2, weather2) {
        const comparisonDiv = document.createElement('div');
        comparisonDiv.className = 'weather-comparison';
        comparisonDiv.innerHTML = `
            <h3>Comparaison météorologique</h3>
            <div class="comparison-grid">
                <div class="comparison-city">
                    <h4>${city1.name}</h4>
                    <div class="temp">${Math.round(weather1.tmax)}°C</div>
                    <div class="desc">${getWeatherDescription(weather1.weather)}</div>
                </div>
                <div class="comparison-vs">VS</div>
                <div class="comparison-city">
                    <h4>${city2.name}</h4>
                    <div class="temp">${Math.round(weather2.tmax)}°C</div>
                    <div class="desc">${getWeatherDescription(weather2.weather)}</div>
                </div>
            </div>
        `;
        
        elements.resultsSection.appendChild(comparisonDiv);
    }
}

// Instance globale pour la comparaison
let weatherComparison;

/**
 * Fonctionnalité créative : Historique des recherches
 */
class SearchHistory {
    constructor() {
        this.history = this.loadHistory();
        this.maxItems = 5;
    }
    
    addSearch(cityData, weatherData) {
        const searchItem = {
            city: cityData.name,
            date: new Date().toISOString(),
            weather: weatherData[0].weather,
            temp: weatherData[0].tmax
        };
        
        // Éviter les doublons
        this.history = this.history.filter(item => item.city !== cityData.name);
        this.history.unshift(searchItem);
        
        // Limiter le nombre d'éléments
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }
        
        this.saveHistory();
        this.displayHistory();
    }
    
    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('weatherHistory')) || [];
        } catch {
            return [];
        }
    }
    
    saveHistory() {
        localStorage.setItem('weatherHistory', JSON.stringify(this.history));
    }
    
    displayHistory() {
        if (this.history.length === 0) return;
        
        let historyDiv = document.getElementById('search-history');
        if (!historyDiv) {
            historyDiv = document.createElement('div');
            historyDiv.id = 'search-history';
            historyDiv.className = 'search-history';
            elements.searchSection.appendChild(historyDiv);
        }
        
        historyDiv.innerHTML = `
            <h3>Recherches récentes</h3>
            <div class="history-items">
                ${this.history.map(item => `
                    <div class="history-item" onclick="searchHistory.selectHistoryItem('${item.city}')">
                        <div class="history-city">${item.city}</div>
                        <div class="history-temp">${Math.round(item.temp)}°C</div>
                        <div class="history-icon">
                            <i class="${getWeatherIcon(item.weather)}"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    selectHistoryItem(cityName) {
        elements.cityInput.value = cityName;
        elements.form.dispatchEvent(new Event('submit'));
    }
}

// Instance globale pour l'historique
let searchHistory;

/**
 * Gestion des erreurs globales
 */
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    showError('Une erreur inattendue s\'est produite. Veuillez recharger la page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejetée:', event.reason);
    showError('Erreur de connexion. Vérifiez votre connexion internet.');
});

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    weatherComparison = new WeatherComparison();
    searchHistory = new SearchHistory();
    
    // Afficher l'historique au démarrage
    searchHistory.displayHistory();
});

/**
 * Gestion de la mise hors ligne
 */
window.addEventListener('online', () => {
    hideError();
    console.log('Connexion rétablie');
});

window.addEventListener('offline', () => {
    showError('Connexion internet perdue. Certaines fonctionnalités peuvent ne pas fonctionner.');
});

// Export pour les tests (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        searchCity,
        getWeatherForecast,
        getWeatherIcon,
        getWeatherDescription,
        formatDate
    };
}
    
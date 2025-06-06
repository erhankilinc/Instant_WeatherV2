# INSTANTWeatherV2 - Interface Météorologique Révolutionnaire

## Description du Projet

INSTANTWeatherV2 est une interface web moderne et modulaire permettant de consulter les prévisions météorologiques. Basée sur une approche de "bento box" pour l'affichage des données . Ce projet vise à fournir des informations météorologiques précises et détaillées pour n'importe quelle commune française en utilisant des API de géolocalisation et de prévisions météorologiques.

## Fonctionnalités

* **Recherche par Code Postal et Sélection de Commune :** Permet de rechercher des villes par leur code postal et de sélectionner une commune parmi les résultats pour obtenir ses prévisions.
* **Prévisions Multi-Jours :** Possibilité de choisir le nombre de jours (de 1 à 7) pour lesquels afficher les prévisions météorologiques via un slider intuitif.
* **Données Météorologiques Détaillées :** Affiche la température actuelle, les températures min/max, la probabilité de pluie et les heures d'ensoleillement.
* **Données Supplémentaires Optionnelles :** L'utilisateur peut choisir d'afficher des informations additionnelles telles que :
    * Latitude et Longitude
    * Cumul de précipitations sur 24h
    * Vitesse et direction du vent
* **Visualisation Cartographique :** Intégration d'une carte interactive (via Leaflet) affichant la localisation de la commune sélectionnée.
* **Mode Sombre (Dark Mode) :** Un bouton permet de basculer facilement entre un thème clair et un thème sombre, avec persistance de la préférence.
* **Layout Adaptatif (Bento Box) :** L'interface utilise une grille "bento box" pour organiser les informations de manière esthétique et fonctionnelle, s'adaptant aux différentes tailles d'écran (responsive design).
* **Gestion des États de l'Application :** Affichage d'états de chargement et de messages d'erreur clairs pour une meilleure expérience utilisateur.

## Technologies Utilisées

* **HTML5 :** Structure sémantique de la page web.
* **CSS3 :** Stylisation de l'interface, gestion du responsive design et des thèmes (light/dark mode). Utilisation de variables CSS pour une gestion facile de la palette de couleurs et des espacements.
* **JavaScript (ES6+) :** Logique métier de l'application, manipulation du DOM, appels API asynchrones.
* **Font Awesome :** Librairie d'icônes pour une interface visuellement riche.
* **Leaflet.js :** Bibliothèque JavaScript open-source pour les cartes interactives.
* **API Météo Concept :** Fournit les données de prévisions météorologiques.
* **API Gouv.fr (Géolocalisation) :** Utilisée pour la recherche de communes par code postal et l'obtention des coordonnées géographiques.

## Configuration et Installation

Pour exécuter ce projet localement, suivez les étapes ci-dessous :

1.  **Cloner le dépôt :**
    ```bash
    git clone (https://github.com/erhankilinc)
    cd INSTANTWeatherV2
    ```

2.  **Obtenir une clé API Météo Concept :**
    Ce projet utilise l'API Météo Concept. Vous devrez obtenir votre propre token API personnel depuis leur site web.

3.  **Configurer le Token API :**
    Ouvrez le fichier `script.js` et remplacez le placeholder du token par votre propre clé API :
    ```javascript
    const API_CONFIG = {
        TOKEN: '40cb912aff2f7792bb9ecd409d50ed4e2dca5e462e8e7ae2643237298e6198be', 
        GEO_API: '[https://geo.api.gouv.fr/communes](https://geo.api.gouv.fr/communes)',
        METEO_API: '[https://api.meteo-concept.com/api/forecast/daily](https://api.meteo-concept.com/api/forecast/daily)'
    };
    ```

4.  **Ouvrir le projet :**
    Ouvrez simplement le fichier `index.html` dans votre navigateur web préféré. Aucune installation de serveur local n'est nécessaire pour le fonctionnement de base, car toutes les opérations sont côté client.

## Utilisation

1.  **Saisie du Code Postal :** Entrez un code postal français valide (5 chiffres) dans le champ dédié.
2.  **Sélection de la Commune :** Une fois le code postal saisi, une liste déroulante des communes associées apparaîtra. Sélectionnez la commune désirée.
3.  **Choix de la Période :** Utilisez le slider pour ajuster le nombre de jours de prévisions (de 1 à 7).
4.  **Options Supplémentaires :** Cochez les cases pour afficher des données additionnelles (latitude, longitude, précipitations, vent, direction du vent).
5.  **Analyse :** Cliquez sur le bouton "Analyser" pour récupérer et afficher les données météorologiques.
6.  **Mode Sombre :** Utilisez l'icône de lune/soleil en haut à droite pour basculer le thème de l'interface.

## Structure du Projet
`(https://erhankilinc.github.io/Instant_WeatherV2/)`

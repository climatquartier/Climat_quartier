class ClimatQuartierApp {
    constructor(config) {
        if (!config) {
            throw new Error('Configuration ClimatQuartier manquante');
        }

        this.zones = config.zones || {};
        this.videos = config.videos || {};
        this.communesConfig = config.communesConfig || {};

        this.currentZone = 'cergy';
        this.currentScenario = 'ssp2';
        this.currentHorizon = 2030;
        this.currentLayer = 'temperature';
        this.isSimulating = false;
        this.tempChart = null;
        this.map = null;
        this.markers = [];
        this.areaLayers = {};
        this.communeLayers = {};
        this.baseLayers = {};
        this.currentBasemap = 'osm';
        this.vegetationLayerActive = false;
        this.impermeabilityLayerActive = false;

        this.init();
    }

            async init() {
                try {
                    this.validateData();
                    await this.initializeMap();
                    this.setupEventListeners();
                    this.setupVideoHandlers();
                    this.updateUI();
                    this.updateImpacts();
                    console.log('ClimatQuartier initialisé avec succès');
                } catch (error) {
                    console.error('Erreur lors de l\'initialisation:', error);
                    this.showError('Erreur de chargement de l\'application');
                }
            }

            initializeMap() {
                return new Promise((resolve, reject) => {
                    try {
                        // Initialisation de la carte
                        this.map = L.map('map', {
                            zoomControl: false,
                            attributionControl: false
                        }).setView([46.8, 2.5], 6);

                        // Configuration des couches de base
                        this.baseLayers = {
                            osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '© OpenStreetMap contributors',
                                maxZoom: 19
                            }),
                            satellite: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                                maxZoom: 20,
                                subdomains: ['mt0','mt1','mt2','mt3']
                            }),
                            dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                                attribution: '© OpenStreetMap, © CartoDB',
                                maxZoom: 19
                            })
                        };

                        this.baseLayers.osm.addTo(this.map);

                        // Ajout du contrôle de zoom
                        L.control.zoom({
                            position: 'bottomright'
                        }).addTo(this.map);

                        // Chargement des shapefiles
                        this.loadAllCommunes();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            }

            async loadAllCommunes() {
                for (const communeId of Object.keys(this.communesConfig)) {
                    await this.loadCommune(communeId);
                }
            }

            async loadCommune(communeId) {
                const commune = this.zones[communeId];
                const config = this.communesConfig[communeId];
                
                try {
                    // Simulation du chargement d'un shapefile
                    // En production, remplacer par le chargement réel du shapefile
                    const geojson = await this.createSimulatedGeoJSON(commune);
                    
                    this.communeLayers[communeId] = L.geoJSON(geojson, {
                        style: {
                            color: config.color,
                            weight: 3,
                            fillColor: config.color,
                            fillOpacity: 0.3
                        },
                        onEachFeature: (feature, layer) => {
                            // Style au survol
                            layer.on('mouseover', function() {
                                layer.setStyle({
                                    weight: 4,
                                    fillOpacity: 0.5
                                });
                            });
                            
                            layer.on('mouseout', function() {
                                layer.setStyle({
                                    weight: 3,
                                    fillOpacity: 0.3
                                });
                            });
                            
                            // Clic sur la commune
                            layer.on('click', (e) => {
                                this.showCommuneInfo(communeId, e.latlng);
                            });
                        }
                    }).addTo(this.map);
                    
                    console.log(`✅ ${commune.name} chargée avec succès`);
                    
                } catch (error) {
                    console.error(`❌ Erreur chargement ${commune.name}:`, error);
                    // Création d'un marqueur de secours
                    this.communeLayers[communeId] = L.marker(commune.center)
                        .addTo(this.map)
                        .bindPopup(`<b>${commune.name}</b><br>${commune.description}`);
                }
            }

            createSimulatedGeoJSON(commune) {
                // Simulation d'un GeoJSON pour la démonstration
                // En production, remplacer par le chargement réel du shapefile
                return {
                    type: "FeatureCollection",
                    features: [{
                        type: "Feature",
                        properties: {
                            name: commune.name,
                            population: commune.population
                        },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [commune.bounds[0][1], commune.bounds[0][0]],
                                [commune.bounds[1][1], commune.bounds[0][0]],
                                [commune.bounds[1][1], commune.bounds[1][0]],
                                [commune.bounds[0][1], commune.bounds[1][0]],
                                [commune.bounds[0][1], commune.bounds[0][0]]
                            ]]
                        }
                    }]
                };
            }

            // Fonctions de contrôle des couches
            toggleCommuneLayer(communeId) {
                const layer = this.communeLayers[communeId];
                const buttons = document.querySelectorAll('.layer-toggle .toggle-btn');
                const button = buttons[Object.keys(this.communesConfig).indexOf(communeId)];
                
                if (layer) {
                    if (this.map.hasLayer(layer)) {
                        this.map.removeLayer(layer);
                        button.classList.remove('active');
                    } else {
                        this.map.addLayer(layer);
                        button.classList.add('active');
                    }
                }
            }

            toggleVegetationLayer(button) {
                // Récupérer le bouton toggle
                const btn = document.getElementById('vegToggle');

                // Ajouter une classe de style pour la couche végétation
                if (!this.vegetationLayerActive) {
                    // Activer l'affichage avec coloration selon végétation
                    for (const communeId of Object.keys(this.communeLayers)) {
                        const layer = this.communeLayers[communeId];
                        if (this.map.hasLayer(layer)) {
                            layer.setStyle(feature => {
                                return {
                                    fillOpacity: 0.6,
                                    color: this.getVegetationColor(feature.properties.vegetation || 0)
                                };
                            });
                        }
                    }
                    this.vegetationLayerActive = true;
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-toggle-on"></i>';
                    console.log('Couche Végétation activée');
                } else {
                    // Désactiver - revenir aux couleurs communes
                    for (const communeId of Object.keys(this.communesConfig)) {
                        const layer = this.communeLayers[communeId];
                        if (layer) {
                            layer.setStyle({
                                fillColor: this.communesConfig[communeId].color,
                                fillOpacity: 0.5
                            });
                        }
                    }
                    this.vegetationLayerActive = false;
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="fas fa-toggle-off"></i>';
                    console.log('Couche Végétation désactivée');
                }
            }

            toggleImpermeabilityLayer(button) {
                // Récupérer le bouton toggle
                const btn = document.getElementById('imperToggle');

                // Ajouter une classe de style pour la couche imperméabilité
                if (!this.impermeabilityLayerActive) {
                    // Activer l'affichage avec coloration selon imperméabilité
                    for (const communeId of Object.keys(this.communeLayers)) {
                        const layer = this.communeLayers[communeId];
                        if (this.map.hasLayer(layer)) {
                            layer.setStyle(feature => {
                                return {
                                    fillOpacity: 0.6,
                                    color: this.getImpermeabilityColor(feature.properties.impermeability || 0)
                                };
                            });
                        }
                    }
                    this.impermeabilityLayerActive = true;
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-toggle-on"></i>';
                    console.log('Couche Désimperméabilisation activée');
                } else {
                    // Désactiver - revenir aux couleurs communes
                    for (const communeId of Object.keys(this.communesConfig)) {
                        const layer = this.communeLayers[communeId];
                        if (layer) {
                            layer.setStyle({
                                fillColor: this.communesConfig[communeId].color,
                                fillOpacity: 0.5
                            });
                        }
                    }
                    this.impermeabilityLayerActive = false;
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="fas fa-toggle-off"></i>';
                    console.log('Couche Désimperméabilisation désactivée');
                }
            }

            getVegetationColor(vegetationPercent) {
                if (vegetationPercent > 40) return '#16a34a';  // Vert foncé
                if (vegetationPercent > 30) return '#22c55e';  // Vert moyen
                if (vegetationPercent > 20) return '#86efac';  // Vert clair
                return '#e8f5e9';  // Très clair
            }

            getImpermeabilityColor(impermeability) {
                // Coloration basée sur le taux d'imperméabilité (inverse de la perméabilité)
                if (impermeability < 20) return '#4ade80';      // Vert - très perméable
                if (impermeability < 40) return '#fbbf24';      // Orange - semi-perméable
                if (impermeability < 60) return '#f97316';      // Orange foncé - peu perméable
                return '#ef4444';  // Rouge - imperméable
            }

            changeBasemap(basemapType) {
                // Mettre à jour les boutons - cherche dans la section Fond de carte
                const basemapSection = document.querySelector('.layer-controls .collapsible-section:nth-child(2)');
                const basemapButtons = basemapSection.querySelectorAll('.toggle-btn');
                basemapButtons.forEach(btn => btn.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                event.target.classList.add('active');
                
                // Changer la couche de base
                this.map.removeLayer(this.baseLayers[this.currentBasemap]);
                this.baseLayers[basemapType].addTo(this.map);
                this.currentBasemap = basemapType;
            }

            showCommuneInfo(communeId, latlng) {
                const commune = this.zones[communeId];
                const panel = document.getElementById('info-panel');
                const content = document.getElementById('info-content');
                
                content.innerHTML = `
                    <h3>${commune.name}</h3>
                    <p>${commune.description}</p>
                    <div class="info-stats">
                        <div class="stat-item">
                            <div class="stat-value">${commune.population}</div>
                            <div class="stat-label">Habitants</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${commune.superficie}</div>
                            <div class="stat-label">Superficie</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${commune.region.split('-')[0]}</div>
                            <div class="stat-label">Région</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.getDepartment(communeId)}</div>
                            <div class="stat-label">Département</div>
                        </div>
                    </div>
                    <p><strong>🌡️ Données climatiques actuelles :</strong></p>
                    <div style="font-size: 0.9rem; color: var(--gray);">
                        Température: ${commune.current.temp}°C | 
                        Jours de canicule: ${commune.current.heatwave} | 
                        Précipitations: ${commune.current.precipitation}mm
                    </div>
                `;
                
                panel.classList.add('active');
            }

            getDepartment(communeId) {
                const departments = {
                    'annecy': 'Haute-Savoie',
                    'cergy': 'Val-d\'Oise', 
                    'saintmalo': 'Ille-et-Vilaine'
                };
                return departments[communeId];
            }

            closeInfoPanel() {
                document.getElementById('info-panel').classList.remove('active');
            }

            // ... (le reste des méthodes existantes reste inchangé)
            setupVideoHandlers() {
                const videoModal = document.getElementById('videoModal');
                const closeVideo = document.getElementById('closeVideo');
                const closeVideoBtn = document.getElementById('closeVideoBtn');
                const videoTrigger = document.getElementById('videoTrigger');
                const shareVideo = document.getElementById('shareVideo');
                const climateVideo = document.getElementById('climateVideo');
                const videoSource = document.getElementById('videoSource');

                videoTrigger.addEventListener('click', () => {
                    this.openVideoModal();
                });

                const closeModal = () => {
                    videoModal.classList.remove('active');
                    climateVideo.pause();
                };

                closeVideo.addEventListener('click', closeModal);
                closeVideoBtn.addEventListener('click', closeModal);

                shareVideo.addEventListener('click', () => {
                    this.shareVideo();
                });

                videoModal.addEventListener('click', (e) => {
                    if (e.target === videoModal) {
                        closeModal();
                    }
                });

                climateVideo.addEventListener('ended', () => {
                    closeVideoBtn.focus();
                });
            }

            openVideoModal() {
                const videoModal = document.getElementById('videoModal');
                const videoTitle = document.getElementById('videoTitle');
                const videoDescription = document.getElementById('videoDescription');
                const climateVideo = document.getElementById('climateVideo');
                const videoSource = document.getElementById('videoSource');

                const videoData = this.videos[this.currentScenario];

                videoTitle.textContent = videoData.title;
                
                let descriptionHTML = `
                    <p>${videoData.description}</p>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
                        <strong style="color: var(--primary);">Impacts principaux :</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.2rem;">
                `;
                
                videoData.impacts.forEach(impact => {
                    descriptionHTML += `<li style="margin-bottom: 0.3rem;">${impact}</li>`;
                });
                
                descriptionHTML += `</ul></div>`;
                videoDescription.innerHTML = descriptionHTML;

                const demoVideos = {
                    ssp2: "https://assets.codepen.io/148180/climate-scenario-ssp2.mp4",
                    ssp5: "https://assets.codepen.io/148180/climate-scenario-ssp5.mp4"
                };

                videoSource.src = demoVideos[this.currentScenario];
                climateVideo.load();

                videoModal.classList.add('active');
                climateVideo.currentTime = 0;
                
                const playPromise = climateVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Lecture automatique bloquée');
                        videoDescription.innerHTML += `
                            <div style="margin-top: 1rem; padding: 0.8rem; background: #fef3c7; border-radius: 6px; text-align: center;">
                                <i class="fas fa-play-circle" style="color: #d97706;"></i>
                                <span style="color: #92400e; font-size: 0.9rem;">Cliquez sur le bouton lecture pour démarrer la vidéo</span>
                            </div>
                        `;
                    });
                }
            }

            shareVideo() {
                const videoData = this.videos[this.currentScenario];
                const shareText = `🔍 Découvrez l'impact du ${videoData.title} sur ClimatQuartier\n\n${window.location.href}\n\n#ClimatQuartier #ChangementClimatique`;
                
                if (navigator.share) {
                    navigator.share({
                        title: videoData.title,
                        text: shareText,
                        url: window.location.href
                    }).catch(err => {
                        this.copyToClipboard(shareText);
                    });
                } else {
                    this.copyToClipboard(shareText);
                }
            }

            copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showMessage('✅ Lien copié dans le presse-papier !');
                }).catch(err => {
                    prompt('📋 Copiez ce lien pour partager:', text);
                });
            }

            showMessage(message) {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    z-index: 10000;
                    max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                `;
                messageDiv.innerHTML = `
                    ${message}
                    <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer; font-weight: bold;">×</button>
                `;
                document.body.appendChild(messageDiv);
                
                setTimeout(() => {
                    if (messageDiv.parentElement) {
                        messageDiv.remove();
                    }
                }, 3000);
            }

            createTerritoryLayers() {
                Object.values(this.areaLayers).forEach(layer => {
                    if (layer) this.map.removeLayer(layer);
                });
                this.areaLayers = {};

                Object.keys(this.zones).forEach(zone => {
                    const currentData = this.zones[zone].current;
                    const simData = this.zones[zone].simulations[this.currentScenario]?.[this.currentHorizon];
                    const data = this.isSimulating ? simData : currentData;
                    
                    const bounds = this.zones[zone].bounds;
                    const rectangle = L.rectangle(bounds, {
                        color: this.getLayerColor(data, this.currentLayer),
                        weight: 2,
                        fillColor: this.getLayerColor(data, this.currentLayer),
                        fillOpacity: 0.4,
                        className: 'territory-layer'
                    }).addTo(this.map);

                    rectangle.bindPopup(this.createTerritoryPopup(zone, data));
                    this.areaLayers[zone] = rectangle;

                    const marker = this.createCenterMarker(zone, data);
                    if (marker) {
                        this.markers.push(marker);
                        this.zones[zone].marker = marker;
                    }
                });

                this.map.fitBounds(this.zones[this.currentZone].bounds);
            }

            createCenterMarker(zone, data) {
                try {
                    const temp = data.temp;
                    const color = this.getTemperatureColor(temp);
                    
                    const icon = L.divIcon({
                        className: this.isSimulating ? 'pulse' : '',
                        html: this.createMarkerHTML(temp, color, zone),
                        iconSize: [45, 45],
                        iconAnchor: [22, 22]
                    });

                    const marker = L.marker(this.zones[zone].center, { icon }).addTo(this.map);
                    
                    marker.bindPopup(this.createPopupContent(zone));
                    marker.on('click', () => {
                        this.switchCity(zone);
                    });

                    return marker;
                } catch (error) {
                    console.error(`Erreur lors de la création du marqueur pour ${zone}:`, error);
                    return null;
                }
            }

            getLayerColor(data, layerType) {
                switch(layerType) {
                    case 'temperature':
                        return this.getTemperatureColor(data.temp);
                    case 'heatwave':
                        if (data.heatwave < 10) return '#3b82f6';
                        if (data.heatwave < 20) return '#f59e0b';
                        return '#ef4444';
                    case 'vegetation':
                        if (data.vegetation > 40) return '#16a34a';
                        if (data.vegetation > 25) return '#22c55e';
                        return '#ef4444';
                    default:
                        return this.getTemperatureColor(data.temp);
                }
            }

            updateTerritoryLayers() {
                Object.keys(this.zones).forEach(zone => {
                    const layer = this.areaLayers[zone];
                    if (layer) {
                        const currentData = this.zones[zone].current;
                        const simData = this.zones[zone].simulations[this.currentScenario][this.currentHorizon];
                        const data = this.isSimulating ? simData : currentData;
                        
                        layer.setStyle({
                            color: this.getLayerColor(data, this.currentLayer),
                            fillColor: this.getLayerColor(data, this.currentLayer)
                        });

                        layer.setPopupContent(this.createTerritoryPopup(zone, data));
                    }
                });
            }

            createTerritoryPopup(zone, data) {
                return `
                    <div style="min-width: 250px; font-family: 'Inter', sans-serif;">
                        <div style="font-weight: bold; color: #1e293b; margin-bottom: 10px; font-size: 1.1em; border-bottom: 2px solid #1A6153; padding-bottom: 5px;">
                            ${this.zones[zone].name} - Territoire communal
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em; margin: 10px 0;">
                            <div><i class="fas fa-thermometer-half" style="color: #d97706;"></i> ${data.temp}°C</div>
                            <div><i class="fas fa-fire" style="color: #dc2626;"></i> ${data.heatwave} j canicule</div>
                            <div><i class="fas fa-cloud-rain" style="color: #2563eb;"></i> ${data.precipitation} mm</div>
                            <div><i class="fas fa-leaf" style="color: #16a34a;"></i> ${data.vegetation}% végétal</div>
                        </div>
                        <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; font-size: 0.8em; color: #64748b; text-align: center;">
                            <i class="fas fa-${this.isSimulating ? 'chart-line' : 'info-circle'}"></i> 
                            ${this.isSimulating ? 
                                `Simulation ${this.currentScenario.toUpperCase()} • ${this.currentHorizon}` : 
                                'Situation actuelle (2025)'}
                        </div>
                        <div style="margin-top: 8px; text-align: center;">
                            <button onclick="app.switchCity('${zone}')" style="background: #1A6153; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                Voir les détails
                            </button>
                        </div>
                    </div>
                `;
            }

            createMarkerHTML(temp, color, zone) {
                return `
                    <div style="
                        width: 45px; height: 45px; 
                        background: ${color}; 
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        font-size: 0.8rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " title="${this.zones[zone].name}">
                        ${temp.toFixed(1)}°
                    </div>
                `;
            }

            getTemperatureColor(temp) {
                if (temp < 12) return '#3b82f6';
                if (temp < 16) return '#10b981';
                if (temp < 20) return '#f59e0b';
                return '#ef4444';
            }

            createPopupContent(zone) {
                try {
                    const currentData = this.zones[zone].current;
                    const simData = this.zones[zone].simulations[this.currentScenario][this.currentHorizon];
                    const data = this.isSimulating ? simData : currentData;
                    
                    return `
                        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
                            <div style="font-weight: bold; color: #1e293b; margin-bottom: 10px; font-size: 1.1em;">
                                ${this.zones[zone].name}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
                                <div><i class="fas fa-thermometer-half" style="color: #d97706;"></i> ${data.temp}°C</div>
                                <div><i class="fas fa-fire" style="color: #dc2626;"></i> ${data.heatwave} j canicule</div>
                                <div><i class="fas fa-cloud-rain" style="color: #2563eb;"></i> ${data.precipitation} mm</div>
                                <div><i class="fas fa-leaf" style="color: #16a34a;"></i> ${data.vegetation}% végétal</div>
                            </div>
                            <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; font-size: 0.8em; color: #64748b;">
                                <i class="fas fa-${this.isSimulating ? 'chart-line' : 'info-circle'}"></i> 
                                ${this.isSimulating ? 
                                    `Simulation ${this.currentScenario.toUpperCase()} • ${this.currentHorizon}` : 
                                    'Situation actuelle (2025)'}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Erreur lors de la création du popup pour ${zone}:`, error);
                    return `<div>Erreur de chargement des données</div>`;
                }
            }

            updateUI() {
                try {
                    this.updateIndicators();
                    this.updateMap();
                    this.updateScenarioTabs();
                    this.updateCityButtons();
                    this.updateChart();
                    this.updateOverlay();
                    this.updateTerritoryLayers();
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de l\'interface:', error);
                    this.showError('Erreur d\'affichage des données');
                }
            }

            updateIndicators() {
                try {
                    const currentData = this.zones[this.currentZone].current;
                    const simData = this.zones[this.currentZone].simulations[this.currentScenario][this.currentHorizon];
                    const data = this.isSimulating ? simData : currentData;
                    const baseData = this.zones[this.currentZone].current;
                    
                    document.querySelectorAll('.indicator-card').forEach(card => {
                        const indicator = card.dataset.indicator;
                        const valueElement = card.querySelector('.value-main');
                        const changeElement = card.querySelector('.value-change');
                        
                        if (valueElement) {
                            valueElement.textContent = this.formatValue(indicator, data[indicator]);
                        }
                        
                        if (changeElement && this.isSimulating) {
                            const change = data[indicator] - baseData[indicator];
                            const percentChange = ((change / baseData[indicator]) * 100).toFixed(1);
                            changeElement.textContent = `${change > 0 ? '+' : ''}${percentChange}%`;
                            changeElement.className = `value-change ${change > 0 ? 'change-up' : 'change-down'}`;
                        } else if (changeElement) {
                            changeElement.textContent = 'Données actuelles';
                            changeElement.className = 'value-change';
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des indicateurs:', error);
                }
            }

            formatValue(indicator, value) {
                const formats = {
                    'temp': v => `${v.toFixed(1)}°C`,
                    'heatwave': v => `${v} jours`,
                    'precipitation': v => `${v} mm`,
                    'icu': v => `${v.toFixed(1)}°C`,
                    'vegetation': v => `${v}%`
                };
                return formats[indicator] ? formats[indicator](value) : value;
            }

            updateMap() {
                try {
                    this.map.fitBounds(this.zones[this.currentZone].bounds);
                    
                    this.markers.forEach(marker => {
                        if (marker && marker.getElement) {
                            const element = marker.getElement();
                            if (element) {
                                element.style.display = 'block';
                            }
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de la carte:', error);
                }
            }

            updateOverlay() {
                try {
                    document.querySelector('.current-city').textContent = 
                        `${this.zones[this.currentZone].name} - ${this.zones[this.currentZone].region}`;
                    
                    const scenarioLabel = this.currentScenario === 'ssp2' ? 'SSP2-4.5 (Modéré)' : 'SSP5-8.5 (Extrême)';
                    document.querySelector('.scenario-tag').textContent = 
                        `${scenarioLabel} • Horizon ${this.currentHorizon}`;
                    
                    document.querySelector('.city-description').textContent = 
                        this.isSimulating ? 'Simulation en cours • Données projetées' : 'Situation actuelle • Données 2025';
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de l\'overlay:', error);
                }
            }

            updateScenarioTabs() {
                try {
                    document.querySelectorAll('.scenario-tab').forEach(tab => {
                        tab.classList.toggle('active', tab.dataset.scenario === this.currentScenario);
                    });
                    
                    document.querySelectorAll('.scenario-option').forEach(option => {
                        option.classList.toggle('active', option.dataset.scenario === this.currentScenario);
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des onglets de scénario:', error);
                }
            }

            updateCityButtons() {
                try {
                    document.querySelectorAll('.city-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.city === this.currentZone);
                        
                        const city = btn.dataset.city;
                        const currentData = this.zones[city].current;
                        const simData = this.zones[city].simulations[this.currentScenario][this.currentHorizon];
                        const temp = this.isSimulating ? simData.temp : currentData.temp;
                        
                        btn.querySelector('.city-temp').textContent = `${temp.toFixed(1)}°C`;
                        
                        if (this.isSimulating) {
                            const change = temp - currentData.temp;
                            btn.querySelector('.city-change').textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}°C`;
                            btn.querySelector('.city-change').style.color = change > 0 ? '#ef4444' : '#10b981';
                        } else {
                            btn.querySelector('.city-change').textContent = 'Actuel';
                            btn.querySelector('.city-change').style.color = '#64748b';
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des boutons de ville:', error);
                }
            }

            updateChart() {
                try {
                    const ctx = document.getElementById('tempChart').getContext('2d');
                    const data = this.zones[this.currentZone];
                    const horizons = [2030, 2050, 2100];
                    
                    if (this.tempChart) {
                        this.tempChart.destroy();
                    }

                    const ssp2Data = horizons.map(horizon => data.simulations.ssp2[horizon].temp);
                    const ssp5Data = horizons.map(horizon => data.simulations.ssp5[horizon].temp);

                    this.tempChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: horizons,
                            datasets: [
                                {
                                    label: 'SSP2-4.5 (Modéré)',
                                    data: ssp2Data,
                                    borderColor: '#1A6153',
                                    backgroundColor: 'rgba(26, 97, 83, 0.1)',
                                    borderWidth: 3,
                                    tension: 0.4,
                                    fill: true
                                },
                                {
                                    label: 'SSP5-8.5 (Extrême)',
                                    data: ssp5Data,
                                    borderColor: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderWidth: 3,
                                    tension: 0.4,
                                    fill: true
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Projection des températures - ${data.name}`,
                                    font: { size: 16, weight: 'bold' }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return `${context.dataset.label}: ${context.parsed.y}°C`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    title: {
                                        display: true,
                                        text: 'Température (°C)'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Horizon'
                                    }
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du graphique:', error);
                }
            }

            updateImpacts() {
                try {
                    const container = document.getElementById('impactsContainer');
                    const data = this.zones[this.currentZone].simulations[this.currentScenario][this.currentHorizon];
                    const currentData = this.zones[this.currentZone].current;

                    const impacts = [
                        {
                            icon: 'fa-temperature-high',
                            label: 'Vagues de chaleur',
                            value: `+${data.heatwave - currentData.heatwave} jours`,
                            color: '#ef4444'
                        },
                        {
                            icon: 'fa-tint',
                            label: 'Précipitations',
                            value: `${(((data.precipitation - currentData.precipitation) / currentData.precipitation) * 100).toFixed(1)}%`,
                            color: '#2563eb'
                        },
                        {
                            icon: 'fa-tree',
                            label: 'Végétation',
                            value: `${(((data.vegetation - currentData.vegetation) / currentData.vegetation) * 100).toFixed(1)}%`,
                            color: '#10b981'
                        },
                        {
                            icon: 'fa-city',
                            label: 'Îlot de chaleur',
                            value: `+${(data.icu - currentData.icu).toFixed(1)}°C`,
                            color: '#f59e0b'
                        }
                    ];

                    container.innerHTML = impacts.map(impact => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; padding: 0.5rem; background: white; border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas ${impact.icon}" style="color: ${impact.color};"></i>
                                <span style="font-size: 0.8rem;">${impact.label}</span>
                            </div>
                            <span style="font-weight: 600; color: ${impact.color}; font-size: 0.9rem;">${impact.value}</span>
                        </div>
                    `).join('');
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des impacts:', error);
                    document.getElementById('impactsContainer').innerHTML = '<div style="color: #ef4444; text-align: center;">Erreur de chargement des données</div>';
                }
            }

            setupEventListeners() {
                // Slider d'horizon avec debounce
                let sliderTimeout;
                document.getElementById('horizonSlider').addEventListener('input', (e) => {
                    clearTimeout(sliderTimeout);
                    sliderTimeout = setTimeout(() => {
                        this.currentHorizon = parseInt(e.target.value);
                        document.getElementById('horizonValue').textContent = this.currentHorizon;
                        if (this.isSimulating) {
                            this.updateUI();
                            this.updateImpacts();
                        }
                    }, 100);
                });

                // Gestionnaire unique pour les scénarios
                const scenarioHandler = (e) => {
                    const newScenario = e.currentTarget.dataset.scenario;
                    if (newScenario !== this.currentScenario) {
                        this.currentScenario = newScenario;
                        if (this.isSimulating) {
                            this.updateUI();
                            this.updateImpacts();
                        }
                    }
                };

                document.querySelectorAll('.scenario-tab, .scenario-option').forEach(element => {
                    element.addEventListener('click', scenarioHandler);
                });

                // Villes
                document.querySelectorAll('.city-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.switchCity(e.currentTarget.dataset.city);
                    });
                });

                // Fermer le panel d'info en cliquant sur la carte
                this.map.on('click', () => {
                    this.closeInfoPanel();
                });

                // Empêcher la double exécution de la simulation
                let isSimulating = false;
                document.getElementById('simulateBtn').addEventListener('click', () => {
                    if (isSimulating) return;
                    
                    isSimulating = true;
                    this.isSimulating = true;
                    
                    const btn = document.getElementById('simulateBtn');
                    btn.innerHTML = '<i class="fas fa-sync-alt loading"></i> Simulation active';
                    btn.style.background = '#10b981';
                    btn.disabled = true;
                    
                    setTimeout(() => {
                        this.updateUI();
                        this.updateImpacts();
                        btn.disabled = false;
                        isSimulating = false;
                    }, 800);
                });

                // Reset amélioré
                document.getElementById('resetBtn').addEventListener('click', () => {
                    this.isSimulating = false;
                    this.currentHorizon = 2030;
                    document.getElementById('horizonSlider').value = 2030;
                    document.getElementById('horizonValue').textContent = '2030';
                    
                    const btn = document.getElementById('simulateBtn');
                    btn.innerHTML = '<i class="fas fa-play"></i> Lancer simulation';
                    btn.style.background = '';
                    
                    this.updateUI();
                    this.updateImpacts();
                });

                // Indicateurs
                document.querySelectorAll('.indicator-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        document.querySelectorAll('.indicator-card').forEach(c => c.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                    });
                });
            }

            switchCity(city) {
                this.currentZone = city;
                this.updateUI();
                this.updateImpacts();
                this.map.fitBounds(this.zones[city].bounds);
            }

            validateData() {
                const requiredFields = ['temp', 'heatwave', 'precipitation', 'icu', 'vegetation'];
                
                Object.keys(this.zones).forEach(zone => {
                    const data = this.zones[zone];
                    if (!data.current || !data.simulations) {
                        throw new Error(`Données manquantes pour ${zone}`);
                    }
                    
                    requiredFields.forEach(field => {
                        if (data.current[field] === undefined) {
                            throw new Error(`Champ ${field} manquant pour ${zone}`);
                        }
                    });
                    
                    Object.keys(data.simulations).forEach(scenario => {
                        Object.keys(data.simulations[scenario]).forEach(horizon => {
                            const simData = data.simulations[scenario][horizon];
                            requiredFields.forEach(field => {
                                if (simData[field] === undefined) {
                                    throw new Error(`Champ ${field} manquant pour ${zone} - ${scenario} - ${horizon}`);
                                }
                            });
                        });
                    });
                });
            }

            showError(message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `
                    <strong>Erreur:</strong> ${message}
                    <button onclick="this.parentElement.remove()">×</button>
                `;
                document.body.appendChild(errorDiv);
                
                setTimeout(() => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 5000);
            }
        }

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const config = window.CLIMAT_QUARTIER_CONFIG;
    if (!config) {
        console.error('Configuration ClimatQuartier introuvable');
        return;
    }
    window.app = new ClimatQuartierApp(config);
});

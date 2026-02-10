const TREE_DELTA_TEMP = [
    { x: 0, y: 0.0 },
    { x: 5000, y: -0.8 },
    { x: 10000, y: -1.5 },
    { x: 20000, y: -2.5 }
];
const TREE_DELTA_PM25 = [
    { x: 0, y: 0.0 },
    { x: 5000, y: -8.0 },
    { x: 10000, y: -15.0 },
    { x: 20000, y: -25.0 }
];
const TREE_DELTA_BIODIV = [
    { x: 0, y: 0.0 },
    { x: 5000, y: 25.0 },
    { x: 10000, y: 45.0 },
    { x: 20000, y: 80.0 }
];
const TREE_DELTA_ICU = [
    { x: 0, y: 0.0 },
    { x: 5000, y: -0.4 },
    { x: 10000, y: -0.7 },
    { x: 20000, y: -1.2 }
];

const EV_DELTA_SURFACE_HAB = [
    { x: 0, y: 0.0 },
    { x: 10, y: 12.0 },
    { x: 25, y: 28.0 },
    { x: 50, y: 55.0 }
];
const EV_DELTA_ICU = [
    { x: 0, y: 0.0 },
    { x: 10, y: -0.5 },
    { x: 25, y: -1.0 },
    { x: 50, y: -1.8 }
];
const EV_DELTA_BIODIV = [
    { x: 0, y: 0.0 },
    { x: 10, y: 30.0 },
    { x: 25, y: 65.0 },
    { x: 50, y: 120.0 }
];
const EV_DELTA_LOISIRS = [
    { x: 0, y: 0.0 },
    { x: 10, y: 25.0 },
    { x: 25, y: 45.0 },
    { x: 50, y: 80.0 }
];

const DENS_DELTA_ICU = [
    { x: -10, y: -0.3 },
    { x: 0, y: 0.0 },
    { x: 15, y: 0.4 }
];
const DENS_DELTA_PM25 = [
    { x: -10, y: -8.0 },
    { x: 0, y: 0.0 },
    { x: 15, y: 10.0 }
];
const DENS_DELTA_EV_HAB = [
    { x: -10, y: 15.0 },
    { x: 0, y: 0.0 },
    { x: 15, y: -12.0 }
];

const PERM_DELTA_INFILTRATION = [
    { x: 0, y: 0.0 },
    { x: 20, y: 30.0 },
    { x: 40, y: 55.0 },
    { x: 70, y: 85.0 }
];
const PERM_DELTA_INONDATIONS = [
    { x: 0, y: 0.0 },
    { x: 20, y: -25.0 },
    { x: 40, y: -45.0 },
    { x: 70, y: -70.0 }
];
const PERM_DELTA_TEMP = [
    { x: 0, y: 0.0 },
    { x: 20, y: -1.0 },
    { x: 40, y: -1.8 },
    { x: 70, y: -3.0 }
];
const PERM_DELTA_NAPPES = [
    { x: 0, y: 0.0 },
    { x: 20, y: 15.0 },
    { x: 40, y: 30.0 },
    { x: 70, y: 55.0 }
];

function interpolate(x, points) {
    if (!points.length) return 0;
    if (points.length === 1) return points[0].y;

    if (x <= points[0].x) {
        const p0 = points[0];
        if (p0.x === 0) return p0.y * (x / 1);
        return p0.y * (x / p0.x);
    }

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (x >= p1.x && x <= p2.x) {
            const t = (x - p1.x) / (p2.x - p1.x);
            return p1.y + t * (p2.y - p1.y);
        }
    }

    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const slope = (last.y - prev.y) / (last.x - prev.x);
    return last.y + slope * (x - last.x);
}

function impactVegetalisation(nbArbres, base) {
    const dT = interpolate(nbArbres, TREE_DELTA_TEMP);
    const dPM25 = interpolate(nbArbres, TREE_DELTA_PM25);
    const dBio = interpolate(nbArbres, TREE_DELTA_BIODIV);
    const dICU = interpolate(nbArbres, TREE_DELTA_ICU);

    return {
        ...base,
        temperature: base.temperature + dT,
        icu: base.icu + dICU,
        pm25: base.pm25 * (1 + dPM25 / 100),
        biodiversite: base.biodiversite * (1 + dBio / 100)
    };
}

function impactEspacesVerts(deltaEVpct, base) {
    const dSurf = interpolate(deltaEVpct, EV_DELTA_SURFACE_HAB);
    const dICU = interpolate(deltaEVpct, EV_DELTA_ICU);
    const dBio = interpolate(deltaEVpct, EV_DELTA_BIODIV);
    const dLoisir = interpolate(deltaEVpct, EV_DELTA_LOISIRS);

    return {
        ...base,
        surfaceParHab: base.surfaceParHab * (1 + dSurf / 100),
        icu: base.icu + dICU,
        biodiversite: base.biodiversite * (1 + dBio / 100),
        loisirs: base.loisirs * (1 + dLoisir / 100),
        vegetation: base.vegetation * (1 + deltaEVpct / 100)
    };
}

function impactDensite(deltaDensitePct, base) {
    const dICU = interpolate(deltaDensitePct, DENS_DELTA_ICU);
    const dPM25 = interpolate(deltaDensitePct, DENS_DELTA_PM25);
    const dEVHab = interpolate(deltaDensitePct, DENS_DELTA_EV_HAB);

    return {
        ...base,
        icu: base.icu + dICU,
        pm25: base.pm25 * (1 + dPM25 / 100),
        surfaceEVParHab: base.surfaceEVParHab * (1 + dEVHab / 100)
    };
}

function impactSolsPermeables(pctPerm, base) {
    const dInf = interpolate(pctPerm, PERM_DELTA_INFILTRATION);
    const dInond = interpolate(pctPerm, PERM_DELTA_INONDATIONS);
    const dT = interpolate(pctPerm, PERM_DELTA_TEMP);
    const dNapp = interpolate(pctPerm, PERM_DELTA_NAPPES);

    return {
        ...base,
        infiltration: base.infiltration * (1 + dInf / 100),
        inondations: base.inondations * (1 + dInond / 100),
        temperature: base.temperature + dT,
        nappes: base.nappes * (1 + dNapp / 100)
    };
}

function appliquerScenarioGlobal(base, params) {
    let res = { ...base };
    res = impactVegetalisation(params.nbArbres, res);
    res = impactEspacesVerts(params.deltaEVpct, res);
    res = impactDensite(params.deltaDensitePct, res);
    res = impactSolsPermeables(params.pctPerm, res);
    return res;
}

const DEC_FORMATTER = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
function formatSig(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '—';
    return DEC_FORMATTER.format(num);
}

class ClimatQuartierApp {
    constructor(config) {
        if (!config) {
            throw new Error('Configuration ClimatQuartier manquante');
        }

        this.zones = config.zones || {};
        this.communesConfig = config.communesConfig || {};

        this.currentZone = 'cergy';
        this.currentScenario = 'ssp2';
        this.horizonOptions = [
            { label: "Aujourd'hui", value: new Date().getFullYear() },
            { label: "2030", value: 2030 },
            { label: "2050", value: 2050 }
        ];
        this.currentHorizon = this.horizonOptions[0].value;
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
        this.greenSpacesLayerActive = false;
        this.greenSpacesLayers = {};
        this.greenSpacesGeoJSON = {};
        this.communeGeoJSON = {};
        this.baseIndicators = {};
        this.baseIndicatorsMeta = {};
        this.idVilleMap = {
            annecy: 1,
            cergy: 2,
            saintmalo: 3
        };
        this.supabase = null;
        this.actions = {
            nbArbres: 0,
            deltaEVpct: 0,
            deltaDensitePct: 0,
            pctPerm: 0
        };
        this.actionsCacheKey = 'cq_actions_cache_v1';
        this.loadActionsFromCache();

        this.init();
    }

            async init() {
                try {
                    this.supabase = this.createSupabaseClient();
                    await this.initializeSupabaseData();
                    this.validateData();
                    await this.initializeMap();
                    this.setupEventListeners();
                    this.updateUI();
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
                        this.greenSpacesLayerActive = true;
                        setTimeout(() => this.renderGreenSpacesLayers(), 300);
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
                    const geojson = this.communeGeoJSON[communeId] || await this.createSimulatedGeoJSON(commune);
                    
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

            createSupabaseClient() {
                const url = window.SUPABASE_URL;
                const key = window.SUPABASE_ANON_KEY;
                if (!url || !key || !window.supabase) {
                    console.warn('Supabase non configuré, chargement des données locales');
                    return null;
                }
                return window.supabase.createClient(url, key);
            }

            async initializeSupabaseData() {
                if (!this.supabase) return;

                for (const zoneId of Object.keys(this.zones)) {
                    const zone = this.zones[zoneId];
                    const commune = await this.fetchCommuneByName(zone.name);
                    if (commune) {
                        zone.population = commune.population || zone.population;
                        zone.superficie = commune.superf_cad ? `${commune.superf_cad} ha` : zone.superficie;
                        zone.id_ville = commune.id_ville;
                        this.communeGeoJSON[zoneId] = this.normalizeGeoJSON(commune.geom, {
                            name: commune.nom || zone.name,
                            id_ville: commune.id_ville
                        });
                    } else {
                        zone.id_ville = this.idVilleMap[zoneId] || zone.id_ville;
                    }

                    const baseIndicators = await this.fetchBaseIndicatorsForZone(zoneId);
                    this.baseIndicators[zoneId] = baseIndicators;
                    this.baseIndicatorsMeta[zoneId] = {
                        scenario: this.currentScenario,
                        horizon: this.currentHorizon
                    };

                    zone.current = {
                        temp: baseIndicators.temperature,
                        heatwave: baseIndicators.heatwave,
                        precipitation: baseIndicators.precipitation,
                        icu: baseIndicators.icu,
                        vegetation: baseIndicators.vegetation
                    };

                    if (zone.id_ville) {
                        const greens = await this.fetchGreenSpaces(zone.id_ville);
                        if (greens) {
                            this.greenSpacesGeoJSON[zoneId] = greens;
                        }
                    }
                }

                if (this.map && this.greenSpacesLayerActive) {
                    this.renderGreenSpacesLayers();
                }
            }

            async fetchCommuneByName(name) {
                try {
                    // Prefer GeoJSON view when available
                    let data = null;
                    let error = null;

                    const viewRes = await this.supabase
                        .schema('appsig')
                        .from('communes_geojson')
                        .select('id_ville, nom, population, superf_cad, geom_geojson')
                        .ilike('nom', `%${name}%`)
                        .limit(1)
                        .maybeSingle();

                    if (viewRes?.data) {
                        data = viewRes.data;
                    } else if (viewRes.error) {
                        error = viewRes.error;
                    }

                    if (!data) {
                        const tableRes = await this.supabase
                            .schema('appsig')
                            .from('communes')
                            .select('id_ville, nom, population, superf_cad, geom')
                            .ilike('nom', `%${name}%`)
                            .limit(1)
                            .maybeSingle();
                        data = tableRes.data;
                        error = tableRes.error;
                    }

                    if (error) throw error;
                    return data;
                } catch (err) {
                    console.warn(`Commune introuvable pour ${name}`, err);
                    return null;
                }
            }

            async fetchBaseIndicatorsForZone(zoneId) {
                const zone = this.zones[zoneId];
                const fallback = this.baseFromStatic(zoneId);
                const idVille = zone.id_ville || this.idVilleMap[zoneId];
                if (!idVille) return fallback;

                const climate = await this.fetchClimateData(idVille, this.currentScenario, this.currentHorizon);
                const icu = await this.fetchAverage(idVille, 'icu_indicateurs', 'icu_intensite_max');
                const pm25 = await this.fetchAverage(idVille, 'atmo_emicons', 'pm25');
                const vegetation = await this.fetchAverage(idVille, 'icu_typmorpho', 'taux_occup_vegetation');

                return {
                    ...fallback,
                    temperature: climate?.temperature ?? fallback.temperature,
                    heatwave: climate?.heatwave ?? fallback.heatwave,
                    precipitation: climate?.precipitation ?? fallback.precipitation,
                    icu: icu ?? fallback.icu,
                    pm25: pm25 ?? fallback.pm25,
                    vegetation: vegetation ?? fallback.vegetation
                };
            }

            async refreshBaseIndicators() {
                if (!this.supabase) return;
                for (const zoneId of Object.keys(this.zones)) {
                    const baseIndicators = await this.fetchBaseIndicatorsForZone(zoneId);
                    this.baseIndicators[zoneId] = baseIndicators;
                    this.baseIndicatorsMeta[zoneId] = {
                        scenario: this.currentScenario,
                        horizon: this.currentHorizon
                    };
                    this.zones[zoneId].current = {
                        temp: baseIndicators.temperature,
                        heatwave: baseIndicators.heatwave,
                        precipitation: baseIndicators.precipitation,
                        icu: baseIndicators.icu,
                        vegetation: baseIndicators.vegetation
                    };
                }
            }

            baseFromStatic(zoneId) {
                const zone = this.zones[zoneId];
                const current = zone.current || {};
                return {
                    temperature: current.temp ?? 0,
                    heatwave: current.heatwave ?? 0,
                    precipitation: current.precipitation ?? 0,
                    icu: current.icu ?? 0,
                    vegetation: current.vegetation ?? 0,
                    pm25: 10,
                    biodiversite: 1.0,
                    surfaceParHab: 1.0,
                    surfaceEVParHab: 1.0,
                    loisirs: 1.0,
                    infiltration: 1.0,
                    inondations: 1.0,
                    nappes: 1.0
                };
            }

            async fetchClimateData(idVille, scenario, horizon) {
                try {
                    const scenarioCandidates = this.getScenarioCandidates(scenario);
                    const { data, error } = await this.supabase
                        .schema('appsig')
                        .from('donnees_tracc')
                        .select('annee, niveau_scenarii, temp_moy_an, jours_chauds_30, precip_an')
                        .eq('id_ville', idVille)
                        .in('niveau_scenarii', scenarioCandidates);
                    if (error || !data?.length) return null;

                    const target = this.pickClosestYear(data, horizon);
                    return {
                        temperature: Number(target.temp_moy_an),
                        heatwave: Number(target.jours_chauds_30),
                        precipitation: Number(target.precip_an)
                    };
                } catch (err) {
                    console.warn('Erreur chargement donnees_tracc', err);
                    return null;
                }
            }

            getScenarioCandidates(scenario) {
                const base = String(scenario || '').toLowerCase();
                const map = {
                    ssp2: ['ssp2', 'ssp245', 'ssp2-4.5', 'ssp2_45', 'ssp2-45', 'modere', 'modéré', 'gwl15'],
                    ssp5: ['ssp5', 'ssp585', 'ssp5-8.5', 'ssp5_85', 'ssp5-85', 'extreme', 'extrême', 'gwl20']
                };
                const mapped = map[base] || [base];
                return [...new Set([...mapped, 'ref', 'reference', 'référence', 'actuel'])];
            }

            pickClosestYear(rows, horizon) {
                const targetYear = Number(horizon);
                let best = rows[0];
                let bestDelta = Math.abs(Number(rows[0].annee) - targetYear);
                rows.forEach(row => {
                    const delta = Math.abs(Number(row.annee) - targetYear);
                    if (delta < bestDelta) {
                        best = row;
                        bestDelta = delta;
                    }
                });
                return best;
            }

            async fetchAverage(idVille, table, column) {
                try {
                    const { data, error } = await this.supabase
                        .schema('appsig')
                        .from(table)
                        .select(column)
                        .eq('id_ville', idVille);
                    if (error || !data?.length) return null;
                    const values = data
                        .map(row => Number(row[column]))
                        .filter(v => Number.isFinite(v));
                    if (!values.length) return null;
                    const sum = values.reduce((acc, v) => acc + v, 0);
                    return sum / values.length;
                } catch (err) {
                    console.warn(`Erreur moyenne ${table}.${column}`, err);
                    return null;
                }
            }

            async fetchGreenSpaces(idVille) {
                try {
                    // Prefer GeoJSON view when available
                    let data = null;
                    let error = null;

                    let viewRes = await this.supabase
                        .schema('appsig')
                        .from('zone_vegetation_geojson')
                        .select('id_vegetation, nature, geom_geojson')
                        .eq('id_ville', idVille)
                        .limit(500);

                    if (viewRes?.data?.length) {
                        data = viewRes.data;
                    } else if (viewRes.error) {
                        error = viewRes.error;
                    }

                    if (!data) {
                        const publicRes = await this.supabase
                            .from('zone_vegetation_geojson')
                            .select('id_vegetation, nature, geom_geojson')
                            .eq('id_ville', idVille)
                            .limit(500);
                        if (publicRes?.data?.length) {
                            data = publicRes.data;
                            error = null;
                        } else if (publicRes.error) {
                            error = publicRes.error;
                        }
                    }

                    if (!data) {
                        const tableRes = await this.supabase
                            .schema('appsig')
                            .from('zone_vegetation')
                            .select('id_vegetation, nature, geom')
                            .eq('id_ville', idVille)
                            .limit(500);
                        data = tableRes.data;
                        error = tableRes.error;
                    }

                    if (error || !data?.length) {
                        console.warn(`Aucune zone_vegetation pour id_ville=${idVille}`);
                        return null;
                    }

                    const features = data.map(row => {
                        const rawGeom = row.geom_geojson || row.geom;
                        const geom = this.normalizeGeoJSON(rawGeom, { nature: row.nature, id_vegetation: row.id_vegetation });
                        if (!geom) return [];
                        if (geom.type === 'FeatureCollection') {
                            return geom.features;
                        }
                        return [];
                    }).flat().filter(Boolean);

                    if (!features.length) return null;
                    console.info(`Zones végétation chargées: ${features.length} (id_ville=${idVille})`);
                    return { type: 'FeatureCollection', features };
                } catch (err) {
                    console.warn('Erreur chargement zone_vegetation', err);
                    return null;
                }
            }

            normalizeGeoJSON(raw, props = {}) {
                if (!raw) return null;
                let geo = raw;
                if (typeof raw === 'string') {
                    try {
                        geo = JSON.parse(raw);
                    } catch {
                        return null;
                    }
                }
                if (geo.type === 'FeatureCollection') return geo;
                if (geo.type === 'Feature') return { type: 'FeatureCollection', features: [geo] };
                if (geo.type && geo.coordinates) {
                    return {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            properties: props,
                            geometry: geo
                        }]
                    };
                }
                return null;
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
                    this.showGreenSpacesLayers();
                    this.vegetationLayerActive = true;
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-toggle-on"></i>';
                    console.log('Couche Végétation activée');
                } else {
                    this.hideGreenSpacesLayers();
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

            showGreenSpacesLayers() {
                this.greenSpacesLayerActive = true;
                this.renderGreenSpacesLayers();
            }

            hideGreenSpacesLayers() {
                this.greenSpacesLayerActive = false;
                Object.values(this.greenSpacesLayers).forEach(layer => {
                    if (layer && this.map.hasLayer(layer)) {
                        this.map.removeLayer(layer);
                    }
                });
            }

            renderGreenSpacesLayers() {
                if (!this.greenSpacesLayerActive) return;
                const scale = this.getGreenSpaceScale();
                Object.keys(this.zones).forEach(zoneId => {
                    const raw = this.greenSpacesGeoJSON[zoneId];
                    if (!raw) return;
                    if (this.greenSpacesLayers[zoneId]) {
                        this.map.removeLayer(this.greenSpacesLayers[zoneId]);
                    }
                    const scaled = this.scaleGeoJSON(raw, scale);
                    const layer = L.geoJSON(scaled, {
                        style: {
                            color: '#16a34a',
                            weight: 1.5,
                            fillColor: '#22c55e',
                            fillOpacity: 0.55
                        }
                    }).addTo(this.map);
                    this.greenSpacesLayers[zoneId] = layer;
                    if (zoneId === this.currentZone) {
                        try {
                            this.map.fitBounds(layer.getBounds(), { maxZoom: 13 });
                        } catch {}
                    }
                });
            }

            getGreenSpaceScale() {
                const ev = this.actions.deltaEVpct / 100;
                const trees = Math.min(this.actions.nbArbres / 20000, 1) * 0.2;
                const perm = this.actions.pctPerm / 100 * 0.2;
                const scale = 1 + (ev * 0.6) + trees + perm;
                return Math.max(0.7, Math.min(scale, 2.0));
            }

            scaleGeoJSON(geojson, scale) {
                const clone = JSON.parse(JSON.stringify(geojson));
                clone.features = clone.features.map(feature => {
                    if (!feature.geometry) return feature;
                    const centroid = this.computeCentroid(feature.geometry);
                    feature.geometry = this.scaleGeometry(feature.geometry, centroid, scale);
                    return feature;
                });
                return clone;
            }

            computeCentroid(geometry) {
                const coords = [];
                const collect = (c) => {
                    if (typeof c[0] === 'number') coords.push(c);
                    else c.forEach(collect);
                };
                collect(geometry.coordinates);
                const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
                const count = coords.length || 1;
                return [sum[0] / count, sum[1] / count];
            }

            scaleGeometry(geometry, centroid, scale) {
                const scaleCoords = (c) => {
                    if (typeof c[0] === 'number') {
                        return [
                            centroid[0] + (c[0] - centroid[0]) * scale,
                            centroid[1] + (c[1] - centroid[1]) * scale
                        ];
                    }
                    return c.map(scaleCoords);
                };
                return {
                    ...geometry,
                    coordinates: scaleCoords(geometry.coordinates)
                };
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
                    const data = this.getDisplayData(zone);
                    
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
                        const data = this.getDisplayData(zone);
                        
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
                            <div><i class="fas fa-thermometer-half" style="color: #d97706;"></i> ${formatSig(data.temp)}°C</div>
                            <div><i class="fas fa-fire" style="color: #dc2626;"></i> ${formatSig(data.heatwave)} j canicule</div>
                            <div><i class="fas fa-cloud-rain" style="color: #2563eb;"></i> ${formatSig(data.precipitation)} mm</div>
                            <div><i class="fas fa-leaf" style="color: #16a34a;"></i> ${formatSig(data.vegetation)}% végétal</div>
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
                        ${formatSig(temp)}°
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
                    const data = this.getDisplayData(zone);
                    
                    return `
                        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
                            <div style="font-weight: bold; color: #1e293b; margin-bottom: 10px; font-size: 1.1em;">
                                ${this.zones[zone].name}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
                                <div><i class="fas fa-thermometer-half" style="color: #d97706;"></i> ${formatSig(data.temp)}°C</div>
                                <div><i class="fas fa-fire" style="color: #dc2626;"></i> ${formatSig(data.heatwave)} j canicule</div>
                                <div><i class="fas fa-cloud-rain" style="color: #2563eb;"></i> ${formatSig(data.precipitation)} mm</div>
                                <div><i class="fas fa-leaf" style="color: #16a34a;"></i> ${formatSig(data.vegetation)}% végétal</div>
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
                    const baseData = this.getBaseUIData(this.currentZone);
                    const data = this.isSimulating ? this.getSimulatedUIData(this.currentZone) : baseData;
                    
                    document.querySelectorAll('.indicator-card').forEach(card => {
                        const indicator = card.dataset.indicator;
                        const valueElement = card.querySelector('.value-main');
                        const changeElement = card.querySelector('.value-change');
                        
                        if (valueElement) {
                            const rawValue = Number.isFinite(data[indicator]) ? data[indicator] : baseData[indicator];
                            valueElement.textContent = this.formatValue(indicator, rawValue);
                        }
                        
                        if (changeElement && this.isSimulating) {
                            const baseVal = Number(baseData[indicator]) || 0;
                            const currentVal = Number.isFinite(data[indicator]) ? data[indicator] : baseVal;
                            const change = currentVal - baseVal;
                            const percentChange = baseVal ? (change / baseVal) * 100 : 0;
                            changeElement.textContent = `${change > 0 ? '+' : ''}${formatSig(percentChange)}%`;
                            const isPositive = change > 0;
                            const isNegative = change < 0;
                            let className = 'value-change';

                            if (indicator === 'vegetation') {
                                className += isPositive ? ' change-down' : isNegative ? ' change-up' : '';
                            } else {
                                className += isPositive ? ' change-up' : isNegative ? ' change-down' : '';
                            }

                            changeElement.className = className;
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
                    'temp': v => `${formatSig(v)}°C`,
                    'heatwave': v => `${formatSig(v)} jours`,
                    'precipitation': v => `${formatSig(v)} mm`,
                    'icu': v => `${formatSig(v)}°C`,
                    'vegetation': v => `${formatSig(v)}%`
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
                    const horizonLabel = this.getHorizonLabel();
                    document.querySelector('.scenario-tag').textContent = 
                        `${scenarioLabel} • Horizon ${horizonLabel}`;
                    
                    document.querySelector('.city-description').textContent = 
                        this.isSimulating ? 'Simulation en cours • Données projetées' : 'Situation actuelle • Données 2025';
                } catch (error) {
                    console.error('Erreur lors de la mise à jour de l\'overlay:', error);
                }
            }

            updateScenarioTabs() {
                try {
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
                        const baseData = this.getBaseUIData(city);
                        const simData = this.getSimulatedUIData(city);
                        const temp = this.isSimulating ? simData.temp : baseData.temp;
                        
                        btn.querySelector('.city-temp').textContent = `${formatSig(temp)}°C`;
                        
                        if (this.isSimulating) {
                            const change = temp - baseData.temp;
                            btn.querySelector('.city-change').textContent = `${change > 0 ? '+' : ''}${formatSig(change)}°C`;
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


            setupEventListeners() {
                // Slider d'horizon avec debounce
                let sliderTimeout;
                document.getElementById('horizonSlider').addEventListener('input', (e) => {
                    clearTimeout(sliderTimeout);
                    sliderTimeout = setTimeout(() => {
                        const idx = parseInt(e.target.value, 10);
                        const opt = this.horizonOptions[idx] || this.horizonOptions[0];
                        this.currentHorizon = opt.value;
                        document.getElementById('horizonValue').textContent = opt.label;
                        this.refreshBaseIndicators().then(() => {
                            this.updateUI();
                        });
                    }, 100);
                });

                // Gestionnaire unique pour les scénarios
                const scenarioHandler = (e) => {
                    const newScenario = e.currentTarget.dataset.scenario;
                    if (newScenario !== this.currentScenario) {
                        this.currentScenario = newScenario;
                        this.refreshBaseIndicators().then(() => {
                            this.updateUI();
                        });
                    }
                };

                document.querySelectorAll('.scenario-option').forEach(element => {
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
                        this.updateActionIndicators();
                        this.updateUI();
                        btn.disabled = false;
                        isSimulating = false;
                    }, 800);
                });

                // Reset amélioré
                document.getElementById('resetBtn').addEventListener('click', () => {
                    this.isSimulating = false;
                    this.currentHorizon = this.horizonOptions[0].value;
                    document.getElementById('horizonSlider').value = 0;
                    document.getElementById('horizonValue').textContent = this.horizonOptions[0].label;
                    this.resetActions();
                    
                    const btn = document.getElementById('simulateBtn');
                    btn.innerHTML = '<i class="fas fa-play"></i> Lancer simulation';
                    btn.style.background = '';
                    
                    this.updateUI();
                });

                // Indicateurs
                document.querySelectorAll('.indicator-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        document.querySelectorAll('.indicator-card').forEach(c => c.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                    });
                });

                const layerToggle = document.getElementById('layerControlsToggle');
                const layerPanel = document.getElementById('layerControls');
                if (layerToggle && layerPanel) {
                    layerToggle.addEventListener('click', () => {
                        layerPanel.classList.toggle('open');
                    });
                }

                this.setupActionInputs();
            }

            switchCity(city) {
                this.currentZone = city;
                this.updateUI();
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

            setupActionInputs() {
                const syncValue = (inputId, valueId, suffix = '') => {
                    const input = document.getElementById(inputId);
                    const value = document.getElementById(valueId);
                    if (!input || !value) return;
                    value.textContent = `${input.value}${suffix}`;
                };

                const onInput = (inputId, valueId, key, suffix = '') => {
                    const input = document.getElementById(inputId);
                    if (!input) return;
                    input.addEventListener('input', () => {
                        const val = Number(input.value);
                        this.actions[key] = val;
                        this.saveActionsToCache();
                        syncValue(inputId, valueId, suffix);
                        if (this.isSimulating) {
                            this.updateActionIndicators();
                            this.updateUI();
                        }
                    });
                    syncValue(inputId, valueId, suffix);
                };

                onInput('treesInput', 'treesValue', 'nbArbres', '');
                onInput('evInput', 'evValue', 'deltaEVpct', '%');
                onInput('densityInput', 'densityValue', 'deltaDensitePct', '%');
                onInput('permInput', 'permValue', 'pctPerm', '%');

                const cached = this.actions;
                const setInput = (id, value, suffix = '') => {
                    const input = document.getElementById(id);
                    const valueEl = document.getElementById(id.replace('Input', 'Value'));
                    if (input) input.value = value;
                    if (valueEl) valueEl.textContent = `${value}${suffix}`;
                };
                setInput('treesInput', cached.nbArbres);
                setInput('evInput', cached.deltaEVpct, '%');
                setInput('densityInput', cached.deltaDensitePct, '%');
                setInput('permInput', cached.pctPerm, '%');
            }

            resetActions() {
                const setInput = (id, value, suffix = '') => {
                    const input = document.getElementById(id);
                    const valueEl = document.getElementById(id.replace('Input', 'Value'));
                    if (input) input.value = value;
                    if (valueEl) valueEl.textContent = `${value}${suffix}`;
                };
                this.actions = { nbArbres: 0, deltaEVpct: 0, deltaDensitePct: 0, pctPerm: 0 };
                this.saveActionsToCache();
                setInput('treesInput', 0);
                setInput('evInput', 0, '%');
                setInput('densityInput', 0, '%');
                setInput('permInput', 0, '%');
                this.renderGreenSpacesLayers();
            }

            updateActionIndicators() {
                if (this.greenSpacesLayerActive) {
                    this.renderGreenSpacesLayers();
                }
            }

            loadActionsFromCache() {
                try {
                    const raw = localStorage.getItem(this.actionsCacheKey);
                    if (!raw) return;
                    const parsed = JSON.parse(raw);
                    if (!parsed || typeof parsed !== 'object') return;
                    this.actions = {
                        nbArbres: Number(parsed.nbArbres) || 0,
                        deltaEVpct: Number(parsed.deltaEVpct) || 0,
                        deltaDensitePct: Number(parsed.deltaDensitePct) || 0,
                        pctPerm: Number(parsed.pctPerm) || 0
                    };
                } catch {}
            }

            saveActionsToCache() {
                try {
                    localStorage.setItem(this.actionsCacheKey, JSON.stringify(this.actions));
                } catch {}
            }

            getBaseIndicators(zoneId) {
                const meta = this.baseIndicatorsMeta[zoneId];
                if (this.supabase && meta && (meta.scenario !== this.currentScenario || meta.horizon !== this.currentHorizon)) {
                    this.refreshBaseIndicators();
                }
                return this.baseIndicators[zoneId] || this.baseFromStatic(zoneId);
            }

            getSimulatedIndicators(zoneId) {
                const base = this.getBaseIndicators(zoneId);
                const sim = appliquerScenarioGlobal(base, this.actions);
                return {
                    ...base,
                    ...sim,
                    vegetation: Number.isFinite(sim.vegetation) ? sim.vegetation : base.vegetation
                };
            }

            getBaseUIData(zoneId) {
                const base = this.getBaseIndicators(zoneId);
                return {
                    temp: base.temperature,
                    heatwave: base.heatwave,
                    precipitation: base.precipitation,
                    icu: base.icu,
                    vegetation: base.vegetation
                };
            }

            getSimulatedUIData(zoneId) {
                const base = this.getBaseIndicators(zoneId);
                const sim = this.getSimulatedIndicators(zoneId);
                return {
                    temp: sim.temperature,
                    heatwave: base.heatwave,
                    precipitation: base.precipitation,
                    icu: sim.icu,
                    vegetation: Number.isFinite(sim.vegetation) ? sim.vegetation : base.vegetation
                };
            }

            getDisplayData(zoneId) {
                return this.isSimulating ? this.getSimulatedUIData(zoneId) : this.getBaseUIData(zoneId);
            }

            getHorizonLabel() {
                const found = this.horizonOptions.find(opt => opt.value === this.currentHorizon);
                return found ? found.label : String(this.currentHorizon);
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

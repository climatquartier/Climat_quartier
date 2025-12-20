window.CLIMAT_QUARTIER_CONFIG = {
    zones: {
        cergy: {
            name: "Cergy",
            region: "Île-de-France",
            center: [49.0379, 2.0693],
            bounds: [[49.017, 2.03], [49.058, 2.11]],
            color: '#2ecc71',
            description: 'Cergy est une ville nouvelle dynamique, pôle économique et universitaire important.',
            population: '66,401',
            superficie: '11.68 km²',
            current: { 
                temp: 13.8, heatwave: 8, precipitation: 700, icu: 1.5, vegetation: 30 
            },
            simulations: {
                ssp2: {
                    2030: { temp: 15.2, heatwave: 14, precipitation: 665, icu: 2.0, vegetation: 27 },
                    2050: { temp: 16.8, heatwave: 22, precipitation: 630, icu: 2.5, vegetation: 24 },
                    2100: { temp: 18.1, heatwave: 28, precipitation: 595, icu: 3.0, vegetation: 21 }
                },
                ssp5: {
                    2030: { temp: 15.8, heatwave: 16, precipitation: 650, icu: 2.2, vegetation: 26 },
                    2050: { temp: 18.0, heatwave: 30, precipitation: 590, icu: 3.0, vegetation: 22 },
                    2100: { temp: 21.2, heatwave: 45, precipitation: 520, icu: 4.0, vegetation: 18 }
                }
            }
        },
        annecy: {
            name: "Annecy",
            region: "Auvergne-Rhône-Alpes", 
            center: [45.8992, 6.1294],
            bounds: [[45.87, 6.08], [45.93, 6.18]],
            color: '#e74c3c',
            description: 'Annecy, surnommée la "Venise des Alpes", est célèbre pour son lac et sa vieille ville médiévale.',
            population: '126,924',
            superficie: '66.93 km²',
            current: { 
                temp: 11.5, heatwave: 5, precipitation: 1200, icu: 1.2, vegetation: 45 
            },
            simulations: {
                ssp2: {
                    2030: { temp: 13.1, heatwave: 9, precipitation: 1140, icu: 1.7, vegetation: 42 },
                    2050: { temp: 14.7, heatwave: 15, precipitation: 1080, icu: 2.2, vegetation: 39 },
                    2100: { temp: 16.0, heatwave: 22, precipitation: 1020, icu: 2.7, vegetation: 36 }
                },
                ssp5: {
                    2030: { temp: 13.7, heatwave: 11, precipitation: 1120, icu: 1.9, vegetation: 41 },
                    2050: { temp: 15.9, heatwave: 23, precipitation: 1040, icu: 2.7, vegetation: 37 },
                    2100: { temp: 19.1, heatwave: 38, precipitation: 960, icu: 3.7, vegetation: 33 }
                }
            }
        },
        saintmalo: {
            name: "Saint-Malo",
            region: "Bretagne",
            center: [48.6493, -2.0257],
            bounds: [[48.62, -2.07], [48.68, -1.98]],
            color: '#3498db',
            description: 'Saint-Malo, cité corsaire historique, est une destination balnéaire prisée.',
            population: '46,803',
            superficie: '36.58 km²',
            current: { 
                temp: 12.2, heatwave: 3, precipitation: 750, icu: 0.8, vegetation: 28 
            },
            simulations: {
                ssp2: {
                    2030: { temp: 13.8, heatwave: 6, precipitation: 712, icu: 1.3, vegetation: 25 },
                    2050: { temp: 15.4, heatwave: 12, precipitation: 674, icu: 1.8, vegetation: 22 },
                    2100: { temp: 16.7, heatwave: 18, precipitation: 636, icu: 2.3, vegetation: 19 }
                },
                ssp5: {
                    2030: { temp: 14.4, heatwave: 8, precipitation: 700, icu: 1.5, vegetation: 24 },
                    2050: { temp: 16.6, heatwave: 20, precipitation: 650, icu: 2.3, vegetation: 20 },
                    2100: { temp: 19.8, heatwave: 35, precipitation: 580, icu: 3.3, vegetation: 16 }
                }
            }
        }
    },
    videos: {
        ssp2: {
            title: "🌱 Scénario Modéré SSP2-4.5 : Notre Avenir Durable",
            description: "Ce scénario représente une voie de développement durable où les émissions atteignent un pic vers 2050 puis déclinent progressivement.",
            videoUrl: "https://assets.codepen.io/148180/climate-scenario-ssp2.mp4",
            impacts: [
                "📈 Hausse modérée des températures (+1.5°C à 2.5°C)",
                "🌡️ Vagues de chaleur plus fréquentes mais gérables",
                "💧 Modifications des régimes de précipitations",
                "🌳 Adaptation progressive des écosystèmes"
            ]
        },
        ssp5: {
            title: "🔥 Scénario Extrême SSP5-8.5 : L'Urgence Climatique", 
            description: "Ce scénario représente la voie la plus pessimiste avec une forte dépendance aux énergies fossiles.",
            videoUrl: "https://assets.codepen.io/148180/climate-scenario-ssp5.mp4",
            impacts: [
                "🌡️ Hausse drastique des températures (+3°C à 5°C)",
                "🔥 Multiplication des canicules et sécheresses",
                "🌀 Événements climatiques extrêmes fréquents",
                "🏭 Stress hydrique et alimentaire accru"
            ]
        }
    },
    communesConfig: {
        annecy: { path: 'Annecy/Annecy.shp', color: '#e74c3c' },
        cergy: { path: 'Cergy/Cergy.shp', color: '#2ecc71' },
        saintmalo: { path: 'Saint-Malo/Saint-Malo.shp', color: '#3498db' }
    }
};

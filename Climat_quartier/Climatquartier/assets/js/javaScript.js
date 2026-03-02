/* ============================================================
   CLIMATQUARTIER — SCRIPT GLOBAL FINAL STABILISÉ
   (Navigation, Dashboard, Import CSV, Import Shapefile, Couches,
   Étiquettes, Table attributaire)
============================================================ */


/* ============================================================
   1 — NAVIGATION ENTRE LES PAGES
============================================================ */
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.dataset.page === pageId) l.classList.add('active');
    });

    if (pageId === "import") {
        setTimeout(() => importMap.invalidateSize(), 350);
    }

    window.scrollTo(0, 0);
}


/* ============================================================
   2 — INITIALISATION AU CHARGEMENT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFilters();
    initCSVUpload();
    initShapefileSelection();
    initFAQ();
    initContactForm();
    initNavLinks();
    initImportMap();   // 🔥 création unique de la carte

    console.log("ClimatQuartier — Script chargé");
});


/* ============================================================
   3 — ONGLET : TABS DU TABLEAU DE BORD
============================================================ */
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');

            if (tab.dataset.tab === "import") {
                setTimeout(() => importMap.invalidateSize(), 350);
            }
        });
    });
}


/* ============================================================
   4 — TABLEAU DE BORD (SIMULATION)
============================================================ */
function initFilters() {
    const btn = document.getElementById('apply-filters');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const q = document.getElementById('quartier-select').value;
        const s = document.getElementById('scenario-select').value;
        const h = document.getElementById('horizon-select').value;
        const i = document.getElementById('indicateur-select').value;

        if (!q) return alert("Choisissez un quartier.");

        updateDashboardData(q, s, h, i);
    });
}

function updateDashboardData(q, s, h, i) {
    document.getElementById('main-map').innerHTML = `
        <strong>${q}</strong><br>
        Scénario : ${s}<br>
        Horizon : ${h}<br>
        Indicateur : ${i}<br>
        <small>Données mises à jour</small>
    `;
}


/* ============================================================
   5 — IMPORT CSV
============================================================ */
function initCSVUpload() {
    const input = document.getElementById('csv-upload');
    if (!input) return;

    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('csv-file-info').textContent = `Fichier : ${file.name}`;

        const reader = new FileReader();
        reader.onload = e => processCSVData(e.target.result);
        reader.readAsText(file);
    });
}

function processCSVData(csv) {
    const rows = csv.trim().split("\n");
    const headers = rows[0].split(",").map(h => h.trim());

    const data = rows.slice(1).map(row => {
        const obj = {};
        row.split(",").forEach((v, i) => obj[headers[i]] = v.trim());
        return obj;
    });

    updateDashboardWithImportedData(data);
}

function updateDashboardWithImportedData(data) {
    const n = data.length;
    if (!n) return alert("CSV vide.");

    document.getElementById('import-stats').innerHTML = `
        <p><strong>Données CSV importées</strong></p>
        <p>${n} lignes</p>
    `;

    alert("CSV importé !");
}


/* ============================================================
   6 — CARTE LEAFLET (IMPORT SHP)
============================================================ */
let importMap;
let shapeLayers = [];
let labelLayers = [];

function initImportMap() {
    importMap = L.map("import-map").setView([46.6, 1.8], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(importMap);

    setTimeout(() => importMap.invalidateSize(), 400);
}


/* ============================================================
   7 — IMPORT SHAPEFILE (SHP + SHX + DBF + PRJ)
============================================================ */
let shapefileFiles = {};

function initShapefileSelection() {
    const input = document.getElementById("shapefile-upload");
    if (!input) return;

    input.addEventListener("change", e => {
        shapefileFiles = { shp: null, shx: null, dbf: null, prj: null };
        let txt = "";

        [...e.target.files].forEach(f => {
            const name = f.name.toLowerCase();
            if (name.endsWith(".shp")) { shapefileFiles.shp = f; txt += "SHP détecté<br>"; }
            if (name.endsWith(".shx")) { shapefileFiles.shx = f; txt += "SHX détecté<br>"; }
            if (name.endsWith(".dbf")) { shapefileFiles.dbf = f; txt += "DBF détecté<br>"; }
            if (name.endsWith(".prj")) { shapefileFiles.prj = f; txt += "PRJ détecté<br>"; }
        });

        document.getElementById("file-info").innerHTML = txt || "Aucun fichier détecté";
    });
}


async function uploadShapefile() {
    if (!shapefileFiles.shp || !shapefileFiles.shx || !shapefileFiles.dbf)
        return alert("Sélectionnez SHP + SHX + DBF (+ PRJ optionnel).");

    const zip = new JSZip();
    Object.values(shapefileFiles).forEach(f => f && zip.file(f.name, f));

    try {
        const buffer = await zip.generateAsync({ type: "arraybuffer" });
        const geojson = await shp(buffer);
        lastImportedGeoJSON = geojson;  // 🔥 on sauvegarde pour le tableau de bord
        addShapefileToMap(geojson);
        alert("Shapefile importé !");
    }
    catch (err) {
        console.error(err);
        alert("Erreur import shapefile.");
    }
    updateDashboardMapWithShapes();
}
        
function addShapefileToMap(geojson) {
    const layer = L.geoJSON(geojson, {
        style: { color: "#0066cc", weight: 2, fillOpacity: 0.25 },
        onEachFeature: generatePopup,
        pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, color: "red" })
    }).addTo(importMap);

    shapeLayers.push(layer);

    const lbl = L.geoJSON(geojson, {
        onEachFeature: createLabel,
        pointToLayer: (f, latlng) => L.marker(latlng)
    });

    labelLayers.push(lbl);

    updateLayerList();
    importMap.fitBounds(layer.getBounds());

    document.getElementById("import-stats").innerHTML =
        `<p><strong>${geojson.features.length}</strong> entités chargées</p>`;
}


/* ============================================================
   8 — GESTION DES COUCHES
============================================================ */
function updateLayerList() {
    const list = document.getElementById("layer-list");
    list.innerHTML = "";

    shapeLayers.forEach((layer, i) => {
        const features = layer.toGeoJSON().features;
        const keys = Object.keys(features[0].properties);

        let options = keys.map(k => `<option value="${k}">${k}</option>`).join("");

        list.innerHTML += `
            <div class="layer-item">
                <input type="checkbox" checked onchange="toggleLayer(${i})"> Couche ${i + 1}

                <button onclick="showAttributes(${i})">Attributs</button>

                <br>

                <label>Étiquette :</label>
                <select onchange="changeLabelField(${i}, this.value)">
                    <option value="">(Auto)</option>
                    ${options}
                </select>

                <button onclick="toggleLabels(${i})">Étiquettes ON/OFF</button>
            </div>
        `;
    });

    if (shapeLayers.length === 0)
        list.innerHTML = "Aucune couche importée";
}


function toggleLayer(i) {
    const layer = shapeLayers[i];
    if (importMap.hasLayer(layer)) importMap.removeLayer(layer);
    else layer.addTo(importMap);
}

function toggleLabels(i) {
    const lbl = labelLayers[i];
    if (importMap.hasLayer(lbl)) importMap.removeLayer(lbl);
    else lbl.addTo(importMap);
}
function changeLabelField(i, field) {
    const lbl = labelLayers[i];

    // Retirer ancienne couche de labels si affichée
    if (importMap.hasLayer(lbl.layer)) importMap.removeLayer(lbl.layer);

    // Regénérer les labels avec le bon champ
    const geojson = shapeLayers[i].toGeoJSON();

    const newLabelLayer = L.geoJSON(geojson, {
        onEachFeature: (f, layer) => createLabel(f, layer, field),
        pointToLayer: (f, latlng) => L.marker(latlng)
    });

    // Mettre à jour la structure
    labelLayers[i] = { layer: newLabelLayer, field };

    // Réafficher si les labels étaient visibles
    importMap.addLayer(newLabelLayer);
}


/* ============================================================
   9 — TABLE ATTRIBUTAIRE (MODAL)
============================================================ */
function showAttributes(i) {
    const features = shapeLayers[i].toGeoJSON().features;
    const keys = Object.keys(features[0].properties);

    let html = `
        <div class="attr-table-container">
        <table class="attr-table">
            <thead>
                <tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>
            </thead>
            <tbody>
    `;

    features.forEach(f => {
        html += "<tr>";
        keys.forEach(k => html += `<td>${f.properties[k]}</td>`);
        html += "</tr>";
    });

    html += `
            </tbody>
        </table>
        </div>
    `;

    document.getElementById("attribute-content").innerHTML = html;
    document.getElementById("attribute-table").style.display = "flex";    
}


function closeAttributeTable() {
    document.getElementById("attribute-table").style.display = "none";
}


/* ============================================================
   10 — POPUP & LABELS
============================================================ */
function generatePopup(feature, layer) {
    const props = feature.properties;
    let html = "";
    for (const k in props) html += `<b>${k} :</b> ${props[k]}<br>`;
    layer.bindPopup(html);
}

function createLabel(feature, layer, field = null) {
    const props = feature.properties;
    if (!props) return;

    let label;

    if (field && props[field] !== undefined) {
        label = props[field];
    } else {
        label = props.nom || props.name || props.NOM || props.ID || Object.values(props)[0];
    }

    layer.bindTooltip(label, {
        permanent: true,
        direction: "center",
        className: "shape-label"
    });
}



/* ============================================================
   11 — FAQ / CONTACT / NAVIGATION
============================================================ */
function initNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });
}

function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const ans = q.nextElementSibling;
            ans.style.display = ans.style.display === "block" ? "none" : "block";
        });
    });
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Empêche le rechargement de la page

        // Change le texte du bouton pour montrer que ça charge
        const btn = document.getElementById('btn-submit');
        const originalText = btn.innerText;
        btn.innerText = 'Envoi en cours...';

        // Paramètres EmailJS (Remplissez avec vos IDs)
        const serviceID = 'service_x3fk2ev';
        const templateID = 'template_miibp8y';

        emailjs.sendForm(serviceID, templateID, this)
            .then(() => {
                // Succès
                btn.innerText = originalText;
                alert('Message envoyé avec succès !');
                form.reset();
            }, (err) => {
                // Erreur
                btn.innerText = originalText;
                alert('Erreur lors de l\'envoi : ' + JSON.stringify(err));
            });
    });
}
/* ============================================================
   AFFICHAGE DU SHAPEFILE DANS LE TABLEAU DE BORD
   ============================================================ */

let dashboardLayer = null;

function updateDashboardMapWithShapes() {
    const map = document.getElementById("main-map");
    if (!map || !lastImportedGeoJSON) return;

    // Création de la carte Leaflet si pas encore créée
    if (!window.dashboardMap) {
        window.dashboardMap = L.map("main-map").setView([49.05, 2.08], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap"
        }).addTo(dashboardMap);
    }

    // Retire l’ancienne couche
    if (dashboardLayer) {
        dashboardMap.removeLayer(dashboardLayer);
    }

    // Ajout du shapefile
    dashboardLayer = L.geoJSON(lastImportedGeoJSON, {
        style: {
            color: "#e63946",
            weight: 2,
            fillOpacity: 0.3
        },
        onEachFeature: (feature, layer) => {
            let popup = "";
            for (let k in feature.properties) {
                popup += `<b>${k}</b> : ${feature.properties[k]}<br>`;
            }
            layer.bindPopup(popup);
        }
    }).addTo(dashboardMap);

    dashboardMap.fitBounds(dashboardLayer.getBounds());

    setTimeout(() => dashboardMap.invalidateSize(), 300);
}
/* ============================================================
   ONGLET DOCUMENTATION / MÉTHODOLOGIE
   ============================================================ */
function initMethodologyTabs() {
    const tabs = document.querySelectorAll('.method-tab');
    const contents = document.querySelectorAll('.method-tab-content');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

document.addEventListener("DOMContentLoaded", initMethodologyTabs);

/* ============================================================
   ONGLET MÉTHODOLOGIE / DOCUMENTATION
   ============================================================ */
(function () {

    function setupMethodTabs() {
        const tabs = document.querySelectorAll('.method-tab');
        const contents = document.querySelectorAll('.method-tab-content');

        if (!tabs.length || !contents.length) return; // sécurité

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab; // "method-content" ou "doc-content"

                // désactiver tous les onglets + contenus
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // activer l’onglet cliqué
                tab.classList.add('active');

                // activer le bon contenu
                const target = document.getElementById(targetId);
                if (target) target.classList.add('active');
            });
        });
    }

    // S'assurer que ça s'exécute même si le script est chargé après le DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMethodTabs);
    } else {
        setupMethodTabs();
    }

})();

/* ================================
   Onglets Méthodologie / Documentation
================================ */
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".method-tab");
    const contents = document.querySelectorAll(".method-tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            // reset
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));

            // active
            tab.classList.add("active");
            document.getElementById(target).classList.add("active");
        });
    });
});

/* ============================================================
   MODULE DOCUMENTATION — Import, Export, Tri, Recherche
   ============================================================ */

let documents = [];

// Charger la liste depuis localStorage au démarrage
document.addEventListener("DOMContentLoaded", () => {
    loadDocuments();
    renderDocuments();
});

/* ============================================================
   1 — Importer un document
   ============================================================ */
function uploadDocument() {
    const input = document.getElementById("doc-upload-input");
    if (!input.files.length) return alert("Veuillez choisir un document.");

    const file = input.files[0];

    const doc = {
        name: file.name,
        type: detectCategory(file.name),
        url: URL.createObjectURL(file),
        date: new Date().toLocaleDateString()
    };

    documents.push(doc);
    saveDocuments();
    renderDocuments();

    input.value = "";
    alert("Document ajouté !");
}

/* Détection automatique de catégorie */
function detectCategory(filename) {
    const f = filename.toLowerCase();
    if (f.endsWith(".pdf")) return "rapports";
    if (f.endsWith(".doc") || f.endsWith(".docx")) return "rapports";
    if (f.endsWith(".csv") || f.endsWith(".xlsx")) return "data";
    if (f.endsWith(".json")) return "data";
    if (f.endsWith(".js")) return "scripts";
    if (f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg")) return "images";
    return "guides";
}

/* ============================================================
   2 — Affichage des documents
   ============================================================ */
function renderDocuments() {
    const list = document.getElementById("doc-list");
    list.innerHTML = "";

    documents.forEach((doc, i) => {
        list.innerHTML += `
            <div class="doc-card" data-cat="${doc.type}">
                <h4>${doc.name}</h4>
                <p><small>Catégorie : ${doc.type}</small></p>
                <p><small>Ajouté le ${doc.date}</small></p>

                <div class="doc-actions">
                    <a href="${doc.url}" target="_blank">📥 Ouvrir</a>
                    <button class="doc-delete" onclick="deleteDocument(${i})">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    });
}

/* ============================================================
   3 — Suppression d’un document
   ============================================================ */
function deleteDocument(index) {
    if (!confirm("Supprimer ce document ?")) return;

    documents.splice(index, 1);
    saveDocuments();
    renderDocuments();
}

/* ============================================================
   4 — Filtrer par catégorie
   ============================================================ */
function filterCategory(cat) {
    document.querySelectorAll(".doc-cat").forEach(btn =>
        btn.classList.remove("active")
    );

    document.querySelector(`.doc-cat[data-cat="${cat}"]`).classList.add("active");

    document.querySelectorAll(".doc-card").forEach(card => {
        if (cat === "all") card.style.display = "block";
        else card.style.display = card.dataset.cat === cat ? "block" : "none";
    });
}

/* ============================================================
   5 — Recherche par mots-clés
   ============================================================ */
function filterDocuments() {
    const q = document.getElementById("doc-search").value.toLowerCase();

    document.querySelectorAll(".doc-card").forEach(card => {
        const name = card.querySelector("h4").textContent.toLowerCase();
        card.style.display = name.includes(q) ? "block" : "none";
    });
}

/* ============================================================
   6 — Export ZIP de tous les documents
   ============================================================ */
async function exportDocumentsZIP() {
    if (!documents.length) return alert("Aucun document à exporter.");

    const zip = new JSZip();

    for (const doc of documents) {
        const fileBlob = await fetch(doc.url).then(r => r.blob());
        zip.file(doc.name, fileBlob);
    }

    zip.generateAsync({ type: "blob" }).then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "ClimatQuartier_documents.zip";
        link.click();
    });
}

/* ============================================================
   7 — Sauvegarde / Chargement
   ============================================================ */
function saveDocuments() {
    localStorage.setItem("cq_documents", JSON.stringify(documents));
}

function loadDocuments() {
    const saved = localStorage.getItem("cq_documents");
    if (saved) documents = JSON.parse(saved);
}


/* ==========================================
   GESTION DU DARK MODE
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; // La balise <html>
    
    // 1. Vérifier s'il y a une préférence sauvegardée
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateButtonIcon(savedTheme);
    } else {
        // Optionnel : Détecter la préférence système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            htmlElement.setAttribute('data-theme', 'dark');
            updateButtonIcon('dark');
        }
    }

    // 2. Gestion du clic sur le bouton
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme); // Sauvegarde
        updateButtonIcon(newTheme);
    });

    // Fonction pour changer l'icône
    function updateButtonIcon(theme) {
        if (theme === 'dark') {
            themeToggleBtn.textContent = '☀️'; // Soleil pour revenir au jour
        } else {
            themeToggleBtn.textContent = '🌙'; // Lune pour aller à la nuit
        }
    }
});
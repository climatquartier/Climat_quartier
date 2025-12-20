document.addEventListener('DOMContentLoaded', () => {
    const documents = [
        {
            title: 'CMIP - Fiche pédagogique',
            file: '../Documentation/CMIP-Fiche_pedagogique.pdf',
            description: 'Panorama des scénarios CMIP utilisés pour les simulations ClimatQuartier.',
            category: 'CMIP',
            tags: ['scénarios', 'CMIP', 'pédagogie'],
            type: 'PDF'
        },
        {
            title: 'Les projections TRACC - Fiche pédagogique',
            file: '../Documentation/Les_projections_TRACC-Fiche_pedagogique.pdf',
            description: 'Détail des projections TRACC mobilisées et pistes pour les interpréter.',
            category: 'TRACC',
            tags: ['TRACC', 'projections', 'fiche'],
            type: 'PDF'
        },
        {
            title: 'Données utilisées Climat Quartier',
            file: '../Documentation/Données_utilisées_climat_quartier.pdf',
            description: 'Sources de données et pré-traitements associés aux indicateurs.',
            category: 'Données',
            tags: ['sources', 'méthodologie', 'données'],
            type: 'PDF'
        }
    ];

    const grid = document.getElementById('docsGrid');
    const searchInput = document.getElementById('docSearch');
    const emptyState = document.getElementById('noResults');
    const countEls = document.querySelectorAll('[data-doc-count]');

    const renderDocs = (list) => {
        if (!grid) {
            return;
        }

        grid.innerHTML = '';

        list.forEach((doc) => {
            const article = document.createElement('article');
            article.className = 'doc-card';

            const tagsMarkup = (doc.tags || [])
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join('');

            article.innerHTML = `
                <div class="doc-top">
                    <span class="pill">${doc.type}</span>
                    ${doc.category ? `<span class="doc-category">${doc.category}</span>` : ''}
                </div>
                <h3 class="doc-title">${doc.title}</h3>
                <p class="doc-description">${doc.description}</p>
                <div class="doc-meta">
                    <span><i class="fas fa-file-pdf"></i> ${doc.type}</span>
                    <span><i class="fas fa-folder-open"></i> Documentation</span>
                </div>
                <div class="doc-tags">
                    ${tagsMarkup}
                </div>
                <div class="doc-actions">
                    <a class="doc-link primary" href="${doc.file}" target="_blank" rel="noopener">
                        <i class="fas fa-eye"></i> Consulter
                    </a>
                    <a class="doc-link ghost" href="${doc.file}" download>
                        <i class="fas fa-download"></i> Télécharger
                    </a>
                </div>
            `;

            grid.appendChild(article);
        });

        updateCount(list.length);
        toggleEmptyState(list.length === 0);
    };

    const updateCount = (count) => {
        countEls.forEach((el) => {
            el.textContent = count;
        });
    };

    const toggleEmptyState = (isEmpty) => {
        if (!emptyState) {
            return;
        }

        emptyState.style.display = isEmpty ? 'flex' : 'none';
    };

    const filterDocs = (query) => {
        const term = query.trim().toLowerCase();

        if (!term) {
            renderDocs(documents);
            return;
        }

        const filtered = documents.filter((doc) => {
            const haystack = [
                doc.title,
                doc.description,
                doc.category,
                (doc.tags || []).join(' ')
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });

        renderDocs(filtered);
    };

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            filterDocs(event.target.value);
        });
    }

    renderDocs(documents);
});

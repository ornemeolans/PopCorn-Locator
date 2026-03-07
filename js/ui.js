// ============================================
// MÓDULO DE UI (ui.js)
// ============================================

import { TMDB_IMAGE_BASE_URL, TMDB_IMAGE_LARGE_URL } from './config.js';
import { PLACEHOLDER_IMAGE, handleImageError, getGenreNames, formatYear, isFavorite, addFavorite, removeFavorite } from './utils.js';

// ============================================
// REFERENCIAS AL DOM
// ============================================
export const elements = {
    searchInput: document.querySelector('.search-input'),
    searchButton: document.querySelector('.search-button'),
    resetButton: document.getElementById('reset-button'),
    filterButtons: document.querySelectorAll('.filter-button'),
    resultsContainer: document.getElementById('results-container'),
    searchInfo: document.getElementById('search-info'),
    movieModal: document.getElementById('movie-modal'),
    closeModal: document.getElementById('close-modal'),
    detailContainer: document.getElementById('detail-container'),
    paginationContainer: document.getElementById('pagination'),
    suggestionsList: document.getElementById('suggestions-list')
};

// ============================================
// MAPA DE NOMBRES DE PAÍSES
// ============================================
const countryNames = {
    'AR': 'Argentina',
    'US': 'Estados Unidos',
    'ES': 'España',
    'MX': 'México',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Perú',
    'BR': 'Brasil',
    'GB': 'Reino Unido',
    'FR': 'Francia',
    'DE': 'Alemania',
    'IT': 'Italia',
    'JP': 'Japón',
    'KR': 'Corea del Sur',
    'CA': 'Canadá',
    'AU': 'Australia'
};

export function getUserCountry() {
    // Intentar obtener el país del localStorage o usar valor por defecto
    return localStorage.getItem('userCountry') || 'AR';
}

export function getCountryName(countryCode) {
    return countryNames[countryCode] || countryCode;
}

// ============================================
// PLANTILLAS (TEMPLATES)
// ============================================

// Template de tarjeta de película/serie
function createMovieCard(item, mediaType) {
    const template = document.getElementById('movie-card-template');
    const clone = template.content.cloneNode(true);
    
    const card = clone.querySelector('.movie-card');
    const img = clone.querySelector('.movie-poster');
    const titleEl = clone.querySelector('.movie-title');
    const yearEl = clone.querySelector('.movie-year');
    const ratingEl = clone.querySelector('.rating-value');
    
    const title = item.title || item.name;
    const posterPath = item.poster_path;
    const poster = posterPath ? TMDB_IMAGE_BASE_URL + posterPath : PLACEHOLDER_IMAGE;
    const year = formatYear(item.release_date || item.first_air_date);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const mediaTypeDisplay = mediaType === 'movie' ? 'Película' : 'Serie';
    
    img.src = poster;
    img.alt = title;
    img.loading = 'lazy';
    img.onerror = () => handleImageError(img);
    
    titleEl.textContent = title;
    yearEl.textContent = `${year} • ${mediaTypeDisplay}`;
    ratingEl.textContent = rating;
    
    // Agregar botón de favorito
    const favButton = document.createElement('button');
    favButton.className = 'favorite-btn';
    favButton.setAttribute('aria-label', isFavorite(item.id, mediaType) ? 'Quitar de favoritos' : 'Añadir a favoritos');
    favButton.innerHTML = isFavorite(item.id, mediaType) ? '❤️' : '🤍';
    favButton.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(item, mediaType, favButton);
    };
    card.appendChild(favButton);
    
    card.addEventListener('click', () => {
        // Import dinámicamente para evitar circular dependency
        import('./app.js').then(module => module.showMovieDetails(item.id, mediaType));
    });
    
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
    
    return clone;
}

// Template de tarjeta de actor
function createActorCard(item) {
    const template = document.getElementById('actor-card-template');
    const clone = template.content.cloneNode(true);
    
    const card = clone.querySelector('.actor-card');
    const img = clone.querySelector('.actor-photo');
    const nameEl = clone.querySelector('.actor-name');
    const knownForEl = clone.querySelector('.actor-known-for');
    const roleEl = clone.querySelector('.actor-role');
    
    const title = item.name;
    const posterPath = item.profile_path;
    const poster = posterPath ? TMDB_IMAGE_BASE_URL + posterPath : PLACEHOLDER_IMAGE;
    const knownFor = item.known_for_department || 'Conocido por';
    const popularFor = item.known_for && item.known_for.length > 0 ?
        item.known_for.slice(0, 2).map(m => m.title || m.name).join(', ') : 'N/A';
    
    img.src = poster;
    img.alt = title;
    img.loading = 'lazy';
    img.onerror = () => handleImageError(img);
    
    nameEl.textContent = title;
    knownForEl.textContent = knownFor;
    roleEl.textContent = `Pop. ${item.popularity.toFixed(0)} | Por: ${popularFor}`;
    
    // Si el actor tiene known_for, crear una sección de películas/series
    const filmographySection = clone.querySelector('.actor-filmography');
    if (item.known_for && item.known_for.length > 0 && filmographySection) {
        const filmographyHTML = item.known_for.slice(0, 6).map(media => {
            const mediaTitle = media.title || media.name;
            const mediaPoster = media.poster_path ? TMDB_IMAGE_BASE_URL + media.poster_path : PLACEHOLDER_IMAGE;
            const mediaYear = (media.release_date || media.first_air_date || '').substring(0, 4);
            const mediaType = media.media_type === 'movie' ? 'P' : 'S';
            
            return `
                <div class="actor-film-item" data-id="${media.id}" data-type="${media.media_type}" role="button" tabindex="0">
                    <img src="${mediaPoster}" alt="${mediaTitle}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <div class="actor-film-title">${mediaTitle}</div>
                    <div class="actor-film-year">${mediaYear || 'N/A'} (${mediaType})</div>
            `;
        }).join('');
        
        filmographySection.innerHTML = `
            <h4 class="filmography-label">Conocido por:</h4>
            <div class="actor-film-grid">${filmographyHTML}</div>
        `;
        
        // Agregar eventos click a las películas
        filmographySection.querySelectorAll('.actor-film-item').forEach(filmItem => {
            filmItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(filmItem.dataset.id);
                const type = filmItem.dataset.type;
                import('./app.js').then(module => module.showMovieDetails(id, type));
            });
            
            filmItem.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    filmItem.click();
                }
            });
        });
    }
    
    card.addEventListener('click', () => {
        import('./app.js').then(module => module.showActorDetails(item.id, item.name));
    });
    
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
    
    return clone;
}

// ============================================
// MANEJO DE FAVORITOS
// ============================================

function toggleFavorite(item, mediaType, button) {
    if (isFavorite(item.id, mediaType)) {
        removeFavorite(item.id, mediaType);
        button.innerHTML = '🤍';
        button.setAttribute('aria-label', 'Añadir a favoritos');
    } else {
        addFavorite({
            id: item.id,
            media_type: mediaType,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date
        });
        button.innerHTML = '❤️';
        button.setAttribute('aria-label', 'Quitar de favoritos');
    }
}

// ============================================
// RENDERIZADO DE RESULTADOS
// ============================================

export function renderResults(results, type = 'all') {
    elements.resultsContainer.innerHTML = '';
    
    if (!results || results.length === 0) {
        elements.resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        return;
    }
    
    results.forEach(item => {
        // La API de personas (/search/person) no devuelve media_type, asignarlo manualmente
        let mediaType = item.media_type;
        if (!mediaType && item.known_for_department) {
            mediaType = 'person';
        }
        
        // Si el filtro es 'actor', mostrar solo actores
        if (type === 'actor') {
            if (mediaType === 'person') {
                elements.resultsContainer.appendChild(createActorCard(item));
            }
            return;
        }
        
        // Si el filtro es 'all', mostrar todo excepto personas
        if (type === 'all') {
            if (mediaType === 'person') {
                // No mostrar personas en búsqueda "all"
                return;
            }
            if (mediaType === 'movie' || mediaType === 'tv') {
                elements.resultsContainer.appendChild(createMovieCard(item, mediaType));
            }
            return;
        }
        
        // Filtrar por tipo específico (movie o series)
        if (mediaType === 'movie' || mediaType === 'tv') {
            const isMovie = mediaType === 'movie';
            // Comparar con 'tv' porque la API devuelve 'tv' para series
            if (type === 'movie' && isMovie) {
                elements.resultsContainer.appendChild(createMovieCard(item, mediaType));
            } else if (type === 'series' && !isMovie) {
                elements.resultsContainer.appendChild(createMovieCard(item, mediaType));
            }
        }
    });
}

// ============================================
// SKELETON LOADING
// ============================================

export function showSkeletonLoading(count = 8) {
    let skeletonHTML = '<div class="skeleton-grid">';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-card">
                <div class="skeleton-poster"></div>
                <div class="skeleton-info">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-year"></div>
                </div>
            </div>
        `;
    }
    skeletonHTML += '</div>';
    elements.resultsContainer.innerHTML = skeletonHTML;
}

// ============================================
// ERROR
// ============================================

export function showError(message, retryCallback = null) {
    const errorSVG = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
    `;
    
    let retryButtonHTML = '';
    if (retryCallback) {
        retryButtonHTML = `<button class="retry-button" onclick="(${retryCallback})()">Reintentar</button>`;
    }
    
    elements.resultsContainer.innerHTML = `
        <div class="error" style="grid-column: 1 / -1;">
            <div class="error-illustration">${errorSVG}</div>
            <p class="error-message">${message}</p>
            ${retryButtonHTML}
        </div>
    `;
}

// ============================================
// MODAL
// ============================================

export function openModal() {
    elements.movieModal.style.display = 'block';
    elements.movieModal.offsetHeight; // Trigger reflow
    elements.movieModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

export function closeModal() {
    elements.movieModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scroll
    setTimeout(() => {
        elements.movieModal.style.display = 'none';
    }, 300);
}

// ============================================
// SUGERENCIAS
// ============================================

export function showSuggestions(results) {
    elements.suggestionsList.innerHTML = '';
    
    if (!results || results.length === 0) {
        elements.suggestionsList.style.display = 'none';
        return;
    }
    
    results.forEach(item => {
        const title = item.title || item.name;
        const mediaType = item.media_type === 'movie' ? 'Película' : 
                         item.media_type === 'tv' ? 'Serie' : item.media_type;
        
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <span>${title}</span>
            <span class="suggestion-item-type">${mediaType}</span>
        `;
        
        suggestionItem.addEventListener('click', () => {
            elements.searchInput.value = title;
            elements.suggestionsList.style.display = 'none';
            import('./app.js').then(module => module.performSearch());
        });
        
        elements.suggestionsList.appendChild(suggestionItem);
    });
    
    elements.suggestionsList.style.display = 'block';
}

export function hideSuggestions() {
    elements.suggestionsList.style.display = 'none';
}

// ============================================
// PAGINACIÓN
// ============================================

export function renderPagination(totalPages, currentPage, searchCallback) {
    elements.paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botón anterior
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.textContent = '← Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => searchCallback(currentPage - 1));
    elements.paginationContainer.appendChild(prevButton);
    
    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => searchCallback(i));
        elements.paginationContainer.appendChild(pageButton);
    }
    
    // Botón siguiente
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button';
    nextButton.textContent = 'Siguiente →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => searchCallback(currentPage + 1));
    elements.paginationContainer.appendChild(nextButton);
}

// ============================================
// ACTUALIZAR INFO DE BÚSQUEDA
// ============================================

export function updateSearchInfo(message) {
    elements.searchInfo.innerHTML = `<p>${message}</p>`;
}

export function clearSearchInfo() {
    elements.searchInfo.innerHTML = '';
}

// ============================================
// FILTROS AVANZADOS (GÉNERO/AÑO)
// ============================================

export function createGenreFilter(genres, mediaType, onChange) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'genre-filter';
    filterContainer.innerHTML = `
        <label for="genre-select" class="visually-hidden">Filtrar por género</label>
        <select id="genre-select" class="genre-select">
            <option value="">Todos los géneros</option>
            ${genres.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
        </select>
    `;
    
    const select = filterContainer.querySelector('#genre-select');
    select.addEventListener('change', (e) => onChange(e.target.value));
    
    return filterContainer;
}

export function createYearFilter(onChange) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'year-filter';
    filterContainer.innerHTML = `
        <label for="year-select" class="visually-hidden">Filtrar por año</label>
        <select id="year-select" class="year-select">
            <option value="">Todos los años</option>
            ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
    `;
    
    const select = filterContainer.querySelector('#year-select');
    select.addEventListener('change', (e) => onChange(e.target.value));
    
    return filterContainer;
}

// ============================================
// MODAL DETAILS
// ============================================

export function showLoadingDetails() {
    elements.detailContainer.innerHTML = '<div class="loading">Cargando detalles...</div>';
}

export function showErrorDetails(message = 'Error al cargar los detalles') {
    elements.detailContainer.innerHTML = `<div class="error">${message}</div>`;
}

// Renderizar detalles de película/serie
export function renderMovieDetails(details, mediaType) {
    const isMovie = mediaType === 'movie';
    const poster = details.poster_path ? TMDB_IMAGE_LARGE_URL + details.poster_path : PLACEHOLDER_IMAGE;
    const title = details.title || details.name;
    const year = formatYear(isMovie ? details.release_date : details.first_air_date);
    const runtime = isMovie ? details.runtime : (details.episode_run_time?.[0] || 0);
    const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
    
    // Director/Creador
    const crew = details.credits?.crew || [];
    const director = isMovie ? 
        crew.find(m => m.job === 'Director') : 
        crew.find(m => m.job === 'Executive Producer');
    const directorName = director?.name || 'N/A';
    
    // Reparto
    const cast = details.credits?.cast || [];
    const actorsList = cast.slice(0, 5).map(a => a.name).join(', ') || 'N/A';
    
    // Rating
    const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    
    // Géneros como IDs para filtrado
    const genreIds = details.genres?.map(g => g.id) || [];
    
    elements.detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${poster}" alt="${title}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            
            <div class="detail-meta">
                <span class="meta-item">${year}</span>
                <span class="meta-item">${isMovie ? 'Película' : 'Serie'}</span>
                <span class="meta-item">${runtime ? `${runtime} min` : 'N/A'}</span>
                <span class="meta-item">${details.tagline || details.status || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Género:</span>
                <span class="detail-info-content">${genres}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">${isMovie ? 'Director' : 'Creador'}:</span>
                <span class="detail-info-content">${directorName}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Reparto:</span>
                <span class="detail-info-content">${actorsList}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Calificaciones:</span>
                <span class="detail-info-content">
                    <span class="star">★</span> ${rating} / 10 (TMDB)
                </span>
            </div>
            
            <div class="detail-overview">
                <h3>Sinopsis</h3>
                <p>${details.overview || 'No hay sinopsis disponible.'}</p>
            </div>
            
            <div class="platforms-section">
                <div class="loading">
                    <p>🔍 Buscando en plataformas...</p>
                </div>
            </div>
        </div>
    `;
    
    return { title, genreIds };
}

// Renderizar detalles de actor
export function renderActorDetails(actor, credits) {
    const photo = actor.profile_path ? TMDB_IMAGE_BASE_URL + actor.profile_path : PLACEHOLDER_IMAGE;
    
    // Filmografía filtrada y ordenada
    const filmography = credits.cast
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 30);
    
    const filmographyHTML = filmography.map((item, index) => {
        const mediaType = item.media_type;
        const year = formatYear(item.release_date || item.first_air_date);
        const title = item.title || item.name;
        const poster = item.poster_path ? TMDB_IMAGE_BASE_URL + item.poster_path : PLACEHOLDER_IMAGE;
        
        return `
            <div class="filmography-item" data-id="${item.id}" data-type="${mediaType}" role="button" tabindex="0">
                <img src="${poster}" alt="${title}" class="filmography-poster" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="filmography-info">
                    <div class="filmography-name">${title}</div>
                    <div class="filmography-year">${year} (${mediaType === 'movie' ? 'P' : 'S'})</div>
                </div>
            </div>
        `;
    }).join('');
    
    elements.detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${photo}" alt="${actor.name}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${actor.name}</h1>
            
            <div class="actor-stats">
                <div class="stat-item">
                    <span class="stat-value">${actor.popularity.toFixed(1)}</span>
                    <span class="stat-label">Popularidad</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${actor.known_for_department || 'N/A'}</span>
                    <span class="stat-label">Conocido por</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${credits.cast.length}</span>
                    <span class="stat-label">Títulos totales</span>
                </div>
            </div>
            
            <div class="actor-bio">
                <h3>Biografía</h3>
                <p>${actor.biography || 'No hay biografía disponible.'}</p>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Fecha de nacimiento:</span>
                <span class="detail-info-content">${actor.birthday || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Lugar de nacimiento:</span>
                <span class="detail-info-content">${actor.place_of_birth || 'N/A'}</span>
            </div>
            
            <div class="actor-filmography" id="actor-filmography-section">
                <h3 class="filmography-title">Filmografía Destacada</h3>
                <div class="filmography-grid">
                    ${filmographyHTML}
                </div>
            </div>
        </div>
    `;
    
    // Agregar event listeners a los items de filmografía
    const filmographySection = document.getElementById('actor-filmography-section');
    if (filmographySection) {
        filmographySection.querySelectorAll('.filmography-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const type = item.dataset.type;
                import('./app.js').then(module => module.showMovieDetails(id, type));
            });
            
            item.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }
}

// Actualizar sección de streaming
export function updateStreamingSection(streamingData) {
    const platformsSection = document.querySelector('.platforms-section');
    if (!platformsSection) return;
    
    // Obtener el país del usuario desde config
    const userCountry = getUserCountry();
    const countryName = getCountryName(userCountry);
    
    // Buscar primero en el país del usuario
    const countryData = streamingData[userCountry];
    
    let html = '';
    
    if (countryData) {
        // Hay datos para el país del usuario
        html = `<h3 class="platforms-title">🎬 Disponible en ${countryName}</h3><div class="platforms-grid">`;
        
        let hasPlatforms = false;
        
        const appendPlatforms = (platformList, type) => {
            if (platformList) {
                platformList.forEach(service => {
                    hasPlatforms = true;
                    const platformName = service.provider_name;
                    const logoUrl = service.logo_path ? `https://image.tmdb.org/t/p/w92${service.logo_path}` : '';
                    
                    let typeText = 'SUSCRIPCIÓN';
                    let typeClass = 'availability-stream';
                    if (type === 'rent') { typeText = 'ALQUILER'; typeClass = 'availability-rent'; }
                    if (type === 'buy') { typeText = 'COMPRA'; typeClass = 'availability-buy'; }
                    
                    html += `
                        <div class="platform-item">
                            <div class="platform-logo-container">
                                <img src="${logoUrl}" alt="${platformName}" class="platform-logo-img" 
                                     onerror="this.style.display='none'; this.closest('.platform-logo-container').innerHTML = '<div class=\\'platform-logo-text\\'>${platformName.substring(0, 2).toUpperCase()}</div>'">
                            </div>
                            <div class="platform-name">${platformName}</div>
                            <div class="platform-type">${type.toUpperCase()}</div>
                            <div class="availability-badge ${typeClass}">${typeText}</div>
                        </div>
                    `;
                });
            }
        };
        
        appendPlatforms(countryData.flatrate, 'flatrate');
        appendPlatforms(countryData.rent, 'rent');
        appendPlatforms(countryData.buy, 'buy');
        
        html += '</div>';
        
        if (!hasPlatforms) {
            html = `<h3 class="platforms-title">🎬 Disponible en ${countryName}</h3><div class="no-results" style="padding: 20px;">No disponible para streaming, alquiler ni compra en ${countryName}.</div>`;
        }
    } else {
        // No hay datos para el país del usuario
        html = `
            <h3 class="platforms-title">🎬 Streaming en ${countryName}</h3>
            <div style="text-align: center; padding: 25px; background: var(--dark-color); border-radius: 8px; margin: 10px 0;">
                <p style="font-size: 1.2rem; color: var(--light-color); margin-bottom: 10px;">😔</p>
                <p style="color: var(--light-color); font-weight: 600;">No disponible en ${countryName}</p>
                <p style="font-size: 0.85rem; color: var(--gray-color); margin-top: 8px;">
                    Esta película/serie no está disponible para streaming, alquiler ni compra en tu país.
                </p>
            </div>
        `;
    }
    
    platformsSection.innerHTML = html;
}

export function showStreamingError() {
    const platformsSection = document.querySelector('.platforms-section');
    if (!platformsSection) return;
    
    platformsSection.innerHTML = `
        <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
        <div style="text-align: center; padding: 20px; background: #333; border-radius: 8px;">
            <p style="color: var(--primary-color); font-weight: bold;">⚠️ Información limitada</p>
            <p style="font-size: 0.9rem; color: #ccc; margin-top: 10px;">No se pudo cargar información de streaming.</p>
        </div>
    `;
}

// ============================================
// INICIALIZAR EVENT LISTENERS DE UI
// ============================================

export function initUIEventListeners(searchCallback, resetCallback) {
    // Botón de búsqueda
    elements.searchButton.addEventListener('click', searchCallback);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            hideSuggestions();
            searchCallback();
        }
    });
    
    // Botón de reset
    elements.resetButton.addEventListener('click', resetCallback);
    
    // Cerrar modal
    elements.closeModal.addEventListener('click', closeModal);
    elements.movieModal.addEventListener('click', (e) => {
        if (e.target === elements.movieModal) closeModal();
    });
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-suggestions-wrapper')) {
            hideSuggestions();
        }
    });
    
    // Filtros
    elements.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            elements.filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-checked', 'true');
        });
    });
}


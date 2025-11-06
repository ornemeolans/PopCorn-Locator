// Configuración de APIs
const TMDB_API_KEY = 'd06b9cae7dc7f8b3e3b9b3c449f757e6'; // Clave TMDB
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// OMDb ya no es necesario

// Base URL para imágenes de TMDB
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Elementos del DOM
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const resetButton = document.getElementById('reset-button'); 
const filterButtons = document.querySelectorAll('.filter-button');
const resultsContainer = document.getElementById('results-container');
const searchInfo = document.getElementById('search-info');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const detailContainer = document.getElementById('detail-container');
const paginationContainer = document.getElementById('pagination');
// NUEVO ELEMENTO DE SUGERENCIAS
const suggestionsList = document.getElementById('suggestions-list');

// Variables de estado
let currentSearchType = 'all';
let currentPage = 1;
let totalResults = 0;
let currentSearchQuery = '';
let isLoading = false;
let isInitialLoad = false; 

// Placeholder para imágenes
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LWZhbWlseT0iQXJpYWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvYnI+QXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';


// ********************************************
// * LÓGICA DE SUGERENCIAS (AUTOCOMPLETADO) *
// ********************************************

// Función de Debounce para limitar las llamadas a la API
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

// Manejador del evento input (usando debounce)
function handleSearchInput() {
    const query = searchInput.value.trim();
    if (query.length < 3) { // Solo buscar después de 3 caracteres
        suggestionsList.style.display = 'none';
        suggestionsList.innerHTML = '';
        return;
    }
    getSearchSuggestions(query);
}

// Obtener sugerencias de la API de TMDB
async function getSearchSuggestions(query) {
    // Usamos el mismo multi-search para sugerir películas y series
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&language=es-ES`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Filtramos solo títulos y limitamos a un máximo de 8
        const filteredResults = data.results
            .filter(item => item.media_type !== 'person' && (item.title || item.name))
            .slice(0, 8); 

        displaySuggestions(filteredResults);

    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsList.style.display = 'none';
    }
}

// Mostrar sugerencias en el dropdown
function displaySuggestions(results) {
    suggestionsList.innerHTML = '';

    if (results.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }

    results.forEach(item => {
        const title = item.title || item.name;
        const mediaType = item.media_type === 'movie' ? 'Película' : item.media_type === 'tv' ? 'Serie' : item.media_type;
        
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <span>${title}</span>
            <span class="suggestion-item-type">${mediaType}</span>
        `;
        
        suggestionItem.addEventListener('click', () => selectSuggestion(title));
        suggestionsList.appendChild(suggestionItem);
    });

    suggestionsList.style.display = 'block';
}

// Seleccionar una sugerencia
function selectSuggestion(title) {
    searchInput.value = title;
    suggestionsList.style.display = 'none';
    performSearch(); // Llama a la búsqueda completa
}

// Ocultar sugerencias al hacer clic fuera del input o del dropdown
window.addEventListener('click', (e) => {
    // Si el clic no es en el input y no es dentro de la lista de sugerencias
    if (e.target !== searchInput && e.target.closest('.suggestions-list') === null) {
        suggestionsList.style.display = 'none';
    }
});
// ********************************************
// * FIN LÓGICA DE SUGERENCIAS *
// ********************************************

// Event Listeners
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        suggestionsList.style.display = 'none'; // Ocultar antes de buscar
        performSearch();
    }
});
// NUEVO: Agregamos el listener de input con debounce
searchInput.addEventListener('input', debounce(handleSearchInput, 300));


filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentSearchType = button.dataset.type;
        if (searchInput.value.trim()) {
            currentPage = 1;
            performSearch();
        } else if (!isLoading) {
             // Si no hay query, pero se cambia el filtro, cargamos populares de nuevo
             // O simplemente no hacemos nada para no sobrecargar la API al cambiar filtros vacíos
        }
    });
});

closeModal.addEventListener('click', () => {
    movieModal.style.display = 'none';
});



// Event Listener para el botón de reseteo
resetButton.addEventListener('click', resetSearch);

// Funciones de control de estado

function resetSearch() {
    searchInput.value = '';
    currentSearchQuery = '';
    currentPage = 1;
    currentSearchType = 'all';
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-type="all"]').classList.add('active');
    loadInitialContent();
}

function loadInitialContent() {
    isInitialLoad = true;
    loadPopularContent();
}

// Carga de Contenido Popular
async function loadPopularContent() {
    resultsContainer.innerHTML = '<div class="loading">Cargando contenido popular...</div>';
    searchInfo.innerHTML = '';
    paginationContainer.innerHTML = '';

    const popularUrl = `${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=es-ES`;

    try {
        const response = await fetch(popularUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayTMDBResults(data.results, 0, 0, 1); 
            searchInfo.innerHTML = '<p>✨ **Contenido Popular y Tendencias**</p>';
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No se pudo cargar el contenido popular.</div>';
        }
    } catch (error) {
        console.error('Error al cargar populares:', error);
        resultsContainer.innerHTML = '<div class="error">Error al cargar el contenido popular.</div>';
    }
}


// Función principal de búsqueda
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Si hay una búsqueda, ya no es carga inicial
    isInitialLoad = false;
    currentSearchQuery = query;
    currentPage = 1;
    resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';
    searchInfo.innerHTML = '';
    paginationContainer.innerHTML = '';

    // Ahora todo usa TMDB
    searchWithTMDB(query, currentPage);
}

// Búsqueda unificada con TMDB
async function searchWithTMDB(query, page = 1) {
    if (isLoading) return;

    isLoading = true;
    resultsContainer.innerHTML = '<div class="loading">Buscando...</div>';

    let url;
    let typeFilter = currentSearchType;

    // Si la búsqueda no es 'all', usamos endpoints específicos para mejor precisión
    if (typeFilter === 'all') {
        url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
    } else {
        let tmdbType = typeFilter === 'series' ? 'tv' : typeFilter === 'actor' ? 'person' : 'movie';
        url = `${TMDB_BASE_URL}/search/${tmdbType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {

            let filteredResults = data.results;
            // Filtramos el resultado 'multi' para ser más precisos si es necesario
            if (currentSearchType === 'all') {
                // Filtramos gente en la búsqueda 'all' para no mezclar si el filtro no está activo
                filteredResults = data.results.filter(item => item.media_type !== 'person');
            }

            displayTMDBResults(filteredResults, data.total_results, data.total_pages, page);
            totalResults = data.total_results;
            searchInfo.innerHTML = `<p>Mostrando ${filteredResults.length} resultados para: <strong>"${query}"</strong></p>`;
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        }
    } catch (error) {
        console.error('Error en la búsqueda con TMDB:', error);
        resultsContainer.innerHTML = '<div class="error">Error al cargar los resultados</div>';
    } finally {
        isLoading = false;
    }
}

// Mostrar resultados de TMDB
function displayTMDBResults(results, totalResults, totalPages, currentPage) {
    resultsContainer.innerHTML = '';

    results.forEach(item => {
        let mediaType = item.media_type;

        // **CORRECCIÓN CRUCIAL:** Si media_type falta (pasa en búsquedas específicas como /search/movie)
        if (!mediaType) {
            if (currentSearchType === 'movie') mediaType = 'movie';
            else if (currentSearchType === 'series') mediaType = 'tv';
            else if (currentSearchType === 'actor') mediaType = 'person';
            else return; // Si estamos en 'all' y falta, lo ignoramos.
        }

        const isMovie = mediaType === 'movie';
        const isSeries = mediaType === 'tv';
        const isActor = mediaType === 'person';

        // Ignorar tipos que no podemos renderizar (e.g., collections)
        if (!isMovie && !isSeries && !isActor) return;

        let title = item.title || item.name;

        let posterPath = item.poster_path || item.profile_path; // Usar profile_path para actores
        const poster = posterPath ? TMDB_IMAGE_BASE_URL + posterPath : PLACEHOLDER_IMAGE;

        const card = document.createElement('div');

        // Lógica de rendering específica para cada tipo
        if (isActor) {
            const knownFor = item.known_for_department || 'Conocido por';
            const popularFor = item.known_for && item.known_for.length > 0 ?
                item.known_for.slice(0, 2).map(m => m.title || m.name).join(', ') : 'N/A';

            card.className = 'actor-card';

            card.innerHTML = `
                <img src="${poster}" alt="${title}" class="actor-photo" 
                    onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="actor-info">
                    <h3 class="actor-name">${title}</h3>
                    <div class="actor-known-for">${knownFor}</div>
                    <div class="actor-role">Pop. ${item.popularity.toFixed(0)} | Por: ${popularFor}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                showActorDetails(item.id, item.name);
            });

        } else if (isMovie || isSeries) {

            let year = (isMovie ? item.release_date : item.first_air_date) ? (isMovie ? item.release_date.substring(0, 4) : item.first_air_date.substring(0, 4)) : 'N/A';
            const mediaTypeDisplay = isMovie ? 'Película' : 'Serie';
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

            card.className = 'movie-card';

            card.innerHTML = `
                <img src="${poster}" alt="${title}" class="movie-poster" 
                    onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="movie-info">
                    <h3 class="movie-title">${title}</h3>
                    <div class="movie-year">${year} • ${mediaTypeDisplay}</div>
                    <div class="movie-rating">
                        <span class="star">★</span>
                        <span>${rating}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                showMovieDetails(item.id, mediaType);
            });

        }

        resultsContainer.appendChild(card);
    });

    // Solo mostrar paginación si no es la carga inicial de populares
    if (!isInitialLoad && totalPages > 1) {
        displayPagination(totalResults, currentPage, totalPages);
    } else {
        paginationContainer.innerHTML = '';
    }
}

// ********************************************
// * LÓGICA DE STREAMING CON TMDB *
// ********************************************

// Función para obtener la disponibilidad de streaming de TMDB
async function getStreamingInfo(id, type) {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const providersUrl = `${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;

    try {
        const providersResponse = await fetch(providersUrl);
        const providersData = await providersResponse.json();

        if (providersData.results) {
            return providersData.results;
        }

        throw new Error('No hay información de streaming disponible en TMDB.');

    } catch (error) {
        console.error('❌ Error al obtener proveedores de streaming:', error);
        throw error;
    }
}


// Actualizar modal con información de streaming - VERSIÓN TMDB
function updateModalWithStreamingInfo(streamingData) {
    let platformsHTML = '';

    // Priorizamos AR (Argentina) y usamos US (EE. UU.) como respaldo
    const countryData = streamingData.AR || streamingData.US;

    if (countryData) {
        const countryName = streamingData.AR ? 'Argentina' : (streamingData.US ? 'EE. UU. (Fallback)' : 'Región no definida');

        platformsHTML = `
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming (${countryName})</h3>
            <div class="platforms-grid">
        `;

        let hasPlatforms = false;

        // Función auxiliar para generar HTML de plataformas
        const appendPlatforms = (platformList, type) => {
            if (platformList) {
                platformList.forEach(service => {
                    hasPlatforms = true;
                    const platformName = service.provider_name;

                    // Mapeo simple de tipo y clase
                    let typeText = 'SUSCRIPCIÓN';
                    let typeClass = 'availability-stream';

                    if (type === 'rent') { typeText = 'ALQUILER'; typeClass = 'availability-rent'; }
                    if (type === 'buy') { typeText = 'COMPRA'; typeClass = 'availability-buy'; }

                    // URL del logo del proveedor. Usamos w92 para un tamaño optimizado.
                    const logoBaseUrl = 'https://image.tmdb.org/t/p/w92';
                    const logoUrl = service.logo_path ? logoBaseUrl + service.logo_path : '';

                    // Usamos un contenedor y el onerror para manejar el fallback al texto
                    platformsHTML += `
                        <div class="platform-item">
                            <div class="platform-logo-container">
                                <img src="${logoUrl}" alt="${platformName} Logo" class="platform-logo-img" 
                                     onerror="this.style.display='none'; this.closest('.platform-logo-container').innerHTML = '<div class=\\'platform-logo-text\\'>${platformName.substring(0, 2).toUpperCase()}</div>';">
                            </div>
                            <div class="platform-name">${platformName}</div>
                            <div class="platform-type">${type.toUpperCase()}</div>
                            <div class="availability-badge ${typeClass}">
                                ${typeText}
                            </div>
                        </div>
                    `;
                });
            }
        };

        // flatrate (suscripción)
        appendPlatforms(countryData.flatrate, 'flatrate');
        // rent (alquiler)
        appendPlatforms(countryData.rent, 'rent');
        // buy (compra)
        appendPlatforms(countryData.buy, 'buy');

        platformsHTML += `</div>`;

        if (!hasPlatforms) {
            platformsHTML = `<h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3><div class="no-results" style="padding: 20px;">No disponible para streaming, alquiler o compra en la región seleccionada.</div>`;
        }

    } else {
        platformsHTML = `
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
            <div style="text-align: center; padding: 20px;">
                <p>🔍 Información no disponible</p>
                <p style="font-size: 0.9rem; color: var(--gray-color); margin-top: 10px;">
                    No hay información detallada de streaming para Argentina o EE. UU.
                </p>
            </div>
        `;
    }

    // Actualizar la sección de plataformas
    const platformsSection = document.querySelector('.platforms-section');
    if (platformsSection) {
        platformsSection.innerHTML = platformsHTML;
    } else {
        const detailInfo = document.querySelector('.detail-info');
        if (detailInfo) {
            const newPlatformsSection = document.createElement('div');
            newPlatformsSection.className = 'platforms-section';
            newPlatformsSection.innerHTML = platformsHTML;
            detailInfo.appendChild(newPlatformsSection);
        }
    }
}


// Mostrar detalles de película/serie (Ahora usa TMDB ID)
async function showMovieDetails(id, type) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles...</div>';
    movieModal.style.display = 'block';

    const mediaType = type === 'movie' ? 'movie' : 'tv';

    try {
        // Cargar detalles básicos de TMDB
        const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=credits,external_ids`;
        const detailsResponse = await fetch(detailsUrl);
        const details = await detailsResponse.json();

        if (details.id) {
            displayMovieDetails(details, mediaType);

            // Cargar información de streaming
            try {
                const streamingData = await getStreamingInfo(id, mediaType);
                updateModalWithStreamingInfo(streamingData);
            } catch (streamingError) {
                console.error('Error al cargar información de streaming:', streamingError);
                showStreamingError(streamingError.message);
            }
        } else {
            detailContainer.innerHTML = '<div class="error">Error al cargar los detalles</div>';
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        detailContainer.innerHTML = '<div class="error">Error al cargar los detalles</div>';
    }
}

// Mostrar error de streaming
function showStreamingError(errorMessage = '') {
    const errorHTML = `
        <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
        <div style="text-align: center; padding: 20px; background: #333; border-radius: 8px;">
            <p style="color: var(--primary-color); font-weight: bold;">⚠️ Información limitada (TMDB)</p>
            <p style="font-size: 0.9rem; color: #ccc; margin-top: 10px;">
                No se pudo cargar información detallada de streaming.
            </p>
            ${errorMessage ? `<p style="font-size: 0.8rem; color: var(--gray-color); margin-top: 5px;">Error técnico: ${errorMessage}</p>` : ''}
            
            <div style="margin-top: 15px; padding: 15px; background: #222; border-radius: 5px;">
                <p style="font-size: 0.9rem; color: #fff; font-weight: bold;">💡 ¿Por qué pasa esto?</p>
                <ul style="text-align: left; font-size: 0.8rem; color: #ccc; margin-top: 10px; padding-left: 20px;">
                    <li>TMDB no encontró el ID de streaming para esta película.</li>
                    <li>No hay proveedores de *streaming* definidos para la región (AR/US).</li>
                    <li>Puede ser contenido muy reciente o muy antiguo.</li>
                </ul>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #1a1a1a; border-radius: 5px;">
                <p style="font-size: 0.8rem; color: var(--success-color);">🎯 <strong>Prueba con:</strong></p>
                <p style="font-size: 0.7rem; color: var(--gray-color); margin-top: 5px;">
                    "Avengers: Endgame", "Stranger Things", "The Batman"
                </p>
            </div>
        </div>
    `;

    const platformsSection = document.querySelector('.platforms-section');
    if (platformsSection) {
        platformsSection.innerHTML = errorHTML;
    } else {
        const detailInfo = document.querySelector('.detail-info');
        if (detailInfo) {
            const newPlatformsSection = document.createElement('div');
            newPlatformsSection.className = 'platforms-section';
            newPlatformsSection.innerHTML = errorHTML;
            detailInfo.appendChild(newPlatformsSection);
        }
    }
}

// Mostrar detalles de película/serie en el modal (Adaptado a TMDB)
function displayMovieDetails(details, type) {
    const mediaTypeDisplay = type === 'movie' ? 'Película' : 'Serie';

    // TMDB Poster
    const poster = details.poster_path ? TMDB_IMAGE_BASE_URL + details.poster_path : PLACEHOLDER_IMAGE;

    // TMDB Meta
    const year = (type === 'movie' ? details.release_date : details.first_air_date) ? (type === 'movie' ? details.release_date.substring(0, 4) : details.first_air_date.substring(0, 4)) : 'N/A';
    const runtime = type === 'movie' ? (details.runtime ? `${details.runtime} min` : 'N/A') : (details.episode_run_time && details.episode_run_time.length > 0 ? `${details.episode_run_time[0]} min` : 'N/A');
    const title = details.title || details.name;
    const overview = details.overview || 'No hay sinopsis disponible.';

    // TMDB Ratings (usa vote_average)
    let ratingsHTML = '';
    if (details.vote_average) {
        ratingsHTML = `
            <div class="detail-rating">
                <span class="star">★</span>
                <span>${details.vote_average.toFixed(1)} / 10</span>
                <span class="rating-source">(TMDB)</span>
            </div>
        `;
    } else {
        ratingsHTML = '<div class="detail-rating">No hay calificaciones disponibles</div>';
    }

    // TMDB Genre
    const genres = details.genres && details.genres.length > 0 ? details.genres.map(g => g.name).join(', ') : 'N/A';

    // TMDB Director/Creators
    const credits = details.credits || {};
    const crew = credits.crew || [];
    const director = type === 'movie' ? crew.find(member => member.job === 'Director') : crew.find(member => member.job === 'Executive Producer');
    const directorName = director ? director.name : 'N/A';

    // TMDB Actors (Cast)
    const cast = credits.cast || [];
    const actorsList = cast.slice(0, 5).map(actor => actor.name).join(', ') || 'N/A';

    // Sección de plataformas (se actualizará después)
    const platformsHTML = `
        <div class="platforms-section">
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
            <div class="loading">
                <p>🔍 Buscando en plataformas...</p>
                <p style="font-size: 0.8rem; color: var(--gray-color); margin-top: 5px;">
                    Consultando The Movie Database (TMDB)...
                </p>
            </div>
        </div>
    `;

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${poster}" alt="${title}" 
                 onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            <div class="detail-meta">
                <span class="meta-item">${year}</span>
                <span class="meta-item">${mediaTypeDisplay}</span>
                <span class="meta-item">${runtime}</span>
                <span class="meta-item">${details.tagline || details.status || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Género:</span>
                <span class="detail-info-content">${genres}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">${type === 'movie' ? 'Director' : 'Creador'}:</span>
                <span class="detail-info-content">${directorName}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Reparto:</span>
                <span class="detail-info-content">${actorsList}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Calificaciones:</span>
                <span class="detail-info-content">${ratingsHTML}</span>
            </div>
            
            <div class="detail-overview">
                <h3>Sinopsis</h3>
                <p>${overview}</p>
            </div>
            
            ${platformsHTML}
        </div>
    `;
}

// ********************************************
// * Lógica de Actores con TMDB (Filmografía Completa) *
// ********************************************

// Mostrar detalles de actor (Ahora usa TMDB ID)
async function showActorDetails(id, name) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles del actor...</div>';
    movieModal.style.display = 'block';

    try {
        const detailsUrl = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=es-ES`;
        // Este endpoint devuelve todas las películas/series del actor
        const creditsUrl = `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}&language=es-ES`;

        const [detailsResponse, creditsResponse] = await Promise.all([
            fetch(detailsUrl),
            fetch(creditsUrl)
        ]);

        const details = await detailsResponse.json();
        const credits = await creditsResponse.json();

        if (details.id) {
            displayActorDetails(details, credits);
        } else {
            detailContainer.innerHTML = '<div class="error">Error al cargar los detalles del actor</div>';
        }
    } catch (error) {
        console.error('Error al cargar detalles del actor:', error);
        detailContainer.innerHTML = '<div class="error">Error al cargar los detalles del actor</div>';
    }
}

// Mostrar detalles del actor en el modal (Adaptado a TMDB)
function displayActorDetails(actor, credits) {
    const photo = actor.profile_path ? TMDB_IMAGE_BASE_URL + actor.profile_path : PLACEHOLDER_IMAGE;

    // Filtramos y ordenamos la filmografía (SOLUCIÓN AL REQUERIMIENTO DEL USUARIO)
    const filmography = credits.cast
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv') // Solo películas y series
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)) // Ordenar por fecha
        .slice(0, 30); // Mostrar solo las 30 más recientes para no saturar

    const filmographyHTML = filmography.map(item => {
        const mediaType = item.media_type;
        const year = (mediaType === 'movie' ? item.release_date : item.first_air_date) ?
            (mediaType === 'movie' ? item.release_date.substring(0, 4) : item.first_air_date.substring(0, 4)) : 'N/A';
        const title = item.title || item.name;
        const poster = item.poster_path ? TMDB_IMAGE_BASE_URL + item.poster_path : PLACEHOLDER_IMAGE;

        // El click llama a showMovieDetails con el ID de TMDB y el tipo
        return `
            <div class="filmography-item" onclick="showMovieDetails(${item.id}, '${mediaType}')">
                <img src="${poster}" 
                     alt="${title}" class="filmography-poster"
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="filmography-info">
                    <div class="filmography-name">${title}</div>
                    <div class="filmography-year">${year} (${mediaType === 'movie' ? 'P' : 'S'})</div>
                </div>
            </div>
        `;
    }).join('');

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${photo}" alt="${actor.name}">
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
                <p>${actor.biography || 'No hay biografía disponible en español.'}</p>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Fecha de nacimiento:</span>
                <span class="detail-info-content">${actor.birthday || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Lugar de nacimiento:</span>
                <span class="detail-info-content">${actor.place_of_birth || 'N/A'}</span>
            </div>
            
            <div class="actor-filmography">
                <h3 class="filmography-title">Filmografía Destacada</h3>
                <div class="filmography-grid">
                    ${filmographyHTML}
                </div>
            </div>
        </div>
    `;
}

// Paginación (Adaptada para TMDB)
function displayPagination(totalResults, currentPage, totalPages) {
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.textContent = '← Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchWithTMDB(currentSearchQuery, currentPage);
        }
    });
    paginationContainer.appendChild(prevButton);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            searchWithTMDB(currentSearchQuery, currentPage);
        });
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button';
    nextButton.textContent = 'Siguiente →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchWithTMDB(currentSearchQuery, currentPage);
        }
    });
    paginationContainer.appendChild(nextButton);
}


// Inicialización (Carga contenido popular al inicio)
document.addEventListener('DOMContentLoaded', () => {
    loadInitialContent();
});
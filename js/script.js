// Configuración de APIs
const TMDB_API_KEY = 'd06b9cae7dc7f8b3e3b9b3c449f757e6'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// OMDB ya no es necesario

// Elementos del DOM
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const filterButtons = document.querySelectorAll('.filter-button');
const resultsContainer = document.getElementById('results-container');
const searchInfo = document.getElementById('search-info');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const detailContainer = document.getElementById('detail-container');
const paginationContainer = document.getElementById('pagination');

// Variables de estado
let currentSearchType = 'all';
let currentPage = 1;
let totalResults = 0;
let currentSearchQuery = '';
let isLoading = false;

// Base URL para imágenes de TMDB
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Placeholder para imágenes
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC9icj5BdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';

// Event Listeners
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentSearchType = button.dataset.type;
        if (searchInput.value.trim()) {
            currentPage = 1;
            performSearch();
        }
    });
});

closeModal.addEventListener('click', () => {
    movieModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        movieModal.style.display = 'none';
    }
});

// Funciones principales
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

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
    
    let url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
    let typeFilter = currentSearchType;
    
    // Si la búsqueda no es 'all', usamos endpoints específicos para mejor precisión
    if (typeFilter === 'movie' || typeFilter === 'series' || typeFilter === 'actor') {
        let tmdbType = typeFilter === 'series' ? 'tv' : typeFilter === 'actor' ? 'person' : 'movie';
        url = `${TMDB_BASE_URL}/search/${tmdbType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            
            // Filtramos el resultado 'multi' para ser más precisos si es necesario
            let filteredResults = data.results;
            if (currentSearchType === 'movie') {
                filteredResults = data.results.filter(item => item.media_type === 'movie');
            } else if (currentSearchType === 'series') {
                filteredResults = data.results.filter(item => item.media_type === 'tv');
            } else if (currentSearchType === 'actor') {
                filteredResults = data.results.filter(item => item.media_type === 'person');
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
        // Ignorar resultados sin tipo de medio (a veces ocurre en búsquedas multi)
        if (!item.media_type) return;

        const isMovie = item.media_type === 'movie';
        const isSeries = item.media_type === 'tv';
        const isActor = item.media_type === 'person';

        let title = item.title || item.name;
        let year = (isMovie ? item.release_date : item.first_air_date) ? (isMovie ? item.release_date.substring(0, 4) : item.first_air_date.substring(0, 4)) : 'N/A';
        let posterPath = item.poster_path || item.profile_path;
        let cardType = isActor ? 'actor-card' : 'movie-card';
        let imageClass = isActor ? 'actor-photo' : 'movie-poster';
        let infoClass = isActor ? 'actor-info' : 'movie-info';
        
        const poster = posterPath ? TMDB_IMAGE_BASE_URL + posterPath : PLACEHOLDER_IMAGE;

        const card = document.createElement('div');
        card.className = cardType;
        
        if (isActor) {
             const knownFor = item.known_for_department || 'Conocido por';
             const popularFor = item.known_for && item.known_for.length > 0 ? 
                                item.known_for.slice(0, 2).map(m => m.title || m.name).join(', ') : 'N/A';

             card.innerHTML = `
                <img src="${poster}" alt="${title}" class="${imageClass}" 
                    onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="${infoClass}">
                    <h3 class="actor-name">${title}</h3>
                    <div class="actor-known-for">${knownFor}</div>
                    <div class="actor-role">Pop. ${item.popularity.toFixed(0)} | Por: ${popularFor}</div>
                </div>
            `;
        } else {
            const mediaTypeDisplay = isMovie ? 'Película' : 'Serie';
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

            card.innerHTML = `
                <img src="${poster}" alt="${title}" class="${imageClass}" 
                    onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <div class="${infoClass}">
                    <h3 class="movie-title">${title}</h3>
                    <div class="movie-year">${year} • ${mediaTypeDisplay}</div>
                    <div class="movie-rating">
                        <span class="star">★</span>
                        <span>${rating}</span>
                    </div>
                </div>
            `;
        }

        card.addEventListener('click', () => {
            if (isActor) {
                showActorDetails(item.id, item.name);
            } else {
                showMovieDetails(item.id, item.media_type);
            }
        });

        resultsContainer.appendChild(card);
    });
    
    displayPagination(totalResults, currentPage, totalPages);
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
                    
                    platformsHTML += `
                        <div class="platform-item">
                            <div class="platform-logo">${platformName.substring(0, 2).toUpperCase()}</div>
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
        const detailsUrl = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=credits,external_ids,ratings`;
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

// Lógica de Actores con TMDB

// Mostrar detalles de actor (Ahora usa TMDB ID)
async function showActorDetails(id, name) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles del actor...</div>';
    movieModal.style.display = 'block';

    try {
        const detailsUrl = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=es-ES`;
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

    const filmography = credits.cast
        .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        .slice(0, 15);
    
    const filmographyHTML = filmography.map(item => {
        const mediaType = item.media_type;
        const year = (mediaType === 'movie' ? item.release_date : item.first_air_date) ? 
                     (mediaType === 'movie' ? item.release_date.substring(0, 4) : item.first_air_date.substring(0, 4)) : 'N/A';
        const title = item.title || item.name;
        const poster = item.poster_path ? TMDB_IMAGE_BASE_URL + item.poster_path : PLACEHOLDER_IMAGE;

        return `
            <div class="filmography-item" onclick="showMovieDetails('${item.id}', '${mediaType}')">
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
                    <span class="stat-label">Títulos</span>
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


// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Buscador de Películas y Series iniciado');
    console.log('🚀 Usando TMDB como API única para búsqueda y streaming');
    console.log('💡 Consejo: Busca películas populares como "Avengers", "The Batman", "Stranger Things"');
});
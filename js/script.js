// Configuración de APIs
const TMDB_API_KEY = 'd06b9cae7dc7f8b3e3b9b3c449f757e6'; // ¡Necesitas una clave gratuita de TMDB!
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_API_KEY = 'ccca0c5e'; 

// URLs de las APIs
const OMDB_API_BASE_URL = 'https://www.omdbapi.com/';

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
    
    if (currentSearchType === 'actor') {
        searchActors(query, currentPage);
    } else {
        searchMoviesAndSeries(query, currentPage);
    }
}

// Búsqueda de películas y series
async function searchMoviesAndSeries(query, page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        await searchWithOMDb(query, page);
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        resultsContainer.innerHTML = '<div class="error">Error al cargar los resultados</div>';
    } finally {
        isLoading = false;
    }
}

// Búsqueda con OMDb API
async function searchWithOMDb(query, page) {
    try {
        let url = `${OMDB_API_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}`;
        
        if (currentSearchType === 'movie') {
            url += '&type=movie';
        } else if (currentSearchType === 'series') {
            url += '&type=series';
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True' && data.Search && data.Search.length > 0) {
            displayOMDbResults(data.Search);
            totalResults = parseInt(data.totalResults);
            displayPagination(totalResults, page);
            searchInfo.innerHTML = `<p>Mostrando ${data.Search.length} resultados para: <strong>"${query}"</strong></p>`;
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        }
    } catch (error) {
        console.error('Error con OMDb:', error);
        resultsContainer.innerHTML = '<div class="error">Error al cargar los resultados</div>';
    }
}

// Búsqueda de actores
async function searchActors(query, page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const url = `${OMDB_API_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True' && data.Search) {
            displayActorResults(data.Search, query);
            searchInfo.innerHTML = `<p>Mostrando resultados para el actor: <strong>"${query}"</strong></p>`;
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron actores</div>';
        }
    } catch (error) {
        console.error('Error al buscar actores:', error);
        resultsContainer.innerHTML = '<div class="error">Error al buscar actores</div>';
    } finally {
        isLoading = false;
    }
}

// Mostrar resultados de OMDb
function displayOMDbResults(results) {
    resultsContainer.innerHTML = '';

    results.forEach(item => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        const poster = item.Poster !== 'N/A' ? item.Poster : PLACEHOLDER_IMAGE;
        const title = item.Title;
        const year = item.Year;
        const type = item.Type === 'movie' ? 'Película' : 'Serie';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${title}" class="movie-poster" 
                 onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <div class="movie-year">${year} • ${type}</div>
                <div class="movie-rating">
                    <span class="star">★</span>
                    <span>Ver detalles</span>
                </div>
            </div>
        `;

        movieCard.addEventListener('click', () => {
            showMovieDetails(item.imdbID, item.Type, item.Title);
        });

        resultsContainer.appendChild(movieCard);
    });
}

// ********************************************
// * NUEVA LÓGICA DE STREAMING CON TMDB *
// ********************************************

// Función mejorada para buscar disponibilidad con TMDB
async function getStreamingInfo(imdbID, title, type) {
    console.log('🔍 Iniciando búsqueda de streaming con TMDB para:', title, `(${imdbID})`);

    // PASO 1: Obtener TMDB ID usando el imdbID
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const findUrl = `${TMDB_BASE_URL}/find/${imdbID}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    
    try {
        const findResponse = await fetch(findUrl);
        const findData = await findResponse.json();
        
        let tmdbID = null;
        
        if (mediaType === 'movie' && findData.movie_results && findData.movie_results.length > 0) {
            tmdbID = findData.movie_results[0].id;
        } else if (mediaType === 'tv' && findData.tv_results && findData.tv_results.length > 0) {
            tmdbID = findData.tv_results[0].id;
        }

        if (!tmdbID) {
            throw new Error('No se pudo encontrar el TMDB ID (No hay información de streaming).');
        }

        // PASO 2: Obtener los proveedores de streaming
        const providersUrl = `${TMDB_BASE_URL}/${mediaType}/${tmdbID}/watch/providers?api_key=${TMDB_API_KEY}`;
        const providersResponse = await fetch(providersUrl);
        const providersData = await providersResponse.json();

        if (providersData.results) {
            console.log('✅ Éxito con TMDB.');
            // Devolvemos todos los resultados de los países
            return providersData.results; 
        }

        throw new Error('No hay información de streaming disponible en TMDB.');

    } catch (error) {
        console.error('❌ Error en TMDB:', error);
        throw error;
    }
}


// Actualizar modal con información de streaming - VERSIÓN TMDB
function updateModalWithStreamingInfo(streamingData) {
    console.log('🎬 Procesando datos de streaming TMDB:', streamingData);
    
    let platformsHTML = '';
    
    // Priorizamos AR (Argentina) y usamos US (EE. UU.) como respaldo
    const countryData = streamingData.AR || streamingData.US; 
    
    if (countryData) {
        const countryName = streamingData.AR ? 'Argentina' : 'EE. UU.';
        
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
                            <div class="platform-logo">${platformName.substring(0, 2)}</div>
                            <div class="platform-name">${platformName}</div>
                            <div class="platform-type">${type}</div>
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
                <p>🔍 Información limitada</p>
                <p style="font-size: 0.9rem; color: var(--gray-color); margin-top: 10px;">
                    No hay información detallada de streaming disponible para Argentina o EE. UU.
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


// Funciones auxiliares (Se mantienen igual)
function getPlatformName(platform) { /* ... */ }
function getServiceTypeText(type) { /* ... */ }
function getServiceTypeClass(type) { /* ... */ }

// Mostrar detalles de película/serie
async function showMovieDetails(imdbID, type, title = '') {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles...</div>';
    movieModal.style.display = 'block';

    try {
        // Cargar detalles básicos de OMDb
        const detailsUrl = `${OMDB_API_BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;
        const detailsResponse = await fetch(detailsUrl);
        const details = await detailsResponse.json();

        if (details.Response === 'True') {
            displayMovieDetails(details, type);
            
            // Cargar información de streaming (AHORA CON TMDB)
            try {
                const streamingData = await getStreamingInfo(imdbID, details.Title, details.Type);
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
            <p style="color: #e50914; font-weight: bold;">⚠️ Información limitada (TMDB)</p>
            <p style="font-size: 0.9rem; color: #ccc; margin-top: 10px;">
                No se pudo cargar información detallada de streaming.
            </p>
            ${errorMessage ? `<p style="font-size: 0.8rem; color: #999; margin-top: 5px;">Error técnico: ${errorMessage}</p>` : ''}
            
            <div style="margin-top: 15px; padding: 15px; background: #222; border-radius: 5px;">
                <p style="font-size: 0.9rem; color: #fff; font-weight: bold;">💡 ¿Por qué pasa esto?</p>
                <ul style="text-align: left; font-size: 0.8rem; color: #ccc; margin-top: 10px; padding-left: 20px;">
                    <li>TMDB no encontró el ID de streaming para esta película.</li>
                    <li>No hay proveedores de *streaming* definidos para la región (AR/US).</li>
                    <li>Puede ser contenido muy reciente o muy antiguo.</li>
                </ul>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: #1a1a1a; border-radius: 5px;">
                <p style="font-size: 0.8rem; color: #46d369;">🎯 <strong>Prueba con:</strong></p>
                <p style="font-size: 0.7rem; color: #999; margin-top: 5px;">
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

// Mostrar detalles de película/serie en el modal (Se mantiene igual)
function displayMovieDetails(details, type) { /* ... */ }

// Mostrar resultados de actores (Se mantiene igual)
function displayActorResults(results, actorName) { /* ... */ }

// Mostrar detalles de actor (Se mantiene igual)
function showActorDetails(actor, filmography) { /* ... */ }

// Mostrar detalles del actor en el modal (Se mantiene igual)
function displayActorDetails(actor, filmography) { /* ... */ }

// Paginación (Se mantiene igual)
function displayPagination(totalResults, currentPage) { /* ... */ }

// Inicialización (Se mantiene igual)
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Buscador de Películas y Series iniciado');
    console.log('🔑 OMDB Key configurada');
    console.log('💡 Consejo: Busca películas populares como "Avengers", "The Batman", "Stranger Things"');
    console.log('🚀 Usando TMDB para obtener información de streaming');
});
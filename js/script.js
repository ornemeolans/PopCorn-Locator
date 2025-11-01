// Configuración de APIs
const RAPID_API_KEY = '4665cc51admshaf1d084c7ce0127p162dfbjsn87a99f17fc12';
const RAPID_API_HOST = 'streaming-availability.p.rapidapi.com';
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

// Búsqueda por ID (método más confiable)
async function searchStreamingById(imdbId, type) {
    try {
        const url = `https://${RAPID_API_HOST}/get?imdb_id=${imdbId}&country=es`;
        
        console.log('Buscando streaming por ID:', imdbId, type);
        console.log('URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPID_API_KEY,
                'x-rapidapi-host': RAPID_API_HOST
            }
        });

        console.log('Respuesta HTTP:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos recibidos de RapidAPI:', data);
        
        return data;
    } catch (error) {
        console.error('Error buscando por ID:', error);
        
        // Manejo específico de errores
        if (error.message.includes('429')) {
            throw new Error('Límite de solicitudes excedido. Intenta más tarde.');
        } else if (error.message.includes('401')) {
            throw new Error('Error de autenticación con la API.');
        } else if (error.message.includes('404')) {
            throw new Error('Contenido no encontrado en la base de datos de streaming.');
        } else {
            throw error;
        }
    }
}

// Método alternativo por título (como respaldo)
async function searchStreamingByTitle(title, type) {
    try {
        const showType = type === 'movie' ? 'movie' : 'series';
        const url = `https://${RAPID_API_HOST}/v2/search/title?title=${encodeURIComponent(title)}&country=es&show_type=${showType}&output_language=es`;
        
        console.log('Buscando streaming por título (respaldo):', title, showType);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPID_API_KEY,
                'x-rapidapi-host': RAPID_API_HOST
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error buscando por título:', error);
        throw error;
    }
}

// Actualizar modal con información de streaming
function updateModalWithStreamingInfo(streamingData) {
    console.log('Datos de streaming recibidos:', streamingData);
    
    let platformsHTML = '';
    
    if (streamingData && streamingData.result) {
        const result = streamingData.result;
        
        if (result.streamingInfo && result.streamingInfo.es) {
            const platforms = result.streamingInfo.es;
            
            platformsHTML = `
                <h3 class="platforms-title">🎬 Disponibilidad en Streaming (España)</h3>
                <div class="platforms-grid">
            `;
            
            Object.entries(platforms).forEach(([platform, services]) => {
                services.forEach(service => {
                    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
                    const typeText = service.type === 'stream' ? 'STREAM' : 
                                    service.type === 'rent' ? 'ALQUILER' : 'COMPRA';
                    const typeClass = service.type === 'stream' ? 'availability-stream' : 
                                     service.type === 'rent' ? 'availability-rent' : 'availability-buy';
                    
                    platformsHTML += `
                        <div class="platform-item">
                            <div class="platform-logo">${platform.substring(0, 2).toUpperCase()}</div>
                            <div class="platform-name">${platformName}</div>
                            <div class="platform-type">${service.type}</div>
                            <div class="availability-badge ${typeClass}">
                                ${typeText}
                            </div>
                            ${service.price ? `<div style="font-size: 10px; margin-top: 3px; color: #fff;">${service.price.formatted || service.price}</div>` : ''}
                            ${service.quality ? `<div style="font-size: 9px; color: var(--gray-color);">Calidad: ${service.quality}</div>` : ''}
                        </div>
                    `;
                });
            });
            
            platformsHTML += `</div>`;
        } else {
            platformsHTML = `
                <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
                <div style="text-align: center; padding: 20px;">
                    <p>ℹ️ Información disponible, pero no en plataformas españolas.</p>
                    <p style="font-size: 0.9rem; color: var(--gray-color); margin-top: 10px;">
                        Este contenido está disponible en otros países pero no en España.
                    </p>
                </div>
            `;
        }
    } else {
        platformsHTML = `
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
            <div style="text-align: center; padding: 20px;">
                <p>🔍 No se encontró información de streaming.</p>
                <p style="font-size: 0.9rem; color: var(--gray-color); margin-top: 10px;">
                    Esta película/serie no está disponible en las principales plataformas de streaming,
                    o la información no está disponible en la base de datos.
                </p>
            </div>
        `;
    }
    
    // Buscar y actualizar la sección de plataformas
    const platformsSection = document.querySelector('.platforms-section');
    if (platformsSection) {
        platformsSection.innerHTML = platformsHTML;
    } else {
        console.warn('No se encontró la sección de plataformas en el modal');
        // Crear la sección si no existe
        const detailInfo = document.querySelector('.detail-info');
        if (detailInfo) {
            const newPlatformsSection = document.createElement('div');
            newPlatformsSection.className = 'platforms-section';
            newPlatformsSection.innerHTML = platformsHTML;
            detailInfo.appendChild(newPlatformsSection);
        }
    }
}

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
            
            // Cargar información de streaming por ID (método principal)
            try {
                console.log('Buscando información de streaming para ID:', imdbID, type);
                
                const streamingData = await searchStreamingById(imdbID, type);
                updateModalWithStreamingInfo(streamingData);
                
            } catch (streamingError) {
                console.error('Error con búsqueda por ID, intentando por título:', streamingError);
                
                // Fallback: buscar por título
                try {
                    const searchTitle = details.Title;
                    const streamingData = await searchStreamingByTitle(searchTitle, type);
                    updateModalWithStreamingInfo(streamingData);
                } catch (titleError) {
                    console.error('Error también con búsqueda por título:', titleError);
                    showStreamingError(streamingError.message);
                }
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
    const platformsSection = document.querySelector('.platforms-section');
    const errorHTML = `
        <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
        <div style="text-align: center; padding: 20px; background: #333; border-radius: 8px;">
            <p style="color: #e50914; font-weight: bold;">❌ No se pudo cargar la información</p>
            ${errorMessage ? `<p style="font-size: 0.9rem; color: #ccc; margin-top: 10px;">Error: ${errorMessage}</p>` : ''}
            <p style="font-size: 0.9rem; margin-top: 10px; color: #ccc;">
                Posibles causas:
            </p>
            <ul style="text-align: left; font-size: 0.8rem; color: #999; margin-top: 10px; padding-left: 20px;">
                <li>El contenido no está en la base de datos de streaming</li>
                <li>Problema temporal con el servicio</li>
                <li>Límite de solicitudes alcanzado</li>
                <li>La película/serie es muy reciente o antigua</li>
            </ul>
            <p style="font-size: 0.8rem; color: #999; margin-top: 15px;">
                💡 <strong>Solución:</strong> Intenta con películas más populares o recientes.
            </p>
        </div>
    `;
    
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

// Mostrar detalles de película/serie en el modal
function displayMovieDetails(details, type) {
    const poster = details.Poster !== 'N/A' ? details.Poster : PLACEHOLDER_IMAGE;
    const mediaType = details.Type === 'movie' ? 'Película' : 'Serie';

    // Procesar ratings
    let ratingsHTML = '';
    if (details.Ratings && details.Ratings.length > 0) {
        ratingsHTML = details.Ratings.map(rating => `
            <div class="detail-rating">
                <span class="star">★</span>
                <span>${rating.Value}</span>
                <span class="rating-source">(${rating.Source})</span>
            </div>
        `).join('');
    } else {
        ratingsHTML = '<div class="detail-rating">No hay calificaciones disponibles</div>';
    }

    // Sección de plataformas (se actualizará con RapidAPI)
    const platformsHTML = `
        <div class="platforms-section">
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
            <div class="loading">
                <p>🔍 Buscando en plataformas...</p>
                <p style="font-size: 0.8rem; color: var(--gray-color); margin-top: 5px;">
                    Consultando Netflix, Amazon Prime, Disney+ y más
                </p>
            </div>
        </div>
    `;

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${poster}" alt="${details.Title}" 
                 onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${details.Title}</h1>
            <div class="detail-meta">
                <span class="meta-item">${details.Year}</span>
                <span class="meta-item">${mediaType}</span>
                <span class="meta-item">${details.Runtime || 'N/A'}</span>
                <span class="meta-item">${details.Rated || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Género:</span>
                <span class="detail-info-content">${details.Genre || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Director:</span>
                <span class="detail-info-content">${details.Director || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Reparto:</span>
                <span class="detail-info-content">${details.Actors || 'N/A'}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Calificaciones:</span>
                <span class="detail-info-content">${ratingsHTML}</span>
            </div>
            
            <div class="detail-overview">
                <h3>Sinopsis</h3>
                <p>${details.Plot || 'No hay sinopsis disponible.'}</p>
            </div>
            
            ${platformsHTML}
        </div>
    `;
}

// Mostrar resultados de actores
function displayActorResults(results, actorName) {
    resultsContainer.innerHTML = '';

    const actorResults = [
        {
            id: 1,
            name: actorName,
            knownFor: 'Actor/Actriz',
            popularity: 'Alta',
            photo: PLACEHOLDER_IMAGE,
            movies: results.slice(0, 6)
        }
    ];

    actorResults.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';
        
        actorCard.innerHTML = `
            <img src="${actor.photo}" alt="${actor.name}" class="actor-photo">
            <div class="actor-info">
                <h3 class="actor-name">${actor.name}</h3>
                <div class="actor-known-for">${actor.knownFor}</div>
                <div class="actor-role">Popularidad: ${actor.popularity}</div>
                <div class="actor-role">Conocido por: ${actor.movies.map(m => m.Title).join(', ')}</div>
            </div>
        `;

        actorCard.addEventListener('click', () => {
            showActorDetails(actor, actor.movies);
        });

        resultsContainer.appendChild(actorCard);
    });
}

// Mostrar detalles de actor
function showActorDetails(actor, filmography) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles del actor...</div>';
    movieModal.style.display = 'block';

    const actorDetails = {
        name: actor.name,
        bio: `${actor.name} es un actor conocido por sus papeles en diversas producciones cinematográficas y televisivas.`,
        birthDate: 'Información no disponible',
        birthPlace: 'Información no disponible',
        popularity: 'Alta',
        knownFor: actor.knownFor,
        moviesCount: filmography.length
    };

    displayActorDetails(actorDetails, filmography);
}

// Mostrar detalles del actor en el modal
function displayActorDetails(actor, filmography) {
    const photo = PLACEHOLDER_IMAGE;

    const filmographyHTML = filmography.map(movie => `
        <div class="filmography-item" onclick="showMovieDetails('${movie.imdbID}', '${movie.Type}', '${movie.Title}')">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : PLACEHOLDER_IMAGE}" 
                 alt="${movie.Title}" class="filmography-poster">
            <div class="filmography-info">
                <div class="filmography-name">${movie.Title}</div>
                <div class="filmography-year">${movie.Year}</div>
            </div>
        </div>
    `).join('');

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${photo}" alt="${actor.name}">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${actor.name}</h1>
            
            <div class="actor-stats">
                <div class="stat-item">
                    <span class="stat-value">${actor.moviesCount}</span>
                    <span class="stat-label">Películas/Series</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${actor.popularity}</span>
                    <span class="stat-label">Popularidad</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${actor.knownFor}</span>
                    <span class="stat-label">Conocido por</span>
                </div>
            </div>
            
            <div class="actor-bio">
                <h3>Biografía</h3>
                <p>${actor.bio}</p>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Fecha de nacimiento:</span>
                <span class="detail-info-content">${actor.birthDate}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Lugar de nacimiento:</span>
                <span class="detail-info-content">${actor.birthPlace}</span>
            </div>
            
            <div class="actor-filmography">
                <h3 class="filmography-title">Filmografía</h3>
                <div class="filmography-grid">
                    ${filmographyHTML}
                </div>
            </div>
        </div>
    `;
}

// Paginación
function displayPagination(totalResults, currentPage) {
    const totalPages = Math.ceil(totalResults / 10);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button';
    prevButton.textContent = '← Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            if (currentSearchType === 'actor') {
                searchActors(currentSearchQuery, currentPage);
            } else {
                searchMoviesAndSeries(currentSearchQuery, currentPage);
            }
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
            if (currentSearchType === 'actor') {
                searchActors(currentSearchQuery, currentPage);
            } else {
                searchMoviesAndSeries(currentSearchQuery, currentPage);
            }
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
            if (currentSearchType === 'actor') {
                searchActors(currentSearchQuery, currentPage);
            } else {
                searchMoviesAndSeries(currentSearchQuery, currentPage);
            }
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Buscador de Películas y Series iniciado');
    console.log('RapidAPI Key configurada');
    console.log('💡 Consejo: Busca películas populares como "Avengers", "The Batman", "Stranger Things"');
    console.log('🔧 Método principal: Búsqueda por ID de IMDb');
});
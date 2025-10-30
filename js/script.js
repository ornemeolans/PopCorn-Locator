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
        
        // CORRECCIÓN: Usar placeholder si la imagen no carga
        const poster = item.Poster !== 'N/A' ? item.Poster : 
                      'https://via.placeholder.com/300x450/333333/FFFFFF?text=Poster+No+Disponible';
        const title = item.Title;
        const year = item.Year;
        const type = item.Type === 'movie' ? 'Película' : 'Serie';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${title}" class="movie-poster" 
                 onerror="this.src='https://via.placeholder.com/300x450/333333/FFFFFF?text=Error+Al+Cargar'">
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
            showMovieDetails(item.imdbID, item.Type);
        });

        resultsContainer.appendChild(movieCard);
    });
}

// Obtener información de streaming usando XMLHttpRequest (CORREGIDO para CORS)
function getStreamingInfo(imdbId, type) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // CORRECCIÓN: Quitar withCredentials para evitar problemas de CORS
        xhr.withCredentials = false;

        xhr.addEventListener('readystatechange', function () {
            if (this.readyState === this.DONE) {
                console.log('Estado:', this.status, this.statusText);
                console.log('Respuesta de RapidAPI:', this.responseText);
                
                if (this.status === 200) {
                    try {
                        const response = JSON.parse(this.responseText);
                        resolve(response);
                    } catch (error) {
                        console.error('Error al procesar información de streaming:', error);
                        reject(error);
                    }
                } else {
                    console.error('Error en la solicitud:', this.status, this.statusText);
                    reject(new Error(`Error ${this.status}: ${this.statusText}`));
                }
            }
        });

        xhr.addEventListener('error', function() {
            console.error('Error de conexión con RapidAPI');
            reject(new Error('Error de conexión'));
        });

        // URL corregida
        const url = `https://streaming-availability.p.rapidapi.com/shows/${type}/${imdbId}?country=es`;
        
        console.log('Solicitando información de streaming para:', imdbId, type);
        console.log('URL:', url);
        
        xhr.open('GET', url);
        xhr.setRequestHeader('x-rapidapi-key', RAPID_API_KEY);
        xhr.setRequestHeader('x-rapidapi-host', RAPID_API_HOST);

        xhr.send();
    });
}

// ALTERNATIVA: Usar fetch API que maneja mejor CORS
async function getStreamingInfoFetch(imdbId, type) {
    try {
        const url = `https://streaming-availability.p.rapidapi.com/shows/${type}/${imdbId}?country=es`;
        
        console.log('Solicitando información de streaming (fetch):', imdbId, type);
        
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
        console.error('Error con fetch:', error);
        throw error;
    }
}

// Actualizar modal con información de streaming
function updateModalWithStreamingInfo(streamingData) {
    console.log('Datos de streaming recibidos:', streamingData);
    
    let platformsHTML = '';
    
    if (streamingData && streamingData.streamingInfo && streamingData.streamingInfo.es) {
        const platforms = streamingData.streamingInfo.es;
        
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
                <p>⚠️ No disponible en plataformas de streaming en España.</p>
                <p style="font-size: 0.9rem; color: var(--gray-color); margin-top: 10px;">
                    Esta película/serie no está disponible en las principales plataformas de streaming en España,
                    o la información no está disponible en este momento.
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
async function showMovieDetails(imdbID, type) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles...</div>';
    movieModal.style.display = 'block';

    try {
        // Cargar detalles básicos de OMDb
        const detailsUrl = `${OMDB_API_BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;
        const detailsResponse = await fetch(detailsUrl);
        const details = await detailsResponse.json();

        if (details.Response === 'True') {
            displayMovieDetails(details, type);
            
            // Intentar cargar información de streaming (usar fetch como alternativa)
            try {
                console.log('Obteniendo información de streaming para:', imdbID, type);
                
                // Probar primero con fetch (mejor manejo de CORS)
                const streamingData = await getStreamingInfoFetch(imdbID, type);
                updateModalWithStreamingInfo(streamingData);
                
            } catch (streamingError) {
                console.error('Error con fetch, intentando con XMLHttpRequest:', streamingError);
                
                // Fallback a XMLHttpRequest
                try {
                    const streamingData = await getStreamingInfo(imdbID, type);
                    updateModalWithStreamingInfo(streamingData);
                } catch (xhrError) {
                    console.error('Error también con XMLHttpRequest:', xhrError);
                    showStreamingError();
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
function showStreamingError() {
    const platformsSection = document.querySelector('.platforms-section');
    const errorHTML = `
        <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
        <div class="error" style="padding: 20px; text-align: center;">
            <p>❌ No se pudo cargar la información de plataformas</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">
                Posibles causas:
            </p>
            <ul style="text-align: left; font-size: 0.8rem; color: var(--gray-color); margin-top: 10px;">
                <li>Problema de conexión a internet</li>
                <li>La API de streaming no tiene información para este contenido</li>
                <li>Límite de solicitudes alcanzado en RapidAPI</li>
            </ul>
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
    const poster = details.Poster !== 'N/A' ? details.Poster : 
                  'https://via.placeholder.com/500x750/333333/FFFFFF?text=Imagen+No+Disponible';
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
                <p>🔍 Buscando información de plataformas...</p>
                <p style="font-size: 0.8rem; color: var(--gray-color); margin-top: 5px;">
                    Consultando disponibilidad en España
                </p>
            </div>
        </div>
    `;

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${poster}" alt="${details.Title}" 
                 onerror="this.src='https://via.placeholder.com/500x750/333333/FFFFFF?text=Error+Al+Cargar'">
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

// [Las funciones restantes se mantienen igual...]
// Mostrar resultados de actores, mostrar detalles de actor, paginación, etc.

// Mostrar resultados de actores
function displayActorResults(results, actorName) {
    resultsContainer.innerHTML = '';

    const actorResults = [
        {
            id: 1,
            name: actorName,
            knownFor: 'Actor/Actriz',
            popularity: 'Alta',
            photo: 'https://via.placeholder.com/500x750/333333/FFFFFF?text=Actor',
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
    const photo = 'https://via.placeholder.com/500x750/333333/FFFFFF?text=Actor';

    const filmographyHTML = filmography.map(movie => `
        <div class="filmography-item" onclick="showMovieDetails('${movie.imdbID}', '${movie.Type}')">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/150x225/333333/FFFFFF?text=Poster'}" 
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
});
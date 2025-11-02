// Configuración de APIs
const TMDB_API_KEY = 'd06b9cae7dc7f8b3e3b9b3c449f757e6';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

// Búsqueda de películas y series con TMDB
async function searchMoviesAndSeries(query, page = 1) {
    if (isLoading) return;

    isLoading = true;

    try {
        let url;
        if (currentSearchType === 'all') {
            url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
        } else if (currentSearchType === 'movie') {
            url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
        } else if (currentSearchType === 'series') {
            url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayTMDBResults(data.results);
            totalResults = data.total_results;
            displayPagination(totalResults, page);
            searchInfo.innerHTML = `<p>Mostrando ${data.results.length} resultados para: <strong>"${query}"</strong></p>`;
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        resultsContainer.innerHTML = '<div class="error">Error al cargar los resultados</div>';
    } finally {
        isLoading = false;
    }
}

// Búsqueda de actores con TMDB
async function searchActors(query, page = 1) {
    if (isLoading) return;

    isLoading = true;

    try {
        const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayActorResults(data.results);
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

// Mostrar resultados de TMDB
function displayTMDBResults(results) {
    resultsContainer.innerHTML = '';

    results.forEach(item => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        // Determinar tipo de contenido y propiedades
        const isMovie = item.media_type === 'movie' || currentSearchType === 'movie';
        const isTV = item.media_type === 'tv' || currentSearchType === 'series';

        const posterPath = item.poster_path || item.profile_path;
        const poster = posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : PLACEHOLDER_IMAGE;
        const title = item.title || item.name;
        const year = isMovie ? (item.release_date ? item.release_date.substring(0, 4) : 'N/A') :
            isTV ? (item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A') : 'N/A';
        const type = isMovie ? 'Película' : isTV ? 'Serie' : 'Persona';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

        movieCard.innerHTML = `
            <img src="${poster}" alt="${title}" class="movie-poster" 
                onerror="this.src='${PLACEHOLDER_IMAGE}'">
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <div class="movie-year">${year} • ${type}</div>
                <div class="movie-rating">
                    <span class="star">★</span>
                    <span>${rating}/10</span>
                </div>
            </div>
        `;

        movieCard.addEventListener('click', () => {
            if (isMovie) {
                showMovieDetails(item.id, 'movie', title);
            } else if (isTV) {
                showMovieDetails(item.id, 'tv', title);
            }
        });

        resultsContainer.appendChild(movieCard);
    });
}

// Mostrar resultados de actores
function displayActorResults(results) {
    resultsContainer.innerHTML = '';

    results.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'actor-card';

        const photo = actor.profile_path ? `${TMDB_IMAGE_BASE_URL}${actor.profile_path}` : PLACEHOLDER_IMAGE;
        const knownFor = actor.known_for ? actor.known_for.map(item => item.title || item.name).join(', ') : 'Actor/Actriz';

        actorCard.innerHTML = `
            <img src="${photo}" alt="${actor.name}" class="actor-photo">
            <div class="actor-info">
                <h3 class="actor-name">${actor.name}</h3>
                <div class="actor-known-for">${knownFor}</div>
                <div class="actor-role">Popularidad: ${actor.popularity ? actor.popularity.toFixed(1) : 'N/A'}</div>
            </div>
        `;

        actorCard.addEventListener('click', () => {
            showActorDetails(actor);
        });

        resultsContainer.appendChild(actorCard);
    });
}

// Obtener detalles de película/serie
async function getMovieDetails(id, type) {
    try {
        const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=credits,release_dates,watch/providers`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        throw error;
    }
}

// Obtener detalles de actor
async function getActorDetails(id) {
    try {
        const url = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=movie_credits,tv_credits`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener detalles del actor:', error);
        throw error;
    }
}

// Obtener información de streaming/proveedores
async function getStreamingInfo(id, type) {
    try {
        const url = `${TMDB_BASE_URL}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener información de streaming:', error);
        throw error;
    }
}

// Mostrar detalles de película/serie
async function showMovieDetails(id, type, title = '') {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles...</div>';
    movieModal.style.display = 'block';

    try {
        const details = await getMovieDetails(id, type);
        const streamingInfo = await getStreamingInfo(id, type);

        if (details) {
            displayMovieDetails(details, type, streamingInfo);
        } else {
            detailContainer.innerHTML = '<div class="error">Error al cargar los detalles</div>';
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        detailContainer.innerHTML = '<div class="error">Error al cargar los detalles</div>';
    }
}

// Mostrar detalles de actor
async function showActorDetails(actor) {
    detailContainer.innerHTML = '<div class="loading">Cargando detalles del actor...</div>';
    movieModal.style.display = 'block';

    try {
        const details = await getActorDetails(actor.id);

        if (details) {
            displayActorDetails(details);
        } else {
            detailContainer.innerHTML = '<div class="error">Error al cargar los detalles del actor</div>';
        }
    } catch (error) {
        console.error('Error al cargar detalles del actor:', error);
        detailContainer.innerHTML = '<div class="error">Error al cargar los detalles del actor</div>';
    }
}

// Mostrar detalles de película/serie en el modal
function displayMovieDetails(details, type, streamingInfo) {
    const poster = details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : PLACEHOLDER_IMAGE;
    const mediaType = type === 'movie' ? 'Película' : 'Serie';
    const title = details.title || details.name;
    const year = type === 'movie' ?
        (details.release_date ? details.release_date.substring(0, 4) : 'N/A') :
        (details.first_air_date ? details.first_air_date.substring(0, 4) : 'N/A');

    const runtime = type === 'movie' ?
        (details.runtime ? `${details.runtime} min` : 'N/A') :
        (details.episode_run_time && details.episode_run_time.length > 0 ?
            `${details.episode_run_time[0]} min/ep` : 'N/A');

    // Procesar géneros
    const genres = details.genres ? details.genres.map(genre => genre.name).join(', ') : 'N/A';

    // Procesar elenco
    const cast = details.credits && details.credits.cast ?
        details.credits.cast.slice(0, 5).map(person => person.name).join(', ') : 'N/A';

    // Procesar información de streaming
    const streamingHTML = generateStreamingHTML(streamingInfo);

    detailContainer.innerHTML = `
        <div class="detail-poster">
            <img src="${poster}" alt="${title}" 
                onerror="this.src='${PLACEHOLDER_IMAGE}'">
        </div>
        <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            <div class="detail-meta">
                <span class="meta-item">${year}</span>
                <span class="meta-item">${mediaType}</span>
                <span class="meta-item">${runtime}</span>
                <span class="meta-item">⭐ ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}/10</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Género:</span>
                <span class="detail-info-content">${genres}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">${type === 'movie' ? 'Director:' : 'Creador:'}</span>
                <span class="detail-info-content">${getDirectorOrCreator(details, type)}</span>
            </div>
            
            <div class="detail-info-item">
                <span class="detail-info-label">Reparto:</span>
                <span class="detail-info-content">${cast}</span>
            </div>
            
            <div class="detail-overview">
                <h3>Sinopsis</h3>
                <p>${details.overview || 'No hay sinopsis disponible.'}</p>
            </div>
            
            ${streamingHTML}
        </div>
    `;
}

// Generar HTML para información de streaming
function generateStreamingHTML(streamingInfo) {
    if (!streamingInfo || !streamingInfo.results) {
        return `
            <div class="platforms-section">
                <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
                <div style="text-align: center; padding: 20px;">
                    <p>🔍 No hay información de streaming disponible</p>
                </div>
            </div>
        `;
    }

    // Priorizar España, luego US
    const countryData = streamingInfo.results.ES || streamingInfo.results.US;

    if (!countryData) {
        return `
            <div class="platforms-section">
                <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
                <div style="text-align: center; padding: 20px;">
                    <p>🌍 No disponible en plataformas principales</p>
                </div>
            </div>
        `;
    }

    let platformsHTML = '';

    // Procesar streaming (gratis/suscripción)
    if (countryData.flatrate && countryData.flatrate.length > 0) {
        platformsHTML += `
            <h4 style="margin: 15px 0 10px 0; color: var(--success-color);">📺 Incluido en suscripción</h4>
            <div class="platforms-grid">
                ${countryData.flatrate.map(provider => `
                    <div class="platform-item">
                        <img src="${TMDB_IMAGE_BASE_URL}${provider.logo_path}" alt="${provider.provider_name}" 
                            style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div class="platform-name">${provider.provider_name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Procesar alquiler
    if (countryData.rent && countryData.rent.length > 0) {
        platformsHTML += `
            <h4 style="margin: 15px 0 10px 0; color: #ffa500;">🎬 Disponible para alquiler</h4>
            <div class="platforms-grid">
                ${countryData.rent.map(provider => `
                    <div class="platform-item">
                        <img src="${TMDB_IMAGE_BASE_URL}${provider.logo_path}" alt="${provider.provider_name}" 
                            style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div class="platform-name">${provider.provider_name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Procesar compra
    if (countryData.buy && countryData.buy.length > 0) {
        platformsHTML += `
            <h4 style="margin: 15px 0 10px 0; color: var(--secondary-color);">🛒 Disponible para compra</h4>
            <div class="platforms-grid">
                ${countryData.buy.map(provider => `
                    <div class="platform-item">
                        <img src="${TMDB_IMAGE_BASE_URL}${provider.logo_path}" alt="${provider.provider_name}" 
                            style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div class="platform-name">${provider.provider_name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (!platformsHTML) {
        return `
            <div class="platforms-section">
                <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
                <div style="text-align: center; padding: 20px;">
                    <p>🌍 No disponible en plataformas principales</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="platforms-section">
            <h3 class="platforms-title">🎬 Disponibilidad en Streaming</h3>
            ${platformsHTML}
        </div>
    `;
}

// Obtener director o creador
function getDirectorOrCreator(details, type) {
    if (type === 'movie') {
        const director = details.credits && details.credits.crew ?
            details.credits.crew.find(person => person.job === 'Director') : null;
        return director ? director.name : 'N/A';
    } else {
        const creator = details.created_by && details.created_by.length > 0 ?
            details.created_by[0].name : 'N/A';
        return creator;
    }
}

// Mostrar detalles del actor en el modal
function displayActorDetails(actor) {
    const photo = actor.profile_path ? `${TMDB_IMAGE_BASE_URL}${actor.profile_path}` : PLACEHOLDER_IMAGE;

    // Obtener filmografía combinada
    const movieCredits = actor.movie_credits ? actor.movie_credits.cast || [] : [];
    const tvCredits = actor.tv_credits ? actor.tv_credits.cast || [];
    const combinedCredits = [...movieCredits, ...tvCredits]
        .sort((a, b) => {
            const dateA = a.release_date || a.first_air_date;
            const dateB = b.release_date || b.first_air_date;
            return new Date(dateB) - new Date(dateA);
        })
        .slice(0, 12);

    const filmographyHTML = combinedCredits.map(item => {
        const poster = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : PLACEHOLDER_IMAGE;
        const title = item.title || item.name;
        const year = item.release_date ? item.release_date.substring(0, 4) :
            item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A';
        const type = item.media_type === 'movie' ? 'Película' : 'Serie';

        return `
            <div class="filmography-item" onclick="showMovieDetails('${item.id}', '${item.media_type}', '${title}')">
                <img src="${poster}" alt="${title}" class="filmography-poster">
                <div class="filmography-info">
                    <div class="filmography-name">${title}</div>
                    <div class="filmography-year">${year} • ${type}</div>
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
                    <span class="stat-value">${actor.popularity ? actor.popularity.toFixed(1) : 'N/A'}</span>
                    <span class="stat-label">Popularidad</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${combinedCredits.length}</span>
                    <span class="stat-label">Producciones</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${actor.known_for_department || 'N/A'}</span>
                    <span class="stat-label">Departamento</span>
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
            
            ${actor.deathday ? `
            <div class="detail-info-item">
                <span class="detail-info-label">Fecha de fallecimiento:</span>
                <span class="detail-info-content">${actor.deathday}</span>
            </div>
            ` : ''}
            
            <div class="actor-filmography">
                <h3 class="filmography-title">Filmografía Reciente</h3>
                <div class="filmography-grid">
                    ${filmographyHTML}
                </div>
            </div>
        </div>
    `;
}

// Paginación
function displayPagination(totalResults, currentPage) {
    const totalPages = Math.min(Math.ceil(totalResults / 20), 20); // TMDB máximo 20 páginas
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
    console.log('🎬 Buscador de Películas y Series iniciado');
    console.log('🍿 Usando The Movie Database (TMDB)');
    console.log('💡 Consejo: Busca películas populares como "Avengers", "The Batman", "Stranger Things"');
});
// ============================================
// MÓDULO DE API (api.js)
// ============================================

import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './config.js';

// ============================================
// CONFIGURACIÓN DE URLs
// ============================================
export { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL };

// ============================================
// FUNCIONES DE API
// ============================================

// Función genérica para hacer fetch
async function fetchFromAPI(endpoint, params = {}) {
    const urlParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        ...params
    });
    
    const url = `${TMDB_BASE_URL}${endpoint}?${urlParams}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    return response.json();
}

// ============================================
// SEARCH
// ============================================

// Búsqueda multi (todo en uno)
export async function searchMulti(query, page = 1) {
    return fetchFromAPI('/search/multi', {
        query,
        page
    });
}

// Búsqueda de películas
export async function searchMovies(query, page = 1) {
    return fetchFromAPI('/search/movie', {
        query,
        page
    });
}

// Búsqueda de series
export async function searchTV(query, page = 1) {
    return fetchFromAPI('/search/tv', {
        query,
        page
    });
}

// Búsqueda de personas/actores
export async function searchPeople(query, page = 1) {
    return fetchFromAPI('/search/person', {
        query,
        page
    });
}

// ============================================
// TRENDING / POPULAR
// ============================================

// Contenido popular/trending
export async function getTrending(page = 1) {
    return fetchFromAPI('/trending/all/day', { page });
}

// Películas populares
export async function getPopularMovies(page = 1) {
    return fetchFromAPI('/movie/popular', { page });
}

// Series populares
export async function getPopularTV(page = 1) {
    return fetchFromAPI('/tv/popular', { page });
}

// ============================================
// DETALLES
// ============================================

// Obtener detalles de película/serie
export async function getDetails(id, mediaType) {
    const type = mediaType === 'movie' ? 'movie' : 'tv';
    return fetchFromAPI(`/${type}/${id}`, {
        append_to_response: 'credits,external_ids'
    });
}

// Obtener detalles de actor
export async function getPersonDetails(id) {
    return fetchFromAPI(`/person/${id}`);
}

// Obtener filmografía de actor
export async function getPersonCredits(id) {
    return fetchFromAPI(`/person/${id}/combined_credits`);
}

// ============================================
// STREAMING / PROVIDERS
// ============================================

// Obtener proveedores de streaming usando el país del usuario
export async function getStreamingProviders(id, mediaType) {
    const type = mediaType === 'movie' ? 'movie' : 'tv';
    const { getStreamingRegions } = await import('./config.js');
    const regions = getStreamingRegions();
    
    // Obtener proveedores para cada región
    const promises = regions.map(region => 
        fetchFromAPI(`/${type}/${id}/watch/providers`, { watch_region: region })
            .then(data => ({ region, data }))
            .catch(() => ({ region, data: null }))
    );
    
    const results = await Promise.all(promises);
    
    // Combinar resultados, priorizando el país del usuario
    const combinedResults = {};
    
    for (const { region, data } of results) {
        if (data && data.results && data.results[region]) {
            combinedResults[region] = data.results[region];
        }
    }
    
    return { results: combinedResults };
}

// ============================================
// GÉNEROS
// ============================================

// Obtener lista de géneros
export async function getGenres(mediaType = 'movie') {
    return fetchFromAPI(`/genre/${mediaType}/list`);
}

// Obtener películas/series por género
export async function getByGenre(mediaType, genreId, page = 1) {
    const type = mediaType === 'movie' ? 'movie' : 'tv';
    return fetchFromAPI(`/discover/${type}`, {
        with_genres: genreId,
        page
    });
}

// ============================================
// SUGERENCIAS (AUTOCOMPLETADO)
// ============================================

export async function getSearchSuggestions(query) {
    if (!query || query.length < 3) return [];
    
    const data = await searchMulti(query, 1);
    
    // Filtrar y limitar resultados
    return data.results
        .filter(item => item.media_type !== 'person' && (item.title || item.name))
        .slice(0, 8);
}


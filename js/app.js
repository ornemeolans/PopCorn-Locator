// ============================================
// APLICACIÓN PRINCIPAL (app.js)
// ============================================

// Importar módulos
import * as api from './api.js';
import * as ui from './ui.js';
import { debounce, getFavorites, scrollToTop } from './utils.js';

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const state = {
    currentSearchType: 'all',      // all, movie, series, actor
    currentPage: 1,
    currentSearchQuery: '',
    isLoading: false,
    isInitialLoad: true,
    isShowingFavorites: false,
    currentGenreFilter: null,
    currentYearFilter: null,
    genres: { movie: [], tv: [] }
};

// ============================================
// INICIALIZACIÓN
// ============================================

import { detectUserCountry, getUserCountry } from './config.js';

export async function init() {
    // Primero detectar el país del usuario
    await detectUserCountry();
    
    // Cargar géneros
    await loadGenres();
    
    // Inicializar event listeners
    setupEventListeners();
    
    // Cargar contenido popular
    loadPopularContent();
}

async function loadGenres() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            api.getGenres('movie'),
            api.getGenres('tv')
        ]);
        state.genres.movie = movieGenres.genres || [];
        state.genres.tv = tvGenres.genres || [];
        
        // Llenar selectores de género
        populateGenreFilters();
        populateYearFilter();
    } catch (error) {
        console.error('Error cargando géneros:', error);
    }
}

function populateGenreFilters() {
    const genreSelect = document.getElementById('genre-filter');
    if (!genreSelect) return;
    
    const allGenres = [...state.genres.movie, ...state.genres.tv];
    // Eliminar duplicados por ID
    const uniqueGenres = allGenres.reduce((acc, g) => {
        if (!acc.find(ag => ag.id === g.id)) acc.push(g);
        return acc;
    }, []);
    
    genreSelect.innerHTML = '<option value="">Todos los géneros</option>' +
        uniqueGenres.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function populateYearFilter() {
    const yearSelect = document.getElementById('year-filter');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
    
    yearSelect.innerHTML = '<option value="">Todos los años</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Búsqueda con debounce
    ui.elements.searchInput.addEventListener('input', debounce(handleSearchInput, 300));
    
    // Búsqueda inmediata
    ui.elements.searchButton.addEventListener('click', performSearch);
    ui.elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            ui.hideSuggestions();
            performSearch();
        }
    });
    
    // Reset
    ui.elements.resetButton.addEventListener('click', resetSearch);
    
    // Filtros de tipo
    ui.elements.filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            ui.elements.filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-checked', 'true');
            
            state.currentSearchType = button.dataset.type;
            state.currentPage = 1;
            state.isShowingFavorites = false;
            
            // Mostrar/ocultar filtros avanzados
            toggleAdvancedFilters();
            
            if (state.currentSearchQuery) {
                performSearch();
            } else if (!state.isLoading) {
                loadPopularContent();
            }
        });
    });
    
    // Botón de Favoritos
    const favoritesToggle = document.getElementById('favorites-toggle');
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', toggleFavorites);
    }
    
    // Filtros avanzados
    const genreFilter = document.getElementById('genre-filter');
    const yearFilter = document.getElementById('year-filter');
    
    if (genreFilter) {
        genreFilter.addEventListener('change', (e) => {
            state.currentGenreFilter = e.target.value || null;
            state.currentPage = 1;
            if (state.currentSearchQuery) {
                executeSearch(state.currentSearchQuery, 1);
            } else {
                loadPopularContent();
            }
        });
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
            state.currentYearFilter = e.target.value || null;
            state.currentPage = 1;
            if (state.currentSearchQuery) {
                executeSearch(state.currentSearchQuery, 1);
            } else {
                loadPopularContent();
            }
        });
    }
    
    // Modal
    ui.elements.closeModal.addEventListener('click', ui.closeModal);
    ui.elements.movieModal.addEventListener('click', (e) => {
        if (e.target === ui.elements.movieModal) ui.closeModal();
    });
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-suggestions-wrapper')) {
            ui.hideSuggestions();
        }
    });
    
    // Tecla Escape para cerrar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ui.elements.movieModal.classList.contains('show')) {
            ui.closeModal();
        }
    });
}

function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advanced-filters');
    if (advancedFilters) {
        // Ocultar filtros avanzados cuando es búsqueda de actores o favoritos
        if (state.currentSearchType === 'actor' || state.currentSearchType === 'favorites') {
            advancedFilters.style.display = 'none';
        }
        // Mostrar filtros avanzados solo cuando hay búsqueda y no es "all" ni "actor"
        else if (state.currentSearchQuery || (state.currentSearchType !== 'all')) {
            advancedFilters.style.display = 'flex';
        } else {
            advancedFilters.style.display = 'none';
        }
    }
}

function toggleFavorites() {
    const favoritesToggle = document.getElementById('favorites-toggle');
    
    state.isShowingFavorites = !state.isShowingFavorites;
    
    if (state.isShowingFavorites) {
        favoritesToggle.classList.add('active');
        favoritesToggle.setAttribute('aria-checked', 'true');
        
        // Desactivar otros filtros
        ui.elements.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        // Ocultar filtros avanzados
        const advancedFilters = document.getElementById('advanced-filters');
        if (advancedFilters) advancedFilters.style.display = 'none';
        
        loadFavorites();
    } else {
        favoritesToggle.classList.remove('active');
        favoritesToggle.setAttribute('aria-checked', 'false');
        
        // Restaurar filtro "Todo"
        document.querySelector('[data-type="all"]').classList.add('active');
        document.querySelector('[data-type="all"]').setAttribute('aria-checked', 'true');
        state.currentSearchType = 'all';
        
        loadPopularContent();
    }
}

function loadFavorites() {
    const favorites = getFavorites();
    
    ui.clearSearchInfo();
    ui.elements.paginationContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        ui.renderResults([], 'all');
        ui.updateSearchInfo('❤️ <strong>Tu lista de favoritos está vacía</strong><br><small>¡Añade películas o series para verlas aquí!</small>');
        return;
    }
    
    ui.renderResults(favorites, 'all');
    ui.updateSearchInfo(`❤️ <strong>Tu lista de favoritos</strong> (${favorites.length} elementos)`);
}

// ============================================
// BÚSQUEDA
// ============================================

async function handleSearchInput() {
    const query = ui.elements.searchInput.value.trim();
    if (query.length < 3) {
        ui.hideSuggestions();
        return;
    }
    
    try {
        const results = await api.getSearchSuggestions(query);
        ui.showSuggestions(results);
    } catch (error) {
        console.error('Error en sugerencias:', error);
        ui.hideSuggestions();
    }
}

export function performSearch() {
    const query = ui.elements.searchInput.value.trim();
    if (!query) return;
    
    state.isInitialLoad = false;
    state.currentSearchQuery = query;
    state.currentPage = 1;
    state.currentGenreFilter = null;
    state.currentYearFilter = null;
    
    executeSearch(query, state.currentPage);
}

async function executeSearch(query, page = 1) {
    if (state.isLoading) return;
    
    state.isLoading = true;
    ui.showSkeletonLoading();
    ui.clearSearchInfo();
    ui.elements.paginationContainer.innerHTML = '';
    scrollToTop();
    
    try {
        let data;
        
        if (state.currentSearchType === 'all') {
            data = await api.searchMulti(query, page);
        } else if (state.currentSearchType === 'movie') {
            data = await api.searchMovies(query, page);
        } else if (state.currentSearchType === 'series') {
            data = await api.searchTV(query, page);
        } else if (state.currentSearchType === 'actor') {
            data = await api.searchPeople(query, page);
        }
        
        if (data && data.results && data.results.length > 0) {
            // Filtrar resultados
            let filteredResults = data.results;
            
            // Si es búsqueda 'all', excluir personas
            if (state.currentSearchType === 'all') {
                filteredResults = data.results.filter(item => item.media_type !== 'person');
            }
            
            // Aplicar filtros de género y año SOLO si no es búsqueda de actores
            if (state.currentSearchType !== 'actor') {
                if (state.currentGenreFilter) {
                    filteredResults = filteredResults.filter(item => {
                        const genres = item.genre_ids || [];
                        return genres.includes(parseInt(state.currentGenreFilter));
                    });
                }
                
                if (state.currentYearFilter) {
                    const year = state.currentYearFilter;
                    filteredResults = filteredResults.filter(item => {
                        const itemYear = (item.release_date || item.first_air_date || '').substring(0, 4);
                        return itemYear === year;
                    });
                }
            }
            
            console.log('✅ Resultados filtrados:', filteredResults.length);
            
            ui.renderResults(filteredResults, state.currentSearchType);
            
            const totalResults = data.total_results;
            const totalPages = data.total_pages;
            
            ui.updateSearchInfo(`Mostrando ${filteredResults.length} resultados para: <strong>"${query}"</strong>`);
            
            if (totalPages > 1) {
                ui.renderPagination(totalPages, page, (newPage) => {
                    executeSearch(query, newPage);
                });
            }
        } else {
            ui.renderResults([], state.currentSearchType);
            ui.updateSearchInfo(`No se encontraron resultados para: <strong>"${query}"</strong>`);
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        ui.showError('Error al cargar los resultados', () => executeSearch(query, page));
    } finally {
        state.isLoading = false;
    }
}

// ============================================
// CONTENIDO POPULAR
// ============================================

async function loadPopularContent() {
    state.isLoading = true;
    ui.showSkeletonLoading();
    ui.clearSearchInfo();
    ui.elements.paginationContainer.innerHTML = '';
    
    try {
        const data = await api.getTrending(1);
        
        if (data && data.results && data.results.length > 0) {
            ui.renderResults(data.results, 'all');
            ui.updateSearchInfo('<p>✨ <strong>Contenido Popular y Tendencias</strong></p>');
        } else {
            ui.showError('No se pudo cargar el contenido popular.');
        }
    } catch (error) {
        console.error('Error al cargar populares:', error);
        ui.showError('Error al cargar el contenido popular.', loadPopularContent);
    } finally {
        state.isLoading = false;
    }
}

// Resetear búsqueda
function resetSearch() {
    ui.elements.searchInput.value = '';
    state.currentSearchQuery = '';
    state.currentPage = 1;
    state.currentGenreFilter = null;
    state.currentYearFilter = null;
    state.currentSearchType = 'all';
    state.isShowingFavorites = false;
    
    // Resetear filtros UI
    ui.elements.filterButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    document.querySelector('[data-type="all"]').classList.add('active');
    document.querySelector('[data-type="all"]').setAttribute('aria-checked', 'true');
    
    // Resetear botón de favoritos
    const favoritesToggle = document.getElementById('favorites-toggle');
    if (favoritesToggle) {
        favoritesToggle.classList.remove('active');
        favoritesToggle.setAttribute('aria-checked', 'false');
    }
    
    // Resetear filtros avanzados
    const genreFilter = document.getElementById('genre-filter');
    const yearFilter = document.getElementById('year-filter');
    if (genreFilter) genreFilter.value = '';
    if (yearFilter) yearFilter.value = '';
    
    const advancedFilters = document.getElementById('advanced-filters');
    if (advancedFilters) advancedFilters.style.display = 'none';
    
    loadPopularContent();
}

// ============================================
// DETALLES DE PELÍCULA/SERIE
// ============================================

export async function showMovieDetails(id, type) {
    ui.showLoadingDetails();
    ui.openModal();
    
    try {
        const details = await api.getDetails(id, type);
        
        if (details.id) {
            ui.renderMovieDetails(details, type);
            
            // Cargar streaming
            try {
                const streamingData = await api.getStreamingProviders(id, type);
                ui.updateStreamingSection(streamingData.results || {});
            } catch (streamingError) {
                console.error('Error streaming:', streamingError);
                ui.showStreamingError();
            }
        } else {
            ui.showErrorDetails('Error al cargar los detalles');
        }
    } catch (error) {
        console.error('Error detalles:', error);
        ui.showErrorDetails('Error al cargar los detalles');
    }
}

// ============================================
// DETALLES DE ACTOR
// ============================================

export async function showActorDetails(id, name) {
    ui.showLoadingDetails();
    ui.openModal();
    
    try {
        const [details, credits] = await Promise.all([
            api.getPersonDetails(id),
            api.getPersonCredits(id)
        ]);
        
        if (details.id) {
            ui.renderActorDetails(details, credits);
        } else {
            ui.showErrorDetails('Error al cargar los detalles del actor');
        }
    } catch (error) {
        console.error('Error actor:', error);
        ui.showErrorDetails('Error al cargar los detalles del actor');
    }
}

// ============================================
// FILTROS AVANZADOS (GÉNERO/AÑO)
// ============================================

export function applyGenreFilter(genreId) {
    state.currentGenreFilter = genreId || null;
    state.currentPage = 1;
    
    if (state.currentSearchQuery) {
        executeSearch(state.currentSearchQuery, 1);
    } else {
        loadPopularContent();
    }
}

export function applyYearFilter(year) {
    state.currentYearFilter = year || null;
    state.currentPage = 1;
    
    if (state.currentSearchQuery) {
        executeSearch(state.currentSearchQuery, 1);
    } else {
        loadPopularContent();
    }
}

// ============================================
// INICIAR APLICACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', init);


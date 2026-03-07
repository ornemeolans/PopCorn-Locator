// ============================================
// MÓDULO DE UTILIDADES (utils.js)
// ============================================

// Placeholder para imágenes
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LWZhbWlseT0iQXJpYWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvYnI+QXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';

// ============================================
// MANEJO CENTRALIZADO DE IMÁGENES FALLBACK
// ============================================
export function handleImageError(imgElement) {
    imgElement.src = PLACEHOLDER_IMAGE;
    imgElement.removeEventListener('error', handleImageError);
}

// ============================================
// FUNCIÓN DE DEBOUNCE
// ============================================
export const debounce = (func, delay) => {
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

// ============================================
// LOCALSTORAGE - FAVORITOS
// ============================================
const FAVORITES_KEY = 'popcorn_favorites';

export function getFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

export function addFavorite(item) {
    const favorites = getFavorites();
    // Evitar duplicados
    if (!favorites.some(f => f.id === item.id && f.media_type === item.media_type)) {
        favorites.push(item);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        return true;
    }
    return false;
}

export function removeFavorite(id, mediaType) {
    let favorites = getFavorites();
    favorites = favorites.filter(f => !(f.id === id && f.media_type === mediaType));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(id, mediaType) {
    const favorites = getFavorites();
    return favorites.some(f => f.id === id && f.media_type === mediaType);
}

export function clearAllFavorites() {
    localStorage.removeItem(FAVORITES_KEY);
}

// ============================================
// UTILIDADES DE FECHA
// ============================================
export function formatYear(dateString) {
    return dateString ? dateString.substring(0, 4) : 'N/A';
}

export function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

// ============================================
// UTILIDADES DE GÉNERO
// ============================================
export const GENRE_MAP = {
    movie: {
        28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
        80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
        14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
        9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
        10770: 'Suspenso', 10752: 'Guerra', 37: 'Western'
    },
    tv: {
        10759: 'Acción', 16: 'Animación', 35: 'Comedia', 80: 'Crimen',
        99: 'Documental', 18: 'Drama', 10751: 'Familia', 10762: 'Niños',
        9648: 'Misterio', 10763: 'Noticias', 10749: 'Romance', 10764: 'Realidad',
        10765: 'Ciencia Ficción', 10766: 'soap', 10767: 'Charla', 10768: 'Guerra',
        37: 'Western'
    }
};

export function getGenreNames(genreIds, mediaType = 'movie') {
    const genreMap = GENRE_MAP[mediaType] || GENRE_MAP.movie;
    return genreIds.map(id => genreMap[id] || 'Desconocido').join(', ');
}

// ============================================
// UTILIDADES DE DOM
// ============================================
export function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString;
    return div.firstChild;
}

export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


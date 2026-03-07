// ============================================
// CONFIGURACIÓN (config.js)
// ============================================

// ⚠️ NOTA: En un proyecto real, esta clave debería estar en variables 
// de entorno del servidor o backend para mayor seguridad.

// Clave TMDB - Reemplaza con tu propia clave si es necesario
export const TMDB_API_KEY = 'd06b9cae7dc7f8b3e3b9b3c449f757e6';

// URLs base
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_LARGE_URL = 'https://image.tmdb.org/t/p/w780';

// Configuración de paginación
export const RESULTS_PER_PAGE = 20;

// Configuración de UI
export const MAX_SUGGESTIONS = 8;
export const MAX_FILMOGRAPHY_ITEMS = 30;

// Configuración de región para streaming (se detecta automáticamente)
let userCountry = 'AR'; // Por defecto Argentina

// Función para obtener la ubicación del usuario
export async function detectUserCountry() {
    try {
        // Usamos ipapi para detectar el país del usuario
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data && data.country_code) {
            userCountry = data.country_code;
            // Guardar en localStorage para persistencia
            localStorage.setItem('userCountry', userCountry);
            console.log(`🌍 País detectado: ${userCountry} (${data.country_name})`);
        }
    } catch (error) {
        console.warn('No se pudo detectar el país, usando valor por defecto (AR):', error);
        // Intentar usar localStorage
        const stored = localStorage.getItem('userCountry');
        if (stored) {
            userCountry = stored;
        }
    }
    
    return userCountry;
}

// Obtener el país del usuario
export function getUserCountry() {
    return userCountry;
}

// Configuración de regiones para streaming (prioridad según el país del usuario)
export function getStreamingRegions() {
    const regions = [userCountry];
    
    // Agregar alternativas si el país no es AR ni US
    if (userCountry !== 'AR' && userCountry !== 'US') {
        regions.push('AR', 'US');
    }
    
    return [...new Set(regions)]; // Eliminar duplicados
}


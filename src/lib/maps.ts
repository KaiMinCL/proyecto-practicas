/**
 * Utilidades para manejo de mapas con Google Maps
 */

// Configuración de Google Maps
export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile
  defaultZoom: 15,
};

/**
 * Genera una URL para Google Maps con una dirección específica
 */
export function generateGoogleMapsUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

/**
 * Genera una URL para un iframe de Google Maps embebido
 */
export function generateGoogleMapsEmbedUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
  
  if (!apiKey) {
    console.warn('Google Maps API key no configurada');
    return '';
  }
  
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=${GOOGLE_MAPS_CONFIG.defaultZoom}`;
}

/**
 * Valida si una dirección tiene el formato básico válido
 */
export function isValidAddress(address: string): boolean {
  if (!address || address.trim().length < 5) {
    return false;
  }
  
  // Validación básica: debe contener al menos una letra y un número o coma
  const hasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(address);
  const hasNumberOrComma = /[0-9,]/.test(address);
  
  return hasLetter && hasNumberOrComma;
}

/**
 * Normaliza una dirección para uso en mapas
 */
export function normalizeAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',') // Eliminar comas duplicadas
    .replace(/,$/, ''); // Eliminar coma al final
}

/**
 * Genera direcciones URL para diferentes acciones de mapas
 */
export function generateMapActions(address: string) {
  const normalizedAddress = normalizeAddress(address);
  
  return {
    view: generateGoogleMapsUrl(normalizedAddress),
    embed: generateGoogleMapsEmbedUrl(normalizedAddress),
    directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(normalizedAddress)}`,
  };
}
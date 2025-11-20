// Utilidades para construir URLs de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Construye la URL completa de una imagen
 * @param {string} imagePath - Ruta de la imagen (puede ser relativa o absoluta)
 * @param {string} defaultFolder - Carpeta por defecto si la ruta es relativa (ej: 'courses', 'profiles')
 * @returns {string} URL completa de la imagen
 */
export const getImageUrl = (imagePath, defaultFolder = 'courses') => {
  if (!imagePath) return null;
  
  // Si ya es una URL completa (empieza con http), la usamos tal cual
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Si empieza con /, le agregamos la URL de la API
  if (imagePath.startsWith('/')) {
    return `${API_URL}${imagePath}`;
  }
  
  // Si no, asumimos que está en la carpeta uploads/{defaultFolder}
  return `${API_URL}/uploads/${defaultFolder}/${imagePath}`;
};

/**
 * Construye la URL completa de un contenido (PDF, Word, video)
 * @param {string} url - URL o ruta del contenido
 * @returns {string} URL completa del contenido
 */
export const getContentUrl = (url) => {
  if (!url) return null;
  
  // Si ya es una URL completa, la usamos tal cual
  if (url.startsWith('http')) {
    return url;
  }
  
  // Si empieza con /, le agregamos la URL de la API
  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }
  
  // Si no, asumimos que es una ruta relativa del servidor
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default API_URL;


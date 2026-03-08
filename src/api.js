/**
 * API module for MetEyes application
 * Extracted from script.js for testing purposes
 */

// Configuration constants
const C = {
    MET_API_BASE_URL: 'https://collectionapi.metmuseum.org/public/collection/v1',
    FAV_KEY: 'met_gallery_favorites_v1',
    PAGE_SIZE: 21,
    NO_IMAGE_URL: 'https://via.placeholder.com/300?text=No+Image',
    DEFAULT_SEARCH: 'sunflowers',
};

/**
 * Internal fetch JSON helper method
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @return {Promise<Object>} - The JSON response
 * @throws {Error} - If the request fails
 */
async function _fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${url}`, error);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * Search the Met Museum collection
 * @param {string} query - Search query
 * @return {Promise<Object>} - Search results
 */
function searchMet(query) {
    const url = `${C.MET_API_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`;
    return _fetchJSON(url);
}

/**
 * Get details for a specific artwork
 * @param {number} objectId - The object ID
 * @return {Promise<Object|null>} - Art details or null on failure
 */
function getArtDetails(objectId) {
    const url = `${C.MET_API_BASE_URL}/objects/${objectId}`;
    // Return null on failure for individual items to not break Promise.all
    return _fetchJSON(url).catch(() => null);
}

// Export for testing
const API = {
    _fetchJSON,
    searchMet,
    getArtDetails,
    constants: C,
};

// For Node.js (testing environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

// For browser (production environment)
if (typeof window !== 'undefined') {
    window.MetEyesAPI = API;
}

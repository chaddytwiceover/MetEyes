// ===================================================================================
//
//  MET GALLERY AI GUIDE - SCRIPT
//
// ===================================================================================

// --- I. CONFIGURATION & GLOBAL VARIABLES ---

const MET_API_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
// The Gemini API is called via a secure serverless proxy function.
// This URL will point to your deployed Firebase Function.
const GEMINI_API_PROXY_URL = '/api/gemini'; // This works if using a Firebase Hosting rewrite
const FAV_KEY = 'met_gallery_favorites_v1';
const PAGE_SIZE = 21;


// --- II. STATE MANAGEMENT ---

// This object holds the application's state.
let state = {
    currentArtObject: null, // Stores the art object currently in the detail view
    allObjectIDs: [],       // Stores all object IDs from a search result
    currentPage: 0,         // The current page of results we are viewing
    isFavoritesView: false, // Are we currently viewing the favorites list?
};


// --- III. DOM ELEMENT REFERENCES ---

// Getting references to all the HTML elements we'll need to interact with.
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const artGalleryContainer = document.getElementById('art-gallery-container');
const artGallery = document.getElementById('art-gallery');
const noResultsMessage = document.getElementById('noResults');
const pager = document.getElementById('pager');
const favoritesNavButton = document.getElementById('favoritesNavButton');
const searchError = document.getElementById('search-error');
const loadingContainer = document.getElementById('loading-container');
const artDetailSection = document.getElementById('art-detail');
const searchSection = document.getElementById('search-section');

// Detail View Elements
const backToGalleryButton = document.getElementById('backToGallery');
const detailImage = document.getElementById('detail-image');
const detailTitle = document.getElementById('detail-title');
const detailArtist = document.getElementById('detail-artist');
const detailDate = document.getElementById('detail-date');
const detailMedium = document.getElementById('detail-medium');
const detailFavButton = document.getElementById('detail-fav-btn');
const askGeminiButton = document.getElementById('askGeminiButton');
const geminiText = document.getElementById('gemini-text');

// Pager Elements
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const pagerInfo = document.getElementById('pager-info');


// --- IV. FAVORITES MANAGEMENT ---

// These functions handle adding, removing, and checking favorite artworks.
// They use the browser's localStorage to persist favorites across sessions.

const getFavorites = () => new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
const isFavorite = (id) => getFavorites().has(id);

function toggleFavorite(id) {
    const favorites = getFavorites();
    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
}


// --- V. API FUNCTIONS (MET & GEMINI) ---

/**
 * Searches the Met API for artworks matching the query.
 * @param {string} query The user's search term.
 */
async function searchMetArt(query) {
    state.isFavoritesView = false;
    state.currentPage = 0;
    
    // UI updates for loading state
    showLoading();
    searchButton.disabled = true;
    searchError.textContent = '';
    noResultsMessage.classList.add('hidden');
    artGallery.innerHTML = '';
    
    try {
        const response = await fetch(`${MET_API_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        state.allObjectIDs = (data.objectIDs && data.total > 0) ? data.objectIDs : [];
        
        await renderCurrentPage();
        
    } catch (error) {
        console.error('Error searching Met Art:', error);
        searchError.textContent = 'Error loading art. Please check your connection and try again.';
        hideLoading();
    } finally {
        searchButton.disabled = false;
    }
}

/**
 * Fetches the details for a single artwork object ID.
 * @param {number} objectId The ID of the artwork to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the art object or null if failed.
 */
async function getArtDetails(objectId) {
    try {
        const response = await fetch(`${MET_API_BASE_URL}/objects/${objectId}`);
        if (!response.ok) return null; // Silently fail for a single object
        return await response.json();
    } catch (error) {
        console.error(`Error fetching details for object ID ${objectId}:`, error);
        return null;
    }
}

/**
 * Gets AI-powered insights about an artwork from the Gemini API via our secure proxy.
 * @param {object} artDetails The details of the artwork.
 */
async function getGeminiFact(artDetails) {
    geminiText.textContent = 'Generating insights...';
    askGeminiButton.disabled = true;

    try {
        const prompt = `Tell me an interesting fact or provide a brief analysis about the artwork titled "${artDetails.title}" by ${artDetails.artistDisplayName || 'an unknown artist'}, created around ${artDetails.objectDate || 'an unknown date'}. Focus on its historical context, artistic style, or significance. Keep it concise, around 2-3 sentences.`;

        const response = await fetch(GEMINI_API_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, objectID: artDetails.objectID })
        });
        
        const data = await response.json();

        if (data.text) {
            geminiText.textContent = data.text;
        } else if (data.error) {
            throw new Error(data.error);
        } else {
             throw new Error('Invalid response structure from proxy.');
        }

    } catch (error) {
        console.error('Error fetching from Gemini API proxy:', error);
        geminiText.textContent = `Error connecting to the AI assistant. ${error.message}`;
    } finally {
        askGeminiButton.disabled = false;
    }
}


// --- VI. DOM MANIPULATION & RENDERING ---

/**
 * Fetches details for the current page of object IDs and renders them to the gallery.
 */
async function renderCurrentPage() {
    showLoading();
    
    const idsToFetch = state.allObjectIDs.slice(state.currentPage * PAGE_SIZE, (state.currentPage + 1) * PAGE_SIZE);
    
    const detailPromises = idsToFetch.map(id => getArtDetails(id));
    const artPieces = (await Promise.all(detailPromises)).filter(Boolean); // Filter out any nulls from failed fetches

    hideLoading();
    displayArtPieces(artPieces);
    updatePager();
}

/**
 * Renders an array of art pieces into the main gallery grid.
 * @param {Array<object>} artPieces - An array of artwork objects from the Met API.
 */
function displayArtPieces(artPieces) {
    artGallery.innerHTML = ''; 
    
    if (artPieces.length === 0) {
        noResultsMessage.classList.remove('hidden');
        pager.classList.add('hidden');
        return;
    }
    
    noResultsMessage.classList.add('hidden');

    artPieces.forEach(art => {
        const isFavorited = isFavorite(art.objectID);
        const card = document.createElement('div');
        card.className = 'art-card';
        card.dataset.objectId = art.objectID;
        card.innerHTML = `
            <div class="art-card-image-wrapper">
                <img src="${art.primaryImageSmall || 'https://via.placeholder.com/300?text=No+Image'}" alt="${art.title || 'Untitled'}" loading="lazy">
            </div>
            <div class="art-card-info">
                <h3>${art.title || 'Untitled'}</h3>
                <p>${art.artistDisplayName || 'Unknown Artist'}</p>
            </div>
            <div class="art-card-info-hover">
                 <h3>${art.title || 'Untitled'}</h3>
                 <p>${art.artistDisplayName || 'Unknown Artist'}</p>
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" aria-label="Toggle Favorite">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
        `;
        artGallery.appendChild(card);
    });
}

/**
 * Shows the detailed view for a single artwork.
 * @param {object} art The artwork object to display.
 */
function showArtDetail(art) {
    state.currentArtObject = art;

    // Hide gallery view elements
    artGalleryContainer.classList.add('hidden');
    searchSection.classList.add('hidden');
    pager.classList.add('hidden');
    
    // Show detail view
    artDetailSection.classList.remove('hidden');
    window.scrollTo(0, 0);

    // Populate detail view with art data
    detailImage.src = art.primaryImage || art.primaryImageSmall || 'https://via.placeholder.com/400?text=No+Image';
    detailImage.alt = `Artwork titled: ${art.title || 'Untitled'}`;
    detailTitle.textContent = art.title || 'Untitled';
    detailArtist.textContent = art.artistDisplayName || 'Unknown Artist';
    detailDate.textContent = `Date: ${art.objectDate || 'N/A'}`;
    detailMedium.textContent = `Medium: ${art.medium || 'N/A'}`;
    
    updateDetailFavoriteButton(art.objectID);

    // Reset Gemini section
    geminiText.textContent = 'Click below to get insights from Gemini!';
    askGeminiButton.disabled = false;
}

/** Hides the art detail view and shows the main gallery view. */
function hideArtDetail() {
    artDetailSection.classList.add('hidden');
    
    artGalleryContainer.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    
    if (!state.isFavoritesView && state.allObjectIDs.length > PAGE_SIZE) {
        pager.classList.remove('hidden');
    }
    
    state.currentArtObject = null;
}

/** Updates the pager text and button states. */
function updatePager() {
    if (state.allObjectIDs.length <= PAGE_SIZE) {
        pager.classList.add('hidden');
        return;
    }
    
    pager.classList.remove('hidden');
    const start = state.currentPage * PAGE_SIZE + 1;
    const end = Math.min((state.currentPage + 1) * PAGE_SIZE, state.allObjectIDs.length);
    pagerInfo.textContent = `Showing ${start}-${end} of ${state.allObjectIDs.length}`;
    
    prevButton.disabled = state.currentPage === 0;
    nextButton.disabled = end >= state.allObjectIDs.length;
}

/** Updates the favorite button in the detail view. */
function updateDetailFavoriteButton(id) {
    const isFav = isFavorite(id);
    detailFavButton.textContent = isFav ? '♥ Favorited' : '♡ Favorite';
    detailFavButton.classList.toggle('favorited', isFav);
}

// --- UI Helper Functions ---
const showLoading = () => {
    loadingContainer.classList.remove('hidden');
    artGalleryContainer.classList.add('hidden');
    pager.classList.add('hidden');
};
const hideLoading = () => {
    loadingContainer.classList.add('hidden');
    artGalleryContainer.classList.remove('hidden');
};


// --- VII. EVENT LISTENERS ---

// This is where we wire up all the user interactions.

document.addEventListener('DOMContentLoaded', () => {
    // Set copyright year dynamically
    document.getElementById('copyright').textContent = `© ${new Date().getFullYear()} Met Gallery AI Guide`;
    
    // Initial load with a default search term
    searchMetArt('sunflowers');
});

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchMetArt(query);
    } else {
        searchError.textContent = 'Please enter a search term.';
    }
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click(); // Trigger search on Enter key
    }
});

artGallery.addEventListener('click', async (e) => {
    const card = e.target.closest('.art-card');
    if (!card) return;

    const objectId = parseInt(card.dataset.objectId);
    const favButton = e.target.closest('.favorite-btn');

    if (favButton) {
        e.stopPropagation();
        toggleFavorite(objectId);
        favButton.classList.toggle('favorited', isFavorite(objectId));
    } else {
        // Fetch full details for the detail view
        showLoading();
        const artDetails = await getArtDetails(objectId);
        hideLoading();
        if (artDetails) {
            showArtDetail(artDetails);
        } else {
            alert("Could not load details for this artwork.");
        }
    }
});

backToGalleryButton.addEventListener('click', hideArtDetail);

detailFavButton.addEventListener('click', () => {
    if (state.currentArtObject) {
        const artId = state.currentArtObject.objectID;
        toggleFavorite(artId);
        updateDetailFavoriteButton(artId);
    }
});

askGeminiButton.addEventListener('click', () => {
    if (state.currentArtObject) {
        getGeminiFact(state.currentArtObject);
    }
});

prevButton.addEventListener('click', () => {
    if (state.currentPage > 0) {
        state.currentPage--;
        renderCurrentPage();
    }
});

nextButton.addEventListener('click', () => {
    const maxPage = Math.ceil(state.allObjectIDs.length / PAGE_SIZE) - 1;
    if (state.currentPage < maxPage) {
        state.currentPage++;
        renderCurrentPage();
    }
});

favoritesNavButton.addEventListener('click', async () => {
    state.isFavoritesView = true;
    const favoriteIDs = [...getFavorites()];
    
    showLoading();
    pager.classList.add('hidden');

    if (favoriteIDs.length === 0) {
        hideLoading();
        artGallery.innerHTML = '';
        noResultsMessage.textContent = "You haven't favorited any art yet.";
        noResultsMessage.classList.remove('hidden');
        return;
    }
    
    const artPromises = favoriteIDs.map(id => getArtDetails(id));
    const artPieces = (await Promise.all(artPromises)).filter(Boolean);

    hideLoading();
    displayArtPieces(artPieces);
});

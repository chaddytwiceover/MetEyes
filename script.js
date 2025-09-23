// Function to generate a random image with a description
async function generateRandomImage(description) {
    try {
        // In a real application, you would send this 'description' to your image generation model.
        // For now, we'll just log it and show a placeholder.
        console.log("Generating image for:", description);
        return `https://via.placeholder.com/300?text=${encodeURIComponent(description)}`;
    } catch (error) {
        console.error("Error generating image:", error);
        return "https://via.placeholder.com/300?text=Image+Error";
    }
}


const MET_API_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
// In a real application, you would secure your Gemini API key.
// For demonstration, we'll use a placeholder.
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API Key!
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;


const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const artGallery = document.getElementById('art-gallery');
const noResultsMessage = document.getElementById('noResults');
const paginationSection = document.getElementById('pagination-section');
const loadMoreButton = document.getElementById('loadMoreButton');
const favoritesNavButton = document.getElementById('favoritesNavButton');
const searchError = document.getElementById('search-error');
const loadingSpinner = document.querySelector('.loading-spinner');
const artDetailSection = document.getElementById('art-detail');
const backToGalleryButton = document.getElementById('backToGallery');
const detailImage = document.getElementById('detail-image');
const detailTitle = document.getElementById('detail-title');
const detailArtist = document.getElementById('detail-artist');
const detailDate = document.getElementById('detail-date');
const detailMedium = document.getElementById('detail-medium');
const geminiText = document.getElementById('gemini-text');
const askGeminiButton = document.getElementById('askGeminiButton');

// --- State Management ---
let currentArtObject = null; // To store the currently displayed art object for Gemini
let allObjectIDs = [];
let currentPage = 0;
const RESULTS_PER_PAGE = 21;
let favorites = JSON.parse(localStorage.getItem('metFavorites')) || [];
let isFavoritesView = false;

// --- Met Gallery API Functions ---

async function searchMetArt(query) {
    // Clear previous results and show spinner
    isFavoritesView = false;
    currentPage = 0;
    artGallery.innerHTML = '';
    paginationSection.style.display = 'none';
    noResultsMessage.style.display = 'none';
    searchError.textContent = '';
    loadingSpinner.style.display = 'block';
    searchButton.disabled = true;

    try {
        const response = await fetch(`${MET_API_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.objectIDs || data.total === 0) {
            artGallery.innerHTML = '';
            noResultsMessage.style.display = 'block';
            allObjectIDs = [];
            return [];
        }

        allObjectIDs = data.objectIDs;
        const artPieces = await loadMoreArt();
        return artPieces;

        // Filter out any null responses if an object could not be fetched
        return artPieces.filter(piece => piece !== null);

    } catch (error) {
        console.error('Error searching Met Art:', error);
        searchError.textContent = 'Error loading art. Please check your connection and try again.';
        return [];
    } finally {
        loadingSpinner.style.display = 'none';
        searchButton.disabled = false;
    }
}

async function loadMoreArt() {
    if (allObjectIDs.length === 0) return [];

    const start = currentPage * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    const objectIdsToFetch = allObjectIDs.slice(start, end);

    if (objectIdsToFetch.length === 0) {
        paginationSection.style.display = 'none';
        return [];
    }

    const artPromises = objectIdsToFetch.map(id => getArtDetails(id));
    const artPieces = await Promise.all(artPromises.map(p => p.catch(e => null))); // Prevent one failure from stopping all
    return artPieces.filter(piece => piece !== null && piece.primaryImageSmall);
}

async function getArtDetails(objectId) {
    try {
        const response = await fetch(`${MET_API_BASE_URL}/objects/${objectId}`);
        const data = await response.json();
        if (!response.ok) {
            return null; // Silently fail for single object fetch
        }
        return data;
    } catch (error) {
        console.error(`Error fetching details for object ID ${objectId}:`, error);
        return null;
    }
}

function displayArtPieces(artPieces, clear = false) {
    if (clear) {
        artGallery.innerHTML = '';
    }

    if (artPieces.length === 0 && currentPage === 0) {
        noResultsMessage.style.display = 'block';
        paginationSection.style.display = 'none';
        return;
    }

    noResultsMessage.style.display = 'none';

    artPieces.forEach(art => {
        const isFavorited = favorites.includes(art.objectID);
        const artCard = document.createElement('div');
        artCard.classList.add('art-card');
        artCard.innerHTML = `
            <div class="art-card-image-wrapper">
                <img src="${art.primaryImageSmall}" alt="Artwork titled: ${art.title || 'Untitled'}">
            </div>
            <div class="art-card-info">
                <h3>${art.title || 'Untitled'}</h3>
                <p>${art.artistDisplayName || 'Unknown Artist'}</p>
            </div>
            <div class="art-card-info-hover">
                <h3>${art.title || 'Untitled'}</h3>
                <p>${art.artistDisplayName || 'Unknown Artist'}</p>
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" aria-label="Add to favorites" data-id="${art.objectID}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
        `;
        artCard.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                showArtDetail(art);
            }
        });
        artGallery.appendChild(artCard);
    });

    // Handle pagination visibility
    const totalDisplayed = artGallery.children.length;
    if (!isFavoritesView && allObjectIDs.length > totalDisplayed) {
        paginationSection.style.display = 'block';
    } else {
        paginationSection.style.display = 'none';
    }

    // Add event listeners to new favorite buttons
    document.querySelectorAll('.favorite-btn:not([data-listener-added])').forEach(btn => {
        btn.setAttribute('data-listener-added', 'true');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn);
        });
    });
}

function toggleFavorite(button) {
    const artId = parseInt(button.dataset.id);
    const isFavorited = favorites.includes(artId);
    if (isFavorited) {
        favorites = favorites.filter(id => id !== artId);
    } else {
        favorites.push(artId);
    }
    localStorage.setItem('metFavorites', JSON.stringify(favorites));
    button.classList.toggle('favorited');
}

function showArtDetail(art) {
    const searchSection = document.getElementById('search-section');
    currentArtObject = art; // Store the current art object
    artGallery.style.display = 'none';
    searchSection.style.display = 'none';
    paginationSection.style.display = 'none';
    noResultsMessage.style.display = 'none';
    artDetailSection.style.display = 'block';
    window.scrollTo(0, 0); // Scroll to top

    detailImage.src = art.primaryImage || art.primaryImageSmall || 'https://via.placeholder.com/400?text=No+Image';
    detailImage.alt = `Artwork titled: ${art.title || 'Untitled'}`;
    detailTitle.textContent = art.title || 'Untitled';
    detailArtist.textContent = art.artistDisplayName || 'Unknown Artist';
    detailDate.textContent = `Date: ${art.objectDate || 'N/A'}`;
    detailMedium.textContent = `Medium: ${art.medium || 'N/A'}`;

    geminiText.textContent = 'Click below to get insights from Gemini!';
    askGeminiButton.style.display = 'block'; // Show the button to ask Gemini
}

function hideArtDetail() {
    const searchSection = document.getElementById('search-section');
    artGallery.style.display = 'grid';
    searchSection.style.display = 'block';
    if (!isFavoritesView && allObjectIDs.length > artGallery.children.length) paginationSection.style.display = 'block';
    artDetailSection.style.display = 'none';
    currentArtObject = null; // Clear the current art object
    geminiText.textContent = 'Loading insights...'; // Reset Gemini text
    askGeminiButton.style.display = 'none'; // Hide the button
}


// --- Google Gemini Integration (Placeholder) ---

async function getGeminiFact(artDetails) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        geminiText.textContent = 'Please replace "YOUR_GEMINI_API_KEY" in script.js with your actual Google Gemini API key to enable AI insights.';
        return;
    }

    geminiText.textContent = 'Generating insights...';
    askGeminiButton.style.display = 'none'; // Hide button while processing

    try {
        const prompt = `Tell me an interesting fact or provide a brief analysis about the artwork titled "${artDetails.title}" by ${artDetails.artistDisplayName || 'an unknown artist'}, created around ${artDetails.objectDate || 'an unknown date'}, and made with ${artDetails.medium || 'an unknown medium'}. Focus on its historical context, artistic style, or significance. Keep it concise, around 2-3 sentences.`;

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        console.log("Gemini Raw Response:", data);

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const geminiResponseText = data.candidates[0].content.parts[0].text;
            geminiText.textContent = geminiResponseText;
        } else if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            geminiText.textContent = `Could not get insights. Gemini API error: ${data.error.message}`;
        } else {
            geminiText.textContent = 'Could not retrieve insights from Gemini. Please try again.';
        }
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        geminiText.textContent = 'Error connecting to Gemini API. Check your key and network.';
    } finally {
        // Re-show button unless there was a critical API key error
        if (!geminiText.textContent.includes("API key")) {
            askGeminiButton.style.display = 'block';
        }
    }
}


// --- Event Listeners ---

searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    searchInput.blur();
    if (query) {
        const artPieces = await searchMetArt(query);
        displayArtPieces(artPieces, true);
    } else {
        searchError.textContent = 'Please enter a search term.';
    }
});

loadMoreButton.addEventListener('click', async () => {
    currentPage++;
    const artPieces = await loadMoreArt();
    displayArtPieces(artPieces, false);
});

favoritesNavButton.addEventListener('click', async () => {
    isFavoritesView = true;
    artGallery.innerHTML = '';
    paginationSection.style.display = 'none';
    noResultsMessage.style.display = 'none';
    searchError.textContent = '';
    loadingSpinner.style.display = 'block';

    if (favorites.length === 0) {
        loadingSpinner.style.display = 'none';
        noResultsMessage.textContent = "You haven't favorited any art yet.";
        noResultsMessage.style.display = 'block';
    } else {
        const artPromises = favorites.map(id => getArtDetails(id));
        const artPieces = await Promise.all(artPromises.map(p => p.catch(e => null)));
        loadingSpinner.style.display = 'none';
        displayArtPieces(artPieces.filter(p => p), true);
    }
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

backToGalleryButton.addEventListener('click', hideArtDetail);

askGeminiButton.addEventListener('click', () => {
    if (currentArtObject) {
        getGeminiFact(currentArtObject);
    }
});

// Initial load: You might want to display some popular art or a default search
// For now, let's just make sure the gallery is visible.
document.addEventListener('DOMContentLoaded', () => {
    // Set copyright year dynamically
    const copyright = document.getElementById('copyright');
    copyright.innerHTML = `&copy; ${new Date().getFullYear()} Met Gallery AI Guide`;
    searchMetArt('sunflowers').then(artPieces => displayArtPieces(artPieces, true)); // Load some default art on startup
});
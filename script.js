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
const artDetailSection = document.getElementById('art-detail');
const backToGalleryButton = document.getElementById('backToGallery');
const detailImage = document.getElementById('detail-image');
const detailTitle = document.getElementById('detail-title');
const detailArtist = document.getElementById('detail-artist');
const detailDate = document.getElementById('detail-date');
const detailMedium = document.getElementById('detail-medium');
const geminiText = document.getElementById('gemini-text');
const askGeminiButton = document.getElementById('askGeminiButton');

let currentArtObject = null; // To store the currently displayed art object for Gemini

// --- Met Gallery API Functions ---

async function searchMetArt(query) {
    artGallery.innerHTML = '<p>Loading...</p>';
    noResultsMessage.style.display = 'none';

    try {
        const response = await fetch(`${MET_API_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`);
        const data = await response.json();

        if (data.total === 0) {
            artGallery.innerHTML = '';
            noResultsMessage.style.display = 'block';
            return [];
        }

        // Fetch details for the first few objects (or more if you want)
        // For a more robust app, you might implement pagination.
        const objectIds = data.objectIDs.slice(0, 20); // Limit to first 20 results for initial display
        const artPromises = objectIds.map(id => getArtDetails(id));
        const artPieces = await Promise.all(artPromises);

        // Filter out any null responses if an object could not be fetched
        return artPieces.filter(piece => piece !== null);

    } catch (error) {
        console.error('Error searching Met Art:', error);
        artGallery.innerHTML = '<p>Error loading art. Please try again.</p>';
        return [];
    }
}

async function getArtDetails(objectId) {
    try {
        const response = await fetch(`${MET_API_BASE_URL}/objects/${objectId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching details for object ID ${objectId}:`, error);
        return null;
    }
}

function displayArtPieces(artPieces) {
    artGallery.innerHTML = '';
    if (artPieces.length === 0) {
        noResultsMessage.style.display = 'block';
        return;
    }

    artPieces.forEach(art => {
        if (art.primaryImageSmall) { // Only display if an image exists
            const artCard = document.createElement('div');
            artCard.classList.add('art-card');
            artCard.innerHTML = `
                <img src="${art.primaryImageSmall}" alt="${art.title}">
                <h3>${art.title || 'Untitled'}</h3>
                <p>${art.artistDisplayName || 'Unknown Artist'}</p>
            `;
            artCard.addEventListener('click', () => showArtDetail(art));
            artGallery.appendChild(artCard);
        }
    });
}

function showArtDetail(art) {
    currentArtObject = art; // Store the current art object
    artGallery.style.display = 'none';
    searchSection.style.display = 'none';
    artDetailSection.style.display = 'block';

    detailImage.src = art.primaryImage || art.primaryImageSmall || 'https://via.placeholder.com/400?text=No+Image';
    detailImage.alt = art.title;
    detailTitle.textContent = art.title || 'Untitled';
    detailArtist.textContent = art.artistDisplayName || 'Unknown Artist';
    detailDate.textContent = `Date: ${art.objectDate || 'N/A'}`;
    detailMedium.textContent = `Medium: ${art.medium || 'N/A'}`;

    geminiText.textContent = 'Click below to get insights from Gemini!';
    askGeminiButton.style.display = 'block'; // Show the button to ask Gemini
}

function hideArtDetail() {
    artGallery.style.display = 'grid';
    searchSection.style.display = 'block';
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
        } else {
            geminiText.textContent = 'Could not retrieve insights from Gemini. Please try again.';
        }
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        geminiText.textContent = 'Error connecting to Gemini API. Check your key and network.';
    } finally {
        askGeminiButton.style.display = 'block'; // Re-show button for another query if desired
    }
}


// --- Event Listeners ---

searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (query) {
        const artPieces = await searchMetArt(query);
        displayArtPieces(artPieces);
    } else {
        alert('Please enter a search query.');
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
    searchMetArt('painting').then(displayArtPieces); // Load some default art on startup
});
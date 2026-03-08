// ===================================================================================
//
//  MET GALLERY GUIDE - SCRIPT
//  REFACTORED FOR MODULARITY, STATE MANAGEMENT, AND ROBUSTNESS
//
// ===================================================================================


/**
 * Main application module.
 * This IIFE (Immediately Invoked Function Expression) encapsulates the entire application,
 * preventing global scope pollution and creating a modular structure.
 */
((window, document) => {
    // --- I. CONFIGURATION ---
    const C = {
        MET_API_BASE_URL: 'https://collectionapi.metmuseum.org/public/collection/v1',
        FAV_KEY: 'met_gallery_favorites_v1',
        PAGE_SIZE: 21,
        NO_IMAGE_URL: 'https://via.placeholder.com/300?text=No+Image',
        DEFAULT_SEARCH: 'sunflowers',
    };

    // --- II. DOM ELEMENT REFERENCES ---
    const D = {
        searchInput: document.getElementById('searchInput'),
        searchButton: document.getElementById('searchButton'),
        artGalleryContainer: document.getElementById('art-gallery-container'),
        artGallery: document.getElementById('art-gallery'),
        noResultsMessage: document.getElementById('noResults'),
        pager: document.getElementById('pager'),
        favoritesNavButton: document.getElementById('favoritesNavButton'),
        searchError: document.getElementById('search-error'),
        loadingContainer: document.getElementById('loading-container'),
        artDetailSection: document.getElementById('art-detail'),
        searchSection: document.getElementById('search-section'),
        backToGalleryButton: document.getElementById('backToGallery'),
        detailImage: document.getElementById('detail-image'),
        detailTitle: document.getElementById('detail-title'),
        detailArtist: document.getElementById('detail-artist'),
        detailDate: document.getElementById('detail-date'),
        detailMedium: document.getElementById('detail-medium'),
        detailFavButton: document.getElementById('detail-fav-btn'),
        prevButton: document.getElementById('prev'),
        nextButton: document.getElementById('next'),
        pagerInfo: document.getElementById('pager-info'),
        copyright: document.getElementById('copyright'),
    };

    // --- III. STATE MANAGEMENT ---
    const Store = {
        _state: {
            currentArtObject: null,
            allObjectIDs: [],
            currentPage: 0,
            currentView: 'gallery', // 'gallery' or 'detail' or 'favorites'
            isLoading: true,
            error: null,
        },
        getState() {
            return this._state;
        },
        setState(newState) {
            this._state = {...this._state, ...newState};
            // In a more complex app, a render/update function would be called here.
        },
    };

    // --- IV. FAVORITES MANAGEMENT ---
    const Favorites = {
        get: () => new Set(JSON.parse(localStorage.getItem(C.FAV_KEY) || '[]')),
        has: (id) => Favorites.get().has(id),
        toggle: (id) => {
            const favorites = Favorites.get();
            if (favorites.has(id)) {
                favorites.delete(id);
            } else {
                favorites.add(id);
            }
            localStorage.setItem(C.FAV_KEY, JSON.stringify([...favorites]));
        },
    };

    // --- V. API ABSTRACTION ---
    const API = {
        async _fetchJSON(url, options = {}) {
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
        },
        searchMet(query) {
            const url = `${C.MET_API_BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`;
            return this._fetchJSON(url);
        },
        getArtDetails(objectId) {
            const url = `${C.MET_API_BASE_URL}/objects/${objectId}`;
            // Return null on failure for individual items to not break Promise.all
            return this._fetchJSON(url).catch(() => null);
        },
    };

    // --- VI. UI RENDERING & MANIPULATION ---
    const UI = {
        // --- Component Creators ---
        createArtCard(art) {
            const isFavorited = Favorites.has(art.objectID);
            const card = document.createElement('div');
            card.className = 'art-card';
            card.dataset.objectId = art.objectID;

            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'art-card-image-wrapper';
            const img = document.createElement('img');
            img.src = art.primaryImageSmall || C.NO_IMAGE_URL;
            img.alt = art.title || 'Untitled';
            img.loading = 'lazy';
            imageWrapper.appendChild(img);

            const info = document.createElement('div');
            info.className = 'art-card-info';
            info.innerHTML = `<h3>${art.title || 'Untitled'}</h3><p>${art.artistDisplayName || 'Unknown Artist'}</p>`;

            const infoHover = document.createElement('div');
            infoHover.className = 'art-card-info-hover';
            infoHover.innerHTML = `<h3>${art.title || 'Untitled'}</h3><p>${art.artistDisplayName || 'Unknown Artist'}</p>`;

            const favButton = document.createElement('button');
            favButton.className = `favorite-btn ${isFavorited ? 'favorited' : ''}`;
            favButton.setAttribute('aria-label', 'Toggle Favorite');
            favButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

            card.append(imageWrapper, info, infoHover, favButton);
            return card;
        },

        // --- View Updaters ---
        renderGallery(artPieces) {
            D.artGallery.innerHTML = '';
            const {currentView} = Store.getState();

            if (artPieces.length === 0) {
                D.noResultsMessage.textContent = currentView === 'favorites' ?
                    'You haven\'t favorited any art yet.' :
                    'No results found. Try a different search!';
                D.noResultsMessage.classList.remove('hidden');
                D.pager.classList.add('hidden');
            } else {
                D.noResultsMessage.classList.add('hidden');
                const cards = artPieces.map(this.createArtCard);
                D.artGallery.append(...cards);
            }
        },
        updatePager() {
            const {allObjectIDs, currentPage, currentView} = Store.getState();
            if (currentView !== 'gallery' || allObjectIDs.length <= C.PAGE_SIZE) {
                D.pager.classList.add('hidden');
                return;
            }

            D.pager.classList.remove('hidden');
            const start = currentPage * C.PAGE_SIZE + 1;
            const end = Math.min((currentPage + 1) * C.PAGE_SIZE, allObjectIDs.length);
            D.pagerInfo.textContent = `Showing ${start}-${end} of ${allObjectIDs.length}`;

            D.prevButton.disabled = currentPage === 0;
            D.nextButton.disabled = end >= allObjectIDs.length;
        },
        updateDetailView(art) {
            D.detailImage.src = art.primaryImage || art.primaryImageSmall || C.NO_IMAGE_URL;
            D.detailImage.alt = `Artwork titled: ${art.title || 'Untitled'}`;
            D.detailTitle.textContent = art.title || 'Untitled';
            D.detailArtist.textContent = art.artistDisplayName || 'Unknown Artist';
            D.detailDate.textContent = `Date: ${art.objectDate || 'N/A'}`;
            D.detailMedium.textContent = `Medium: ${art.medium || 'N/A'}`;
            this.updateDetailFavoriteButton(art.objectID);
        },
        updateDetailFavoriteButton(id) {
            const isFav = Favorites.has(id);
            D.detailFavButton.textContent = isFav ? '♥ Favorited' : '♡ Favorite';
            D.detailFavButton.classList.toggle('favorited', isFav);
        },

        // --- View Toggles ---
        showLoading(isLoading) {
            Store.setState({isLoading});
            D.loadingContainer.classList.toggle('hidden', !isLoading);
            D.searchButton.disabled = isLoading;
            if (isLoading) {
                D.artGalleryContainer.classList.add('hidden');
                D.pager.classList.add('hidden');
                D.searchError.textContent = '';
            } else {
                D.artGalleryContainer.classList.remove('hidden');
            }
        },
        showView(view) { // 'gallery' or 'detail'
            const isDetailView = view === 'detail';
            D.artGalleryContainer.classList.toggle('hidden', isDetailView);
            D.searchSection.classList.toggle('hidden', isDetailView);
            D.artDetailSection.classList.toggle('hidden', !isDetailView);
            if (isDetailView) {
                window.scrollTo(0, 0);
            }
            this.updatePager();
        },
    };

    // --- VII. CONTROLLERS / EVENT HANDLERS ---
    const App = {
        async handleSearch(query) {
            UI.showLoading(true);
            Store.setState({currentView: 'gallery', currentPage: 0});

            try {
                const data = await API.searchMet(query);
                const objectIDs = (data.objectIDs && data.total > 0) ? data.objectIDs : [];
                Store.setState({allObjectIDs: objectIDs});
                await this.renderCurrentPage();
            } catch (error) {
                Store.setState({error: error.message, allObjectIDs: []});
                D.searchError.textContent = 'Error loading art. Please check your connection and try again.';
                UI.renderGallery([]); // Clear gallery and show no results
            } finally {
                UI.showLoading(false);
            }
        },

        async renderCurrentPage() {
            UI.showLoading(true);
            const {allObjectIDs, currentPage} = Store.getState();

            // Validate that we have object IDs
            if (!allObjectIDs || allObjectIDs.length === 0) {
                UI.renderGallery([]);
                UI.showLoading(false);
                return;
            }

            const startIdx = currentPage * C.PAGE_SIZE;
            const endIdx = Math.min((currentPage + 1) * C.PAGE_SIZE, allObjectIDs.length);
            const idsToFetch = allObjectIDs.slice(startIdx, endIdx);

            // Validate pagination bounds
            if (startIdx >= allObjectIDs.length || idsToFetch.length === 0) {
                Store.setState({currentPage: 0});
                UI.showLoading(false);
                return;
            }

            const artPieces = (await Promise.all(idsToFetch.map((id) => API.getArtDetails(id)))).filter(Boolean);

            UI.renderGallery(artPieces);
            UI.updatePager();
            UI.showLoading(false);
        },

        async handleShowFavorites() {
            UI.showLoading(true);
            Store.setState({currentView: 'favorites', allObjectIDs: [], currentPage: 0});
            UI.showView('gallery');

            const favoriteIDs = [...Favorites.get()];
            const artPieces = (await Promise.all(favoriteIDs.map((id) => API.getArtDetails(id)))).filter(Boolean);

            UI.renderGallery(artPieces);
            UI.showLoading(false);
        },

        async handleShowDetail(objectId) {
            UI.showLoading(true);
            const artDetails = await API.getArtDetails(objectId);
            UI.showLoading(false);

            if (artDetails) {
                Store.setState({currentArtObject: artDetails, currentView: 'detail'});
                UI.updateDetailView(artDetails);
                UI.showView('detail');
            } else {
                alert('Could not load details for this artwork.');
            }
        },

        handleHideDetail() {
            const {currentView} = Store.getState();
            Store.setState({currentArtObject: null, currentView: currentView === 'favorites' ? 'favorites' : 'gallery'});
            UI.showView('gallery');
        },

        handleToggleFavorite(objectId, cardButton) {
            Favorites.toggle(objectId);
            // Update button on card if provided
            if (cardButton) {
                cardButton.classList.toggle('favorited', Favorites.has(objectId));
            }
            // Update button on detail page if it's the current item
            const {currentArtObject} = Store.getState();
            if (currentArtObject && currentArtObject.objectID === objectId) {
                UI.updateDetailFavoriteButton(objectId);
            }
        },

        handleChangePage(direction) {
            const {currentPage, allObjectIDs} = Store.getState();
            const maxPage = Math.ceil(allObjectIDs.length / C.PAGE_SIZE) - 1;
            const newPage = currentPage + direction;

            if (newPage >= 0 && newPage <= maxPage) {
                Store.setState({currentPage: newPage});
                this.renderCurrentPage();
            }
        },

        // --- Initializer ---
        init() {
            // Set dynamic content
            D.copyright.textContent = `© ${new Date().getFullYear()} Met Gallery Guide`;

            // Register all event listeners
            D.searchButton.addEventListener('click', () => {
                const query = D.searchInput.value.trim();
                if (query) {
                    this.handleSearch(query);
                } else {
                    D.searchError.textContent = 'Please enter a search term.';
                }
            });

            D.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') D.searchButton.click();
            });

            D.artGallery.addEventListener('click', (e) => {
                const card = e.target.closest('.art-card');
                if (!card) return;

                const objectId = parseInt(card.dataset.objectId, 10);
                const favButton = e.target.closest('.favorite-btn');

                if (favButton) {
                    e.stopPropagation();
                    this.handleToggleFavorite(objectId, favButton);
                } else {
                    this.handleShowDetail(objectId);
                }
            });

            D.backToGalleryButton.addEventListener('click', () => this.handleHideDetail());

            D.detailFavButton.addEventListener('click', () => {
                const {currentArtObject} = Store.getState();
                if (currentArtObject) {
                    this.handleToggleFavorite(currentArtObject.objectID);
                }
            });

            D.prevButton.addEventListener('click', () => this.handleChangePage(-1));
            D.nextButton.addEventListener('click', () => this.handleChangePage(1));

            D.favoritesNavButton.addEventListener('click', () => this.handleShowFavorites());

            // Initial load
            this.handleSearch(C.DEFAULT_SEARCH);
        },
    };

    // --- VIII. APP INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => App.init());
})(window, document);

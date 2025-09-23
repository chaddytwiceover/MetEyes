# Met Gallery AI Guide

Welcome to the Met Gallery AI Guide, a web application designed to help users explore the vast collection of the Metropolitan Museum of Art with the assistance of a powerful AI guide, powered by Google Gemini.

## Purpose

The goal of this project is to create an engaging and educational experience for art enthusiasts. Users can search for artworks, view high-quality images and details, and get unique, AI-generated insights and analysis on their favorite pieces. It bridges the gap between a traditional online gallery and a personalized, guided tour.

---

## Application Structure

The application is built with standard web technologies: HTML, CSS, and JavaScript. The structure is straightforward and modular.

### `index.html`

This is the main entry point and skeleton of the application. It defines the layout and contains all the necessary containers for dynamic content.

- **`<header>`**: Displays the application title.
- **`<main>`**: The primary content area, divided into three key sections:
  - `#search-section`: Contains the input field and button for users to search the Met's collection.
  - `#art-gallery`: A grid where search results (artwork cards) are dynamically loaded. It also handles loading states and "no results" messages.
  - `#art-detail`: A view that is hidden by default. It displays detailed information about a single selected artwork, including the AI-generated insights from Gemini.
- **`<footer>`**: Contains the copyright information, which is dynamically updated with the current year.

### `style.css`

This file contains all the styling rules to make the application visually appealing, responsive, and user-friendly.

- **Layout & Responsiveness**: Uses CSS Grid (`#art-gallery`) for a responsive layout of artwork cards that adapts to different screen sizes.
- **User Feedback**: Styles for loading spinners, error messages, and disabled buttons to provide clear visual feedback to the user.
- **Transitions & Animations**: Subtle `fadeIn` animations and transitions make the user experience smoother when content appears or changes.
- **Accessibility**: Includes `:focus` styles for buttons and inputs to improve keyboard navigation, and a `.visually-hidden` class to provide context for screen readers without cluttering the visual interface.

### `script.js`

This is the heart of the application, containing all the logic for user interaction, API communication, and DOM manipulation.

- **Global Variables**: Constants for API endpoints and DOM element references.
- **Met Gallery API Functions**:
  - `searchMetArt(query)`: Takes a search query, fetches a list of object IDs from the Met API, and then orchestrates fetching the details for each object.
  - `getArtDetails(objectId)`: Fetches detailed information for a single artwork from the Met API.
- **Google Gemini Integration**:
  - `getGeminiFact(artDetails)`: Constructs a detailed prompt based on the current artwork's data and sends it to the Google Gemini API to get AI-generated analysis.
- **DOM Manipulation Functions**:
  - `displayArtPieces(artPieces)`: Renders the search results into the `#art-gallery` grid.
  - `showArtDetail(art)` / `hideArtDetail()`: Toggles the visibility between the gallery view and the detailed artwork view.
- **Event Listeners**:
  - Handles clicks on the search button, artwork cards, "Back to Gallery" button, and the "Ask Gemini" button.
  - Listens for the `Enter` key in the search input.
  - An initial `DOMContentLoaded` event listener sets the copyright year and performs an initial search to populate the gallery on page load.

---

## Potential Improvements & Future Features

This project has a solid foundation, but there are many ways it could be extended and improved.

1.  **Pagination for Search Results**:

    - **Problem**: The app currently only shows the first 20 results from a search, but the API can return thousands.
    - **Solution**: Implement "Next" and "Previous" buttons to allow users to paginate through all the results from their search query. This would involve storing the full list of `objectIDs` and the current page number in the application's state.

2.  **"Favorites" System**:

    - **Problem**: Users have no way to save artworks they find interesting.
    - **Solution**: Add a "Favorite" button (e.g., a heart icon) to each art card and detail view. Use the browser's `localStorage` to save a list of favorited artwork IDs. A new "Favorites" view could be added to the navigation to display all saved pieces.

3.  **Advanced Search Filters**:

    - **Problem**: The current search is a simple text query.
    - **Solution**: The Met API supports more advanced searching. Add UI elements (like dropdowns or checkboxes) to allow users to filter by department, artist, date range, or medium.

4.  **More Interactive AI Chat**:

    - **Problem**: The Gemini interaction is a one-time "ask for a fact."
    - **Solution**: Turn the Gemini section into a mini-chat. After the initial fact, provide buttons with follow-up questions like "Tell me more about the artist," "What was happening in the world when this was made?", or "Explain the artistic style."

5.  **Image Zoom/Pan Functionality**:

    - **Problem**: Users can't inspect the fine details of the high-resolution artwork images.
    - **Solution**: Integrate a lightweight JavaScript library (like Panzoom) to allow users to click on the detail image to open a modal view where they can zoom in and pan around the artwork.

6.  **Improved Error Handling & Resilience**:

    - **Problem**: While basic error handling exists, it could be more robust.
    - **Solution**: Implement a retry mechanism with exponential backoff for failed API requests. Provide more specific error messages to the user based on the type of network or API error that occurred.

7.  **Deployment & Build Process**:
    - **Problem**: The project is currently run locally.
    - **Solution**: Add instructions for deploying the application to a static hosting service (like Netlify, Vercel, or GitHub Pages). For a more advanced setup, a simple build process could be added to minify CSS and JavaScript for production.

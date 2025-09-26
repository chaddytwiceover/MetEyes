# Met Gallery AI Guide

Welcome to the Met Gallery AI Guide, a web application designed to help users explore the vast collection of the Metropolitan Museum of Art with the assistance of a powerful AI guide, powered by Google Gemini.

## Purpose

The goal of this project is to create an engaging and educational experience for art enthusiasts. Users can search for artworks, view high-quality images and details, and get unique, AI-generated insights and analysis on their favorite pieces. It bridges the gap between a traditional online gallery and a personalized, guided tour.

## Table of Contents

- [Purpose](#purpose)
- [Application Structure](#application-structure)
- [Getting Started](#getting-started)
- [Development](#development)
  - [Code Style and Linting](#code-style-and-linting)
  - [Testing](#testing)
- [Contributing](#contributing)
- [Potential Improvements & Future Features](#potential-improvements--future-features)
- [Secure Gemini proxy (Firebase Functions)](#secure-gemini-proxy-firebase-functions)

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

## Getting Started

Follow these steps to set up and run the Met Gallery AI Guide locally.

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- A web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chaddytwiceover/MetEyes.git
   cd MetEyes
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Serve the application:**
   Since this is a static web application, you can serve it using any static file server. Here are a few options:

   **Option A: Using Python (if installed):**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Using Node.js serve package:**
   ```bash
   npx serve public
   ```

   **Option C: Using Live Server (VS Code extension):**
   - Install the Live Server extension in VS Code
   - Right-click on `public/index.html` and select "Open with Live Server"

4. **Open your browser:**
   Navigate to `http://localhost:8000` (or the port shown by your chosen server) to view the application.

---

## Development

### Code Style and Linting

This project uses ESLint to enforce consistent code style and catch potential issues.

**Available linting commands:**

```bash
# Check code style and potential issues
npm run lint

# Automatically fix fixable issues
npm run lint:fix
```

**ESLint Configuration:**
- Uses Google JavaScript Style Guide as the base
- Configured for browser, Node.js, and Jest environments
- 4-space indentation with 120-character line length
- Single quotes for main application code
- Double quotes for Firebase Functions code
- Special rules for test files to allow Jest globals

**Before committing code:**
1. Run `npm run lint` to check for style issues
2. Fix any errors or warnings reported
3. Use `npm run lint:fix` to automatically fix formatting issues

### Testing

This project includes comprehensive tests for the AI integration functionality.

**Available test commands:**

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage:**
- **24 test cases** covering all specified scenarios
- **79.16%** statement coverage
- **86.95%** branch coverage
- Tests include successful API calls, error handling, input validation, and edge cases

**Test Architecture:**
- **Framework:** Jest with jsdom environment
- **Mocking:** Global fetch mock for API calls
- **Setup:** Automated test setup with proper cleanup between tests
- **Organization:** Tests are grouped by functionality for clarity

---

## Contributing

We welcome contributions to improve the Met Gallery AI Guide! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the coding standards below

### Coding Standards
- Follow the existing code style enforced by ESLint
- Run `npm run lint` before committing to ensure code quality
- Add tests for new functionality when appropriate
- Keep commits focused and write clear commit messages
- Update documentation if you add new features or change existing behavior

### Pull Request Process
1. **Before submitting:**
   - Ensure all tests pass: `npm test`
   - Ensure code passes linting: `npm run lint`
   - Test your changes manually in the browser
   - Update the README if you've added new features or changed setup instructions

2. **Submit your PR:**
   - Use a descriptive title and provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Be responsive to feedback and make requested changes promptly

3. **Code Review:**
   - All PRs require review before merging
   - Address reviewer comments and suggestions
   - Keep the PR scope focused - smaller PRs are easier to review

### Reporting Issues
- Use the GitHub Issues tab to report bugs or request features
- Include steps to reproduce the issue
- Provide browser version and any error messages
- For feature requests, explain the use case and expected behavior

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

---

## Secure Gemini proxy (Firebase Functions)

This project includes a ready-to-deploy Firebase Cloud Function that acts as a secure proxy to the Google Gemini API. The purpose is to keep your Gemini API key secret and to allow server-side caching and light abuse protection.

What was added:

- `functions/index.js` — a Firebase HTTPS function named `gemini` that accepts POST requests with JSON body `{ prompt: string, objectID?: string }`.
- `functions/package.json` — function dependencies.

How to deploy (minimal):

1. Install Firebase CLI and login:

```powershell
npm install -g firebase-tools
firebase login
```

2. Initialize functions (if you haven't already) or skip if the `functions` folder is present:

```powershell
cd path\to\MetEyes
firebase init functions
```

3. Set the Gemini API key (option A: environment var via CLI config):

```powershell
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

Optional: set a small proxy key to reduce anonymous abuse (server-side check for `x-proxy-key` header):

```powershell
firebase functions:config:set gemini.proxy_key="SOME_PROXY_SECRET"
```

4. Deploy the function:

```powershell
firebase deploy --only functions:gemini
```

5. Update your frontend `GEMINI_API_PROXY_URL` to point to the deployed function URL, for example `https://us-central1-<project-id>.cloudfunctions.net/gemini` or configure Firebase Hosting rewrites so `/api/gemini` rewrites to the function.

Firebase hosting rewrite example in `firebase.json`:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/gemini",
        "function": "gemini"
      }
    ]
  }
}
```

Notes & recommendations:

- The cache used by the function is in-memory and ephemeral — it helps reduce duplicated calls while a function instance is warm but is not a persistent cache. For persistent caching use Firestore or Redis.
- Monitor usage and add rate-limiting or authentication (Firebase Auth + Callable functions) if you see abuse.
- Keep an eye on Gemini billing and function invocation costs.

This app is intentionally Gemini-only for AI features. It does not use Genkit or any other multi-model orchestration. If you want to add other models later, consider a Genkit-based architecture, but for now the code assumes Gemini as the only model and the serverless proxy is tailored to Gemini's REST endpoint.

This repo also includes `firebase.json` which demonstrates a Hosting rewrite so the frontend can POST to `/api/gemini` and have requests routed to the `gemini` Cloud Function. Adjust the `hosting.public` directory in `firebase.json` as needed for your hosting layout.

const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client with the API key from Firebase config.
// This is a secure way to access your key without putting it in the code.
const genAI = new GoogleGenerativeAI(functions.config().gemini.key);

/**
 * A Firebase HTTPS Function that acts as a secure proxy to the Gemini API.
 * Your frontend will call this function, and this function will securely
 * call Gemini.
 */
exports.geminiProxy = functions.https.onRequest(async (req, res) => {
  // Set CORS headers to allow requests from your web app.
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle pre-flight CORS requests.
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  // We only want to handle POST requests for this function.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A 'prompt' is required in the request body." });
    }

    // Access the specific Gemini model.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Send the prompt to Gemini and wait for the result.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the text from Gemini back to the frontend.
    return res.status(200).json({ text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({ error: "Failed to communicate with the Gemini API." });
  }
});


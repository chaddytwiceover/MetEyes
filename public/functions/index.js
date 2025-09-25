const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Define the Gemini API key as a configurable parameter.
// This is the modern, recommended way to handle secrets.
// Set it by running: firebase functions:config:set gemini.key="YOUR_API_KEY"
const geminiApiKey = defineString("GEMINI_KEY");

let genAI;

/**
 * A Firebase HTTPS Function that acts as a secure proxy to the Gemini API.
 * Your frontend will call this function, and this function will securely
 * call Gemini.
 */
exports.geminiProxy = onRequest(
  {
    // It's best practice to specify the region(s).
    region: "us-central1",
    // Allow requests from your deployed site and localhost for development.
    // Replace 'your-firebase-project-id.web.app' with your actual domain.
    cors: [
      "https://your-firebase-project-id.web.app",
      "http://localhost:5000",
    ],
    // Use the defined secret.
    secrets: [geminiApiKey],
  },
  async (req, res) => {
    // We only want to handle POST requests for this function.
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    // Initialize the client only when needed.
    genAI = genAI || new GoogleGenerativeAI(geminiApiKey.value());

    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "A 'prompt' is required." });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      res.status(200).json({ text });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to call the Gemini API." });
    }
  },
);

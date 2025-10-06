/**
 * Firebase Cloud Functions for MetEyes Application
 * Provides a secure proxy to Google Gemini API
 */

const {setGlobalOptions} = require('firebase-functions');
const {onRequest} = require('firebase-functions/v2/https');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const logger = require('firebase-functions/logger');

// Load environment variables for local development
require('dotenv').config();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// In-memory cache for Gemini responses (ephemeral, per-instance)
const responseCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Gemini API Proxy Function
 * Accepts POST requests with a prompt and returns AI-generated insights
 */
exports.geminiProxy = onRequest({
  cors: true,
  maxInstances: 5,
  timeoutSeconds: 60,
}, async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({error: 'Method not allowed. Use POST.'});
    return;
  }

  try {
    const {prompt, objectID} = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({error: 'Invalid request: prompt is required'});
      return;
    }

    // Check cache first
    const cacheKey = `${objectID || 'general'}-${prompt}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info('Returning cached response', {objectID});
      res.status(200).json({text: cached.text, cached: true});
      return;
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY ||
                   process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('GEMINI_API_KEY not configured');
      res.status(500).json({
        error: 'Server configuration error: API key not found',
      });
      return;
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({model: 'gemini-pro'});

    // Generate content
    logger.info('Generating content for prompt', {
      promptLength: prompt.length,
      objectID,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    // Cache the response
    responseCache.set(cacheKey, {
      text,
      timestamp: Date.now(),
    });

    // Clean old cache entries (simple implementation)
    if (responseCache.size > 100) {
      const oldestKey = responseCache.keys().next().value;
      responseCache.delete(oldestKey);
    }

    logger.info('Successfully generated content', {
      responseLength: text.length,
      objectID,
    });

    res.status(200).json({text});
  } catch (error) {
    logger.error('Error generating content', {
      error: error.message,
      stack: error.stack,
    });

    // Handle specific error types
    if (error.message?.includes('API key')) {
      res.status(500).json({
        error: 'API key configuration error',
      });
    } else if (error.message?.includes('quota') ||
               error.message?.includes('rate limit')) {
      res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
      });
    } else {
      res.status(500).json({
        error: 'Failed to generate AI insights. Please try again.',
      });
    }
  }
});

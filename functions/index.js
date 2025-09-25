const functions = require('firebase-functions');
// Node 18 (Cloud Functions runtime) provides a global `fetch`. Use it directly.

// Simple in-memory cache to reduce repeated Gemini calls for the same objectID/prompt
// This cache is ephemeral and only lives while the function instance is warm.
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Optional proxy API key header name - keep it simple for minimal hardening
const PROXY_KEY_HEADER = 'x-proxy-key';

exports.gemini = functions.https.onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.set('Allow', 'POST');
    return res.status(405).send(`Method ${req.method} Not Allowed`);
  }

  try {
    // Optional: check for a small proxy key to limit abuse (set via functions config or env)
    const proxyKey = process.env.PROXY_KEY || functions.config().gemini?.proxy_key;
    if (proxyKey) {
      const provided = req.get(PROXY_KEY_HEADER);
      if (!provided || provided !== proxyKey) {
        return res.status(401).json({ error: 'Unauthorized - invalid proxy key' });
      }
    }

  const { prompt, objectID } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required in the request body' });
    }

    // Use objectID as part of cache key when available (helps dedupe identical prompt calls)
    const cacheKey = objectID ? `${objectID}:${prompt}` : `prompt:${prompt}`;
    const now = Date.now();
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey);
      if (now - entry.ts < CACHE_TTL_MS) {
        return res.status(200).json({ cached: true, ...entry.value });
      }
      cache.delete(cacheKey);
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is not configured.');
      return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY missing' });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const geminiResp = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await geminiResp.json();

    if (!geminiResp.ok) {
      console.error('Gemini error response:', data);
      return res.status(geminiResp.status || 500).json(data);
    }

    // Store in cache
    cache.set(cacheKey, { ts: now, value: data });

    return res.status(200).json(data);

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

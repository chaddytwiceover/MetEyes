/**
 * Vercel/Netlify serverless function to act as a proxy for the Google Gemini API.
 * This is a secure way to make API calls without exposing your API key on the client-side.
 *
 * How it works:
 * 1. The frontend sends a POST request to this function's endpoint (e.g., /api/gemini).
 * 2. This function receives the 'prompt' from the request body.
 * 3. It retrieves the secure GEMINI_API_KEY from the server's environment variables.
 * 4. It forwards the request to the actual Google Gemini API.
 * 5. It returns the response from Gemini back to the frontend.
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API Error:', errorData);
            return res.status(geminiResponse.status).json(errorData);
        }

        const data = await geminiResponse.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
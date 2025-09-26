/**
 * Tests for getGeminiFact function
 * Testing scenarios:
 * 1. Successful API call
 * 2. Error handling (HTTP errors, network failures)
 * 3. Input validation
 * 4. Edge cases
 */

const API = require('../src/api');

describe('getGeminiFact', () => {
    // Test data
    const validArtDetails = {
        title: 'The Starry Night',
        artistDisplayName: 'Vincent van Gogh',
        objectDate: '1889',
    };

    const mockSuccessResponse = {
        text: 'The Starry Night by Vincent van Gogh is one of the most recognizable paintings in Western art. ' +
            'Created during his stay at the Saint-Paul-de-Mausole asylum, it showcases his distinctive ' +
            'post-impressionist style with bold, swirling brushstrokes that convey movement and emotion.',
    };

    const mockErrorResponse = {
        error: 'Failed to generate response',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Successful API Call', () => {
        test('should successfully call Gemini API and return valid response', async () => {
            // Mock successful fetch response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await API.getGeminiFact(validArtDetails);

            expect(result).toEqual(mockSuccessResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                API.constants.GEMINI_API_PROXY_URL,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        prompt: `Tell me an interesting fact or provide a brief analysis about the artwork ` +
                            `titled "The Starry Night" by Vincent van Gogh, created around 1889. ` +
                            `Focus on its historical context, artistic style, or significance. ` +
                            `Keep it concise, around 2-3 sentences.`,
                    }),
                },
            );
        });

        test('should handle artwork with missing optional fields', async () => {
            const artWithoutOptionalFields = {
                title: 'Unknown Masterpiece',
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await API.getGeminiFact(artWithoutOptionalFields);

            expect(result).toEqual(mockSuccessResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                API.constants.GEMINI_API_PROXY_URL,
                expect.objectContaining({
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: expect.stringMatching(/Unknown Masterpiece/),
                }),
            );

            // Check that default values are used for missing fields
            const calledPrompt = JSON.parse(global.fetch.mock.calls[0][1].body).prompt;
            expect(calledPrompt).toContain('an unknown artist');
            expect(calledPrompt).toContain('an unknown date');
        });

        test('should handle artwork with empty string optional fields', async () => {
            const artWithEmptyFields = {
                title: 'Test Artwork',
                artistDisplayName: '',
                objectDate: '',
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await API.getGeminiFact(artWithEmptyFields);

            const calledPrompt = JSON.parse(global.fetch.mock.calls[0][1].body).prompt;
            expect(calledPrompt).toContain('an unknown artist');
            expect(calledPrompt).toContain('an unknown date');
        });
    });

    describe('Error Handling', () => {
        test('should handle HTTP error responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('HTTP error! Status: 500');
        });

        test('should handle HTTP 404 error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('HTTP error! Status: 404');
        });

        test('should handle HTTP 429 (rate limit) error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
            });

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('HTTP error! Status: 429');
        });

        test('should handle network failure', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('Network error');
        });

        test('should handle timeout error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Request timeout'));

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('Request timeout');
        });

        test('should handle JSON parsing error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                },
            });

            await expect(API.getGeminiFact(validArtDetails)).rejects.toThrow('Invalid JSON');
        });
    });

    describe('Input Validation', () => {
        test('should throw error for null artDetails', () => {
            expect(() => API.getGeminiFact(null)).toThrow('artDetails must be a valid object');
        });

        test('should throw error for undefined artDetails', () => {
            expect(() => API.getGeminiFact(undefined)).toThrow('artDetails must be a valid object');
        });

        test('should throw error for non-object artDetails', () => {
            expect(() => API.getGeminiFact('not an object')).toThrow('artDetails must be a valid object');
            expect(() => API.getGeminiFact(123)).toThrow('artDetails must be a valid object');
            expect(() => API.getGeminiFact([])).toThrow('artDetails must be a valid object');
        });

        test('should throw error for missing title', () => {
            expect(() => API.getGeminiFact({})).toThrow('artDetails must have a valid title');
        });

        test('should throw error for null title', () => {
            expect(() => API.getGeminiFact({title: null})).toThrow('artDetails must have a valid title');
        });

        test('should throw error for empty title', () => {
            expect(() => API.getGeminiFact({title: ''})).toThrow('artDetails must have a valid title');
            expect(() => API.getGeminiFact({title: '   '})).toThrow('artDetails must have a valid title');
        });

        test('should throw error for non-string title', () => {
            expect(() => API.getGeminiFact({title: 123})).toThrow('artDetails must have a valid title');
            expect(() => API.getGeminiFact({title: {}})).toThrow('artDetails must have a valid title');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty API response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            });

            const result = await API.getGeminiFact(validArtDetails);
            expect(result).toEqual({});
        });

        test('should handle API response with null text', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({text: null}),
            });

            const result = await API.getGeminiFact(validArtDetails);
            expect(result).toEqual({text: null});
        });

        test('should handle API response with error field', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse,
            });

            const result = await API.getGeminiFact(validArtDetails);
            expect(result).toEqual(mockErrorResponse);
        });

        test('should handle very long title', async () => {
            const longTitleArt = {
                title: 'A'.repeat(1000), // Very long title
                artistDisplayName: 'Test Artist',
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await API.getGeminiFact(longTitleArt);
            expect(result).toEqual(mockSuccessResponse);

            const calledPrompt = JSON.parse(global.fetch.mock.calls[0][1].body).prompt;
            expect(calledPrompt).toContain('A'.repeat(1000));
        });

        test('should handle special characters in artwork details', async () => {
            const specialCharArt = {
                title: 'Art with "quotes" & special chars <>\\',
                artistDisplayName: 'Artist with àccénts & symbols ©®',
                objectDate: '1800-1850 (circa)',
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await API.getGeminiFact(specialCharArt);
            expect(result).toEqual(mockSuccessResponse);

            const calledPrompt = JSON.parse(global.fetch.mock.calls[0][1].body).prompt;
            expect(calledPrompt).toContain(specialCharArt.title);
            expect(calledPrompt).toContain(specialCharArt.artistDisplayName);
            expect(calledPrompt).toContain(specialCharArt.objectDate);
        });

        test('should handle Unicode characters', async () => {
            const unicodeArt = {
                title: '蒙娜丽莎 (Mona Lisa in Chinese)',
                artistDisplayName: 'Léonard de Vinci',
                objectDate: '1503–1519',
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await API.getGeminiFact(unicodeArt);
            expect(result).toEqual(mockSuccessResponse);

            const calledPrompt = JSON.parse(global.fetch.mock.calls[0][1].body).prompt;
            expect(calledPrompt).toContain('蒙娜丽莎');
            expect(calledPrompt).toContain('Léonard de Vinci');
        });
    });

    describe('Request Format', () => {
        test('should send correct request format', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await API.getGeminiFact(validArtDetails);

            expect(global.fetch).toHaveBeenCalledWith(
                '/api/gemini',
                expect.objectContaining({
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: expect.stringContaining('prompt'),
                }),
            );

            const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(requestBody).toHaveProperty('prompt');
            expect(typeof requestBody.prompt).toBe('string');
            expect(requestBody.prompt.length).toBeGreaterThan(0);
        });

        test('should construct proper prompt with all fields', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await API.getGeminiFact(validArtDetails);

            const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            const prompt = requestBody.prompt;

            expect(prompt).toContain('The Starry Night');
            expect(prompt).toContain('Vincent van Gogh');
            expect(prompt).toContain('1889');
            expect(prompt).toContain('Tell me an interesting fact');
            expect(prompt).toContain('historical context, artistic style, or significance');
            expect(prompt).toContain('2-3 sentences');
        });
    });
});

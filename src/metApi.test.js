/**
 * Tests for Met Museum API functions
 * Testing scenarios:
 * 1. searchMet - successful and error cases
 * 2. getArtDetails - successful, error, and edge cases
 */

const API = require('./api');

describe('searchMet', () => {
    const mockSearchResponse = {
        total: 2,
        objectIDs: [12345, 67890],
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully search and return object IDs', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSearchResponse,
        });

        const result = await API.searchMet('sunflowers');

        expect(result).toEqual(mockSearchResponse);
        expect(global.fetch).toHaveBeenCalledWith(
            `${API.constants.MET_API_BASE_URL}/search?q=sunflowers&hasImages=true`,
            {},
        );
    });

    test('should URL-encode the search query', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSearchResponse,
        });

        await API.searchMet('van gogh & friends');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('van%20gogh%20%26%20friends'),
            {},
        );
    });

    test('should throw on HTTP error', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 503,
        });

        await expect(API.searchMet('test')).rejects.toThrow('HTTP error! Status: 503');
    });

    test('should throw on network failure', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(API.searchMet('test')).rejects.toThrow('Network error');
    });
});

describe('getArtDetails', () => {
    const mockArtDetails = {
        objectID: 12345,
        title: 'The Starry Night',
        artistDisplayName: 'Vincent van Gogh',
        objectDate: '1889',
        medium: 'Oil on canvas',
        primaryImage: 'https://example.com/image.jpg',
        primaryImageSmall: 'https://example.com/image-small.jpg',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully fetch art details by ID', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockArtDetails,
        });

        const result = await API.getArtDetails(12345);

        expect(result).toEqual(mockArtDetails);
        expect(global.fetch).toHaveBeenCalledWith(
            `${API.constants.MET_API_BASE_URL}/objects/12345`,
            {},
        );
    });

    test('should return null on HTTP error (to not break Promise.all)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        });

        const result = await API.getArtDetails(99999);

        expect(result).toBeNull();
    });

    test('should return null on network failure (to not break Promise.all)', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await API.getArtDetails(12345);

        expect(result).toBeNull();
    });

    test('should return null on JSON parse error', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => {
                throw new Error('Invalid JSON');
            },
        });

        const result = await API.getArtDetails(12345);

        expect(result).toBeNull();
    });

    test('should handle multiple concurrent requests (Promise.all pattern)', async () => {
        const ids = [1, 2, 3];
        const responses = ids.map((id) => ({objectID: id, title: `Art ${id}`}));

        responses.forEach((resp) => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => resp,
            });
        });

        const results = await Promise.all(ids.map((id) => API.getArtDetails(id)));

        expect(results).toHaveLength(3);
        results.forEach((result, i) => {
            expect(result).toEqual(responses[i]);
        });
    });

    test('should filter out nulls when used with Promise.all', async () => {
        global.fetch
            .mockResolvedValueOnce({ok: true, json: async () => ({objectID: 1, title: 'Art 1'})})
            .mockResolvedValueOnce({ok: false, status: 404})
            .mockResolvedValueOnce({ok: true, json: async () => ({objectID: 3, title: 'Art 3'})});

        const results = (await Promise.all([1, 2, 3].map((id) => API.getArtDetails(id)))).filter(Boolean);

        expect(results).toHaveLength(2);
        expect(results[0].objectID).toBe(1);
        expect(results[1].objectID).toBe(3);
    });
});

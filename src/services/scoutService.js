/**
 * scoutService.js
 *
 * Client-side service for calling the /api/scout serverless function.
 * Keeps all fetch logic out of components so ChatPage stays clean.
 */

/**
 * Sends a user query to the Scout API and returns the result.
 *
 * @param {string} query - The user's natural language travel request
 * @returns {Promise<{ matches: Array, fallback_message: string|null }>}
 * @throws {Error} If the network request fails or the API returns an error
 */
export async function searchTravel(query) {
    const response = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });

    // Safely parse — the proxy may return plain text if the API server isn't running
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : { error: await response.text() };

    if (!response.ok) {
        const isProxyError = response.status === 502 || response.status === 504 || !isJson;
        throw new Error(
            isProxyError
                ? 'The API server is not running. Run `vercel dev` instead of `npm run dev`.'
                : data.error || `Request failed with status ${response.status}`
        );
    }

    return data; // { matches: [...], fallback_message: string|null }
}

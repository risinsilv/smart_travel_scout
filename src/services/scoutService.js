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

    const data = await response.json();

    if (!response.ok) {
        // Surface a meaningful error message from the API if available
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data; // { matches: [...], fallback_message: string|null }
}

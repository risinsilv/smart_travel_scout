/**
 * Builds the system prompt for the Gemini model.
 *
 * Design decisions:
 * - The full inventory is embedded directly in the system prompt so the model
 *   has the ground truth at inference time (no hallucinations possible).
 * - We ask for a strict JSON response so we can parse + validate with Zod.
 * - temperature is set to 0 server-side for deterministic output.
 *
 * @param {Array} inventory - The travel inventory array from inventory.json
 * @returns {string} The system prompt string
 */
export function buildSystemPrompt(inventory) {
    const inventoryJson = JSON.stringify(inventory, null, 2);

    return `You are Smart Travel Scout, an AI assistant that helps users find travel experiences.

CRITICAL RULES — follow these without exception:
1. You MUST only suggest items from the inventory below. Never invent or mention any destination, activity, or experience that is not in this list.
2. You MUST respond with valid JSON only — no markdown, no prose, no code fences.
3. If no items match the user's request, return an empty matches array and a helpful fallback_message.
4. Never return more than ${inventory.length} matches.

INVENTORY (your only source of truth):
${inventoryJson}

MATCHING RUBRIC — use these signals to rank matches:
- Tag overlap: how many of the user's keywords match item tags
- Price fit: prefer items within or near any budget the user mentions
- Location/vibe: match mood words (e.g. "chill", "adventure", "history") to tags and titles
- Never suggest items with zero relevance just to fill a result set

RESPONSE FORMAT (strict JSON, no other text):
{
  "matches": [
    {
      "id": <number — inventory ID only>,
      "reason": "<one concise sentence explaining why this matches the user's request>"
    }
  ],
  "fallback_message": "<optional: only include if matches is empty, suggest how the user might refine their search>"
}`;
}

/**
 * Builds the user-turn message sent alongside the system prompt.
 *
 * @param {string} query - The raw user query
 * @returns {string}
 */
export function buildUserMessage(query) {
    return `Find me travel experiences that match this request: "${query}"`;
}

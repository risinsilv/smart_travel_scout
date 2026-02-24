/**
 * Vercel Serverless Function: POST /api/scout
 *
 * Receives a user query, calls the Gemini API with a grounded system prompt,
 * validates the response with Zod, and returns enriched match objects.
 *
 * The API key stays server-side — it is never exposed to the browser.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'module';
import { buildSystemPrompt, buildUserMessage } from '../src/lib/prompts.js';
import { ScoutResponseSchema, VALID_INVENTORY_IDS } from '../src/schemas/scoutResponse.js';

// Load inventory — JSON import with createRequire for ESM compatibility
const require = createRequire(import.meta.url);
const inventory = require('../src/data/inventory.json');

// Build an ID → item lookup for fast enrichment after validation
const inventoryMap = Object.fromEntries(inventory.map((item) => [item.id, item]));

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body ?? {};

    // Validate that a query string was provided
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'A non-empty query string is required.' });
    }

    // Initialise the Gemini client with the server-side API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: missing API key.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        systemInstruction: buildSystemPrompt(inventory),
        generationConfig: {
            temperature: 0,          // Deterministic — no creative drift
            responseMimeType: 'application/json', // Ask Gemini to return JSON directly
        },
    });

    let rawText = '';
    try {
        const result = await model.generateContent(buildUserMessage(query.trim()));
        rawText = result.response.text();
    } catch (geminiError) {
        console.error('[scout] Gemini API error:', geminiError);
        return res.status(502).json({ error: 'Failed to reach the AI service. Please try again.' });
    }

    // --- Parse the raw JSON string from Gemini ---
    let parsed;
    try {
        // Strip markdown code fences if the model wraps the JSON anyway
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
    } catch {
        console.error('[scout] JSON parse error. Raw response:', rawText);
        return res.status(422).json({
            error: 'AI returned invalid JSON. Please try again.',
            raw: rawText,
        });
    }

    // --- Validate with Zod schema ---
    const validation = ScoutResponseSchema.safeParse(parsed);
    if (!validation.success) {
        console.error('[scout] Zod validation failed:', validation.error.flatten());
        return res.status(422).json({
            error: 'AI response failed schema validation.',
            details: validation.error.flatten(),
        });
    }

    const { matches, fallback_message } = validation.data;

    // --- Defence-in-depth: filter to only known inventory IDs ---
    // (Zod already checks this, but belt-and-suspenders is valuable here)
    const safeMatches = matches.filter((m) => VALID_INVENTORY_IDS.includes(m.id));

    // --- Enrich matches: join AI reason with full inventory item data ---
    const enriched = safeMatches.map((m) => ({
        ...inventoryMap[m.id],  // id, title, location, price, tags
        reason: m.reason,
    }));

    return res.status(200).json({
        matches: enriched,
        fallback_message: fallback_message ?? null,
    });
}

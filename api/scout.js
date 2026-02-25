/**
 * Vercel Serverless Function: POST /api/scout
 *
 * Receives a user query, calls the Gemini API with a grounded system prompt,
 * validates the response with Zod, and returns enriched match objects.
 *
 * The API key stays server-side — it is never exposed to the browser.
 */

import { GoogleGenAI } from '@google/genai';
import { createRequire } from 'module';
import { buildSystemPrompt, buildUserMessage } from '../src/lib/prompts.js';
import { ScoutResponseSchema, VALID_INVENTORY_IDS } from '../src/schemas/scoutResponse.js';

// Load inventory — JSON import with createRequire for ESM compatibility
const require = createRequire(import.meta.url);
const inventory = require('../src/data/inventory.json');

// Build an ID → item lookup for fast enrichment after validation
const inventoryMap = Object.fromEntries(inventory.map((item) => [item.id, item]));

console.log('[scout] Handler module loaded. Inventory items:', inventory.length);

export default async function handler(req, res) {
    console.log(`\n[scout] ── Incoming request ── method: ${req.method}`);

    // Only allow POST
    if (req.method !== 'POST') {
        console.warn('[scout] Rejected: wrong HTTP method:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, model: clientModel, provider: clientProvider } = req.body ?? {};
    console.log('[scout] Query received:', JSON.stringify(query));
    console.log('[scout] Client requested model/provider:', clientModel, clientProvider);

    // Validate that a query string was provided
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        console.warn('[scout] Rejected: empty or missing query');
        return res.status(400).json({ error: 'A non-empty query string is required.' });
    }

    // Determine which provider to use.  Default to Gemini if unspecified.
    const provider = clientProvider || 'gemini';
    let rawText = '';

    if (provider === 'openrouter') {
        // openrouter requires its own API key
        const orKey = process.env.OPENROUTER_API_KEY;
        if (!orKey) {
            console.error('[scout] FATAL: OPENROUTER_API_KEY is not set but client requested openrouter');
            return res.status(500).json({ error: 'Server configuration error: missing OpenRouter API key.' });
        }

        try {
            const { OpenRouter } = await import('@openrouter/sdk');
            const openRouter = new OpenRouter({
                apiKey: orKey,
            });

            const modelName = clientModel || process.env.OPENROUTER_MODEL || 'openai/gpt-4o';
            console.log('[scout] Calling OpenRouter API with model', modelName);

            const completion = await openRouter.chat.send({
                chatGenerationParams: {
                    model: modelName,
                    messages: [
                        { role: 'system', content: buildSystemPrompt(inventory) },
                        { role: 'user', content: buildUserMessage(query.trim()) },
                    ],
                    stream: false,
                },
            });

            rawText = completion?.choices?.[0]?.message?.content || '';
            console.log('[scout] Raw OpenRouter response:', rawText);
        } catch (orError) {
            console.error('[scout] ❌ OpenRouter API call failed:');
            console.error('  Message:', orError.message);
            console.error('  Stack:', orError.stack);
            return res.status(502).json({ error: 'Failed to reach the AI service. Please try again.' });
        }
    } else {
        // default to Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = clientModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        console.log('[scout] API key present:', !!apiKey);
        console.log('[scout] Using model:', modelName);

        if (!apiKey) {
            console.error('[scout] FATAL: GEMINI_API_KEY is not set in environment variables');
            return res.status(500).json({ error: 'Server configuration error: missing API key.' });
        }

        try {
            // New @google/genai SDK — pass apiKey as an object property
            const ai = new GoogleGenAI({ apiKey });

            console.log('[scout] Calling Gemini API...');
            const response = await ai.models.generateContent({
                model: modelName,
                contents: buildUserMessage(query.trim()),
                config: {
                    systemInstruction: buildSystemPrompt(inventory),
                    temperature: 0,                        // Deterministic — no creative drift
                    responseMimeType: 'application/json',  // Ask Gemini to return JSON directly
                },
            });

            rawText = response.text;
            console.log('[scout] Raw Gemini response:', rawText);
        } catch (geminiError) {
            console.error('[scout] ❌ Gemini API call failed:');
            console.error('  Message:', geminiError.message);
            console.error('  Status:', geminiError.status);
            console.error('  Stack:', geminiError.stack);
            return res.status(502).json({ error: 'Failed to reach the AI service. Please try again.' });
        }
    }

    // --- Parse the raw JSON string from Gemini ---
    let parsed;
    try {
        // Strip markdown code fences if the model wraps the JSON anyway.
        // Some models prepend whitespace/newlines before ```json, so trim first.
        let cleaned = (rawText ?? '').trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
        }
        parsed = JSON.parse(cleaned);
        console.log('[scout] Parsed AI JSON:', JSON.stringify(parsed, null, 2));
    } catch (parseError) {
        console.error('[scout] ❌ JSON parse failed');
        console.error('  Parse error:', parseError.message);
        console.error('  Raw text was:', rawText);
        return res.status(422).json({
            error: 'AI returned invalid JSON. Please try again.',
            raw: rawText,
        });
    }

    // --- Validate with Zod schema ---
    console.log('[scout] Running Zod validation...');
    const validation = ScoutResponseSchema.safeParse(parsed);
    if (!validation.success) {
        console.error('[scout] ❌ Zod validation failed:', JSON.stringify(validation.error.flatten(), null, 2));
        return res.status(422).json({
            error: 'AI response failed schema validation.',
            details: validation.error.flatten(),
        });
    }
    console.log('[scout] ✅ Zod validation passed');

    const { matches, fallback_message } = validation.data;
    console.log('[scout] Matched IDs from AI:', matches.map(m => m.id));

    // --- Defence-in-depth: filter to only known inventory IDs ---
    const safeMatches = matches.filter((m) => VALID_INVENTORY_IDS.includes(m.id));
    console.log('[scout] Safe matches after ID filter:', safeMatches.length);

    // --- Enrich matches: join AI reason with full inventory item data ---
    const enriched = safeMatches.map((m) => ({
        ...inventoryMap[m.id],   // id, title, location, price, tags
        reason: m.reason,
    }));

    console.log('[scout] ✅ Responding with', enriched.length, 'enriched match(es)');
    return res.status(200).json({
        matches: enriched,
        fallback_message: fallback_message ?? null,
    });
}

# 🌏 Smart Travel Scout

Smart Travel Scout is an AI-powered travel recommendation chat app. Describe what kind of trip you are after — budget, activity, vibe — and the assistant searches a curated Sri Lankan travel inventory to find the experiences that best match your request.

---

## Features

- **AI-powered search** — natural language queries matched against a real inventory using a structured LLM response
- **Dual AI providers** — choose between **Google Gemini** and **OpenRouter** (which gives access to many models including OpenAI GPT) from a dropdown in the chat interface
- **Constrained JSON output** — the AI returns only inventory IDs and short reasons; the backend joins those IDs to the full item data, keeping prompts short and responses predictable
- **Schema validation** — every AI response is validated with [Zod](https://zod.dev) before it is shown to the user
- **Cancel in-flight requests** — a **Cancel** button lets you abort a slow response at any time
- **Serverless backend** — the API key never reaches the browser; all AI calls happen in a Vercel Serverless Function (`/api/scout`)

---

## ⚠️ Note on AI Model Availability

Sometimes an AI model may not respond. This can happen because:

Note: Since I'm using a free tier and less powerful model response time may very.

- The query exceeds the model's **token limit** (very long messages or large inventory context)
- The provider is experiencing **high traffic** or rate-limiting
- The selected model is temporarily unavailable

If a request fails or times out, try:
1. Switching to the other AI provider using the **Model** dropdown
2. Simplifying your query
3. Trying again after a short wait

Both Gemini and OpenRouter models are available in the dropdown precisely so you have a fallback when one provider is unresponsive.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material UI |
| AI – Provider A | Google Gemini (`@google/genai`) |
| AI – Provider B | OpenRouter (`@openrouter/sdk`) |
| Validation | Zod |
| Backend | Vercel Serverless Functions (Node.js ESM) |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/risinsilv/smart_travel_scout.git
cd smart_travel_scout
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# --- Server-side API keys (never exposed to the browser) ---
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional server-side model defaults
GEMINI_MODEL=gemini-3-flash-preview
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct

# --- Frontend model dropdown (prefix with VITE_MODEL_) ---
# Format: gemini:<model-name>  or  openrouter:<model-name>
VITE_MODEL_1=gemini:gemini-3-flash-preview
VITE_MODEL_2=openrouter:meta-llama/llama-3.2-3b-instruct
```

Each `VITE_MODEL_*` entry adds one option to the **Model** dropdown in the chat interface.

### 3. Run locally

```bash
# Start both the Vite dev server and the local API server together
npm run dev:full
```

Or run them separately:

```bash
npm run dev:server   # Node API server (port 3001)
npm run dev          # Vite frontend  (port 5173)
```

### 4. Deploy

Push to a Vercel-connected repository. Vercel will automatically detect the `/api` directory and deploy `scout.js` as a Serverless Function. Set the environment variables above in the Vercel project settings.

---

## How the AI Integration Works

1. The user types a query (e.g. *"beach trip under $100"*).
2. The frontend sends the query plus the chosen model/provider to `POST /api/scout`.
3. The serverless function builds a short system prompt that includes the full inventory (5 items) and instructs the model to return **only a JSON array of matched IDs with one-line reasons**.
4. The response is validated with Zod and the IDs are joined to the local inventory data.
5. The enriched matches (title, location, price, tags, reason) are returned to the frontend.

---

## Submission – Passion Check

### 1. The "Under the Hood" Moment

**Technical hurdle:** Connecting the Gemini API response to the frontend reliably.

1.

The first version sent the full AI response text directly to the UI, but the Gemini model occasionally wrapped its JSON output in markdown code fences (` ```json … ``` `) even when `responseMimeType: 'application/json'` was set. This caused `JSON.parse` to throw and the whole request to fail with a confusing "invalid JSON" error.

**How I debugged it:** I added detailed `console.log` statements in the serverless function to print the raw response text before parsing. Once I could see the actual output in the Vercel function logs, the fence wrapping was obvious. The fix was a small pre-processing step that strips any leading/trailing code fences before parsing:

```js
if (cleaned.startsWith('```')) {
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}
```

After that, parsing became reliable across different model versions.

---

2. 

### 2. The Scalability Thought

With only five items, the entire inventory easily fits inside the system prompt without hitting token limits. In this case, using a RAG approach would add unnecessary complexity.

Generating embeddings and performing vector search would introduce extra processing steps without providing meaningful performance or accuracy benefits. For such a small dataset, this could even increase response time.

Therefore, directly grounding the LLM with the full inventory in the prompt is the most efficient and appropriate solution for this assignment. If the dataset scaled significantly, I would then adopt a hybrid retrieval approach.

 With **50,000 packages**, that approach would be far too expensive and the model would lose precision.

Here is how I would adapt:

| Concern | Solution |
|---|---|
| **Token cost** | Pre-compute vector embeddings (e.g. with `text-embedding-3-small`) for each inventory item's title, tags, and location. At query time, embed the user's query and do a **top-k vector search** to retrieve only the most semantically relevant candidates before calling the LLM. |
| **Accuracy** | Send only the top-k candidates to the LLM instead of the full catalogue. A smaller, focused context means the model is less likely to hallucinate or mix up items. |
| **Response schema** | Ask the LLM to return **only item IDs + one-line reasons** (already done), then join locally. This keeps the output token count minimal regardless of inventory size. |
| **Cost controls** | Use `temperature: 0` for determinism (already set), cache identical prompt hashes (e.g. with Redis), apply a keyword pre-filter to skip the LLM entirely for simple queries like *"cheapest"* or *"beach"*, and set short, reusable system prompts. The other option is to use sementic hashing, instead of hashing the text directly, convert the prompt into a vector embedding and store that with the answer, So when a prompt arrives, system can compute the embedding of the prompt adn searches for vectors that is within a defined similarity threshold. |
| **Infrastructure** | Store embeddings in a vector database (Pinecone, pgvector, or Supabase Vector) so the similarity search is fast and scalable without loading all items into memory. |

---

### 3. The AI Reflection

**AI tools used:** GitHub Copilot (inline suggestions) and ChatGPT (architecture questions and debugging help).

**Instance of a bad suggestion:** when i asked the AI agent to suggest me a api intigration process of the relevent LLM model:

I used Claude Code as my AI agent to generate the integration code for calling the API. The code provided was mostly correct, but when I deployed and ran it on Vercel, it resulted in a response error. Although the model suggested fixes, the issue persisted, so I had to log the entire API request process to debug it properly. Through debugging, I discovered that my system was not following the recommended procedure outlined in the Gemini documentation. After reviewing the documentation carefully, I found that my implementation was using a different component to configure the API request instead of the recommended approach described in the official documentation.Then I implimented the recommended approach.
---


## Project Structure

```
smart_travel_scout/
├── api/
│   └── scout.js          # Vercel Serverless Function – AI routing & validation
├── src/
│   ├── components/
│   │   └── chat/         # ChatMessage, ChatInput components
│   ├── data/
│   │   └── inventory.json # 5 Sri Lankan travel packages
│   ├── lib/
│   │   └── prompts.js    # System prompt & user message builders
│   ├── pages/
│   │   └── ChatPage.jsx  # Main chat UI with model dropdown
│   ├── schemas/
│   │   └── scoutResponse.js  # Zod validation schema
│   └── services/
│       └── scoutService.js   # Frontend API client
├── .env                  # Local secrets (not committed)
└── vite.config.js
```

---

## License

MIT

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Model configuration

You can now offer multiple AI models in the chat interface. Set environment variables prefixed with `VITE_MODEL_` in your `.env` file. The value should be either the model name for Gemini or prefixed with a provider, e.g.: `openrouter:openai/gpt-5.2`.

Example:

```
VITE_MODEL_1=gemini:gemini-3-flash-preview
VITE_MODEL_2=openrouter:openai/gpt-5.2
VITE_MODEL_3=gemini-1.0
```

The dropdown on the chat page will display each entry. The chosen model is sent to the server which will route the request to Google Gemini or OpenRouter depending on the provider.

You also need the corresponding server keys:

```
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
```

`GEMINI_MODEL` and `OPENROUTER_MODEL` may be used as server-side defaults when the client doesn't specify a model.

## Cancel requests

While a request is in-flight you can hit the **Cancel** button to abort it. This prevents the browser from waiting on the server response and adds a "Request cancelled." message to the chat.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

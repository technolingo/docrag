export const config = {
    port: 3000,
    chunk: { size: 800, overlap: 100 },
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'nomic-embed-text',
    },
    retrieval: { topK: 4 },
} as const;

// `const` at the beginning tells JavaScript to never rebind this variable to a different value,
// but it does not prevent the value itself to mutate.

// `as const` at the end is TypeScript-specific and does not affect runtime behaviour.
// it narrows the types of the values to both `readonly` and `literals`.

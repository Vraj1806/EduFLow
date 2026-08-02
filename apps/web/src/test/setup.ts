import '@testing-library/jest-dom/vitest';

// jsdom does not implement the Fetch API. The AuthProvider calls /auth/me on
// mount; if fetch is absent the call must degrade to "not authenticated"
// gracefully. This stub covers the gap without masking real errors.
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = () => Promise.reject(new Error('fetch is not implemented in jsdom'));
}

// jsdom does not implement window.matchMedia (used for reduced-motion checks).
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

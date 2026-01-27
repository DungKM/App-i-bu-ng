export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  API_TOKEN: import.meta.env.VITE_API_TOKEN as string,
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY as string,

  API_BACKEND_AUTH_NODE_URL: (import.meta.env.VITE_API_BACKEND_AUTH_NODE_URL as string) || "http://localhost:5000",
};
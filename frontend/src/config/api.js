/**
 * Central API base URL.
 * - Development: empty string → Vite proxy handles /api/* → localhost:3456
 * - Production (Vercel): set VITE_API_URL=https://your-app.onrender.com in Vercel env vars
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;

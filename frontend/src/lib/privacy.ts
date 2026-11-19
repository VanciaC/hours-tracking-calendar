/** Who runs the app and answers privacy requests (GDPR article 13). */
export const PRIVACY_OWNER = 'Vancia Chan'

/**
 * Where to send privacy requests. Set at build time with VITE_PRIVACY_CONTACT,
 * so the real address is not written in the code. The fallback is for development only.
 */
export const PRIVACY_CONTACT: string = import.meta.env.VITE_PRIVACY_CONTACT || 'contact@example.com'

/** Change this date whenever the privacy page changes. */
export const PRIVACY_UPDATED = '2026-11-19'

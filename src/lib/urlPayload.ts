import LZString from 'lz-string';
import { DEFAULT_ANIMATION_ID } from '../components/animations/registry';

/**
 * Shape of the data encoded into the shareable link.
 * Kept as short keys since it's serialized into the URL.
 */
export interface HeartPayload {
  /** Short message shown in the terminal console stage */
  q: string;
  /** Recipient name */
  n?: string;
  /** Longer message typed out on the reveal stage */
  m?: string;
  /** Selected animation id (see components/animations/registry) */
  a?: string;
}

/**
 * Encodes a payload into a single, compact URL-safe string.
 * Everything is bundled into one JSON blob and compressed, so the
 * link stays short even when the messages are long - instead of the
 * old approach of base64-encoding each field into its own query param.
 */
export function encodeHeartPayload(payload: HeartPayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

export function buildHeartUrl(origin: string, pathname: string, payload: HeartPayload): string {
  return `${origin}${pathname}?d=${encodeHeartPayload(payload)}`;
}

function decodeLegacyField(value: string): string {
  return decodeURIComponent(atob(value));
}

/**
 * Decodes a payload from `window.location.search`.
 * Supports the current compressed `?d=` format, and falls back to the
 * older `?q=&n=&m=` base64 format so previously shared links keep working.
 */
export function decodeHeartPayload(search: string): HeartPayload | null {
  const params = new URLSearchParams(search);
  const d = params.get('d');

  if (d) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(d);
      if (!json) return null;
      const parsed = JSON.parse(json) as HeartPayload;
      if (!parsed || !parsed.q) return null;
      return { a: DEFAULT_ANIMATION_ID, ...parsed };
    } catch (e) {
      console.error('Failed to decode heart payload:', e);
      return null;
    }
  }

  const legacyQ = params.get('q');
  if (legacyQ) {
    try {
      const payload: HeartPayload = { q: decodeLegacyField(legacyQ), a: DEFAULT_ANIMATION_ID };
      const legacyN = params.get('n');
      const legacyM = params.get('m');
      if (legacyN) payload.n = decodeLegacyField(legacyN);
      if (legacyM) payload.m = decodeLegacyField(legacyM);
      return payload;
    } catch (e) {
      console.error('Failed to decode legacy heart payload:', e);
      return null;
    }
  }

  return null;
}

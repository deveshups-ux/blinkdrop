/**
 * Cryptographic Utility for SHA-256 Checksum & File Integrity
 * Uses native Web Crypto API (SubtleCrypto) for high-speed hardware-accelerated hashing.
 */

/**
 * Compute SHA-256 hash of an ArrayBuffer, Blob, or File
 * Returns a 64-character lowercase hexadecimal hash string.
 */
export async function computeSHA256(data: ArrayBuffer | Blob | File): Promise<string> {
  let buffer: ArrayBuffer;

  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else {
    buffer = await data.arrayBuffer();
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Shorten a 64-character hash for clean UI display (e.g. "a8f3...b2c1")
 */
export function formatHashPreview(hash: string, lead = 6, tail = 4): string {
  if (!hash || hash.length < lead + tail) return hash || '';
  return `${hash.substring(0, lead)}...${hash.substring(hash.length - tail)}`;
}

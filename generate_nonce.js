#!/usr/bin/env njs

/*
 * Standalone sampling helper. This is not used by nginx; it prints generated
 * nonce values so they can be inspected with tools such as CyberChef. It uses
 * njs so the sampling runtime matches the nginx example.
 */

const NONCE_BYTES = 16;
const DEFAULT_COUNT = 1000;

function parseCount(value) {
  if (value === undefined) {
    return DEFAULT_COUNT;
  }

  const count = Number(value);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('count must be a positive integer');
  }

  return count;
}

function generateNonce() {
  const bytes = new Uint8Array(NONCE_BYTES);
  crypto.getRandomValues(bytes);

  return Buffer.from(bytes).toString('base64').replace(/=+$/, '');
}

const count = parseCount(process.argv[2]);

for (let i = 0; i < count; i++) {
  /*
   * 16 random bytes provide 128 bits of entropy before Base64 encoding. Base64
   * padding is encoding overhead, so this helper strips trailing "=" characters
   * to match the nginx example.
   */
  console.log(generateNonce());
}

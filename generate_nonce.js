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

function randomBytes(length) {
  /*
   * Match getnonce.js: njs documents Uint32Array support for
   * crypto.getRandomValues(), so generate 32-bit words and split them into
   * bytes instead of depending on Uint8Array support.
   */
  const words = new Uint32Array(Math.ceil(length / 4));
  crypto.getRandomValues(words);

  const bytes = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    bytes.push(word & 0xff);
    bytes.push((word >>> 8) & 0xff);
    bytes.push((word >>> 16) & 0xff);
    bytes.push((word >>> 24) & 0xff);
  }

  return bytes.slice(0, length);
}

function base64EncodeBytes(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/=+$/, '');
}

const count = parseCount(process.argv[2]);

for (let i = 0; i < count; i++) {
  /*
   * 16 random bytes provide 128 bits of entropy before Base64 encoding. Base64
   * padding is encoding overhead, so this helper strips trailing "=" characters
   * to match the nginx example.
   */
  console.log(base64EncodeBytes(randomBytes(NONCE_BYTES)));
}

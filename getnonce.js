const NONCE_BYTES = 16;

function randomBytes(length) {
  /*
   * CSP nonces should have at least 128 bits before encoding. njs documents
   * Uint32Array support for crypto.getRandomValues(), so generate 32-bit words
   * and split them into bytes instead of depending on Uint8Array support.
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
  /*
   * btoa() expects a binary string, not a JavaScript string containing text.
   * Each character code below is one byte from the random buffer.
   */
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  /*
   * CSP only needs the same nonce string in the policy and element attribute.
   * Strip Base64 padding to keep the value compact and avoid trailing "==".
   */
  return btoa(binary).replace(/=+$/, '');
}

function getnonce(r) {
  /*
   * js_set caches the returned value for the current request unless configured
   * with "nocache". That matters: the CSP header and any HTML substitution must
   * see the same nonce value during a single response.
   */
  return base64EncodeBytes(randomBytes(NONCE_BYTES));
}

export default {getnonce};

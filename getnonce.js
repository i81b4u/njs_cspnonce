const NONCE_BYTES = 16;

function getnonce(r) {
  /*
   * js_set caches the returned value for the current request unless configured
   * with "nocache". That matters: the CSP header and any HTML substitution must
   * see the same nonce value during a single response.
   */
  const bytes = new Uint8Array(NONCE_BYTES);
  crypto.getRandomValues(bytes);

  /*
   * CSP only needs the same nonce string in the policy and element attribute.
   * Strip Base64 padding to keep the value compact and avoid trailing "==".
   */
  return Buffer.from(bytes).toString('base64').replace(/=+$/, '');
}

export default {getnonce};

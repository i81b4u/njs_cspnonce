// Print 1000 nonces
for (let j = 0; j < 1000; j++) {
    // 16 + 2 for a minumum of 128 bits and compensate for b64 padding characters ("==")
    const nonceLength = 18;
    // Preallocate memory for the Uint8Array
    const cvalarray = new Uint8Array(nonceLength);

    // Generate random values in a single call
    crypto.getRandomValues(cvalarray);

    // Use a binary buffer to efficiently build the nonce
    const buffer = [];
    for (let i = 0; i < nonceLength; i++) {
        buffer.push(String.fromCharCode(cvalarray[i]));
    }

    // Encode the binary buffer directly
    const cspnonce = btoa(buffer.join(''));

    console.log(cspnonce);
}

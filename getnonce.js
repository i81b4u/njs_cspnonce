function getnonce() {
  const nonceLength = 18;
  const cvalarray = new Uint8Array(nonceLength);

  crypto.getRandomValues(cvalarray);

  const buffer = [];
  for (let i = 0; i < nonceLength; i++) {
    buffer.push(String.fromCharCode(cvalarray[i]));
  }
  
  const cspnonce = btoa(buffer.join(''));
  return cspnonce
}

export default {getnonce};

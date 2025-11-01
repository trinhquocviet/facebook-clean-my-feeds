export function generateRandomString(): string {
  // - generate random text (first letter must be an alphabet)
  // -- used for css classes
  // -- used for postAttCPID
  // -- used for tagging items
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strArray = [chars.charAt(Math.floor(Math.random() * 52))]; // First letter must be an alphabet

  for (let i = 0; i < 12; i++) {
    strArray.push(chars.charAt(Math.floor(Math.random() * 62)));
  }

  return strArray.join('');
}

export function cleanText(text: string): string {
  // - fb is using ASCII code 160 for whitespace ...
  // -- also "normalise" the text (i.e. convert unicode magic to normal ascii code)
  // -- (unicode magic used to bold/italic/etc characters without html/css/style)
  // return text.replaceAll(String.fromCharCode(160), String.fromCharCode(32)).normalize('NFKC');
  // -- normalise(NKFC) will convert 160(00A0) to 32(0020)
  // -- https://www.unicode.org/charts/normalization/index.html
  return text.normalize('NFKC');
}
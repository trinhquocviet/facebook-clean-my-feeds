export function generateRandomString() {
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
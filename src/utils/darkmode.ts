export function isDarkMode(): boolean {
  // -- fb's dark-mode : off
  if (document.documentElement.classList.contains('__fb-light-mode')) {
    return false;
  };
  // -- fb's dark-mode : on
  if (document.documentElement.classList.contains('__fb-dark-mode')) {
    return true;
  };
  // -- fb's dark-mode: automatic;
  if (document.body) {
    // -- check the body's background colour
    const bodyBackgroundColour = window.getComputedStyle(document.body).backgroundColor;
    const rgb = bodyBackgroundColour.match(/\d+/g);
    if (rgb) {
      const red = parseInt(rgb[0], 10);
      const green = parseInt(rgb[1], 10);
      const blue = parseInt(rgb[2], 10);

      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
      return luminance < 128;
    }
  }
  // -- fallback ...
  return false;
}
export function findFirstMatch(postFullText: string, textValuesToFind: string[]): string {
  const foundText = textValuesToFind.find(text => postFullText.includes(text));
  return foundText !== undefined ? foundText : '';
}

export function findFirstMatchRegExp(postFullText: string, regexpTextValuesToFind: string[]): string {
  // -- using Regular Expressions
  // -- user supplied the RE patterns
  for (const pattern of regexpTextValuesToFind) {
    // -- do not use 'g' - want to reset lastindex to 0 for each test.
    // --'i' flag for case-insensitive matching;
    const regex = new RegExp(pattern, 'i');
    if (regex.test(postFullText)) {
      return pattern;
    }
  }
  return '';
}
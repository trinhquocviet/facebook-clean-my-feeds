export function buildSS(classes: string, styles: string): string {
  // -- formats and builds the StyleSheet code
  // -- parameters: classes (separated by comma), styles (separated by semicolon)
  // -- array actions: .filter - remove empties, .map - trim (or pad + trim)
  // -- function throwing a wobble? - check the properties and values pairs (one could be unmatched)
  const listOfClasses = classes.split(',').filter(function (e) { return e.trim() }).map(e => e.trim());
  let styleLines = styles.split(';').filter(function (e) { return e.trim() });
  styleLines = styleLines.map(function (e) {
    let temp = e.split(':');
    return '    ' + temp[0].trim() + ':' + temp[1].trim();
  });

  let temp = listOfClasses.join(',\n') + ' {\n';
  temp += styleLines.join(';\n') + ';\n';
  temp += '}\n';
  return temp;
}
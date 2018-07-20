export const parseSingleQuoteJSON = (string: string) =>
  JSON.parse(string.replace(/'/g, '"'));

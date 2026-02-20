// -------------------------------------------
// Helper & utility functions

export const parseSingleQuoteJSON = (string: string) =>
  JSON.parse(string.replace(/'/g, '"'));

export const formatFilePath = (filePath: string) =>
  `"${filePath.replace(/\\/g, '/')}"`;

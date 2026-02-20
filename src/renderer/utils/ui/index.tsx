export function sanitizeTextInput(text: string) {
  return text.replace(/[|&;$%@"<>()+,./]/g, '');
}

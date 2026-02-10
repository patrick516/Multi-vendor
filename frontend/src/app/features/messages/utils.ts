// src/app/features/messages/utils.ts

// Shorten a message body for the table
export function snippet(text: string, length = 80): string {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "…" : text;
}

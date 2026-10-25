export type SpeechTranscriptInsertion = Readonly<{
  value: string;
  caretStart: number;
  caretEnd: number;
}>;

/** Replaces the saved selection with one final transcript, preserving text and enforcing the composer limit. */
export function insertSpeechTranscript(
  originalValue: string,
  selectionStart: number,
  selectionEnd: number,
  transcript: string,
  maxLength: number,
): SpeechTranscriptInsertion {
  const start = Math.max(0, Math.min(Math.min(selectionStart, selectionEnd), originalValue.length));
  const end = Math.max(start, Math.min(Math.max(selectionStart, selectionEnd), originalValue.length));
  const before = originalValue.slice(0, start);
  const after = originalValue.slice(end);
  const spoken = transcript.trim();
  if (!spoken) return { value: originalValue, caretStart: selectionStart, caretEnd: selectionEnd };

  const leadingSpace = before && !/\s$/.test(before) ? " " : "";
  const trailingSpace = after && !/^\s/.test(after) ? " " : "";
  const room = Math.max(0, maxLength - before.length - after.length - leadingSpace.length - trailingSpace.length);
  if (!room) return { value: originalValue, caretStart: selectionStart, caretEnd: selectionEnd };

  const insertedText = spoken.slice(0, room);
  const value = `${before}${leadingSpace}${insertedText}${trailingSpace}${after}`;
  const caret = before.length + leadingSpace.length + insertedText.length;
  return { value, caretStart: caret, caretEnd: caret };
}

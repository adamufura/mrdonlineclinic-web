export type ChatMessageLike = {
  content?: string | null;
  displayContent?: string | null;
  originalContent?: string | null;
  isTranslated?: boolean;
};

export function getMessageDisplayText(
  message: ChatMessageLike,
  showOriginal: boolean,
): string {
  const original =
    typeof message.originalContent === 'string'
      ? message.originalContent
      : typeof message.content === 'string'
        ? message.content
        : '';
  const display =
    typeof message.displayContent === 'string'
      ? message.displayContent
      : original;

  if (showOriginal && message.isTranslated) return original;
  return display;
}

export function getMessagePreviewText(message: ChatMessageLike | null | undefined): string {
  if (!message) return '';
  const display =
    typeof message.displayContent === 'string'
      ? message.displayContent
      : typeof message.content === 'string'
        ? message.content
        : '';
  return display.trim();
}

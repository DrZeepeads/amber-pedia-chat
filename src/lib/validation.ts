import { z } from 'zod';

export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .trim(),
  mode: z.enum(['academic', 'clinical']),
});

export const conversationTitleSchema = z.string()
  .min(1, 'Title cannot be empty')
  .max(100, 'Title too long (max 100 characters)')
  .trim();

export const validateMessage = (content: string, mode: string) => {
  try {
    return messageSchema.parse({ content, mode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};

// Sanitize user input for display
export const sanitizeHtml = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

import { z } from 'zod';

// Sanitize input to prevent Google Sheets formula injection
// Prefixes dangerous characters that could be interpreted as formulas
export function sanitizeForSheets(value: string): string {
  if (!value) return value;
  // Characters that trigger formula interpretation in spreadsheets
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
  const trimmed = value.trim();
  if (dangerousChars.some(char => trimmed.startsWith(char))) {
    return `'${trimmed}`; // Prefix with single quote to escape
  }
  return trimmed;
}

// Strip HTML tags to prevent XSS
export function stripHtml(value: string): string {
  if (!value) return value;
  return value.replace(/<[^>]*>/g, '');
}

// Combined sanitization
export function sanitize(value: string): string {
  return sanitizeForSheets(stripHtml(value));
}

// Singapore phone number regex (+65 followed by 8 digits)
const sgPhoneRegex = /^(\+65)?[689]\d{7}$/;

// Registration schema
export const registrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  eventTitle: z.string().min(1).max(200).transform(sanitize),
  userId: z.string().min(1, 'User ID is required'),
  userName: z.string().min(1, 'Name is required').max(100).transform(sanitize),
  userEmail: z.string().email('Invalid email address').max(255).transform(s => s.toLowerCase().trim()),
  userPhone: z.string().optional().transform(val => {
    if (!val) return '';
    const cleaned = val.replace(/\s/g, '');
    return cleaned;
  }).refine(val => !val || sgPhoneRegex.test(val), {
    message: 'Invalid Singapore phone number',
  }),
  registrationType: z.enum(['participant', 'volunteer']),
  isCaregiver: z.boolean().optional().default(false),
  participantName: z.string().max(100).optional().transform(val => val ? sanitize(val) : ''),
  dietaryRequirements: z.string().max(500).optional().transform(val => val ? sanitize(val) : ''),
  specialNeeds: z.string().max(500).optional().transform(val => val ? sanitize(val) : ''),
  needsWheelchairAccess: z.boolean().optional().default(false),
  hasCaregiverAccompanying: z.boolean().optional().default(false),
  caregiverName: z.string().max(100).optional().transform(val => val ? sanitize(val) : ''),
  caregiverPhone: z.string().optional().transform(val => {
    if (!val) return '';
    return val.replace(/\s/g, '');
  }),
});

// Event schema for admin
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).transform(sanitize),
  description: z.string().max(2000).optional().transform(val => val ? sanitize(val) : ''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  location: z.string().min(1).max(200).transform(sanitize),
  category: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(1000).optional(),
  volunteersNeeded: z.number().int().min(0).max(100).optional(),
  wheelchairAccessible: z.boolean().optional(),
  caregiverRequired: z.boolean().optional(),
  confirmationMessage: z.string().max(500).optional().transform(val => val ? sanitize(val) : ''),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type EventInput = z.infer<typeof eventSchema>;

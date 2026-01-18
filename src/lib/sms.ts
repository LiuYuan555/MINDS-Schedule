import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send SMS confirmation message
 * @param to - Phone number to send to
 * @param message - Pre-formatted message to send
 */
export async function sendConfirmationSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!client || !fromPhone) {
    console.warn('Twilio not configured - SMS not sent');
    return { success: false, error: 'SMS service not configured' };
  }

  // Format phone number for Singapore (add +65 if not present)
  let toPhone = to.replace(/\s/g, ''); // Remove spaces
  if (!toPhone.startsWith('+')) {
    if (toPhone.startsWith('65')) {
      toPhone = '+' + toPhone;
    } else if (toPhone.length === 8) {
      toPhone = '+65' + toPhone;
    }
  }

  // Validate phone number format
  if (!/^\+\d{10,15}$/.test(toPhone)) {
    console.warn('Invalid phone number format:', toPhone);
    return { success: false, error: 'Invalid phone number format' };
  }

  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });
    console.log('SMS sent successfully to:', toPhone);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get the default message template for admins to edit
 */
export function getDefaultMessageTemplate(): string {
  return `Hi {name}! You're confirmed for "{event}" on {date} at {time}. Location: {location}. See you there! - MINDS Singapore`;
}

/**
 * Replace placeholders in a message template
 */
export function formatConfirmationMessage(
  template: string,
  params: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
  }
): string {
  return template
    .replace(/\{name\}/gi, params.userName)
    .replace(/\{event\}/gi, params.eventTitle)
    .replace(/\{date\}/gi, params.eventDate)
    .replace(/\{time\}/gi, params.eventTime)
    .replace(/\{location\}/gi, params.eventLocation);
}

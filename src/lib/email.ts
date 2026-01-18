import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Use Resend's test email for development, or your verified domain for production
const FROM_EMAIL = process.env.FROM_EMAIL || 'MINDS Singapore <onboarding@resend.dev>';

/**
 * Send confirmation email after registration
 */
export async function sendConfirmationEmail(
  to: string,
  params: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    customMessage?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured - Email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const { userName, eventTitle, eventDate, eventTime, eventLocation, customMessage } = params;

  // Format the message (use custom or default)
  const messageBody = customMessage
    ? customMessage
        .replace(/\{name\}/gi, userName)
        .replace(/\{event\}/gi, eventTitle)
        .replace(/\{date\}/gi, eventDate)
        .replace(/\{time\}/gi, eventTime)
        .replace(/\{location\}/gi, eventLocation)
    : `Hi ${userName}! You're confirmed for "${eventTitle}" on ${eventDate} at ${eventTime}. Location: ${eventLocation}. See you there! - MINDS Singapore`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Registration Confirmed! ✓</h1>
          </div>
          <div style="background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">${messageBody}</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1e40af;">Event Details</h2>
              <table style="width: 100%; font-size: 14px; color: #475569;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 100px;">📅 Date:</td>
                  <td style="padding: 8px 0;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">🕐 Time:</td>
                  <td style="padding: 8px 0;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">📍 Location:</td>
                  <td style="padding: 8px 0;">${eventLocation}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
              If you need to cancel your registration, please visit the My Events page.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>MINDS Singapore</p>
          </div>
        </div>
      `,
    });
    console.log('Email sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Initialize Google Sheets client
function getGoogleSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error('Google Sheets not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function POST(request: NextRequest) {
  try {
    const { registrationId, eventId, waitlistPosition } = await request.json();

    if (!registrationId || !eventId || !waitlistPosition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    // Get all registrations to find the one to approve
    const registrationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = registrationsResponse.data.values || [];
    const headers = rows[0];
    const idIndex = headers.indexOf('id');
    const statusIndex = headers.indexOf('status');
    const waitlistPositionIndex = headers.indexOf('waitlistPosition');

    // Find the registration row
    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[idIndex] === registrationId
    );

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update the registration to add waitlist position
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!${String.fromCharCode(66 + statusIndex)}${rowIndex + 1}:${String.fromCharCode(66 + waitlistPositionIndex)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['waitlist', waitlistPosition.toString()]],
      },
    });

    // Update event's currentWaitlist count
    const eventsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:M',
    });

    const eventRows = eventsResponse.data.values || [];
    const eventHeaders = eventRows[0];
    const eventIdIndex = eventHeaders.indexOf('id');
    const currentWaitlistIndex = eventHeaders.indexOf('currentWaitlist');

    const eventRowIndex = eventRows.findIndex((row, index) => 
      index > 0 && row[eventIdIndex] === eventId
    );

    if (eventRowIndex !== -1) {
      const currentWaitlist = parseInt(eventRows[eventRowIndex][currentWaitlistIndex] || '0');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Events!${String.fromCharCode(65 + currentWaitlistIndex)}${eventRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[currentWaitlist + 1]],
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Waitlist request approved' 
    });
  } catch (error) {
    console.error('Error approving waitlist request:', error);
    return NextResponse.json(
      { error: 'Failed to approve waitlist request' },
      { status: 500 }
    );
  }
}

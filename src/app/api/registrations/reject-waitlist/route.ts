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
    const { registrationId, eventId } = await request.json();

    if (!registrationId || !eventId) {
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

    // Get all registrations to find the one to reject
    const registrationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:K',
    });

    const rows = registrationsResponse.data.values || [];
    const headers = rows[0];
    const idIndex = headers.indexOf('id');
    const statusIndex = headers.indexOf('status');

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

    // Update the registration status to 'rejected'
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!${String.fromCharCode(66 + statusIndex)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['rejected']],
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Waitlist request rejected' 
    });
  } catch (error) {
    console.error('Error rejecting waitlist request:', error);
    return NextResponse.json(
      { error: 'Failed to reject waitlist request' },
      { status: 500 }
    );
  }
}

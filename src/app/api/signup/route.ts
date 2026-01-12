import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/signup - Save sign-up data to Google Sheets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, name, email, phone, dietaryRequirements, specialNeeds } = body;

    // Validate required fields
    if (!eventId || !eventTitle || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Google Sheets credentials are configured
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!credentials || !spreadsheetId) {
      console.warn('Google Sheets not configured. Sign-up data:', body);
      // Return success even if not configured (for demo purposes)
      return NextResponse.json({
        success: true,
        message: 'Registration received (Google Sheets not configured)',
      });
    }

    // Parse credentials
    const serviceAccountKey = JSON.parse(credentials);

    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the row data
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,
      eventId,
      eventTitle,
      name,
      email,
      phone,
      dietaryRequirements || '',
      specialNeeds || '',
    ];

    // Append the data to the spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sign-ups!A:H', // Assumes a sheet named "Sign-ups"
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to save registration' },
      { status: 500 }
    );
  }
}

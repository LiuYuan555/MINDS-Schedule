import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

async function getGoogleSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!credentials || !spreadsheetId) {
    throw new Error('Google Sheets not configured');
  }

  const serviceAccountKey = JSON.parse(credentials);
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Fetch removal history from RemovalHistory sheet
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'RemovalHistory!A:N',
      });
    } catch (sheetError: any) {
      // If RemovalHistory sheet doesn't exist yet, return empty array
      if (sheetError.code === 400 || sheetError.message?.includes('Unable to parse range')) {
        console.log('RemovalHistory sheet not found, returning empty array');
        return NextResponse.json([]);
      }
      throw sheetError;
    }

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    // Skip header row
    const dataRows = rows.slice(1);
    
    // Map to objects
    const history = dataRows.map((row: string[]) => ({
      id: row[0],
      originalRegistrationId: row[1],
      eventId: row[2],
      eventTitle: row[3],
      userId: row[4],
      userName: row[5],
      userEmail: row[6],
      userPhone: row[7],
      registrationType: row[8],
      isCaregiver: row[9] === 'TRUE',
      participantName: row[10],
      removedBy: row[11],
      reason: row[12],
      removedAt: row[13],
    }));

    // Filter by eventId if provided
    if (eventId) {
      const filtered = history.filter((item: any) => item.eventId === eventId);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching removal history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch removal history' },
      { status: 500 }
    );
  }
}

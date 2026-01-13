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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, membershipType } = body;

    if (!userId || !membershipType) {
      return NextResponse.json({ error: 'User ID and membership type required' }, { status: 400 });
    }

    // Validate membership type
    const validTypes = ['adhoc', 'once_weekly', 'twice_weekly', 'three_plus_weekly'];
    if (!validTypes.includes(membershipType)) {
      return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Get all users to find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:H',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === userId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the MembershipType column (column G, index 6)
    // Row numbers in Sheets are 1-indexed, and row 1 is the header
    const sheetRowNumber = rowIndex + 1;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!G${sheetRowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[membershipType]],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Membership type updated successfully',
      membershipType 
    });

  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json({ error: 'Failed to update membership type' }, { status: 500 });
  }
}

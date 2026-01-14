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

// GET /api/user/membership - Get user's membership type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:H',
    });

    const rows = response.data.values || [];
    const userRow = rows.find((row) => row[0] === userId);

    if (userRow) {
      return NextResponse.json({ 
        membershipType: userRow[6] || 'adhoc',
        exists: true 
      });
    }

    return NextResponse.json({ 
      membershipType: 'adhoc',
      exists: false 
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    return NextResponse.json({ membershipType: 'adhoc', exists: false });
  }
}

// POST /api/user/membership - Create or update user's membership type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, membershipType } = body;

    if (!userId || !membershipType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['adhoc', 'once_weekly', 'twice_weekly', 'three_plus_weekly'];
    if (!validTypes.includes(membershipType)) {
      return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Check if user exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:H',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === userId);

    if (rowIndex !== -1) {
      // Update existing user's membership type (column G, index 6)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Users!G${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[membershipType]] },
      });
    } else {
      // Create new user row
      // Columns: ID | Name | Email | Phone | Role | Password | MembershipType | CreatedAt
      const newRow = [
        userId,
        userName || '',
        userEmail || '',
        '', // phone
        'participant', // role
        '', // password (not used with Clerk)
        membershipType,
        new Date().toISOString(),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Users!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
    }

    return NextResponse.json({ success: true, membershipType });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
  }
}

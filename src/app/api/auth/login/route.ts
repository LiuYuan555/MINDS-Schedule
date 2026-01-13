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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    const userRow = rows.find((row) => row[2] === email && row[4] === password);

    if (!userRow) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = {
      id: userRow[0],
      name: userRow[1],
      email: userRow[2],
      phone: userRow[3],
      role: userRow[5],
      membershipType: userRow[6] || undefined,
      skills: userRow[7] ? JSON.parse(userRow[7]) : [],
      availability: userRow[8] ? JSON.parse(userRow[8]) : [],
      emergencyContact: userRow[9] || undefined,
      emergencyPhone: userRow[10] || undefined,
      createdAt: userRow[11],
    };

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

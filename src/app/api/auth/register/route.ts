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
    const { name, email, phone, password, role, membershipType } = body;

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Check if user already exists
    const existingUsers = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:C',
    });

    const rows = existingUsers.data.values || [];
    const emailExists = rows.some((row) => row[2] === email);

    if (emailExists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Generate user ID
    const userId = `user_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Create user row (8 columns: ID | Name | Email | Phone | Password | Role | MembershipType | CreatedAt)
    const rowData = [
      userId,
      name,
      email,
      phone,
      password, // In production, this should be hashed!
      role,
      membershipType || '',
      createdAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Users!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    const user = {
      id: userId,
      name,
      email,
      phone,
      role,
      membershipType: membershipType || undefined,
      createdAt,
    };

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

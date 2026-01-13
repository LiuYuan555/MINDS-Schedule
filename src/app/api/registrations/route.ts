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

// GET /api/registrations - Get registrations for a user or event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const eventId = searchParams.get('eventId');

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A2:O',
    });

    const rows = response.data.values || [];
    let registrations = rows.map((row) => ({
      id: row[0],
      eventId: row[1],
      eventTitle: row[2],
      userId: row[3],
      userName: row[4],
      userEmail: row[5],
      userPhone: row[6],
      registrationType: row[7],
      status: row[8],
      dietaryRequirements: row[9] || '',
      specialNeeds: row[10] || '',
      needsWheelchairAccess: row[11] === 'true',
      hasCaregiverAccompanying: row[12] === 'true',
      caregiverName: row[13] || '',
      caregiverPhone: row[14] || '',
      registeredAt: row[15] || '',
    }));

    if (userId) {
      registrations = registrations.filter((r) => r.userId === userId);
    }
    if (eventId) {
      registrations = registrations.filter((r) => r.eventId === eventId);
    }

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ registrations: [] });
  }
}

// POST /api/registrations - Create a new registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      eventTitle,
      userId,
      userName,
      userEmail,
      userPhone,
      registrationType,
      dietaryRequirements,
      specialNeeds,
      needsWheelchairAccess,
      hasCaregiverAccompanying,
      caregiverName,
      caregiverPhone,
    } = body;

    if (!eventId || !eventTitle || !userId || !userName || !userEmail || !registrationType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Check if user already registered for this event
    const existingRegs = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:D',
    });

    const rows = existingRegs.data.values || [];
    const alreadyRegistered = rows.some(
      (row) => row[1] === eventId && row[3] === userId && row[8] !== 'cancelled'
    );

    if (alreadyRegistered) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 });
    }

    const registrationId = `reg_${Date.now()}`;
    const registeredAt = new Date().toISOString();

    const rowData = [
      registrationId,
      eventId,
      eventTitle,
      userId,
      userName,
      userEmail,
      userPhone || '',
      registrationType,
      'registered',
      dietaryRequirements || '',
      specialNeeds || '',
      needsWheelchairAccess ? 'true' : 'false',
      hasCaregiverAccompanying ? 'true' : 'false',
      caregiverName || '',
      caregiverPhone || '',
      registeredAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Registrations!A:P',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    return NextResponse.json({
      success: true,
      registration: {
        id: registrationId,
        eventId,
        eventTitle,
        userId,
        userName,
        userEmail,
        userPhone,
        registrationType,
        status: 'registered',
        registeredAt,
      },
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// PUT /api/registrations - Update registration status (for attendance tracking)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, status } = body;

    if (!registrationId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the registration row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === registrationId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Update status (column I, index 8)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!I${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { isAdmin } from '@/lib/adminAuth';

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
  // Admin check
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { registrationId, eventId } = body;

    if (!registrationId || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Get all registrations
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:Q', // Extended to include promotedAt column
    });

    const rows = response.data.values || [];
    
    // Find the registration to promote
    let rowIndex = -1;
    let registration: any = null;
    
    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
      if (rows[i][0] === registrationId) {
        rowIndex = i + 1; // +1 for 1-based indexing, +1 for header row = i+2, but we already started at 1
        registration = {
          id: rows[i][0],
          eventId: rows[i][1],
          status: rows[i][8],
        };
        break;
      }
    }

    if (!registration || registration.status !== 'waitlist') {
      return NextResponse.json({ error: 'Registration not found or not on waitlist' }, { status: 404 });
    }

    // Check if event has capacity
    const eventsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:T',
    });

    const eventRows = eventsResponse.data.values || [];
    let eventRowIndex = -1;
    let event: any = null;

    for (let i = 1; i < eventRows.length; i++) {
      if (eventRows[i][0] === eventId) {
        eventRowIndex = i + 1;
        event = {
          capacity: eventRows[i][8] ? parseInt(eventRows[i][8], 10) : null,
          currentSignups: eventRows[i][9] ? parseInt(eventRows[i][9], 10) : 0,
          currentWaitlist: eventRows[i][20] ? parseInt(eventRows[i][20], 10) : 0,
        };
        break;
      }
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check capacity
    if (event.capacity !== null && event.currentSignups >= event.capacity) {
      return NextResponse.json({ error: 'Event is at full capacity' }, { status: 400 });
    }

    // Update registration status to 'registered' and set promotedAt timestamp
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!I${rowIndex}:Q${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['registered', '', '', '', '', '', '', '', now]], // status, clear waitlistPosition, set promotedAt
      },
    });

    // Update event counts: increment currentSignups, decrement currentWaitlist
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Events!J${eventRowIndex}:U${eventRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[event.currentSignups + 1, event.currentWaitlist > 0 ? event.currentWaitlist - 1 : 0]],
      },
    });

    // Reorder waitlist positions for remaining waitlist members
    const waitlistMembers = rows
      .map((row, idx) => ({ row, idx: idx + 1 }))
      .filter(({ row }) => row[1] === eventId && row[8] === 'waitlist' && row[0] !== registrationId)
      .sort((a, b) => {
        const posA = a.row[9] ? parseInt(a.row[9], 10) : 999;
        const posB = b.row[9] ? parseInt(b.row[9], 10) : 999;
        return posA - posB;
      });

    // Update positions
    for (let i = 0; i < waitlistMembers.length; i++) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Registrations!J${waitlistMembers[i].idx}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[i + 1]], // New position
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Promoted from waitlist successfully' 
    });

  } catch (error) {
    console.error('Error promoting from waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to promote from waitlist' },
      { status: 500 }
    );
  }
}

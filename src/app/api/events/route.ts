import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get Google Sheets client
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

// GET /api/events - Fetch all events from Google Sheets
export async function GET() {
  try {
    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A2:K', // Skip header row
    });

    const rows = response.data.values || [];
    
    const events = rows.map((row) => ({
      id: row[0] || '',
      title: row[1] || '',
      description: row[2] || '',
      date: row[3] || '',
      time: row[4] || '',
      endTime: row[5] || '',
      location: row[6] || '',
      category: row[7] || '',
      capacity: row[8] ? parseInt(row[8], 10) : undefined,
      currentSignups: row[9] ? parseInt(row[9], 10) : 0,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return sample events if Google Sheets is not configured
    const { sampleEvents } = await import('@/data/events');
    return NextResponse.json({ events: sampleEvents });
  }
}

// POST /api/events - Add a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, time, endTime, location, category, capacity } = body;

    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Generate a unique ID
    const id = `event_${Date.now()}`;

    const rowData = [
      id,
      title,
      description,
      date,
      time,
      endTime || '',
      location,
      category,
      capacity || '',
      0, // currentSignups starts at 0
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Events!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      event: { id, ...body, currentSignups: 0 },
    });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json(
      { error: 'Failed to add event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // First, find the row with this event ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === eventId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete the row (rowIndex + 1 because sheets are 1-indexed)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assumes Events is the first sheet
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// PUT /api/events - Update an existing event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, date, time, endTime, location, category, capacity } = body;

    if (!id || !title || !description || !date || !time || !location || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the row with this event ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the row (rowIndex + 1 because sheets are 1-indexed)
    const rowData = [
      id,
      title,
      description,
      date,
      time,
      endTime || '',
      location,
      category,
      capacity || '',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Events!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      event: { id, title, description, date, time, endTime, location, category, capacity },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

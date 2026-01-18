import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('PATCH /api/registrations/[id] - ID:', id);
    
    const body = await request.json();
    const { status } = body;
    console.log('PATCH /api/registrations/[id] - Status:', status);

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the registration by ID
    const registrationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:T',
    });

    const rows = registrationsResponse.data.values || [];
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    // Find the row index (add 2 to account for header and 1-based indexing)
    const rowIndex = dataRows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 1-based index
    const registration = dataRows[rowIndex];
    const eventId = registration[1];
    const registrationType = registration[7];
    const previousStatus = registration[8];

    // Update the status (column I, index 8)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!I${actualRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });

    // If cancelling a registered participant, decrement the event's currentSignups
    if (status === 'cancelled' && previousStatus === 'registered' && registrationType === 'participant') {
      // Get current event data
      const eventsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Events!A:T',
      });

      const eventRows = eventsResponse.data.values || [];
      const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

      if (eventRowIndex !== -1) {
        const currentSignups = parseInt(eventRows[eventRowIndex][9] || '0', 10);
        const newSignups = Math.max(0, currentSignups - 1);

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!J${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newSignups]] },
        });
      }
    }

    // If cancelling a registered volunteer, decrement the event's currentVolunteers
    if (status === 'cancelled' && previousStatus === 'registered' && registrationType === 'volunteer') {
      const eventsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Events!A:T',
      });

      const eventRows = eventsResponse.data.values || [];
      const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

      if (eventRowIndex !== -1) {
        const currentVolunteers = parseInt(eventRows[eventRowIndex][17] || '0', 10);
        const newVolunteers = Math.max(0, currentVolunteers - 1);

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!R${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newVolunteers]] },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Registration status updated to ${status}` 
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // For now, we'll use PATCH with status='cancelled' instead of actual deletion
  // This preserves the registration history
  const { id } = await context.params;
  
  return NextResponse.json(
    { error: 'Use PATCH with status="cancelled" to cancel registrations' },
    { status: 405 }
  );
}

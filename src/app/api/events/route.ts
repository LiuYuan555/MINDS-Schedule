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

// Helper function to get the sheetId for a given sheet name
async function getSheetId(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string): Promise<number> {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName);
  if (!sheet || sheet.properties?.sheetId === undefined || sheet.properties?.sheetId === null) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  return sheet.properties.sheetId;
}

// Helper function to calculate event status based on current time
function calculateEventStatus(date: string, endTime: string, startTime: string): 'ongoing' | 'past' {
  if (!date) return 'ongoing';
  
  try {
    const now = new Date();
    // Use endTime if available, otherwise fall back to startTime
    const timeToUse = endTime || startTime;
    const eventEndDateTime = new Date(`${date}T${timeToUse}`);
    
    // If the date/time parsing failed, default to ongoing
    if (isNaN(eventEndDateTime.getTime())) {
      return 'ongoing';
    }
    
    return now > eventEndDateTime ? 'past' : 'ongoing';
  } catch {
    return 'ongoing';
  }
}

// GET /api/events - Fetch all events from Google Sheets
export async function GET() {
  try {
    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A2:V', // Extended range to include EventStatus column
    });

    const rows = response.data.values || [];
    
    const events = rows.map((row) => {
      const date = row[3] || '';
      const time = row[4] || '';
      const endTime = row[5] || '';
      
      // Calculate event status server-side for accuracy (fallback from Google Sheets formula)
      const eventStatus = calculateEventStatus(date, endTime, time);
      
      return {
        id: row[0] || '',
        title: row[1] || '',
        description: row[2] || '',
        date,
        time,
        endTime,
        location: row[6] || '',
        category: row[7] || '',
        capacity: row[8] ? parseInt(row[8], 10) : undefined,
        currentSignups: row[9] ? parseInt(row[9], 10) : 0,
        wheelchairAccessible: row[10] === 'true',
        caregiverRequired: row[11] === 'true',
        caregiverPaymentRequired: row[12] === 'true',
        caregiverPaymentAmount: row[13] ? parseFloat(row[13]) : undefined,
        ageRestriction: row[14] || undefined,
        skillLevel: row[15] || 'all',
        volunteersNeeded: row[16] ? parseInt(row[16], 10) : 0,
        currentVolunteers: row[17] ? parseInt(row[17], 10) : 0,
        recurringGroupId: row[18] || undefined,
        isRecurring: row[19] === 'true',
        confirmationMessage: row[20] || undefined,
        eventStatus, // Calculated server-side for real-time accuracy
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return sample events if Google Sheets is not configured
    const { sampleEvents } = await import('@/data/events');
    return NextResponse.json({ events: sampleEvents });
  }
}

// POST /api/events - Add a new event or multiple recurring events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, description, date, time, endTime, location, category, capacity,
      wheelchairAccessible, caregiverRequired, caregiverPaymentRequired, caregiverPaymentAmount,
      volunteersNeeded, skillLevel, ageRestriction, isRecurring, recurringDates, confirmationMessage
    } = body;

    if (!title || !description || !date || !time || !location || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // If recurring event, create multiple events
    if (isRecurring && recurringDates && recurringDates.length > 0) {
      const recurringGroupId = `recurring_${Date.now()}`;
      const events = [];
      const rowsData = [];

      for (const eventDate of recurringDates) {
        const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const event = {
          id,
          title,
          description,
          date: eventDate,
          time,
          endTime: endTime || '',
          location,
          category,
          capacity: capacity || undefined,
          currentSignups: 0,
          wheelchairAccessible: wheelchairAccessible || false,
          caregiverRequired: caregiverRequired || false,
          caregiverPaymentRequired: caregiverPaymentRequired || false,
          caregiverPaymentAmount: caregiverPaymentAmount || undefined,
          ageRestriction: ageRestriction || undefined,
          skillLevel: skillLevel || 'all',
          volunteersNeeded: volunteersNeeded || 0,
          currentVolunteers: 0,
          recurringGroupId,
          isRecurring: true,
          confirmationMessage: confirmationMessage || undefined,
        };
        
        events.push(event);
        
        const rowData = [
          id,
          title,
          description,
          eventDate,
          time,
          endTime || '',
          location,
          category,
          capacity || '',
          0, // currentSignups
          wheelchairAccessible ? 'true' : 'false',
          caregiverRequired ? 'true' : 'false',
          caregiverPaymentRequired ? 'true' : 'false',
          caregiverPaymentAmount || 'Nil',
          ageRestriction || 'Nil',
          skillLevel || 'all',
          volunteersNeeded || 0,
          0, // currentVolunteers
          recurringGroupId, // column S
          'true', // isRecurring - column T
          confirmationMessage || 'Nil', // column U
        ];
        
        rowsData.push(rowData);
      }

      // Append all rows at once
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Events!A:U',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rowsData,
        },
      });

      return NextResponse.json({
        success: true,
        events,
      });
    } else {
      // Create single event
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
        wheelchairAccessible ? 'true' : 'false',
        caregiverRequired ? 'true' : 'false',
        caregiverPaymentRequired ? 'true' : 'false',
        caregiverPaymentAmount || 'Nil',
        ageRestriction || 'Nil',
        skillLevel || 'all',
        volunteersNeeded || 0,
        0, // currentVolunteers starts at 0
        '', // recurringGroupId
        'false', // isRecurring
        confirmationMessage || 'Nil', // column U
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Events!A:U',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });

      return NextResponse.json({
        success: true,
        event: { 
          id, 
          ...body, 
          currentSignups: 0, 
          currentVolunteers: 0,
          wheelchairAccessible: wheelchairAccessible || false,
          caregiverRequired: caregiverRequired || false,
          caregiverPaymentRequired: caregiverPaymentRequired || false,
          isRecurring: false,
        },
      });
    }
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

    // Get the actual sheetId for the Events sheet
    const eventsSheetId = await getSheetId(sheets, spreadsheetId, 'Events');

    // Delete the row (rowIndex + 1 because sheets are 1-indexed)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: eventsSheetId,
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
    const { 
      id, title, description, date, time, endTime, location, category, capacity,
      wheelchairAccessible, caregiverRequired, caregiverPaymentRequired, caregiverPaymentAmount,
      volunteersNeeded, skillLevel, ageRestriction, confirmationMessage
    } = body;

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

    // Get current signups and volunteers count to preserve them
    const currentDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Events!J${rowIndex + 1}:U${rowIndex + 1}`,
    });
    const currentData = currentDataResponse.data.values?.[0] || [];
    const currentSignups = currentData[0] || 0;
    const currentVolunteers = currentData[8] || 0;
    const recurringGroupId = currentData[9] || '';
    const isRecurringStr = currentData[10] || 'false';

    // Update the row (rowIndex + 1 because sheets are 1-indexed)
    // Column order: ID | Title | Description | Date | Time | EndTime | Location | Category | Capacity | CurrentSignups | WheelchairAccessible | CaregiverRequired | CaregiverPaymentRequired | CaregiverPaymentAmount | AgeRestriction | SkillLevel | VolunteersNeeded | CurrentVolunteers | RecurringGroupId | IsRecurring | ConfirmationMessage
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
      currentSignups,
      wheelchairAccessible ? 'true' : 'false',
      caregiverRequired ? 'true' : 'false',
      caregiverPaymentRequired ? 'true' : 'false',
      caregiverPaymentAmount || 'Nil',
      ageRestriction || 'Nil',
      skillLevel || 'all',
      volunteersNeeded || 0,
      currentVolunteers,
      recurringGroupId,
      isRecurringStr,
      confirmationMessage || 'Nil',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Events!A${rowIndex + 1}:U${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      event: { ...body, currentSignups, currentVolunteers },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

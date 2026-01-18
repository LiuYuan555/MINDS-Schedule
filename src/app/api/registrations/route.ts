import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { sendConfirmationSMS, formatConfirmationMessage, getDefaultMessageTemplate } from '@/lib/sms';

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
      range: 'Registrations!A2:T',
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
      waitlistPosition: row[16] || '',
      promotedAt: row[17] || '',
      isCaregiver: row[18] === 'true',
      participantName: row[19] || '',
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
      isCaregiver,
      participantName,
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

    // Reject guest signups - userId must start with 'user_' (registered users)
    if (!userId.startsWith('user_')) {
      return NextResponse.json({ error: 'You must be logged in to register for events' }, { status: 401 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Get event details to check capacity
    const eventsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:U',
    });

    const eventRows = eventsResponse.data.values || [];
    const eventRow = eventRows.find((row) => row[0] === eventId);

    if (!eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Extract event details for SMS
    const eventDate = eventRow[3];
    const eventTime = eventRow[4];
    const eventLocation = eventRow[6];
    const confirmationMessage = eventRow[20] && eventRow[20] !== 'Nil' ? eventRow[20] : undefined;

    // Check capacity based on registration type
    if (registrationType === 'participant') {
      const capacity = eventRow[8] ? parseInt(eventRow[8], 10) : null;
      const currentSignups = eventRow[9] ? parseInt(eventRow[9], 10) : 0;
      if (capacity !== null && currentSignups >= capacity) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 });
      }
    } else if (registrationType === 'volunteer') {
      const volunteersNeeded = eventRow[16] ? parseInt(eventRow[16], 10) : null;
      const currentVolunteers = eventRow[17] ? parseInt(eventRow[17], 10) : 0;
      if (volunteersNeeded !== null && currentVolunteers >= volunteersNeeded) {
        return NextResponse.json({ error: 'No more volunteers needed' }, { status: 400 });
      }
    }

    // Check if user already registered for this event
    const existingRegs = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:I',
    });

    const rows = existingRegs.data.values || [];
    const alreadyRegistered = rows.some(
      (row) => row[1] === eventId && row[3] === userId && row[8] !== 'cancelled'
    );

    if (alreadyRegistered) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 });
    }

    // Get the new event's date and time info
    const newEventDate = eventRow[3]; // Date
    const newEventStartTime = eventRow[4]; // Start time
    const newEventEndTime = eventRow[5] || eventRow[4]; // End time (or start time if no end time)

    // Helper function to check if two time ranges overlap
    const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
      // Convert time strings to minutes for easier comparison
      const toMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + (minutes || 0);
      };
      const s1 = toMinutes(start1);
      const e1 = toMinutes(end1);
      const s2 = toMinutes(start2);
      const e2 = toMinutes(end2);
      // Overlap if one starts before the other ends
      return s1 < e2 && s2 < e1;
    };

    // Check for overlapping events the user is already registered for
    const userRegistrations = rows.filter(
      (row) => row[3] === userId && row[8] !== 'cancelled'
    );

    for (const reg of userRegistrations) {
      const registeredEventId = reg[1];
      const registeredEvent = eventRows.find((e) => e[0] === registeredEventId);
      
      if (registeredEvent) {
        const regEventDate = registeredEvent[3];
        const regEventStartTime = registeredEvent[4];
        const regEventEndTime = registeredEvent[5] || registeredEvent[4];
        
        // Check if same date and times overlap
        if (regEventDate === newEventDate && 
            timesOverlap(newEventStartTime, newEventEndTime, regEventStartTime, regEventEndTime)) {
          return NextResponse.json({ 
            error: `Time conflict: You are already registered for "${registeredEvent[1]}" which overlaps with this event.` 
          }, { status: 400 });
        }
      }
    }

    // Check membership limits for participants
    if (registrationType === 'participant') {
      // Get user's membership type from Users sheet
      const usersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Users!A:H',
      });

      const userRows = usersResponse.data.values || [];
      const userRow = userRows.find((row) => row[0] === userId);

      if (userRow) {
        const membershipType = userRow[6] || 'adhoc'; // Column G (index 6) = MembershipType

        // Define limits for each membership type
        const membershipLimits: Record<string, number> = {
          adhoc: 999, // No practical limit
          once_weekly: 1,
          twice_weekly: 2,
          three_plus_weekly: 999, // No practical limit
        };

        const limit = membershipLimits[membershipType] ?? 999;

        if (limit < 999) {
          // Calculate the week of the EVENT being registered for (Monday to Sunday)
          // Parse date string as local date (YYYY-MM-DD format)
          const [year, month, day] = newEventDate.split('-').map(Number);
          const eventDate = new Date(year, month - 1, day); // month is 0-indexed
          
          const eventDayOfWeek = eventDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          // Calculate days since Monday for the event's week
          const daysSinceMonday = eventDayOfWeek === 0 ? 6 : eventDayOfWeek - 1;
          const weekStart = new Date(eventDate);
          weekStart.setDate(eventDate.getDate() - daysSinceMonday);
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Sunday
          weekEnd.setHours(23, 59, 59, 999);

          // Count user's participant registrations for events in the SAME WEEK as this event
          const fullRegsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Registrations!A:P',
          });

          const fullRegs = fullRegsResponse.data.values || [];
          
          // Get all event dates for the user's registrations
          const weeklyCount = fullRegs.filter((row) => {
            if (row[3] !== userId) return false; // Not this user
            if (row[7] !== 'participant') return false; // Not a participant registration
            if (row[8] === 'cancelled') return false; // Cancelled
            
            // Find the event for this registration to get its date
            const regEventId = row[1];
            const regEvent = eventRows.find((e) => e[0] === regEventId);
            if (!regEvent) return false;
            
            // Parse the registered event's date as local date
            const regEventDateStr = regEvent[3];
            const [regYear, regMonth, regDay] = regEventDateStr.split('-').map(Number);
            const regEventDate = new Date(regYear, regMonth - 1, regDay);
            
            return regEventDate >= weekStart && regEventDate <= weekEnd;
          }).length;

          if (weeklyCount >= limit) {
            const membershipLabels: Record<string, string> = {
              once_weekly: 'Once a Week',
              twice_weekly: 'Twice a Week',
            };
            const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const weekEndStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return NextResponse.json({ 
              error: `Weekly limit reached: Your ${membershipLabels[membershipType]} membership allows ${limit} event(s) per week. You already have ${weeklyCount} event(s) registered for the week of ${weekStartStr} - ${weekEndStr}.`
            }, { status: 400 });
          }
        }
      }
    }

    const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      '', // waitlistPosition (column Q)
      '', // promotedAt (column R)
      isCaregiver ? 'true' : 'false', // isCaregiver (column S)
      participantName || '', // participantName (column T)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Registrations!A:T',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });

    // Update the event's participant/volunteer count in Events sheet
    const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

    if (eventRowIndex !== -1) {
      if (registrationType === 'participant') {
        // Update currentSignups (column J, index 9)
        const currentSignups = parseInt(eventRows[eventRowIndex][9] || '0', 10);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!J${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentSignups + 1]] },
        });
      } else if (registrationType === 'volunteer') {
        // Update currentVolunteers (column R, index 17)
        const currentVolunteers = parseInt(eventRows[eventRowIndex][17] || '0', 10);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!R${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentVolunteers + 1]] },
        });
      }
    }

    // Send confirmation SMS
    if (userPhone) {
      const template = confirmationMessage || getDefaultMessageTemplate();
      const smsMessage = formatConfirmationMessage(template, {
        userName,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
      });
      // Fire and forget - don't block registration on SMS
      sendConfirmationSMS(userPhone, smsMessage).catch(err => {
        console.error('SMS sending failed:', err);
      });
    }

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

    // Find the registration row and get its details
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:I',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === registrationId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const registration = rows[rowIndex];
    const eventId = registration[1];
    const registrationType = registration[7];
    const previousStatus = registration[8];

    // Update status (column I, index 8)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Registrations!I${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });

    // If status is changing to/from 'cancelled', update event counts
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // Decrement the count
      const eventsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Events!A:R',
      });

      const eventRows = eventsResponse.data.values || [];
      const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

      if (eventRowIndex !== -1) {
        if (registrationType === 'participant') {
          const currentSignups = parseInt(eventRows[eventRowIndex][9] || '0', 10);
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Events!J${eventRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[Math.max(0, currentSignups - 1)]] },
          });
        } else if (registrationType === 'volunteer') {
          const currentVolunteers = parseInt(eventRows[eventRowIndex][17] || '0', 10);
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Events!R${eventRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[Math.max(0, currentVolunteers - 1)]] },
          });
        }
      }
    } else if (previousStatus === 'cancelled' && status !== 'cancelled') {
      // Re-registering (changing from cancelled to another status) - increment the count
      const eventsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Events!A:R',
      });

      const eventRows = eventsResponse.data.values || [];
      const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

      if (eventRowIndex !== -1) {
        if (registrationType === 'participant') {
          const currentSignups = parseInt(eventRows[eventRowIndex][9] || '0', 10);
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Events!J${eventRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentSignups + 1]] },
          });
        } else if (registrationType === 'volunteer') {
          const currentVolunteers = parseInt(eventRows[eventRowIndex][17] || '0', 10);
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Events!R${eventRowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentVolunteers + 1]] },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE /api/registrations - Remove a registration and log to removal history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    const removedBy = searchParams.get('removedBy') || 'Staff';
    const reason = searchParams.get('reason') || 'Removed by staff';

    if (!registrationId) {
      return NextResponse.json({ error: 'Missing registration ID' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the registration row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:T',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === registrationId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const registration = rows[rowIndex];
    const eventId = registration[1];
    const eventTitle = registration[2];
    const userId = registration[3];
    const userName = registration[4];
    const userEmail = registration[5];
    const userPhone = registration[6];
    const registrationType = registration[7];
    const isCaregiver = registration[18] === 'true';
    const participantName = registration[19] || '';

    // Log to RemovalHistory sheet
    const removalHistoryRow = [
      `removal_${Date.now()}`, // ID
      registrationId, // Original Registration ID
      eventId,
      eventTitle,
      userId,
      userName,
      userEmail,
      userPhone,
      registrationType,
      isCaregiver ? 'true' : 'false',
      participantName,
      removedBy,
      reason,
      new Date().toISOString(), // Removed At
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'RemovalHistory!A:N',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [removalHistoryRow] },
    });

    // Delete the registration row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming Registrations is the first sheet
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });

    // Update event counts
    const eventsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A:R',
    });

    const eventRows = eventsResponse.data.values || [];
    const eventRowIndex = eventRows.findIndex((row) => row[0] === eventId);

    if (eventRowIndex !== -1) {
      if (registrationType === 'participant') {
        const currentSignups = parseInt(eventRows[eventRowIndex][9] || '0', 10);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!J${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[Math.max(0, currentSignups - 1)]] },
        });
      } else if (registrationType === 'volunteer') {
        const currentVolunteers = parseInt(eventRows[eventRowIndex][17] || '0', 10);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Events!R${eventRowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[Math.max(0, currentVolunteers - 1)]] },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registration removed and logged to history' 
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

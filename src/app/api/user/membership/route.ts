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
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    
    // Find user by ID first, then by email as fallback
    let userRow = rows.find((row) => row[0] === userId);
    
    if (!userRow && email) {
      userRow = rows.find((row) => row[2]?.toLowerCase() === email.toLowerCase());
    }

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

    // Check if user exists - use full column range to match Users sheet structure
    // Columns: A: ID | B: Name | C: Email | D: Phone | E: Role | F: Status | G: MembershipType | H: CreatedAt | I: ApprovedAt | J: ApprovedBy | K: LastUpdatedAt | L: LastUpdatedBy
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    
    // Find user by ID first, then by email as fallback
    let rowIndex = rows.findIndex((row) => row[0] === userId);
    
    // If not found by ID, try to find by email
    if (rowIndex === -1 && userEmail) {
      rowIndex = rows.findIndex((row) => row[2]?.toLowerCase() === userEmail.toLowerCase());
    }

    if (rowIndex !== -1) {
      // Update existing user's membership type (column G) and last updated timestamp (column K)
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `Users!G${rowIndex + 1}`,
              values: [[membershipType]],
            },
            {
              range: `Users!K${rowIndex + 1}`,
              values: [[new Date().toISOString()]],
            },
          ],
        },
      });
      
      // Also update the user ID if they were found by email but had a different/missing ID
      const existingId = rows[rowIndex][0];
      if (!existingId || existingId !== userId) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Users!A${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[userId]] },
        });
      }
    } else {
      // Create new user row with full column structure matching Users sheet
      // Columns: ID | Name | Email | Phone | Role | Status | MembershipType | CreatedAt | ApprovedAt | ApprovedBy | LastUpdatedAt | LastUpdatedBy
      const newRow = [
        userId,
        userName || '',
        userEmail || '',
        '', // phone
        'participant', // role
        'pending', // status - new users need approval
        membershipType,
        new Date().toISOString(), // createdAt
        '', // approvedAt
        '', // approvedBy
        '', // lastUpdatedAt
        '', // lastUpdatedBy
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Users!A:L',
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

import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, UserStatus, MembershipType } from '@/types';
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

// Column mapping for Users sheet:
// A: ID | B: Name | C: Email | D: Phone | E: Role | F: Status | G: MembershipType | H: CreatedAt | I: ApprovedAt | J: ApprovedBy | K: LastUpdatedAt | L: LastUpdatedBy

function parseUserRow(row: string[]): User {
  return {
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    phone: row[3] || '',
    role: (row[4] as UserRole) || 'participant',
    status: (row[5] as UserStatus) || 'pending',
    membershipType: (row[6] as MembershipType) || 'adhoc',
    createdAt: row[7] || new Date().toISOString(),
    approvedAt: row[8] || undefined,
    approvedBy: row[9] || undefined,
    lastUpdatedAt: row[10] || undefined,
    lastUpdatedBy: row[11] || undefined,
  };
}

// GET /api/users - Get all users or a specific user
export async function GET(request: NextRequest) {
  // Admin check - only admins can list all users
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  
  // Allow fetching own user data, but require admin for listing all users
  if (!userId && !email && !(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const status = searchParams.get('status');

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    
    // Skip header row if it exists
    const dataRows = rows.length > 0 && rows[0][0] === 'ID' ? rows.slice(1) : rows;
    
    let users: User[] = dataRows.map(parseUserRow).filter(u => u.id);

    // Filter by specific user ID
    if (userId) {
      const user = users.find(u => u.id === userId);
      return NextResponse.json({ user: user || null });
    }

    // Filter by email
    if (email) {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return NextResponse.json({ user: user || null });
    }

    // Filter by status
    if (status) {
      users = users.filter(u => u.status === status);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (for registration request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, userPhone, role = 'participant', membershipType = 'adhoc' } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Check if user already exists
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = existingResponse.data.values || [];
    const existingUser = rows.find(row => row[0] === userId || row[2]?.toLowerCase() === userEmail.toLowerCase());

    if (existingUser) {
      const user = parseUserRow(existingUser);
      return NextResponse.json({ user, exists: true });
    }

    // Create new user with pending status
    const newRow = [
      userId,
      userName || '',
      userEmail,
      userPhone || '',
      role,
      'pending', // New users start as pending
      membershipType,
      new Date().toISOString(),
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

    const user = parseUserRow(newRow);
    return NextResponse.json({ user, created: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT /api/users - Update user details (status, role, membership, etc.)
export async function PUT(request: NextRequest) {
  // Admin check
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, updates, adminId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the user row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === userId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentRow = rows[rowIndex];
    const now = new Date().toISOString();

    // Build updated row
    const updatedRow = [
      currentRow[0], // ID (unchanged)
      updates.name ?? currentRow[1],
      updates.email ?? currentRow[2],
      updates.phone ?? currentRow[3],
      updates.role ?? currentRow[4],
      updates.status ?? currentRow[5],
      updates.membershipType ?? currentRow[6],
      currentRow[7], // createdAt (unchanged)
      updates.status === 'active' && currentRow[5] === 'pending' ? now : (currentRow[8] || ''), // approvedAt
      updates.status === 'active' && currentRow[5] === 'pending' ? (adminId || 'Admin') : (currentRow[9] || ''), // approvedBy
      now, // lastUpdatedAt
      adminId || 'Admin', // lastUpdatedBy
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Users!A${rowIndex + 1}:L${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });

    const user = parseUserRow(updatedRow);
    return NextResponse.json({ user, success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users - Delete a user
export async function DELETE(request: NextRequest) {
  // Admin check
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { sheets, spreadsheetId } = await getGoogleSheetsClient();

    // Find the user row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Users!A:L',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === userId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get spreadsheet info to find the sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const usersSheet = spreadsheet.data.sheets?.find(
      s => s.properties?.title === 'Users'
    );

    if (!usersSheet?.properties?.sheetId) {
      return NextResponse.json({ error: 'Users sheet not found' }, { status: 500 });
    }

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: usersSheet.properties.sheetId,
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
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

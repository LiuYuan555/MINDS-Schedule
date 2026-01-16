import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@/types';

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

// GET /api/user/status - Check user's access status
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
    
    // Find user by ID or email
    const userRow = rows.find(row => 
      row[0] === userId || 
      (email && row[2]?.toLowerCase() === email.toLowerCase())
    );

    if (!userRow) {
      // User not in system - they need to be registered
      return NextResponse.json({ 
        exists: false,
        status: null,
        canAccess: false,
        message: 'User not registered in the system'
      });
    }

    const status = (userRow[5] as UserStatus) || 'pending';
    const canAccess = status === 'active';

    let message = '';
    if (status === 'pending') {
      message = 'Your account is pending approval. Please wait for an administrator to approve your access.';
    } else if (status === 'restricted') {
      message = 'Your account has been restricted. Please contact an administrator for assistance.';
    }

    return NextResponse.json({ 
      exists: true,
      status,
      canAccess,
      message,
      userName: userRow[1] || '',
      userEmail: userRow[2] || '',
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ 
      exists: false,
      status: null,
      canAccess: false,
      message: 'Error checking access status'
    }, { status: 500 });
  }
}
